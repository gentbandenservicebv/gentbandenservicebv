"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  addToCart,
  toggleFavorite,
  getFavorites,
  subscribeToFavorites,
} from "@/lib/store";
import { getSpecTooltip } from "@/lib/tyre-specs";
import "../banden.css";

/* ── Types ─────────────────────────────────────────────────────────── */
interface TyreImage {
  id: string;
  url: string;
  fileKey: string;
  isPrimary: boolean;
  order: number;
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
  season: "SUMMER" | "WINTER" | "ALL_SEASON";
  condition: "NEW" | "USED";
  price: number;
  stock: number;
  treadDepth: number | null;
  dotYear?: string | null;
  runflat?: boolean;
  reinforced?: boolean;
  threepmsfRated?: boolean;
  msMarking?: boolean;
  selfSealing?: boolean;
  acoustic?: boolean;
  electric?: boolean;
  rimProtection?: boolean;
  iceGrip?: boolean;
  highLoad?: boolean;
  demo?: boolean;
  oeMarking?: string | null;
  tyreClass?: string | null;
  plyRating?: string | null;
  loadRange?: string | null;
  structureType?: string | null;
  tubeless?: boolean;
  fuelEfficiency?: string | null;
  wetGrip?: string | null;
  noiseLevel?: number | null;
  description: string | null;
  featured: boolean;
  images: TyreImage[];
}

/* ── Static ─────────────────────────────────────────────────────────── */
const brandLogos: Record<string, string> = {
  Michelin: "/brands/michelin.svg",
  Continental: "/brands/continental.svg",
  Bridgestone: "/brands/bridgestone.svg",
  Goodyear: "/brands/goodyear.svg",
  Pirelli: "/brands/pirelli.svg",
  Dunlop: "/brands/dunlop.svg",
  Hankook: "/brands/hankook.svg",
  Falken: "/brands/falken.svg",
  Nokian: "/brands/nokian.svg",
  BFGoodrich: "/brands/bfgoodrich.svg",
  Toyo: "/brands/toyo.svg",
  Yokohama: "/brands/yokohama.svg",
};

const SEASON_LABEL: Record<string, string> = {
  SUMMER: "Zomer",
  WINTER: "Winter",
  ALL_SEASON: "All-season",
};

const SEASON_ICON: Record<string, React.ReactNode> = {
  SUMMER: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="4.22" y1="19.78" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  ),
  WINTER: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="7" y1="7" x2="17" y2="17" /><line x1="17" y1="7" x2="7" y2="17" />
    </svg>
  ),
  ALL_SEASON: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
    </svg>
  ),
};

/* ── Icons ──────────────────────────────────────────────────────────── */
function TireIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="30" stroke="#cbd5e1" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r="12" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
    </svg>
  );
}

function HeartIcon({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? "1" : "2.2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CalendarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CartSmallIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CheckSmallIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Tyre Card (Same as banden/page.tsx) ─────────────────────────────── */
interface TyreCardProps {
  tyre: Tyre;
  isFav: boolean;
  onToggleFav: (tyre: Tyre) => void;
  onAddToCart: (tyre: Tyre) => void;
}

function TyreCard({ tyre, isFav, onToggleFav, onAddToCart }: TyreCardProps) {
  const [added, setAdded] = useState(false);
  const primaryImg = tyre.images.find((i) => i.isPrimary) ?? tyre.images[0];
  const isNew = tyre.condition === "NEW";
  const speedLoad = [tyre.loadIndex, tyre.speedIndex].filter(Boolean).join("");
  const productHref = `/banden/${tyre.slug || tyre.id}`;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(tyre);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  function handleToggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onToggleFav(tyre);
  }

  return (
    <article className="tyre-card">
      <Link href={productHref} className="tyre-card__img-wrap" tabIndex={-1}>
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={`${tyre.brand} ${tyre.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="tyre-card__img-placeholder">
            <TireIcon size={80} />
          </div>
        )}
        <span className={`tyre-card__badge tyre-card__badge--${isNew ? "new" : "used"}`}>
          {isNew ? "Nieuw" : "2de hands"}
        </span>
        {tyre.images.length > 1 && (
          <span className="tyre-card__img-count">+{tyre.images.length - 1}</span>
        )}

        {/* Floating Heart Button */}
        <button
          type="button"
          className={`tyre-card__fav-floating ${isFav ? "tyre-card__fav-floating--active" : ""}`}
          onClick={handleToggleFav}
          aria-label={isFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          title={isFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
        >
          <HeartIcon filled={isFav} size={18} />
        </button>
      </Link>

      <div className="tyre-card__body">
        <div className="tyre-card__brand-row">
          {brandLogos[tyre.brand] ? (
            <div className="tyre-card__brand-logo-wrap">
              <img
                src={brandLogos[tyre.brand]}
                alt={tyre.brand}
                className="tyre-card__brand-logo"
                loading="lazy"
              />
            </div>
          ) : (
            <span className="tyre-card__brand-text">{tyre.brand}</span>
          )}
          <span className="tyre-card__season-tag">
            {SEASON_ICON[tyre.season]}
            {SEASON_LABEL[tyre.season]}
          </span>
        </div>

        <Link href={productHref} className="tyre-card__model-link">
          <h3 className="tyre-card__model">{tyre.model}</h3>
        </Link>

        <div className="tyre-card__size-row">
          <span className="tyre-card__size">{tyre.size}</span>
          {speedLoad && <span className="tyre-card__speed-load">{speedLoad}</span>}
        </div>

        <div className="tyre-card__pills">
          {tyre.dotYear && (
            <span className="tc-pill tc-pill--dot" data-tooltip={getSpecTooltip("DOT")} title={getSpecTooltip("DOT")}>
              DOT &apos;{tyre.dotYear.slice(-2)}
            </span>
          )}
          {tyre.reinforced && (
            <span className="tc-pill tc-pill--xl" data-tooltip={getSpecTooltip("XL")} title={getSpecTooltip("XL")}>
              XL
            </span>
          )}
          {tyre.highLoad && (
            <span className="tc-pill" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#ea580c", borderColor: "rgba(249, 115, 22, 0.3)" }} data-tooltip={getSpecTooltip("HL")} title={getSpecTooltip("HL")}>
              HL
            </span>
          )}
          {tyre.runflat && (
            <span className="tc-pill tc-pill--rft" data-tooltip={getSpecTooltip("Runflat")} title={getSpecTooltip("Runflat")}>
              Runflat
            </span>
          )}
          {tyre.rimProtection && (
            <span className="tc-pill" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }} data-tooltip={getSpecTooltip("Velgbescherming")} title={getSpecTooltip("Velgbescherming")}>
              Velgbescherming (FSL)
            </span>
          )}
          {tyre.threepmsfRated && (
            <span className="tc-pill" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", borderColor: "rgba(59, 130, 246, 0.3)" }} data-tooltip={getSpecTooltip("3PMSF")} title={getSpecTooltip("3PMSF")}>
              3PMSF 🏔️
            </span>
          )}
          {tyre.msMarking && (
            <span className="tc-pill" style={{ background: "rgba(100, 116, 139, 0.12)", color: "#475569", borderColor: "rgba(100, 116, 139, 0.3)" }} data-tooltip={getSpecTooltip("M+S")} title={getSpecTooltip("M+S")}>
              M+S ❄️
            </span>
          )}
          {tyre.iceGrip && (
            <span className="tc-pill" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2", borderColor: "rgba(6, 182, 212, 0.3)" }} data-tooltip={getSpecTooltip("Nordic")} title={getSpecTooltip("Nordic")}>
              🧊 Noordse band
            </span>
          )}
          {tyre.electric && (
            <span className="tc-pill" style={{ background: "rgba(234, 179, 8, 0.12)", color: "#b45309", borderColor: "rgba(234, 179, 8, 0.3)" }} data-tooltip={getSpecTooltip("EV")} title={getSpecTooltip("EV")}>
              ⚡ EV / EVR
            </span>
          )}
          {tyre.selfSealing && (
            <span className="tc-pill" style={{ background: "rgba(20, 184, 166, 0.12)", color: "#0d9488", borderColor: "rgba(20, 184, 166, 0.3)" }} data-tooltip={getSpecTooltip("Seal")} title={getSpecTooltip("Seal")}>
              🛡️ Seal
            </span>
          )}
          {tyre.acoustic && (
            <span className="tc-pill" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", borderColor: "rgba(99, 102, 241, 0.3)" }} data-tooltip={getSpecTooltip("Acoustic")} title={getSpecTooltip("Acoustic")}>
              🔇 Acoustic
            </span>
          )}
          {tyre.demo && (
            <span className="tc-pill" style={{ background: "rgba(236, 72, 153, 0.12)", color: "#db2777", borderColor: "rgba(236, 72, 153, 0.3)" }} data-tooltip={getSpecTooltip("Demo")} title={getSpecTooltip("Demo")}>
              Demo
            </span>
          )}
          {tyre.oeMarking && (
            <span className="tc-pill" style={{ background: "rgba(147, 51, 234, 0.12)", color: "#7c3aed", borderColor: "rgba(147, 51, 234, 0.3)" }} data-tooltip={getSpecTooltip(tyre.oeMarking)} title={getSpecTooltip(tyre.oeMarking)}>
              {tyre.oeMarking}
            </span>
          )}
          {tyre.tyreClass && (
            <span className="tc-pill" style={{ background: "rgba(100, 116, 139, 0.1)", color: "#334155", borderColor: "rgba(100, 116, 139, 0.25)" }} data-tooltip={getSpecTooltip(tyre.tyreClass)} title={getSpecTooltip(tyre.tyreClass)}>
              {tyre.tyreClass}
            </span>
          )}
          {tyre.plyRating && (
            <span className="tc-pill" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }} data-tooltip={getSpecTooltip(tyre.plyRating)} title={getSpecTooltip(tyre.plyRating)}>
              {tyre.plyRating}
            </span>
          )}
          {tyre.structureType && (
            <span className="tc-pill" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", borderColor: "rgba(99, 102, 241, 0.3)" }} data-tooltip={getSpecTooltip(tyre.structureType)} title={getSpecTooltip(tyre.structureType)}>
              {tyre.structureType}
            </span>
          )}
          {tyre.loadRange && (
            <span className="tc-pill" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706", borderColor: "rgba(245, 158, 11, 0.3)" }} data-tooltip={getSpecTooltip(`Range ${tyre.loadRange}`)} title={getSpecTooltip(`Range ${tyre.loadRange}`)}>
              Range {tyre.loadRange}
            </span>
          )}
          {(tyre.fuelEfficiency || tyre.wetGrip) && (
            <span className="tc-pill tc-pill--eu" data-tooltip={getSpecTooltip("EU")} title={getSpecTooltip("EU")}>
              EU {tyre.fuelEfficiency || "-"}/{tyre.wetGrip || "-"}
            </span>
          )}
          {tyre.treadDepth && (
            <span className="tc-pill" data-tooltip={getSpecTooltip("Profieldiepte")} title={getSpecTooltip("Profieldiepte")}>
              Profiel {tyre.treadDepth}mm
            </span>
          )}
        </div>

        <div className="tyre-card__footer">
          <div>
            <div className="tyre-card__price">
              <span className="tyre-card__price-from"></span>€{tyre.price.toFixed(2)}
              <span className="tyre-card__price-unit">/st</span>
            </div>
            <div className="tyre-card__stock">
              {tyre.stock > 0 ? (
                <span className="tyre-card__stock--in">● Op voorraad</span>
              ) : (
                <span className="tyre-card__stock--order text-xs text-slate-400">● Levertijd 2–3 d.</span>
              )}
            </div>
          </div>

          <div className="tyre-card__actions">
            {/* Add to cart button */}
            <button
              type="button"
              className={`tc-btn tc-btn--cart ${added ? "tc-btn--cart-added" : ""}`}
              onClick={handleAddToCart}
              aria-label={`Voeg ${tyre.brand} ${tyre.model} toe aan winkelmand`}
            >
              {added ? (
                <>
                  <CheckSmallIcon size={16} />
                  <span>Toegevoegd!</span>
                </>
              ) : (
                <>
                  <CartSmallIcon size={16} />
                  <span>In winkelmand</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Skeletons for Loading State ────────────────────────────────────── */
function TyreCardSkeleton() {
  return (
    <article className="tyre-card tyre-card--skeleton" aria-hidden="true">
      <div className="tyre-card__img-wrap" style={{ display: "block" }}>
        <div className="skeleton-shimmer" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
        <div className="skeleton-badge skeleton-shimmer" />
      </div>
      <div className="tyre-card__body">
        <div className="tyre-card__brand-row" style={{ alignItems: "center" }}>
          <div className="skeleton-bar skeleton-shimmer" style={{ width: 72, height: 16 }} />
          <div className="skeleton-pill skeleton-shimmer" style={{ width: 78, height: 22 }} />
        </div>
        <div className="skeleton-bar skeleton-shimmer" style={{ width: "80%", height: 20, margin: "10px 0 6px" }} />
        <div className="skeleton-bar skeleton-shimmer" style={{ width: "55%", height: 16, marginBottom: 14 }} />
        <div className="tyre-card__pills">
          <div className="skeleton-pill skeleton-shimmer" style={{ width: 54, height: 22 }} />
          <div className="skeleton-pill skeleton-shimmer" style={{ width: 44, height: 22 }} />
          <div className="skeleton-pill skeleton-shimmer" style={{ width: 68, height: 22 }} />
        </div>
        <div className="tyre-card__footer" style={{ marginTop: "auto", paddingTop: 12 }}>
          <div>
            <div className="skeleton-bar skeleton-shimmer" style={{ width: 84, height: 24, marginBottom: 4 }} />
            <div className="skeleton-bar skeleton-shimmer" style={{ width: 58, height: 12 }} />
          </div>
          <div className="skeleton-btn skeleton-shimmer" style={{ width: 110, height: 38 }} />
        </div>
      </div>
    </article>
  );
}

export function TyreDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Bandgegevens laden">
      {/* Hero breadcrumb skeleton */}
      <section className="bc-hero bc-hero--compact">
        <div className="bc-hero__bg" />
        <div className="container bc-hero__inner">
          <nav className="bc-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="skeleton-bar skeleton-shimmer" style={{ width: 42, height: 14 }} />
            <span>/</span>
            <span className="skeleton-bar skeleton-shimmer" style={{ width: 55, height: 14 }} />
            <span>/</span>
            <span className="skeleton-bar skeleton-shimmer" style={{ width: 140, height: 14 }} />
          </nav>
        </div>
      </section>

      {/* Product layout skeleton */}
      <section className="section bg-surface pd-section">
        <div className="container pd-layout">
          {/* Left: Gallery Skeleton */}
          <div className="pd-gallery">
            <div className="pd-skeleton-main">
              <div className="skeleton-shimmer" style={{ width: "100%", height: "100%" }} />
              <div className="skeleton-badge skeleton-shimmer" style={{ top: 14, left: 14, width: 70, height: 24 }} />
            </div>
            <div className="pd-gallery__thumbs">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pd-skeleton-thumb skeleton-shimmer" />
              ))}
            </div>
          </div>

          {/* Right: Info Skeleton */}
          <div className="pd-info">
            {/* Brand logo placeholder */}
            <div className="pd-info__brand">
              <div className="skeleton-bar skeleton-shimmer" style={{ width: 110, height: 26 }} />
            </div>

            {/* Title */}
            <div className="skeleton-bar skeleton-shimmer" style={{ width: "85%", height: 36, margin: "4px 0" }} />

            {/* Meta chips */}
            <div className="pd-info__meta" style={{ gap: 8 }}>
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 120, height: 32 }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 60, height: 32 }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 85, height: 32 }} />
            </div>

            {/* Feature pills */}
            <div className="pd-info__pills" style={{ gap: 6, margin: "6px 0" }}>
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 68, height: 24 }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 44, height: 24 }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 80, height: 24 }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: 95, height: 24 }} />
            </div>

            {/* Description placeholder */}
            <div className="pd-desc-wrap" style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius-md)", borderLeft: "3px solid #cbd5e1" }}>
              <div className="skeleton-bar skeleton-shimmer" style={{ width: "95%", height: 14, marginBottom: 8 }} />
              <div className="skeleton-bar skeleton-shimmer" style={{ width: "88%", height: 14, marginBottom: 8 }} />
              <div className="skeleton-bar skeleton-shimmer" style={{ width: "70%", height: 14 }} />
            </div>

            {/* Buy box */}
            <div className="pd-skeleton-buybox">
              <div>
                <div className="skeleton-bar skeleton-shimmer" style={{ width: 150, height: 13, marginBottom: 8 }} />
                <div className="skeleton-bar skeleton-shimmer" style={{ width: 130, height: 36, marginBottom: 10 }} />
                <div className="skeleton-bar skeleton-shimmer" style={{ width: 180, height: 16 }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton-btn skeleton-shimmer" style={{ width: "100%", height: 48, borderRadius: 999 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="skeleton-btn skeleton-shimmer" style={{ flex: 1, height: 42, borderRadius: 999 }} />
                  <div className="skeleton-btn skeleton-shimmer" style={{ width: 120, height: 42, borderRadius: 999 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical specs skeleton */}
        <div className="container pd-specs-section">
          <div className="skeleton-bar skeleton-shimmer" style={{ width: 220, height: 24, marginBottom: 20 }} />
          <div className="pd-specs-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="pd-spec-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="skeleton-bar skeleton-shimmer" style={{ width: "35%", height: 14 }} />
                <div className="skeleton-bar skeleton-shimmer" style={{ width: "45%", height: 14 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Related items skeleton */}
        <div className="container pd-related-section">
          <div style={{ marginBottom: 20 }}>
            <div className="skeleton-bar skeleton-shimmer" style={{ width: 260, height: 24, marginBottom: 8 }} />
            <div className="skeleton-bar skeleton-shimmer" style={{ width: 340, height: 15 }} />
          </div>
          <div className="pd-related-grid">
            {[...Array(4)].map((_, i) => (
              <TyreCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Product Page ───────────────────────────────────────────────────── */
function TyreDetailContent() {
  const params = useParams<{ slug?: string; id?: string }>();
  const identifier = params.slug || params.id;
  const [tyre, setTyre] = useState<Tyre | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [descOverflows, setDescOverflows] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [relatedTyres, setRelatedTyres] = useState<Tyre[]>([]);

  // Load tyre details
  useEffect(() => {
    if (!identifier) return;
    fetch(`/api/tyres/${encodeURIComponent(identifier)}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setTyre(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [identifier]);

  // Synchronize favorites
  useEffect(() => {
    setFavorites(getFavorites());
    const unsub = subscribeToFavorites((favs) => {
      setFavorites(favs);
    });
    return () => unsub();
  }, []);

  // Detect if description overflows the clamped height
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setDescOverflows(el.scrollHeight > el.clientHeight + 2);
  }, [tyre]);

  // Fetch related tyres (same size or same season)
  useEffect(() => {
    if (!tyre) return;

    const query = new URLSearchParams();
    if (tyre.width) query.set("width", String(tyre.width));
    if (tyre.aspectRatio) query.set("profile", String(tyre.aspectRatio));
    if (tyre.diameter) query.set("rim", String(tyre.diameter));

    fetch(`/api/tyres?${query.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Tyre[]) => {
        const filtered = data.filter((t) => t.id !== tyre.id);

        if (filtered.length < 4) {
          // If fewer than 4 with exact same size, fetch additional tyres with same season
          fetch(`/api/tyres?season=${tyre.season}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((seasonData: Tyre[]) => {
              const extra = seasonData.filter(
                (t) => t.id !== tyre.id && !filtered.some((f) => f.id === t.id)
              );
              setRelatedTyres([...filtered, ...extra].slice(0, 4));
            })
            .catch(() => setRelatedTyres(filtered.slice(0, 4)));
        } else {
          setRelatedTyres(filtered.slice(0, 4));
        }
      })
      .catch(() => setRelatedTyres([]));
  }, [tyre]);

  function handleToggleFavorite(targetTyre: Tyre) {
    toggleFavorite(targetTyre.id);
  }

  function handleAddToCart(targetTyre: Tyre) {
    const primaryImg = targetTyre.images.find((i) => i.isPrimary) ?? targetTyre.images[0];
    addToCart({
      id: targetTyre.id,
      slug: targetTyre.slug,
      brand: targetTyre.brand,
      model: targetTyre.model,
      size: targetTyre.size,
      price: targetTyre.price,
      stock: targetTyre.stock,
      imageUrl: primaryImg?.url,
      season: targetTyre.season,
      condition: targetTyre.condition,
    });
    window.dispatchEvent(new CustomEvent("gent-open-cart"));
  }

  if (loading) {
    return <TyreDetailSkeleton />;
  }

  if (notFound || !tyre) {
    return (
      <div className="section bg-surface" style={{ minHeight: "60vh", textAlign: "center", paddingTop: 80 }}>
        <h1 className="h2 text-dark" style={{ marginBottom: 16 }}>Band niet gevonden</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>Deze band bestaat niet meer of is verwijderd.</p>
        <Link href="/banden" className="btn btn--primary">Terug naar aanbod</Link>
      </div>
    );
  }

  const currentImg = tyre.images[activeImg] ?? tyre.images.find((i) => i.isPrimary) ?? tyre.images[0];
  const speedLoad = [tyre.loadIndex, tyre.speedIndex].filter(Boolean).join("");
  const isNew = tyre.condition === "NEW";
  const isMainTyreFav = favorites.includes(tyre.id);

  const specs: { label: string; value: string | number | boolean | undefined | null }[] = [
    { label: "Merk", value: tyre.brand },
    { label: "Model", value: tyre.model },
    { label: "Maat", value: tyre.size },
    tyre.width ? { label: "Breedte", value: `${tyre.width} mm` } : { label: "", value: null },
    tyre.aspectRatio ? { label: "Aspect ratio", value: `${tyre.aspectRatio}` } : { label: "", value: null },
    tyre.diameter ? { label: "Velgdiameter", value: `${tyre.diameter}″` } : { label: "", value: null },
    { label: "Seizoen", value: SEASON_LABEL[tyre.season] },
    { label: "Conditie", value: isNew ? "Nieuw" : "2de hands" },
    speedLoad ? { label: "Last/snelheidsindex", value: speedLoad } : { label: "", value: null },
    tyre.treadDepth ? { label: "Profieldiepte", value: `${tyre.treadDepth} mm` } : { label: "", value: null },
    tyre.dotYear ? { label: "DOT-jaar", value: tyre.dotYear } : { label: "", value: null },
    tyre.runflat ? { label: "Run-flat", value: "Ja (noodloopband)" } : { label: "", value: null },
    tyre.reinforced ? { label: "Versterkt (XL)", value: "Ja (Extra Load)" } : { label: "", value: null },
    tyre.highLoad ? { label: "Hoge draagkracht (HL)", value: "Ja (High Load voor zware EV/SUV 🏋️)" } : { label: "", value: null },
    tyre.rimProtection ? { label: "Velgbescherming", value: "Ja (FSL / MFS / FR / RPB rand 🛡️)" } : { label: "", value: null },
    tyre.threepmsfRated ? { label: "3PMSF Certificering", value: "Ja (Alpine winter gecertificeerd 🏔️)" } : { label: "", value: null },
    tyre.msMarking ? { label: "M+S Markering", value: "Ja (Modder & Sneeuw ❄️)" } : { label: "", value: null },
    tyre.iceGrip ? { label: "Noordse ijsgrip", value: "Ja (Nordic friction / Extreme ijsgrip ISO 19447 🧊)" } : { label: "", value: null },
    tyre.selfSealing ? { label: "Zelfdichtend", value: "Ja (Seal-technologie 🛡️)" } : { label: "", value: null },
    tyre.acoustic ? { label: "Geluidsdemping", value: "Ja (Acoustic schuiminzet 🔇)" } : { label: "", value: null },
    tyre.electric ? { label: "EV-geschikt", value: "Ja (EV / EVC / EVR geoptimaliseerd ⚡)" } : { label: "", value: null },
    tyre.demo ? { label: "Type conditie", value: "Demoband (nieuw gedemonteerd 0-50 km 🏷️)" } : { label: "", value: null },
    tyre.oeMarking ? { label: "OEM Homologatie", value: tyre.oeMarking } : { label: "", value: null },
    tyre.tyreClass ? { label: "Bandklasse / Type", value: tyre.tyreClass } : { label: "", value: null },
    tyre.plyRating ? { label: "Ply rating (PR)", value: tyre.plyRating } : { label: "", value: null },
    tyre.loadRange ? { label: "Load Range", value: `Range ${tyre.loadRange}` } : { label: "", value: null },
    tyre.structureType ? { label: "Constructietype", value: tyre.structureType } : { label: "", value: null },
    tyre.tubeless === false ? { label: "Binnenband", value: "TT (Tube Type / met binnenband)" } : { label: "Constructie", value: "TL (Tubeless)" },
    tyre.fuelEfficiency ? { label: "Brandstofefficiëntie", value: tyre.fuelEfficiency } : { label: "", value: null },
    tyre.wetGrip ? { label: "Grip op nat wegdek", value: tyre.wetGrip } : { label: "", value: null },
    tyre.noiseLevel ? { label: "Geluidsniveau", value: `${tyre.noiseLevel} dB` } : { label: "", value: null },
  ].filter((s) => s.label && s.value !== null && s.value !== undefined && s.value !== "");

  return (
    <>
      {/* Hero breadcrumb */}
      <section className="bc-hero bc-hero--compact">
        <div className="bc-hero__bg" />
        <div className="container bc-hero__inner">
          <nav className="bc-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/banden">Banden</Link>
            <span>/</span>
            <span>{tyre.brand} {tyre.model}</span>
          </nav>
        </div>
      </section>

      {/* Product layout */}
      <section className="section bg-surface pd-section">
        <div className="container pd-layout">

          {/* Left: Gallery */}
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              {currentImg ? (
                <Image
                  src={currentImg.url}
                  alt={`${tyre.brand} ${tyre.model}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "contain" }}
                  priority
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", minHeight: 300, background: "#f8fafc" }}>
                  <TireIcon size={120} />
                </div>
              )}

              {/* Badges */}
              <span className={`pd-badge pd-badge--${isNew ? "new" : "used"}`}>
                {isNew ? "Nieuw" : "2de hands"}
              </span>
              {tyre.runflat && <span className="pd-badge pd-badge--rft pd-badge--rft-pos">Runflat</span>}
            </div>

            {/* Thumbnail strip */}
            {tyre.images.length > 1 && (
              <div className="pd-gallery__thumbs">
                {tyre.images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`pd-thumb-btn ${idx === activeImg ? "pd-thumb-btn--active" : ""}`}
                    onClick={() => setActiveImg(idx)}
                    type="button"
                    aria-label={`Foto ${idx + 1}`}
                  >
                    <Image src={img.url} alt={`foto ${idx + 1}`} width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="pd-info">
            {/* Brand logo or text */}
            <div className="pd-info__brand">
              {brandLogos[tyre.brand] ? (
                <img
                  src={brandLogos[tyre.brand]}
                  alt={tyre.brand}
                  style={{ maxHeight: 28, maxWidth: 130, width: "auto", height: 26, objectFit: "contain" }}
                  loading="lazy"
                />
              ) : (
                <span className="pd-info__brand-text">{tyre.brand}</span>
              )}
            </div>

            <h1 className="pd-info__title">{tyre.brand} {tyre.model}</h1>

            {/* Key specs inline */}
            <div className="pd-info__meta">
              <span className="pd-meta-chip">{tyre.size}</span>
              {speedLoad && <span className="pd-meta-chip pd-meta-chip--accent">{speedLoad}</span>}
              <span className="pd-meta-chip">{SEASON_LABEL[tyre.season]}</span>
            </div>

            {/* Spec pills */}
            <div className="pd-info__pills">
              {tyre.dotYear && (
                <span className="tc-pill tc-pill--dot" data-tooltip={getSpecTooltip("DOT")} title={getSpecTooltip("DOT")}>
                  DOT &apos;{tyre.dotYear.slice(-2)}
                </span>
              )}
              {tyre.reinforced && (
                <span className="tc-pill tc-pill--xl" data-tooltip={getSpecTooltip("XL")} title={getSpecTooltip("XL")}>
                  XL
                </span>
              )}
              {tyre.highLoad && (
                <span className="tc-pill" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#ea580c", borderColor: "rgba(249, 115, 22, 0.3)" }} data-tooltip={getSpecTooltip("HL")} title={getSpecTooltip("HL")}>
                  HL
                </span>
              )}
              {tyre.runflat && (
                <span className="tc-pill tc-pill--rft" data-tooltip={getSpecTooltip("Runflat")} title={getSpecTooltip("Runflat")}>
                  Runflat
                </span>
              )}
              {tyre.rimProtection && (
                <span className="tc-pill" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }} data-tooltip={getSpecTooltip("Velgbescherming")} title={getSpecTooltip("Velgbescherming")}>
                  Velgbescherming (FSL)
                </span>
              )}
              {tyre.threepmsfRated && (
                <span className="tc-pill" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", borderColor: "rgba(59, 130, 246, 0.3)" }} data-tooltip={getSpecTooltip("3PMSF")} title={getSpecTooltip("3PMSF")}>
                  3PMSF 🏔️
                </span>
              )}
              {tyre.msMarking && (
                <span className="tc-pill" style={{ background: "rgba(100, 116, 139, 0.12)", color: "#475569", borderColor: "rgba(100, 116, 139, 0.3)" }} data-tooltip={getSpecTooltip("M+S")} title={getSpecTooltip("M+S")}>
                  M+S ❄️
                </span>
              )}
              {tyre.iceGrip && (
                <span className="tc-pill" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2", borderColor: "rgba(6, 182, 212, 0.3)" }} data-tooltip={getSpecTooltip("Nordic")} title={getSpecTooltip("Nordic")}>
                  🧊 Noordse band
                </span>
              )}
              {tyre.electric && (
                <span className="tc-pill" style={{ background: "rgba(234, 179, 8, 0.12)", color: "#b45309", borderColor: "rgba(234, 179, 8, 0.3)" }} data-tooltip={getSpecTooltip("EV")} title={getSpecTooltip("EV")}>
                  ⚡ EV / EVR
                </span>
              )}
              {tyre.demo && (
                <span className="tc-pill" style={{ background: "rgba(236, 72, 153, 0.12)", color: "#db2777", borderColor: "rgba(236, 72, 153, 0.3)" }} data-tooltip={getSpecTooltip("Demo")} title={getSpecTooltip("Demo")}>
                  Demo
                </span>
              )}
              {tyre.oeMarking && (
                <span className="tc-pill" style={{ background: "rgba(147, 51, 234, 0.12)", color: "#7c3aed", borderColor: "rgba(147, 51, 234, 0.3)" }} data-tooltip={getSpecTooltip(tyre.oeMarking)} title={getSpecTooltip(tyre.oeMarking)}>
                  {tyre.oeMarking}
                </span>
              )}
              {tyre.plyRating && (
                <span className="tc-pill" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }} data-tooltip={getSpecTooltip(tyre.plyRating)} title={getSpecTooltip(tyre.plyRating)}>
                  {tyre.plyRating}
                </span>
              )}
              {tyre.structureType && (
                <span className="tc-pill" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", borderColor: "rgba(99, 102, 241, 0.3)" }} data-tooltip={getSpecTooltip(tyre.structureType)} title={getSpecTooltip(tyre.structureType)}>
                  {tyre.structureType}
                </span>
              )}
              {tyre.loadRange && (
                <span className="tc-pill" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706", borderColor: "rgba(245, 158, 11, 0.3)" }} data-tooltip={getSpecTooltip(`Range ${tyre.loadRange}`)} title={getSpecTooltip(`Range ${tyre.loadRange}`)}>
                  Range {tyre.loadRange}
                </span>
              )}
              {tyre.tubeless === false && (
                <span className="tc-pill" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", borderColor: "rgba(239, 68, 68, 0.3)" }} data-tooltip={getSpecTooltip("TT")} title={getSpecTooltip("TT")}>
                  TT (Binnenband)
                </span>
              )}
              {(tyre.fuelEfficiency || tyre.wetGrip) && (
                <span className="tc-pill tc-pill--eu" data-tooltip={getSpecTooltip("EU")} title={getSpecTooltip("EU")}>
                  EU {tyre.fuelEfficiency || "-"}/{tyre.wetGrip || "-"}
                </span>
              )}
              {tyre.treadDepth && (
                <span className="tc-pill" data-tooltip={getSpecTooltip("Profieldiepte")} title={getSpecTooltip("Profieldiepte")}>
                  Profiel {tyre.treadDepth}mm
                </span>
              )}
            </div>

            {tyre.description && (() => {
              const cleanDesc = tyre.description!.replace(/\s*\[SPECS:[^\]]*\]\s*$/, "").trim();
              return (
                <div className="pd-desc-wrap">
                  <p
                    ref={descRef}
                    className={`pd-info__desc ${descExpanded ? "pd-info__desc--expanded" : "pd-info__desc--clamped"}`}
                  >
                    {cleanDesc}
                  </p>
                  {(descOverflows || descExpanded) && (
                    <button
                      type="button"
                      className="pd-desc-toggle"
                      onClick={() => setDescExpanded((v) => !v)}
                    >
                      {descExpanded ? "Lees minder ↑" : "Lees meer ↓"}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Price + CTA */}
            <div className="pd-info__buy-box">
              <div className="pd-info__price-wrap">
                <div className="pd-info__price-from">Prijs per stuk (incl. BTW)</div>
                <div className="pd-info__price">€{tyre.price.toFixed(2)}</div>
                <div className={`pd-info__stock ${tyre.stock > 0 ? "pd-info__stock--in" : "pd-info__stock--order"}`}>
                  {tyre.stock > 0 ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#10b981" /></svg>
                      Direct op voorraad (montage al vanaf morgen mogelijk)
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#2563eb" /></svg>
                      Leverbaar binnen 2–3 werkdagen
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons: Bestel nu + Maak afspraak + Favoriet */}
              <div className="pd-info__cta">
                <button
                  type="button"
                  className="btn btn--primary btn--lg pd-buy-btn"
                  onClick={() => handleAddToCart(tyre)}
                >
                  <CartSmallIcon size={20} />
                  <span>Bestel nu</span>
                </button>

                <div className="pd-secondary-actions">
                  <Link
                    href={`/afspraak?service=fitting&tire=${encodeURIComponent(`${tyre.brand} ${tyre.model} (${tyre.size})`)}&size=${encodeURIComponent(tyre.size)}&tireId=${encodeURIComponent(tyre.id)}`}
                    className="pd-appointment-btn"
                  >
                    <CalendarIcon size={18} />
                    <span>Maak een afspraak</span>
                  </Link>

                  <button
                    type="button"
                    className={`pd-fav-btn ${isMainTyreFav ? "pd-fav-btn--active" : ""}`}
                    onClick={() => handleToggleFavorite(tyre)}
                    aria-label={isMainTyreFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                    title={isMainTyreFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                  >
                    <HeartIcon filled={isMainTyreFav} size={18} />
                    <span>{isMainTyreFav ? "Opgeslagen" : "Favoriet"}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Technical Specs table */}
        <div className="container pd-specs-section">
          <h2 className="pd-specs-title">Technische specificaties</h2>
          <div className="pd-specs-grid">
            {specs.map((s) => {
              const tooltip = getSpecTooltip(s.label);
              return (
                <div key={s.label} className="pd-spec-row">
                  <span
                    className="pd-spec-label"
                    data-tooltip={tooltip}
                    data-tooltip-pos="right"
                    title={tooltip}
                    tabIndex={tooltip ? 0 : undefined}
                  >
                    {s.label}
                    {tooltip && (
                      <span className="pd-spec-info-icon" aria-hidden="true">
                        ⓘ
                      </span>
                    )}
                  </span>
                  <span className="pd-spec-value">{String(s.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related Products Section (Using exact same TyreCard as tires page) */}
        {relatedTyres.length > 0 && (
          <div className="container pd-related-section">
            <div className="pd-related-header">
              <div>
                <h2 className="pd-related-title">Gerelateerde banden in deze maat</h2>
                <p className="pd-related-subtitle">
                  Andere banden met maat <strong>{tyre.size}</strong> uit onze actuele voorraad
                </p>
              </div>
              <Link
                href={`/banden?width=${tyre.width || ""}&profile=${tyre.aspectRatio || ""}&rim=${tyre.diameter || ""}`}
                className="pd-related-link"
              >
                Bekijk alle {tyre.size} banden →
              </Link>
            </div>

            <div className="pd-related-grid">
              {relatedTyres.map((rel) => (
                <TyreCard
                  key={rel.id}
                  tyre={rel}
                  isFav={favorites.includes(rel.id)}
                  onToggleFav={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function TyreDetailPage() {
  return (
    <Suspense fallback={<TyreDetailSkeleton />}>
      <TyreDetailContent />
    </Suspense>
  );
}
