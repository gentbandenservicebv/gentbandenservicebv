export interface CartItem {
  id: string;
  slug?: string | null;
  brand: string;
  model: string;
  size: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  maxStock: number;
  season?: string;
  condition?: string;
}

const CART_KEY = "gent_cart_v1";
const FAVORITES_KEY = "gent_favorites_v1";
const CART_EVENT = "gent-cart-change";
const FAVORITES_EVENT = "gent-favorites-change";

function isClient(): boolean {
  return typeof window !== "undefined";
}

/* ── Cart ───────────────────────────────────────────────────────────── */

export function getCart(): CartItem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];

    return items.map((item: any): CartItem => {
      const stock =
        typeof item.maxStock === "number" && !isNaN(item.maxStock) && item.maxStock > 0
          ? item.maxStock
          : typeof item.stock === "number" && !isNaN(item.stock) && item.stock > 0
          ? item.stock
          : 8;
      const quantity = Math.max(
        1,
        Math.min(stock, typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 1)
      );

      return {
        id: String(item.id),
        slug: item.slug ?? null,
        brand: String(item.brand || ""),
        model: String(item.model || ""),
        size: String(item.size || ""),
        price: typeof item.price === "number" ? item.price : 0,
        imageUrl: item.imageUrl ?? null,
        quantity,
        maxStock: stock,
        season: item.season,
        condition: item.condition,
      };
    });
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cart }));
  } catch {
    // Ignore quota or access errors
  }
}

export function addToCart(
  item: {
    id: string;
    slug?: string | null;
    brand: string;
    model: string;
    size: string;
    price: number;
    imageUrl?: string | null;
    stock?: number;
    maxStock?: number;
    season?: string;
    condition?: string;
  },
  qty = 1
): { cart: CartItem[]; addedItem: CartItem; isNew: boolean } {
  const current = getCart();
  const existingIndex = current.findIndex((i) => i.id === item.id);
  let isNew = false;
  let targetItem: CartItem;

  const availableStock =
    typeof item.stock === "number" && !isNaN(item.stock) && item.stock > 0
      ? item.stock
      : typeof item.maxStock === "number" && !isNaN(item.maxStock) && item.maxStock > 0
      ? item.maxStock
      : 8;

  if (existingIndex > -1) {
    const existing = current[existingIndex];
    const newQty = Math.min(availableStock, existing.quantity + qty);
    targetItem = { ...existing, quantity: newQty, maxStock: availableStock, price: item.price };
    current[existingIndex] = targetItem;
  } else {
    isNew = true;
    targetItem = {
      id: item.id,
      slug: item.slug,
      brand: item.brand,
      model: item.model,
      size: item.size,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: Math.min(availableStock, Math.max(1, qty)),
      maxStock: availableStock,
      season: item.season,
      condition: item.condition,
    };
    current.push(targetItem);
  }

  saveCart(current);
  return { cart: current, addedItem: targetItem, isNew };
}

export function updateCartQuantity(id: string, qty: number): CartItem[] {
  let current = getCart();
  if (qty <= 0) {
    current = current.filter((i) => i.id !== id);
  } else {
    current = current.map((i) => {
      if (i.id !== id) return i;
      const limit =
        typeof i.maxStock === "number" && !isNaN(i.maxStock) && i.maxStock > 0
          ? i.maxStock
          : 8;
      const targetQty = Math.max(1, Math.min(limit, qty));
      return { ...i, quantity: targetQty, maxStock: limit };
    });
  }
  saveCart(current);
  return current;
}

export function removeFromCart(id: string): CartItem[] {
  const current = getCart().filter((i) => i.id !== id);
  saveCart(current);
  return current;
}

export function clearCart(): void {
  saveCart([]);
}

export function subscribeToCart(callback: (cart: CartItem[]) => void): () => void {
  if (!isClient()) return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<CartItem[]>;
    callback(custom.detail || getCart());
  };
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/* ── Favorites ──────────────────────────────────────────────────────── */

export function getFavorites(): string[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: favs }));
  } catch {
    // Ignore quota or access errors
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const current = getFavorites();
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  saveFavorites(next);
  return !exists;
}

export function subscribeToFavorites(callback: (favs: string[]) => void): () => void {
  if (!isClient()) return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<string[]>;
    callback(custom.detail || getFavorites());
  };
  window.addEventListener(FAVORITES_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
