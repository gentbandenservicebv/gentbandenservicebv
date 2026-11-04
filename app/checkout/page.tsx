"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CartItem,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  subscribeToCart,
  addToCart,
} from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import StripeAddressAutocomplete from "./StripeAddressAutocomplete";
import "./checkout.css";

const MONTAGE_PRICE = 19.99; // €19.99 per tyre

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tyreIdParam = searchParams.get("tyreId");
  const qtyParam = Math.max(1, parseInt(searchParams.get("qty") || "2", 10));
  const montageParam = searchParams.get("montage") !== "0";

  // Auth session
  const { data: sessionData, isPending: sessionPending } = useSession();
  const user = sessionData?.user;

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // Checkout configuration
  const [withMontage, setWithMontage] = useState(montageParam);
  const [checkoutMode, setCheckoutMode] = useState<"account" | "guest">("guest");
  const [createAccountAfter, setCreateAccountAfter] = useState(false);

  // Form details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [address, setAddress] = useState({
    street: "",
    postalCode: "",
    city: "",
    country: "België",
  });

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  function handleSelectMontage() {
    const primaryTire = cart[0];
    const size = primaryTire?.size || "";
    const tireName = primaryTire ? `${primaryTire.brand} ${primaryTire.model}` : "";
    const tireId = primaryTire?.id || "";
    const qty = totalCount || 2;

    const params = new URLSearchParams();
    params.set("service", "fitting");
    if (size) params.set("size", size);
    if (tireName) params.set("tire", `${tireName} (${size})`);
    if (tireId) params.set("tireId", tireId);
    if (qty) params.set("qty", String(qty));
    params.set("from", "checkout");

    router.push(`/afspraak?${params.toString()}`);
  }

  // Initialize cart and handle direct tyre query param
  useEffect(() => {
    const existing = getCart();
    setCart(existing);

    // If tyreId param is present and item not in cart, fetch & add it
    if (tyreIdParam) {
      const alreadyInCart = existing.some((it) => it.id === tyreIdParam);
      if (!alreadyInCart) {
        fetch(`/api/tyres/${encodeURIComponent(tyreIdParam)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((tyreData) => {
            if (tyreData) {
              const primaryImg = tyreData.images?.find((i: any) => i.isPrimary) || tyreData.images?.[0];
              addToCart(
                {
                  id: tyreData.id,
                  slug: tyreData.slug,
                  brand: tyreData.brand,
                  model: tyreData.model,
                  size: tyreData.size,
                  price: tyreData.price,
                  imageUrl: primaryImg?.url || null,
                  stock: tyreData.stock || 4,
                  season: tyreData.season,
                  condition: tyreData.condition,
                },
                qtyParam
              );
              setCart(getCart());
            }
          })
          .catch((err) => console.error("Could not fetch tyre from param:", err))
          .finally(() => setLoadingCart(false));
        return;
      }
    }

    setLoadingCart(false);

    const unsub = subscribeToCart((updated) => setCart(updated));
    return () => unsub();
  }, [tyreIdParam, qtyParam]);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user, name, email]);

  const hasSecondhand = cart.some((it) => it.condition === "USED");

  useEffect(() => {
    if (hasSecondhand && !withMontage) {
      setWithMontage(true);
    }
  }, [hasSecondhand, withMontage]);

  const totalCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const tyreSubtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const montageSubtotal = withMontage ? MONTAGE_PRICE * totalCount : 0;
  const grandTotal = tyreSubtotal + montageSubtotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError("");

    if (cart.length === 0) {
      setCheckoutError("Uw winkelmand is leeg. Voeg eerst banden toe.");
      return;
    }

    if (!withMontage) {
      if (hasSecondhand) {
        setCheckoutError("Tweedehands banden kunnen niet verzonden worden. Kies voor montage of afhaling in onze werkplaats.");
        return;
      }
      if (!address.street.trim() || !address.postalCode.trim() || !address.city.trim()) {
        setCheckoutError("Vul alstublieft uw straat, postcode en gemeente in voor de bezorging.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const items = cart.map((it) => ({
        tyreId: it.id,
        quantity: it.quantity,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          withMontage,
          userId: user?.id || null,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim(),
          address: withMontage ? null : address,
          notes: notes.trim() || null,
          createAccountAfter,
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "De betaling kon niet worden gestart. Probeer het opnieuw.");
        setSubmitting(false);
      }
    } catch {
      setCheckoutError("Er kon geen verbinding worden gemaakt met de betalingsserver.");
      setSubmitting(false);
    }
  }

  if (loadingCart) {
    return (
      <div className="checkout-page">
        <div className="checkout-container" style={{ textAlign: "center", padding: "100px 20px" }}>
          <div className="checkout-spinner" />
          <p style={{ marginTop: 16, color: "#64748b", fontWeight: 600 }}>Bestelgegevens laden…</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon">🛞</div>
            <h2 className="checkout-empty-title">Uw winkelmand is leeg</h2>
            <p className="checkout-empty-text">
              U heeft momenteel geen banden geselecteerd om af te rekenen. Bekijk ons actuele aanbod nieuwe en 2de hands banden.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/banden" className="checkout-empty-btn checkout-empty-btn--primary">
                Bekijk alle banden
              </Link>
              <Link href="/afspraak" className="checkout-empty-btn checkout-empty-btn--secondary">
                Afspraak inplannen
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header navigation */}
        <div className="checkout-header">
          <Link href="/banden" className="checkout-back-link">
            ← Verder winkelen
          </Link>
          <div className="checkout-header-main">
            <div>
              <h1 className="checkout-title">Veilig Afrekenen</h1>
              <p className="checkout-subtitle">
                Rond uw bestelling eenvoudig af. Kies voor vakkundige montage in Gent of gratis thuislevering.
              </p>
            </div>
            <div className="checkout-secure-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-bit SSL Beveiligd</span>
            </div>
          </div>
        </div>

        {/* Unregistered User Persuasion Box (Shown when NOT logged in) */}
        {!user && !sessionPending && (
          <div className="checkout-persuasion-box">
            <div className="checkout-persuasion-header">
              <div className="checkout-persuasion-tag">
                <span>⚡ Slim &amp; Snel Afrekenen</span>
              </div>
              <h2 className="checkout-persuasion-heading">Hoe wilt u bestellen?</h2>
              <p className="checkout-persuasion-lead">
                Maak een gratis account aan voor orderbeheer, BTW-facturen en snellere bestellingen, of ga direct door als gast zonder registratie.
              </p>
            </div>

            <div className="checkout-persuasion-grid">
              {/* Option 1: Create Account / Login (Highlighted) */}
              <div className="checkout-persuasion-card checkout-persuasion-card--primary">
                <div className="checkout-card-ribbon">Aanbevolen</div>
                <div className="checkout-card-top">
                  <div className="checkout-card-icon checkout-card-icon--star">✨</div>
                  <div>
                    <h3 className="checkout-card-title">Account aanmaken of Inloggen</h3>
                    <p className="checkout-card-subtitle">Geniet van maximale controle en extra gemak</p>
                  </div>
                </div>

                <ul className="checkout-perks-list">
                  <li>
                    <span className="checkout-perk-check">✓</span>
                    <span><strong>Geen gegevens herhalen:</strong> Adres en contactgegevens direct bewaard</span>
                  </li>
                  <li>
                    <span className="checkout-perk-check">✓</span>
                    <span><strong>Orderoverzicht &amp; Facturen:</strong> Download 24/7 officiële BTW-facturen</span>
                  </li>
                  <li>
                    <span className="checkout-perk-check">✓</span>
                    <span><strong>Afsprakenbeheer:</strong> Beheer montage en seizoenswissels op één plek</span>
                  </li>
                  <li>
                    <span className="checkout-perk-check">✓</span>
                    <span><strong>Seizoensalerts:</strong> Tijdig bericht voor zomer- en winterbandenwissel</span>
                  </li>
                </ul>

                <div className="checkout-persuasion-actions">
                  <Link
                    href={`/auth/signup?callbackUrl=${encodeURIComponent("/checkout")}`}
                    className="checkout-btn-account"
                  >
                    <span>Gratis account aanmaken</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                  <Link
                    href={`/auth/signin?callbackUrl=${encodeURIComponent("/checkout")}`}
                    className="checkout-btn-signin"
                  >
                    Al een account? <strong>Inloggen</strong>
                  </Link>
                </div>
              </div>

              {/* Option 2: Guest Checkout */}
              <div
                className={`checkout-persuasion-card checkout-persuasion-card--guest ${checkoutMode === "guest" ? "checkout-persuasion-card--active" : ""}`}
                onClick={() => setCheckoutMode("guest")}
              >
                <div className="checkout-card-top">
                  <div className="checkout-card-icon checkout-card-icon--guest">👤</div>
                  <div>
                    <h3 className="checkout-card-title">Verdergaan als gast</h3>
                    <p className="checkout-card-subtitle">Direct afrekenen zonder wachtwoord</p>
                  </div>
                </div>

                <p className="checkout-guest-desc">
                  Wilt u liever geen account aanmaken? Geen enkel probleem. Vul hieronder direct uw e-mail en telefoonnummer in voor de order- en betaalbevestiging via Stripe.
                </p>

                <div className="checkout-guest-features">
                  <div className="checkout-guest-feature-item">
                    <span>⚡</span> <span>Geen wachtwoord vereist</span>
                  </div>
                  <div className="checkout-guest-feature-item">
                    <span>🔒</span> <span>Direct door naar betaling</span>
                  </div>
                  <div className="checkout-guest-feature-item">
                    <span>🧾</span> <span>Betaalbewijs direct per mail</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="checkout-btn-guest"
                  onClick={() => {
                    setCheckoutMode("guest");
                    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Direct doorgaan als gast ↓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logged in reassurance banner */}
        {user && (
          <div className="checkout-user-banner">
            <div className="checkout-user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="checkout-user-details">
              <strong>Ingelogd als {user.name || "Klant"}</strong> ({user.email})
              <span className="checkout-user-sub">
                Uw bestelling wordt automatisch geregistreerd in uw account.
              </span>
            </div>
            <button
              type="button"
              className="checkout-user-switch"
              onClick={() => signOut()}
            >
              Uitloggen
            </button>
          </div>
        )}

        {/* Main 2-column Checkout Form */}
        <form onSubmit={handleSubmit}>
          <div className="checkout-grid">
            {/* Left Column: Form Details */}
            <div className="checkout-main">
              {/* Step 1: Contact Details */}
              <div className="checkout-card" id="contact-section">
                <div className="checkout-card__header">
                  <div className="checkout-card__step">1</div>
                  <div>
                    <h2 className="checkout-card__title">
                      {user ? "Uw Contactgegevens" : "Uw Contactgegevens (Gastbestelling)"}
                    </h2>
                    <p className="checkout-card__desc">
                      Hierop ontvangt u uw betaalbewijs en updates over uw banden.
                    </p>
                  </div>
                </div>

                <div className="checkout-form-group">
                  <div className="checkout-field">
                    <label className="checkout-label">Voor- en achternaam *</label>
                    <input
                      className="checkout-input"
                      type="text"
                      required
                      placeholder="bijv. Jan De Smet"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="checkout-form-row">
                    <div className="checkout-field">
                      <label className="checkout-label">Telefoonnummer *</label>
                      <input
                        className="checkout-input"
                        type="tel"
                        required
                        placeholder="bijv. 0467 87 12 05"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-label">E-mailadres *</label>
                      <input
                        className="checkout-input"
                        type="email"
                        required
                        placeholder="uw@email.be"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Optional account creation for guests */}
                  {!user && (
                    <label className="checkout-create-account-checkbox">
                      <input
                        type="checkbox"
                        checked={createAccountAfter}
                        onChange={(e) => setCreateAccountAfter(e.target.checked)}
                      />
                      <span>
                        <strong>Handig:</strong> Maak na betaling automatisch een account aan met deze gegevens zodat ik mijn factuur en order online kan inzien.
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Step 2: Montage & Service Choice */}
              <div className="checkout-card">
                <div className="checkout-card__header">
                  <div className="checkout-card__step">2</div>
                  <div>
                    <h2 className="checkout-card__title">Montage &amp; Levering</h2>
                    <p className="checkout-card__desc">
                      Kies voor professionele montage in onze werkplaats of thuislevering.
                    </p>
                  </div>
                </div>

                <div className="checkout-service-options">
                  {/* Option A: With Montage / Workshop */}
                  <div
                    className={`checkout-service-card ${withMontage ? "checkout-service-card--active" : ""}`}
                    onClick={() => setWithMontage(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setWithMontage(true)}
                  >
                    <input
                      type="radio"
                      className="checkout-service-radio"
                      checked={withMontage}
                      onChange={() => setWithMontage(true)}
                    />
                    <div className="checkout-service-content">
                      <div className="checkout-service-headline">
                        <span className="checkout-service-name">
                          🔧 Montage &amp; Afhaling in onze werkplaats
                        </span>
                        <span className="checkout-service-price" style={{ color: "var(--primary)" }}>
                          {hasSecondhand ? "Verplicht voor 2de hands" : "Populairste keuze"}
                        </span>
                      </div>
                      <p className="checkout-service-desc">
                        Vakkundig gemonteerd en gebalanceerd in onze werkplaats (Dendermondsesteenweg 428, Gent).
                        {hasSecondhand && " Tweedehands banden worden altijd in onze werkplaats gecontroleerd en gemonteerd of klaargelegd voor afhaling."}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMontage();
                        }}
                        style={{
                          marginTop: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Wilt u vooraf een specifiek tijdslot reserveren? Open de planner →
                      </button>
                    </div>
                  </div>

                  {/* Option B: Without Montage (Home Delivery) */}
                  <div
                    className={`checkout-service-card ${!withMontage ? "checkout-service-card--active" : ""} ${hasSecondhand ? "checkout-service-card--disabled" : ""}`}
                    onClick={() => {
                      if (hasSecondhand) return;
                      setWithMontage(false);
                    }}
                    role="button"
                    tabIndex={hasSecondhand ? -1 : 0}
                    onKeyDown={(e) => {
                      if (hasSecondhand) return;
                      if (e.key === " ") setWithMontage(false);
                    }}
                  >
                    <input
                      type="radio"
                      className="checkout-service-radio"
                      checked={!withMontage && !hasSecondhand}
                      disabled={hasSecondhand}
                      onChange={() => {
                        if (hasSecondhand) return;
                        setWithMontage(false);
                      }}
                    />
                    <div className="checkout-service-content">
                      <div className="checkout-service-headline">
                        <span className="checkout-service-name">
                          📦 Levering aan huis (Zonder montage)
                        </span>
                        <span className="checkout-service-price" style={{ color: hasSecondhand ? "#dc2626" : "#16a34a" }}>
                          {hasSecondhand ? "Niet leverbaar" : "Gratis bezorging"}
                        </span>
                      </div>
                      <p className="checkout-service-desc">
                        {hasSecondhand ? (
                          <span style={{ color: "#b45309", fontWeight: 600 }}>
                            ⚠️ Tweedehands banden worden niet verzonden. Deze zijn uitsluitend beschikbaar voor montage of afhaling in onze werkplaats.
                          </span>
                        ) : (
                          "Uw banden worden snel en zorgvuldig afgeleverd op uw woon- of bedrijfsadres. Vul hieronder uw adres in."
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditional Notice / Address */}
                {withMontage ? (
                  <div className="checkout-montage-notice">
                    <span className="checkout-montage-notice__icon">📍</span>
                    <div className="checkout-montage-notice__text">
                      <strong>Montage ter plaatse bij Gent Bandenservice BV</strong>
                      <p>
                        Locatie: <strong>Dendermondsesteenweg 428, 9040 Gent</strong>. Na de betaling staan uw banden meteen voor u klaar. Kom gerust langs tijdens onze openingsuren (Ma–Za: 09:00–18:00) of kies een voorkeurstijd bij de opmerkingen!
                      </p>
                    </div>
                  </div>
                ) : (
                  <StripeAddressAutocomplete
                    value={address}
                    onChange={(newAddress) => setAddress(newAddress)}
                    required={!withMontage}
                  />
                )}
              </div>

              {/* Step 3: Opmerkingen & Voertuiggegevens */}
              <div className="checkout-card">
                <div className="checkout-card__header">
                  <div className="checkout-card__step">3</div>
                  <div>
                    <h2 className="checkout-card__title">Opmerkingen &amp; Voertuig (Optioneel)</h2>
                    <p className="checkout-card__desc">
                      Laat eventuele specifieke instructies of voertuigdetails achter.
                    </p>
                  </div>
                </div>

                <div className="checkout-field">
                  <label className="checkout-label">Opmerkingen of kenteken (optioneel)</label>
                  <textarea
                    className="checkout-textarea"
                    rows={3}
                    placeholder="Vermeld eventueel uw automerk, model of kenteken, of uw voorkeursdag voor montage..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="checkout-sidebar">
              <div className="checkout-card checkout-summary-card">
                <div className="checkout-summary-header">
                  <h3 className="checkout-summary-title">Overzicht bestelling</h3>
                  <span className="checkout-summary-count">{totalCount} band{totalCount !== 1 ? "en" : ""}</span>
                </div>

                {/* Items in Cart */}
                <div className="checkout-items-scroll">
                  {cart.map((item) => (
                    <div key={item.id} className="checkout-item-row">
                      <div className="checkout-item-img">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={`${item.brand} ${item.model}`}
                            width={64}
                            height={64}
                            unoptimized
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                          />
                        ) : (
                          <span style={{ fontSize: "1.5rem" }}>🛞</span>
                        )}
                      </div>
                      <div className="checkout-item-details">
                        <div className="checkout-item-brand">{item.brand}</div>
                        <div className="checkout-item-model">{item.model}</div>
                        <div className="checkout-item-size">{item.size}</div>

                        <div className="checkout-item-actions">
                          <div>
                            <div className="checkout-item-qty-pill">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label="Aantal verlagen"
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
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
                          <span className="checkout-item-price">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            className="checkout-item-remove"
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Verwijderen"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="checkout-breakdown">
                  <div className="checkout-breakdown-row">
                    <span>Subtotaal ({totalCount} banden)</span>
                    <span>€{tyreSubtotal.toFixed(2)}</span>
                  </div>

                  {withMontage ? (
                    <div className="checkout-breakdown-row checkout-breakdown-row--highlight">
                      <span>✓ {totalCount}× Montage &amp; Balancering</span>
                      <span>€{montageSubtotal.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="checkout-breakdown-row">
                      <span>Levering aan huis</span>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>Gratis</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="checkout-total-row">
                  <div>
                    <span className="checkout-total-label">Totaalbedrag</span>
                    <span className="checkout-total-vat">Alle prijzen incl. BTW &amp; Recupel</span>
                  </div>
                  <span className="checkout-total-val">€{grandTotal.toFixed(2)}</span>
                </div>

                {checkoutError && (
                  <div className="checkout-error-box" role="alert">
                    <span>⚠️</span>
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button type="submit" className="checkout-submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="checkout-btn-spinner" />
                      <span>Doorsturen naar Stripe…</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <span>Afrekenen via Stripe — €{grandTotal.toFixed(2)}</span>
                    </>
                  )}
                </button>

                {/* Trust & Payment badges */}
                <div className="checkout-trust">
                  <div className="checkout-trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>100% beveiligde Stripe betaling</span>
                  </div>
                  <div className="checkout-trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Bancontact, iDEAL, Visa, Mastercard, Apple Pay</span>
                  </div>
                  <div className="checkout-trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Directe orderbevestiging &amp; factuur per e-mail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <p style={{ color: "#64748b" }}>Afrekenpagina laden…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
