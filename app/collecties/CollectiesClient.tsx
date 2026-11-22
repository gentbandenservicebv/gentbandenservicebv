"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import "./collecties.css";

interface TyreImage {
  id: string;
  url: string;
}

interface Tyre {
  id: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  stock: number;
  images?: TyreImage[];
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

export default function CollectiesClient({ initialCollections = [] }: { initialCollections?: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [loading, setLoading] = useState(initialCollections.length === 0);
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedSeason, setSelectedSeason] = useState("ALL");

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
    if (initialCollections.length > 0) return;
    async function fetchCollections() {
      try {
        setLoading(true);
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          setCollections(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load collections", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, [initialCollections.length]);

  const brands = useMemo(() => {
    const list = new Set<string>();
    collections.forEach((c) => {
      if (c.vehicleBrand) list.add(c.vehicleBrand);
    });
    return Array.from(list);
  }, [collections]);

  const filtered = useMemo(() => {
    return collections.filter((col) => {
      if (selectedBrand !== "ALL" && col.vehicleBrand?.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      if (selectedSeason !== "ALL" && col.season !== selectedSeason) {
        return false;
      }
      return true;
    });
  }, [collections, selectedBrand, selectedSeason]);

  return (
    <div className="collecties-page">
      {/* Hero Header */}
      <div className="page-hero bg-dark">
        <div className="container">
          <nav className="bc-breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">/</span>
            <span className="current">Breedsets &amp; Collecties</span>
          </nav>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(1, 110, 185, 0.15)", border: "1px solid rgba(1, 110, 185, 0.3)", padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            <span>Staggered Fitment • Breedsets</span>
          </div>

          <h1 className="page-hero__title" style={{ fontSize: "clamp(1.85rem, 4vw, 2.75rem)", fontWeight: 800, margin: "0 0 14px 0", letterSpacing: "-0.02em" }}>
            Banden Collecties &amp; Breedsets
          </h1>
          <p className="page-hero__sub" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", maxWidth: 750, lineHeight: 1.6, margin: 0 }}>
            Heeft uw wagen bredere achterbanden dan voorbanden (zoals de <strong>BMW X5</strong>, <strong>Mercedes-AMG</strong> of <strong>Porsche</strong>)?
            Kies een complete, perfect op elkaar afgestemde 4-bandenset met één klik.
          </p>

          {/* Filter Bar */}
          <div className="collecties-filter-bar">
            {/* Brand Filter */}
            <div className="collecties-filter-group">
              <span className="collecties-filter-label">Merk:</span>
              <button
                onClick={() => setSelectedBrand("ALL")}
                className={`collecties-pill-btn${selectedBrand === "ALL" ? " collecties-pill-btn--active" : ""}`}
              >
                Alle merken
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`collecties-pill-btn${selectedBrand === b ? " collecties-pill-btn--active" : ""}`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Season Filter */}
            <div className="collecties-filter-group">
              <span className="collecties-filter-label">Seizoen:</span>
              {[
                { id: "ALL", label: "Alles" },
                { id: "SUMMER", label: "Zomer" },
                { id: "WINTER", label: "Winter" },
                { id: "ALL_SEASON", label: "4-Seizoenen" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id)}
                  className={`collecties-pill-btn${selectedSeason === s.id ? " collecties-pill-btn--active" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ paddingBottom: 110, paddingTop: 36 }}>
        {loading ? (
          <div className="collecties-grid" aria-busy="true" aria-label="Collecties worden geladen">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="collectie-card collectie-skeleton-card">
                {/* Top bar skeleton */}
                <div className="collectie-card__top" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 70, height: 22 }} />
                    <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 85, height: 22 }} />
                  </div>
                  <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 80, height: 22 }} />
                </div>

                {/* Visual skeleton */}
                <div
                  className="collectie-card__visual"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    padding: "20px 24px",
                  }}
                >
                  <div className="collectie-skeleton collectie-skeleton-circle" style={{ width: 110, height: 110 }} />
                  <div className="collectie-skeleton collectie-skeleton-circle" style={{ width: 130, height: 130 }} />
                </div>

                {/* Body skeleton */}
                <div className="collectie-card__body">
                  <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "75%", height: 20, marginBottom: 8 }} />
                  <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "50%", height: 14, marginBottom: 16 }} />

                  {/* 2 Axle pills skeleton */}
                  <div className="collectie-card__axles" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div className="collectie-skeleton collectie-skeleton-box" style={{ height: 48, borderRadius: 8 }} />
                    <div className="collectie-skeleton collectie-skeleton-box" style={{ height: 48, borderRadius: 8 }} />
                  </div>

                  {/* Footer skeleton */}
                  <div className="collectie-card__footer" style={{ marginTop: "auto", paddingTop: 14 }}>
                    <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "40%", height: 14 }} />
                    <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 100, height: 36, borderRadius: 8 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "#161822",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "60px 20px",
              textAlign: "center",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🛞</div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px 0" }}>Geen breedsets gevonden binnen deze filters</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 24 }}>
              Er zijn momenteel geen sets die aan de geselecteerde filters voldoen. Neem gerust contact met ons op voor een set op maat voor uw wagen.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { setSelectedBrand("ALL"); setSelectedSeason("ALL"); }}
                className="btn btn--outline"
                style={{ padding: "8px 18px", borderRadius: 8 }}
              >
                Filters wissen
              </button>
              <Link href="/banden" className="btn btn--primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
                Naar alle losse banden
              </Link>
            </div>
          </div>
        ) : (
          <div className="collecties-grid">
            {filtered.map((col) => {
              const front = col.items.find((i) => i.axle === "FRONT");
              const rear = col.items.find((i) => i.axle === "REAR");
              const totalPrice =
                (front?.tyre?.price ? front.tyre.price * front.quantity : 0) +
                (rear?.tyre?.price ? rear.tyre.price * rear.quantity : 0);

              const frontImg = front?.tyre?.images?.[0]?.url;
              const rearImg = rear?.tyre?.images?.[0]?.url;

              return (
                <div key={col.id} className="collectie-card">
                  {/* Top Bar: Vehicle Brand & Season */}
                  <div className="collectie-card__top">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {col.vehicleBrand && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            color: "#fff",
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                          }}
                        >
                          {col.vehicleBrand} {col.vehicleModel}
                        </span>
                      )}
                      {col.vehicleYear && (
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                          {col.vehicleYear}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        background:
                          col.season === "SUMMER"
                            ? "rgba(245, 158, 11, 0.15)"
                            : col.season === "WINTER"
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          col.season === "SUMMER"
                            ? "#fbbf24"
                            : col.season === "WINTER"
                            ? "#60a5fa"
                            : "#34d399",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.season === "SUMMER" ? "Zomerbanden" : col.season === "WINTER" ? "Winterbanden" : "4-Seizoenen"}
                    </span>
                  </div>

                  {/* VISUAL SHOWCASE HEADER: Collection Image OR Large Tire Showcase */}
                  <div className="collectie-card__visual">
                    {col.imageUrl ? (
                      <div className="collectie-card__visual-cover">
                        <Image
                          src={col.imageUrl}
                          alt={col.name}
                          fill
                          unoptimized
                          style={{ objectFit: "contain", padding: 10 }}
                        />
                      </div>
                    ) : (
                      <div className="collectie-card__visual-tires">
                        {/* Front Tyre Showcase */}
                        <div className="collectie-card__tire-showcase">
                          <div className="collectie-card__tire-showcase-img">
                            {frontImg ? (
                              <Image
                                src={frontImg}
                                alt="Vooras band"
                                fill
                                unoptimized
                                style={{ objectFit: "contain" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                                🛞
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700, marginTop: 4 }}>
                            VOOR (2x)
                          </span>
                        </div>

                        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.2rem", fontWeight: 800 }}>
                          +
                        </div>

                        {/* Rear Tyre Showcase (Larger / Wider) */}
                        <div className="collectie-card__tire-showcase">
                          <div className="collectie-card__tire-showcase-img collectie-card__tire-showcase-img--rear">
                            {rearImg ? (
                              <Image
                                src={rearImg}
                                alt="Achteras band"
                                fill
                                unoptimized
                                style={{ objectFit: "contain" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                                🛞
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, marginTop: 4 }}>
                            ACHTER (BREDER)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="collectie-card__body">
                    <h2 className="collectie-card__title">
                      {col.name}
                    </h2>
                    {col.description && (
                      <p className="collectie-card__desc">
                        {col.description}
                      </p>
                    )}

                    {/* Staggered Visual Diagram with Thumbs */}
                    <div className="collectie-card__diagram">
                      {/* Front Axle */}
                      <div className="collectie-card__axle-row" style={{ paddingBottom: 8, borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
                        <div className="collectie-card__axle-info">
                          {frontImg && (
                            <div className="collectie-card__axle-thumb">
                              <Image src={frontImg} alt="Vooras" fill unoptimized style={{ objectFit: "contain", padding: 2 }} />
                            </div>
                          )}
                          <span
                            className="collectie-card__axle-badge"
                            style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}
                          >
                            VOOR
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="collectie-card__axle-size">
                              {front?.tyre?.size || "Maat op aanvraag"}
                            </div>
                            <div className="collectie-card__axle-sub">
                              2x {front?.tyre?.brand} {front?.tyre?.model} •{" "}
                              {front?.tyre ? (
                                front.tyre.stock > 0 ? (
                                  <span style={{ color: "#10b981" }}>{deliveryInfo.inStockText || "Op voorraad"}</span>
                                ) : (
                                  <span style={{ color: "#38bdf8" }}>Levertijd {deliveryInfo.min}–{deliveryInfo.max} {deliveryInfo.unit}</span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {front?.tyre && (
                          <div className="collectie-card__axle-price">
                            €{(front.tyre.price * front.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Rear Axle (Wider) */}
                      <div className="collectie-card__axle-row">
                        <div className="collectie-card__axle-info">
                          {rearImg && (
                            <div className="collectie-card__axle-thumb">
                              <Image src={rearImg} alt="Achteras" fill unoptimized style={{ objectFit: "contain", padding: 2 }} />
                            </div>
                          )}
                          <span
                            className="collectie-card__axle-badge"
                            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
                          >
                            ACHTER
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="collectie-card__axle-size">
                              {rear?.tyre?.size || "Maat op aanvraag"}
                            </div>
                            <div className="collectie-card__axle-sub">
                              2x {rear?.tyre?.brand} {rear?.tyre?.model} (Breder) •{" "}
                              {rear?.tyre ? (
                                rear.tyre.stock > 0 ? (
                                  <span style={{ color: "#10b981" }}>{deliveryInfo.inStockText || "Op voorraad"}</span>
                                ) : (
                                  <span style={{ color: "#38bdf8" }}>Levertijd {deliveryInfo.min}–{deliveryInfo.max} {deliveryInfo.unit}</span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {rear?.tyre && (
                          <div className="collectie-card__axle-price">
                            €{(rear.tyre.price * rear.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: Price + Button */}
                    <div className="collectie-card__footer">
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                          Setprijs (4 banden)
                        </div>
                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#10b981", lineHeight: 1.2 }}>
                          €{totalPrice.toFixed(2)}
                        </div>
                      </div>

                      <Link
                        href={`/collecties/${col.slug}`}
                        className="btn btn--primary"
                        style={{
                          padding: "10px 18px",
                          borderRadius: 8,
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>Bekijk Set</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informative Staggered Fitment Guide Banner */}
        <div className="collecties-guide-banner">
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 10px 0", color: "#fff" }}>
              Wat is een &apos;Breedset&apos; of &apos;Staggered Fitment&apos;?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Krachtige SUV&apos;s en sportwagens zoals de <strong>BMW X5</strong>, <strong>BMW X6</strong>, <strong>Mercedes GLC/GLE</strong> en <strong>Porsche Panamera</strong> hebben af fabriek bredere achtervelgen en -banden dan voorasbanden.
              Dit zorgt voor maximale grip bij acceleratie en een dynamische wegligging.
            </p>
          </div>
          <div>
            <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.8 }}>
              <li>Altijd de exacte fabrieksspecificaties en rolomtrek gerespecteerd (essentieel voor xDrive &amp; 4MATIC).</li>
              <li>Montage &amp; balanceren mogelijk in onze werkplaats in Gent.</li>
              <li>Gratis verzending in België vanaf 2 banden.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
