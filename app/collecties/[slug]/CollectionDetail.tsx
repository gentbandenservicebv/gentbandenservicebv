"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { addToCart } from "@/lib/store";
import CollectionDetailSkeleton from "./CollectionDetailSkeleton";
import "../collecties.css";

interface TyreImage {
  id: string;
  url: string;
}

interface Tyre {
  id: string;
  slug?: string | null;
  brand: string;
  model: string;
  size: string;
  width?: number | null;
  aspectRatio?: number | null;
  diameter?: number | null;
  speedIndex?: string | null;
  loadIndex?: string | null;
  season: string;
  condition: string;
  price: number;
  stock: number;
  runflat?: boolean;
  reinforced?: boolean;
  fuelEfficiency?: string | null;
  wetGrip?: string | null;
  noiseLevel?: number | null;
  images: TyreImage[];
}

interface CollectionItem {
  id: string;
  axle: "FRONT" | "REAR" | "ALL";
  quantity: number;
  tyre: Tyre;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  season: "SUMMER" | "WINTER" | "ALL_SEASON";
  featured: boolean;
  active: boolean;
  imageUrl: string | null;
  items: CollectionItem[];
}

interface Props {
  slug: string;
}

export default function CollectionDetail({ slug }: Props) {
  const router = useRouter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // Dynamic delivery settings from admin
  const [deliveryInfo, setDeliveryInfo] = useState<{ min: string; max: string; unit: string; inStockText: string }>({
    min: "2",
    max: "5",
    unit: "werkdagen",
    inStockText: "Op voorraad",
  });

  useEffect(() => {
    fetch("/api/settings?public=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDeliveryInfo({
            min: data.delivery_time_min || "2",
            max: data.delivery_time_max || "5",
            unit: data.delivery_time_unit || "werkdagen",
            inStockText: data.in_stock_text || "Op voorraad",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    async function loadCollection() {
      try {
        setLoading(true);
        const res = await fetch(`/api/collections/${slug}`);
        if (!res.ok) {
          setError("Collectie niet gevonden");
          return;
        }
        const data = await res.json();
        setCollection(data);
      } catch {
        setError("Fout bij laden van collectie");
      } finally {
        setLoading(false);
      }
    }
    loadCollection();
  }, [slug]);

  if (loading) {
    return <CollectionDetailSkeleton />;
  }

  if (error || !collection) {
    return (
      <div className="collecties-page" style={{ paddingTop: 140, textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Collectie niet gevonden</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>De opgevraagde bandenset bestaat niet of is inactief.</p>
        <Link href="/collecties" className="btn btn--primary" style={{ padding: "10px 20px", borderRadius: 8 }}>
          Bekijk alle collecties
        </Link>
      </div>
    );
  }

  const frontItem = collection.items.find((i) => i.axle === "FRONT");
  const rearItem = collection.items.find((i) => i.axle === "REAR");

  const frontTotal = frontItem?.tyre ? frontItem.tyre.price * frontItem.quantity : 0;
  const rearTotal = rearItem?.tyre ? rearItem.tyre.price * rearItem.quantity : 0;
  const totalSetPrice = frontTotal + rearTotal;

  const isFullSetInStock =
    (frontItem?.tyre ? frontItem.tyre.stock > 0 : true) &&
    (rearItem?.tyre ? rearItem.tyre.stock > 0 : true);

  const handleAddFullSetToCart = () => {
    if (frontItem?.tyre) {
      addToCart(
        {
          id: frontItem.tyre.id,
          slug: frontItem.tyre.slug,
          brand: frontItem.tyre.brand,
          model: frontItem.tyre.model,
          size: frontItem.tyre.size,
          price: frontItem.tyre.price,
          imageUrl: frontItem.tyre.images?.[0]?.url,
          stock: frontItem.tyre.stock,
          season: frontItem.tyre.season,
          condition: frontItem.tyre.condition,
        },
        frontItem.quantity
      );
    }

    if (rearItem?.tyre) {
      addToCart(
        {
          id: rearItem.tyre.id,
          slug: rearItem.tyre.slug,
          brand: rearItem.tyre.brand,
          model: rearItem.tyre.model,
          size: rearItem.tyre.size,
          price: rearItem.tyre.price,
          imageUrl: rearItem.tyre.images?.[0]?.url,
          stock: rearItem.tyre.stock,
          season: rearItem.tyre.season,
          condition: rearItem.tyre.condition,
        },
        rearItem.quantity
      );
    }

    setAddedMessage("De complete 4-bandenset is toegevoegd aan uw winkelwagen!");
    setTimeout(() => setAddedMessage(null), 4000);
  };

  const handleAddSingleAxle = (item: CollectionItem, label: string) => {
    addToCart(
      {
        id: item.tyre.id,
        slug: item.tyre.slug,
        brand: item.tyre.brand,
        model: item.tyre.model,
        size: item.tyre.size,
        price: item.tyre.price,
        imageUrl: item.tyre.images?.[0]?.url,
        stock: item.tyre.stock,
        season: item.tyre.season,
        condition: item.tyre.condition,
      },
      item.quantity
    );
    setAddedMessage(`2x ${label} toegevoegd aan uw winkelwagen!`);
    setTimeout(() => setAddedMessage(null), 4000);
  };

  return (
    <div className="collecties-page">
      {/* Header & Breadcrumb */}
      <div className="page-hero bg-dark" style={{ paddingBottom: collection.imageUrl ? 24 : 48 }}>
        <div className="container">
          <nav className="bc-breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">/</span>
            <Link href="/collecties">Breedsets &amp; Collecties</Link>
            <span className="separator">/</span>
            <span className="current">{collection.name}</span>
          </nav>

          {/* If collection has an image, render it as a wide cinematic banner */}
          {collection.imageUrl ? (
            <div className="collectie-hero-banner">
              <Image
                src={collection.imageUrl}
                alt={collection.name}
                fill
                unoptimized
                priority
                className="collectie-hero-banner__img"
              />
              <div className="collectie-hero-banner__overlay" />

              <div className="collectie-hero-banner__content">
                <div className="collectie-hero-banner__badges">
                  {collection.vehicleBrand && (
                    <span className="collectie-hero-banner__badge collectie-hero-banner__badge--brand">
                      {collection.vehicleBrand} {collection.vehicleModel}
                    </span>
                  )}
                  {collection.vehicleYear && (
                    <span className="collectie-hero-banner__badge collectie-hero-banner__badge--year">
                      Bouwjaar {collection.vehicleYear}
                    </span>
                  )}
                  <span
                    className="collectie-hero-banner__badge collectie-hero-banner__badge--season"
                    style={{
                      background:
                        collection.season === "SUMMER"
                          ? "rgba(245, 158, 11, 0.3)"
                          : collection.season === "WINTER"
                          ? "rgba(59, 130, 246, 0.3)"
                          : "rgba(16, 185, 129, 0.3)",
                      color:
                        collection.season === "SUMMER"
                          ? "#fbbf24"
                          : collection.season === "WINTER"
                          ? "#60a5fa"
                          : "#34d399",
                    }}
                  >
                    {collection.season === "SUMMER" ? "Zomerbanden" : collection.season === "WINTER" ? "Winterbanden" : "4-Seizoenen"}
                  </span>
                </div>

                <h1 className="collectie-hero-banner__title">{collection.name}</h1>
                {collection.description && (
                  <p className="collectie-hero-banner__desc">{collection.description}</p>
                )}
              </div>
            </div>
          ) : (
            /* Fallback Typography Hero when no image is uploaded */
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
                {collection.vehicleBrand && (
                  <span
                    style={{
                      background: "#016eb9",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {collection.vehicleBrand} {collection.vehicleModel}
                  </span>
                )}
                {collection.vehicleYear && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Bouwjaar {collection.vehicleYear}
                  </span>
                )}
                <span
                  style={{
                    background:
                      collection.season === "SUMMER"
                        ? "rgba(245, 158, 11, 0.15)"
                        : collection.season === "WINTER"
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",
                    color:
                      collection.season === "SUMMER"
                        ? "#fbbf24"
                        : collection.season === "WINTER"
                        ? "#60a5fa"
                        : "#34d399",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {collection.season === "SUMMER" ? "Zomerbanden" : collection.season === "WINTER" ? "Winterbanden" : "4-Seizoenen"}
                </span>
              </div>

              <h1 className="page-hero__title" style={{ fontSize: "clamp(1.85rem, 3.8vw, 2.6rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                {collection.name}
              </h1>
              {collection.description && (
                <p className="page-hero__sub" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", maxWidth: 850, marginTop: 12, lineHeight: 1.6 }}>
                  {collection.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="container" style={{ paddingBottom: 80, paddingTop: collection.imageUrl ? 16 : 36 }}>
        <div className="collectie-detail-container">
          {addedMessage && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                fontSize: "0.95rem",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                color: "#10b981",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <span>✓ {addedMessage}</span>
              <Link
                href="/checkout"
                className="btn btn--primary"
                style={{ padding: "6px 14px", borderRadius: 6, fontSize: "0.85rem" }}
              >
                Naar afrekenen
              </Link>
            </div>
          )}

          {/* Symmetrical 2-Column Axle Grid: VOORAS & ACHTERAS (Centered) */}
          <div className="collectie-axles-grid">
            {/* VOORAS CARD */}
            {frontItem && (
              <div className="collectie-axle-box collectie-axle-box--front">
                <span
                  className="collectie-axle-box__badge"
                  style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}
                >
                  Vooras • {frontItem.quantity}x Banden
                </span>

                {/* Big Tire Image */}
                <div className="collectie-axle-box__img-wrap">
                  {frontItem.tyre.images?.[0]?.url ? (
                    <Image
                      src={frontItem.tyre.images[0].url}
                      alt={frontItem.tyre.brand + " " + frontItem.tyre.model}
                      fill
                      unoptimized
                      style={{ objectFit: "contain", padding: 8 }}
                    />
                  ) : (
                    <span style={{ fontSize: "3rem" }}>🛞</span>
                  )}
                </div>

                <h3 className="collectie-axle-box__brand">
                  {frontItem.tyre.brand} {frontItem.tyre.model}
                </h3>

                <div className="collectie-axle-box__size" style={{ color: "#38bdf8" }}>
                  {frontItem.tyre.size}
                </div>

                {/* DYNAMIC STOCK & DELIVERY TIME DISPLAY */}
                <div style={{ fontSize: "0.85rem", margin: "6px 0", minHeight: 22 }}>
                  {frontItem.tyre.stock > 0 ? (
                    <span style={{ color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                      {deliveryInfo.inStockText || "Op voorraad"} ({frontItem.tyre.stock} stuks beschikbaar)
                    </span>
                  ) : (
                    <span style={{ color: "#38bdf8", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                      Leverbaar binnen {deliveryInfo.min}–{deliveryInfo.max} {deliveryInfo.unit}
                    </span>
                  )}
                </div>

                {frontItem.tyre.fuelEfficiency && (
                  <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: "0.775rem", color: "rgba(255,255,255,0.7)" }}>
                    <span>Brandstof: <strong>{frontItem.tyre.fuelEfficiency}</strong></span>
                    <span>•</span>
                    <span>Grip: <strong>{frontItem.tyre.wetGrip}</strong></span>
                    {frontItem.tyre.noiseLevel && (
                      <>
                        <span>•</span>
                        <span>Geluid: <strong>{frontItem.tyre.noiseLevel} dB</strong></span>
                      </>
                    )}
                  </div>
                )}

                {/* Price block */}
                <div className="collectie-axle-box__price-block">
                  <div className="collectie-axle-box__price-total">
                    €{(frontItem.tyre.price * frontItem.quantity).toFixed(2)}
                  </div>
                  <div className="collectie-axle-box__price-sub">
                    €{frontItem.tyre.price.toFixed(2)} per band ({frontItem.quantity}x)
                  </div>
                </div>

                {/* Single axle order button */}
                <button
                  onClick={() => handleAddSingleAxle(frontItem, "Vooras banden")}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#e2e8f0",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#38bdf8";
                    e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                >
                  Enkel vooras toevoegen
                </button>
              </div>
            )}

            {/* ACHTERAS CARD (BREDER) */}
            {rearItem && (
              <div className="collectie-axle-box collectie-axle-box--rear">
                <span
                  className="collectie-axle-box__badge"
                  style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }}
                >
                  Achteras • {rearItem.quantity}x Banden (Breder)
                </span>

                {/* Big Tire Image (Wider visual) */}
                <div className="collectie-axle-box__img-wrap collectie-axle-box__img-wrap--rear">
                  {rearItem.tyre.images?.[0]?.url ? (
                    <Image
                      src={rearItem.tyre.images[0].url}
                      alt={rearItem.tyre.brand + " " + rearItem.tyre.model}
                      fill
                      unoptimized
                      style={{ objectFit: "contain", padding: 8 }}
                    />
                  ) : (
                    <span style={{ fontSize: "3.2rem" }}>🛞</span>
                  )}
                </div>

                <h3 className="collectie-axle-box__brand">
                  {rearItem.tyre.brand} {rearItem.tyre.model}
                </h3>

                <div className="collectie-axle-box__size" style={{ color: "#f59e0b" }}>
                  {rearItem.tyre.size}
                </div>

                {/* DYNAMIC STOCK & DELIVERY TIME DISPLAY */}
                <div style={{ fontSize: "0.85rem", margin: "6px 0", minHeight: 22 }}>
                  {rearItem.tyre.stock > 0 ? (
                    <span style={{ color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                      {deliveryInfo.inStockText || "Op voorraad"} ({rearItem.tyre.stock} stuks beschikbaar)
                    </span>
                  ) : (
                    <span style={{ color: "#38bdf8", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                      Leverbaar binnen {deliveryInfo.min}–{deliveryInfo.max} {deliveryInfo.unit}
                    </span>
                  )}
                </div>

                {rearItem.tyre.fuelEfficiency && (
                  <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: "0.775rem", color: "rgba(255,255,255,0.7)" }}>
                    <span>Brandstof: <strong>{rearItem.tyre.fuelEfficiency}</strong></span>
                    <span>•</span>
                    <span>Grip: <strong>{rearItem.tyre.wetGrip}</strong></span>
                    {rearItem.tyre.noiseLevel && (
                      <>
                        <span>•</span>
                        <span>Geluid: <strong>{rearItem.tyre.noiseLevel} dB</strong></span>
                      </>
                    )}
                  </div>
                )}

                {/* Price block */}
                <div className="collectie-axle-box__price-block">
                  <div className="collectie-axle-box__price-total">
                    €{(rearItem.tyre.price * rearItem.quantity).toFixed(2)}
                  </div>
                  <div className="collectie-axle-box__price-sub">
                    €{rearItem.tyre.price.toFixed(2)} per band ({rearItem.quantity}x)
                  </div>
                </div>

                {/* Single axle order button */}
                <button
                  onClick={() => handleAddSingleAxle(rearItem, "Achteras banden")}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#e2e8f0",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.background = "rgba(245, 158, 11, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                >
                  Enkel achteras toevoegen
                </button>
              </div>
            )}
          </div>

          {/* CENTERPIECE: Complete Set Order Banner (Full-Width, Centered) */}
          <div className="collectie-set-banner">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isFullSetInStock ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)", color: isFullSetInStock ? "#10b981" : "#38bdf8", padding: "4px 12px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                {isFullSetInStock ? (
                  <span>✓ {deliveryInfo.inStockText || "Direct op voorraad"} (4 banden)</span>
                ) : (
                  <span>📦 Levertijd set: {deliveryInfo.min}–{deliveryInfo.max} {deliveryInfo.unit}</span>
                )}
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px 0", color: "#fff" }}>
                Complete set bestellen voor {collection.vehicleBrand || "uw auto"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                Inclusief 2x vooras ({frontItem?.tyre?.size}) en 2x achteras ({rearItem?.tyre?.size}).
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>
                <span>🚚 <strong>Gratis levering</strong> in België</span>
                <span>•</span>
                <span>🛠️ <strong>Montage mogelijk</strong> in Gent</span>
                <span>•</span>
                <span>📄 Factuur met BTW</span>
              </div>
            </div>

            <div className="collectie-set-banner__actions">
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Totaal setprijs (4 banden)
                </div>
                <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "#10b981", lineHeight: 1.1 }}>
                  €{totalSetPrice.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  inclusief 21% BTW &amp; milieubijdrage
                </div>
              </div>

              <button
                onClick={handleAddFullSetToCart}
                className="btn btn--primary"
                style={{
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 6px 20px rgba(1, 110, 185, 0.4)",
                  cursor: "pointer",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Complete set bestellen
              </button>

              <Link
                href="/afspraak"
                style={{
                  textAlign: "center",
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Of afspraak maken voor montage in Gent
              </Link>
            </div>
          </div>

          {/* Compatibility Guarantee Note (Centered) */}
          <div
            style={{
              background: "rgba(1, 110, 185, 0.08)",
              border: "1px solid rgba(1, 110, 185, 0.2)",
              borderRadius: 14,
              padding: "22px 28px",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#38bdf8", fontSize: "1rem", fontWeight: 700 }}>
              100% Pasvorm- &amp; Rolomtrekgarantie
            </h4>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.65 }}>
              Bij vierwielaangedreven wagens (zoals <strong>BMW xDrive</strong>, <strong>Mercedes 4MATIC</strong> en <strong>Audi quattro</strong>) is het essentieel dat het rolomtrekverschil tussen de vooras en achteras binnen de fabrieksmarge blijft (&lt; 1-2%).
              Deze set is conform de officiële fabrikantspecificaties samengesteld ter bescherming van uw aandrijflijn en differentieel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
