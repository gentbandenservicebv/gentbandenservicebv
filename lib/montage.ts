import { SiteSettings, DEFAULT_SITE_SETTINGS } from "./settings-types";

export interface TyreMontageInfo {
  id?: string;
  size?: string | null;
  diameter?: number | null;
  runflat?: boolean | null;
  brand?: string;
  model?: string;
}

export interface MontageBreakdownItem {
  tyreId?: string;
  label: string;
  size: string;
  diameter: number | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  runflat: boolean;
}

export interface CartMontageResult {
  total: number;
  totalTyres: number;
  breakdown: MontageBreakdownItem[];
  summaryText: string;
}

/**
 * Extracts the rim diameter in inches from a tire size string or integer field.
 * Examples: "205/55 R16" -> 16, "225/45ZR17" -> 17, "315/30 R22" -> 22, "175/65R14C" -> 14.
 */
export function extractTyreDiameter(sizeStr?: string | null, diameterField?: number | null): number | null {
  if (typeof diameterField === "number" && !isNaN(diameterField) && diameterField >= 10 && diameterField <= 32) {
    return diameterField;
  }
  if (!sizeStr) return null;

  const clean = sizeStr.trim().toUpperCase();

  // Pattern: matches R16, ZR18, /15, -17, R 19, etc.
  const matchR = clean.match(/(?:R|ZR|-|\/|\s)\s*(\d{2})(?:[C\s]|$|[A-Z])/);
  if (matchR) {
    const val = parseInt(matchR[1], 10);
    if (val >= 10 && val <= 32) return val;
  }

  // Fallback pattern: 205/55 16 or 205/55R16
  const matchFull = clean.match(/\d{3}\/\d{2}\s*(?:R|ZR)?\s*(\d{2})/);
  if (matchFull) {
    const val = parseInt(matchFull[1], 10);
    if (val >= 10 && val <= 32) return val;
  }

  // Fallback: any 2 digits at end of size string
  const matchEnd = clean.match(/(\d{2})$/);
  if (matchEnd) {
    const val = parseInt(matchEnd[1], 10);
    if (val >= 10 && val <= 32) return val;
  }

  return null;
}

/**
 * Calculates the montage price per tire based on its size / diameter and site settings.
 */
export function getMontagePriceForTyre(
  tyre: TyreMontageInfo,
  settings?: Partial<SiteSettings> | null
): number {
  const mergedSettings = { ...DEFAULT_SITE_SETTINGS, ...(settings || {}) };
  const defaultPrice = parseFloat(mergedSettings.montage_default_price) || 19.99;
  const diameter = extractTyreDiameter(tyre.size, tyre.diameter);
  const isRunflat = Boolean(tyre.runflat);
  const runflatSurcharge = isRunflat
    ? Math.max(0, parseFloat(mergedSettings.montage_runflat_surcharge) || 0)
    : 0;

  // 1. Check custom rates JSON override (exact size string or exact diameter)
  if (mergedSettings.montage_custom_rates_json) {
    try {
      const customRates = JSON.parse(mergedSettings.montage_custom_rates_json);
      if (typeof customRates === "object" && customRates !== null) {
        if (tyre.size && customRates[tyre.size.trim()] !== undefined) {
          const customVal = parseFloat(customRates[tyre.size.trim()]);
          if (!isNaN(customVal) && customVal >= 0) {
            return Number((customVal + runflatSurcharge).toFixed(2));
          }
        }
        if (diameter && customRates[String(diameter)] !== undefined) {
          const customVal = parseFloat(customRates[String(diameter)]);
          if (!isNaN(customVal) && customVal >= 0) {
            return Number((customVal + runflatSurcharge).toFixed(2));
          }
        }
      }
    } catch {}
  }

  // 2. Fallback to default price if diameter couldn't be parsed
  if (!diameter) {
    return Number((defaultPrice + runflatSurcharge).toFixed(2));
  }

  // 3. Size bracket lookup
  let basePrice = defaultPrice;
  if (diameter <= 15) {
    basePrice = parseFloat(mergedSettings.montage_price_13_15) || defaultPrice;
  } else if (diameter === 16) {
    basePrice = parseFloat(mergedSettings.montage_price_16) || defaultPrice;
  } else if (diameter === 17) {
    basePrice = parseFloat(mergedSettings.montage_price_17) || defaultPrice;
  } else if (diameter === 18) {
    basePrice = parseFloat(mergedSettings.montage_price_18) || defaultPrice;
  } else if (diameter === 19) {
    basePrice = parseFloat(mergedSettings.montage_price_19) || defaultPrice;
  } else if (diameter === 20) {
    basePrice = parseFloat(mergedSettings.montage_price_20) || defaultPrice;
  } else if (diameter === 21) {
    basePrice = parseFloat(mergedSettings.montage_price_21) || defaultPrice;
  } else if (diameter >= 22) {
    basePrice = parseFloat(mergedSettings.montage_price_22_plus) || defaultPrice;
  }

  return Number((Math.max(0, basePrice) + runflatSurcharge).toFixed(2));
}

/**
 * Calculates total montage cost and breakdown for an array of cart/order items.
 */
export function calculateCartMontage(
  items: Array<{
    id?: string;
    tyreId?: string;
    size?: string | null;
    diameter?: number | null;
    runflat?: boolean | null;
    quantity: number;
    brand?: string;
    model?: string;
  }>,
  settings?: Partial<SiteSettings> | null
): CartMontageResult {
  const breakdown: MontageBreakdownItem[] = [];
  let total = 0;
  let totalTyres = 0;

  for (const item of items) {
    const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
    const unitPrice = getMontagePriceForTyre(
      {
        id: item.id || item.tyreId,
        size: item.size,
        diameter: item.diameter,
        runflat: item.runflat,
        brand: item.brand,
        model: item.model,
      },
      settings
    );

    const diameter = extractTyreDiameter(item.size, item.diameter);
    const subtotal = Number((unitPrice * qty).toFixed(2));
    total += subtotal;
    totalTyres += qty;

    const diameterLabel = diameter ? `${diameter} inch` : (item.size || "standaard");
    const label = `Montage & balancering (${diameterLabel}${item.runflat ? " · Runflat" : ""})`;

    breakdown.push({
      tyreId: item.id || item.tyreId,
      label,
      size: item.size || (diameter ? `R${diameter}` : ""),
      diameter,
      unitPrice,
      quantity: qty,
      subtotal,
      runflat: Boolean(item.runflat),
    });
  }

  total = Number(total.toFixed(2));

  // Build a concise human summary e.g. "4 banden (4× 16\" à €19.99)" or "4 banden (2× 16\" à €19.99, 2× 19\" à €25.00)"
  const groups: Record<string, { qty: number; unitPrice: number; inchLabel: string }> = {};
  for (const b of breakdown) {
    const key = `${b.diameter ?? "std"}_${b.unitPrice}`;
    if (!groups[key]) {
      groups[key] = {
        qty: 0,
        unitPrice: b.unitPrice,
        inchLabel: b.diameter ? `${b.diameter}"` : "standaard",
      };
    }
    groups[key].qty += b.quantity;
  }

  const parts = Object.values(groups).map(
    (g) => `${g.qty}× ${g.inchLabel} à €${g.unitPrice.toFixed(2)}`
  );
  const summaryText = `${totalTyres} ${totalTyres === 1 ? "band" : "banden"} (${parts.join(", ")})`;

  return {
    total,
    totalTyres,
    breakdown,
    summaryText,
  };
}
