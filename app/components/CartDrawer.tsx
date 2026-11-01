"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CartItem,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  subscribeToCart,
} from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import "./CartDrawer.css";

export default function CartDrawer() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
    const unsub = subscribeToCart((updated) => setCart(updated));

    const handleOpen = () => {
      setOpen(true);
    };

    window.addEventListener("gent-open-cart", handleOpen);
    return () => {
      unsub();
      window.removeEventListener("gent-open-cart", handleOpen);
    };
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const tyreSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  function handleGoToCheckout() {
    setOpen(false);
    router.push("/checkout");
  }

  if (!open) return null;

  return (
    <div
      className="cart-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Winkelmand">
        {/* Header */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2 className="cart-drawer__title">Winkelmand</h2>
            {totalCount > 0 && <span className="cart-drawer__badge">{totalCount}</span>}
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={() => setOpen(false)}
            aria-label="Winkelmand sluiten"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {cart.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3 className="cart-drawer__empty-title">Uw winkelmand is leeg</h3>
              <p className="cart-drawer__empty-text">
                Bekijk ons actuele aanbod nieuwe en 2de hands banden en voeg uw gewenste maat toe.
              </p>
              <Link
                href="/banden"
                className="btn btn--primary"
                onClick={() => setOpen(false)}
              >
                Banden bekijken
              </Link>
            </div>
          ) : (
            <>
              {/* Login persuasion or logged in badge */}
              {!user ? (
                <div className="cart-drawer__auth-card">
                  <div className="cart-drawer__auth-card-icon">✨</div>
                  <div className="cart-drawer__auth-card-body">
                    <strong>Nieuwe klant?</strong>
                    <p>U kunt straks direct afrekenen als gast óf een account aanmaken voor snel orderoverzicht en facturen.</p>
                  </div>
                </div>
              ) : (
                <div className="cart-drawer__auth-card cart-drawer__auth-card--logged-in">
                  <div className="cart-drawer__auth-card-icon">✓</div>
                  <div className="cart-drawer__auth-card-body">
                    <strong>Ingelogd als {user.name || user.email}</strong>
                    <p>Uw gegevens worden automatisch gekoppeld aan deze bestelling.</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="cart-drawer__items-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__img">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={`${item.brand} ${item.model}`}
                          width={72}
                          height={72}
                          unoptimized
                        />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="44" stroke="#cbd5e1" strokeWidth="8" />
                          <circle cx="50" cy="50" r="18" fill="#e2e8f0" />
                        </svg>
                      )}
                    </div>

                    <div className="cart-item__info">
                      <div className="cart-item__top">
                        <span className="cart-item__brand">{item.brand}</span>
                        <button
                          type="button"
                          className="cart-item__delete"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`${item.brand} ${item.model} verwijderen`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>

                      <div className="cart-item__model">{item.model}</div>
                      <div className="cart-item__size">{item.size}</div>

                      <div className="cart-item__bottom">
                        <div>
                          <div className="cart-item__qty">
                            <button
                              type="button"
                              className="cart-item__qty-btn"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Aantal verlagen"
                            >
                              −
                            </button>
                            <span className="cart-item__qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-item__qty-btn"
                              onClick={() => {
                                if (item.quantity < item.maxStock) {
                                  updateCartQuantity(item.id, item.quantity + 1);
                                }
                              }}
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Aantal verhogen"
                              title={item.quantity >= item.maxStock ? "Maximaal aantal bereikt" : "Aantal verhogen"}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="cart-item__price">
                          €{(item.price * item.quantity).toFixed(2)}
                          <div className="cart-item__unit-price">
                            (€{item.price.toFixed(2)} /st)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Service info banner */}
              <div className="cart-drawer__service-pill">
                <span>🔧</span>
                <div>
                  <strong>Montage of levering</strong>
                  <p>In de volgende stap kiest u eenvoudig voor montage in onze werkplaats (Dendermondsesteenweg 428, 9040 Gent) of thuislevering.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__totals">
              <div className="cart-drawer__total-row">
                <span>Aantal geselecteerde banden</span>
                <strong>{totalCount} stuk{totalCount !== 1 ? "s" : ""}</strong>
              </div>
              <div className="cart-drawer__total-row cart-drawer__total-row--main">
                <span>Subtotaal banden</span>
                <span>€{tyreSubtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              className="cart-drawer__checkout-btn"
              onClick={handleGoToCheckout}
            >
              <span>Doorgaan naar afrekenen</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="cart-drawer__footer-actions">
              <button
                type="button"
                className="cart-drawer__continue-btn"
                onClick={() => setOpen(false)}
              >
                Verder winkelen
              </button>
              <button
                type="button"
                className="cart-drawer__clear-btn"
                onClick={clearCart}
              >
                Mand legen
              </button>
            </div>

            <div className="cart-drawer__guarantee">
              <span>🔒 100% Beveiligde Stripe betaling</span>
              <span>·</span>
              <span>Bancontact, iDEAL &amp; Pay</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
