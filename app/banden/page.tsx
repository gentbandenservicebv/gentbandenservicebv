"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { addToCart, toggleFavorite, getFavorites, subscribeToFavorites } from "@/lib/store";
import { OE_MARKINGS, TYRE_CLASSES, getSpecTooltip } from "@/lib/tyre-specs";
import "./banden.css";

/* ── Types ─────────────────────────────────────────────────────────── */
interface TyreImage { id: string; url: string; fileKey: string; isPrimary: boolean; order: number; }
interface Tyre {
  id: string; slug?: string | null; brand: string; model: string; size: string;
  width?: number | null; aspectRatio?: number | null; diameter?: number | null;
  speedIndex?: string | null; loadIndex?: string | null;
  season: "SUMMER" | "WINTER" | "ALL_SEASON";
  condition: "NEW" | "USED";
  price: number; stock: number; treadDepth: number | null;
  dotYear?: string | null; runflat?: boolean; reinforced?: boolean;
  threepmsfRated?: boolean; msMarking?: boolean; selfSealing?: boolean;
  acoustic?: boolean; electric?: boolean; rimProtection?: boolean; iceGrip?: boolean; highLoad?: boolean; demo?: boolean;
  oeMarking?: string | null; tyreClass?: string | null;
  plyRating?: string | null; loadRange?: string | null; structureType?: string | null; tubeless?: boolean;
  fuelEfficiency?: string | null; wetGrip?: string | null; noiseLevel?: number | null;
  description: string | null; featured: boolean; images: TyreImage[];
}

interface Filters {
  season: string;
  condition: string;
  brand: string;
  speedIndex: string;
  fuelEfficiency: string;
  wetGrip: string;
  dotYear: string;
  runflat: boolean;
  reinforced: boolean;
  threepmsfRated: boolean;
  msMarking: boolean;
  rimProtection: boolean;
  iceGrip: boolean;
  highLoad: boolean;
  electric: boolean;
  selfSealing: boolean;
  acoustic: boolean;
  demo: boolean;
  oeMarking: string;
  tyreClass: string;
  inStock: boolean;
  priceMin: string;
  priceMax: string;
  width: string;
  profile: string;
  rim: string;
}

const EMPTY_FILTERS: Filters = {
  season: "", condition: "", brand: "",
  speedIndex: "", fuelEfficiency: "", wetGrip: "", dotYear: "",
  runflat: false, reinforced: false,
  threepmsfRated: false, msMarking: false, rimProtection: false,
  iceGrip: false, highLoad: false, electric: false, selfSealing: false,
  acoustic: false, demo: false, oeMarking: "", tyreClass: "",
  inStock: false, priceMin: "", priceMax: "",
  width: "", profile: "", rim: "",
};

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
const SEASON_LABEL: Record<string, string> = { SUMMER: "Zomer", WINTER: "Winter", ALL_SEASON: "All-season" };
const SEASON_ICON: Record<string, React.ReactNode> = {
  SUMMER: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="4.22" y1="19.78" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" /></svg>,
  WINTER: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="7" y1="7" x2="17" y2="17" /><line x1="17" y1="7" x2="7" y2="17" /></svg>,
  ALL_SEASON: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /></svg>,
};

/* ── Common diameters & widths ─────────────────────────────────────── */
const SPEED_INDEXES = ["T", "H", "V", "W", "Y", "ZR"];
const EU_GRADES = ["A", "B", "C", "D", "E"];
const DOT_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

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
function CheckIcon() {
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}><circle cx="12" cy="12" r="10" /><polyline points="16 9 10 15 7 12" /></svg>;
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function CloseIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
}
function ChevronIcon({ open }: { open: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function HeartIcon({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "1" : "2.2"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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

/* ── Filter section accordion item ─────────────────────────────────── */
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fl-section">
      <button className="fl-section__head" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="fl-section__body">{children}</div>}
    </div>
  );
}




/* ── Tyre Card ──────────────────────────────────────────────────────── */
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
function FeaturedTyreSkeleton() {
  return (
    <div className="bc-feat-card bc-feat-card--skeleton" aria-hidden="true">
      <div className="bc-feat-card__img skeleton-shimmer-dark" />
      <div className="bc-feat-card__body">
        <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: "45%", height: 11, marginBottom: 6 }} />
        <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: "85%", height: 16, marginBottom: 6 }} />
        <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: "65%", height: 13, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: 48, height: 18, borderRadius: 99 }} />
          <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: 62, height: 18, borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: "42%", height: 18 }} />
          <div className="skeleton-bar skeleton-shimmer-dark" style={{ width: "35%", height: 13 }} />
        </div>
      </div>
    </div>
  );
}

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

/* ── Helper to test if a tyre matches active filters & search ──────── */
function matchesFilters(
  tyre: Tyre,
  f: Filters,
  searchQuery: string,
  excludeField?: keyof Filters | "size" | "features"
): boolean {
  // 1. Search text query match
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const normQ = q.replace(/[^a-z0-9]/g, "");
      const brand = (tyre.brand || "").toLowerCase();
      const model = (tyre.model || "").toLowerCase();
      const size = (tyre.size || "").toLowerCase();
      const season = (tyre.season || "").toLowerCase();
      const condition = (tyre.condition || "").toLowerCase();
      const full = `${brand} ${model} ${size} ${season} ${condition}`;
      const normFull = full.replace(/[^a-z0-9]/g, "");

      const matchesSingle =
        brand.includes(q) ||
        model.includes(q) ||
        size.includes(q) ||
        full.includes(q) ||
        normFull.includes(normQ);

      if (!matchesSingle) {
        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length <= 1) return false;
        const allTokensMatch = tokens.every(
          (tok) => full.includes(tok) || normFull.includes(tok.replace(/[^a-z0-9]/g, ""))
        );
        if (!allTokensMatch) return false;
      }
    }
  }

  // 2. Size (width, profile, rim)
  if (excludeField !== "size") {
    if (excludeField !== "width" && f.width && tyre.width !== Number(f.width)) return false;
    if (excludeField !== "profile" && f.profile && tyre.aspectRatio !== Number(f.profile)) return false;
    if (excludeField !== "rim" && f.rim && tyre.diameter !== Number(f.rim)) return false;
  }

  // 3. Brand
  if (excludeField !== "brand" && f.brand && tyre.brand.toLowerCase() !== f.brand.toLowerCase()) {
    return false;
  }

  // 4. Season
  if (excludeField !== "season" && f.season && tyre.season !== f.season) {
    return false;
  }

  // 5. Condition
  if (excludeField !== "condition" && f.condition && tyre.condition !== f.condition) {
    return false;
  }

  // 6. Speed Index
  if (excludeField !== "speedIndex" && f.speedIndex && tyre.speedIndex?.toUpperCase() !== f.speedIndex.toUpperCase()) {
    return false;
  }

  // 7. EU Fuel
  if (excludeField !== "fuelEfficiency" && f.fuelEfficiency && tyre.fuelEfficiency?.toUpperCase() !== f.fuelEfficiency.toUpperCase()) {
    return false;
  }

  // 8. EU Wet Grip
  if (excludeField !== "wetGrip" && f.wetGrip && tyre.wetGrip?.toUpperCase() !== f.wetGrip.toUpperCase()) {
    return false;
  }

  // 9. DOT Year
  if (excludeField !== "dotYear" && f.dotYear && tyre.dotYear?.toString() !== f.dotYear) {
    return false;
  }

  // 10. OEM
  if (excludeField !== "oeMarking" && f.oeMarking && tyre.oeMarking?.toUpperCase() !== f.oeMarking.toUpperCase()) {
    return false;
  }

  // 11. Tyre Class
  if (excludeField !== "tyreClass" && f.tyreClass && tyre.tyreClass?.toUpperCase() !== f.tyreClass.toUpperCase()) {
    return false;
  }

  // 12. In Stock
  if (excludeField !== "inStock" && f.inStock && tyre.stock <= 0) {
    return false;
  }

  // 13. Features
  if (excludeField !== "features") {
    if (excludeField !== "runflat" && f.runflat && !tyre.runflat) return false;
    if (excludeField !== "reinforced" && f.reinforced && !tyre.reinforced) return false;
    if (excludeField !== "threepmsfRated" && f.threepmsfRated && !tyre.threepmsfRated) return false;
    if (excludeField !== "msMarking" && f.msMarking && !tyre.msMarking) return false;
    if (excludeField !== "rimProtection" && f.rimProtection && !tyre.rimProtection) return false;
    if (excludeField !== "iceGrip" && f.iceGrip && !tyre.iceGrip) return false;
    if (excludeField !== "highLoad" && f.highLoad && !tyre.highLoad) return false;
    if (excludeField !== "electric" && f.electric && !tyre.electric) return false;
    if (excludeField !== "selfSealing" && f.selfSealing && !tyre.selfSealing) return false;
    if (excludeField !== "acoustic" && f.acoustic && !tyre.acoustic) return false;
    if (excludeField !== "demo" && f.demo && !tyre.demo) return false;
  }

  // 14. Price range
  if (excludeField !== "priceMin" && f.priceMin && tyre.price < Number(f.priceMin)) return false;
  if (excludeField !== "priceMax" && f.priceMax && tyre.price > Number(f.priceMax)) return false;

  return true;
}

/* ── Filter sidebar with dynamic, faceted multi-attribute options ────── */
function FilterSidebar({
  filters,
  onChange,
  allTyres,
  search = "",
  onClearSearch,
  activeCount,
  onClose,
  resultCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  allTyres: Tyre[];
  search?: string;
  onClearSearch?: () => void;
  activeCount: number;
  onClose?: () => void;
  resultCount?: number;
}) {
  /* 1. Overall matching tyres: matches search AND all currently active filters */
  const matchingTyres = useMemo(() => {
    return allTyres.filter((t) => matchesFilters(t, filters, search));
  }, [allTyres, filters, search]);

  /* 2. Search-only matched tyres for search context count */
  const searchMatchedTyres = useMemo(() => {
    if (!search.trim()) return allTyres;
    return allTyres.filter((t) => matchesFilters(t, EMPTY_FILTERS, search));
  }, [allTyres, search]);

  /* 3. Dynamic Widths: derived from tyres matching all other non-size filters */
  const availableWidths = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "size"));
    const map = new Map<number, number>();
    list.forEach((t) => {
      if (typeof t.width === "number") {
        map.set(t.width, (map.get(t.width) || 0) + 1);
      }
    });
    return {
      total: list.length,
      widths: Array.from(map.entries()).sort((a, b) => a[0] - b[0]),
    };
  }, [allTyres, filters, search]);

  /* 4. Dynamic Profiles: derived for the selected width + non-size filters */
  const availableProfiles = useMemo(() => {
    const list = allTyres.filter((t) => {
      if (filters.width && t.width !== Number(filters.width)) return false;
      return matchesFilters(t, filters, search, "size");
    });
    const map = new Map<number, number>();
    list.forEach((t) => {
      if (typeof t.aspectRatio === "number") {
        map.set(t.aspectRatio, (map.get(t.aspectRatio) || 0) + 1);
      }
    });
    return {
      total: list.length,
      profiles: Array.from(map.entries()).sort((a, b) => a[0] - b[0]),
    };
  }, [allTyres, filters, search]);

  /* 5. Dynamic Rims: derived for the selected width & profile + non-size filters */
  const availableRims = useMemo(() => {
    const list = allTyres.filter((t) => {
      if (filters.width && t.width !== Number(filters.width)) return false;
      if (filters.profile && t.aspectRatio !== Number(filters.profile)) return false;
      return matchesFilters(t, filters, search, "size");
    });
    const map = new Map<number, number>();
    list.forEach((t) => {
      if (typeof t.diameter === "number") {
        map.set(t.diameter, (map.get(t.diameter) || 0) + 1);
      }
    });
    return {
      total: list.length,
      rims: Array.from(map.entries()).sort((a, b) => a[0] - b[0]),
    };
  }, [allTyres, filters, search]);

  /* 6. Dynamic Seasons: derived from all active filters EXCEPT season */
  const availableSeasons = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "season"));
    const counts: Record<string, number> = { SUMMER: 0, WINTER: 0, ALL_SEASON: 0 };
    list.forEach((t) => {
      if (t.season && counts[t.season] !== undefined) counts[t.season]++;
    });
    const items = [
      { key: "SUMMER", label: "Zomer", count: counts.SUMMER, icon: SEASON_ICON.SUMMER },
      { key: "WINTER", label: "Winter", count: counts.WINTER, icon: SEASON_ICON.WINTER },
      { key: "ALL_SEASON", label: "All-season", count: counts.ALL_SEASON, icon: SEASON_ICON.ALL_SEASON },
    ];
    return {
      total: list.length,
      seasons: items.filter((s) => s.count > 0 || filters.season === s.key),
    };
  }, [allTyres, filters, search]);

  /* 7. Dynamic Condition: derived from all active filters EXCEPT condition */
  const availableConditions = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "condition"));
    const counts: Record<string, number> = { NEW: 0, USED: 0 };
    list.forEach((t) => {
      if (t.condition && counts[t.condition] !== undefined) counts[t.condition]++;
    });
    const items = [
      { key: "NEW", label: "Nieuw", count: counts.NEW },
      { key: "USED", label: "2de hands", count: counts.USED },
    ];
    return {
      total: list.length,
      conditions: items.filter((c) => c.count > 0 || filters.condition === c.key),
    };
  }, [allTyres, filters, search]);

  /* 8. Dynamic Brands: derived from all active filters EXCEPT brand */
  const availableBrands = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "brand"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.brand) {
        map.set(t.brand, (map.get(t.brand) || 0) + 1);
      }
    });
    const sorted = Array.from(map.entries())
      .filter(([b, count]) => count > 0 || (filters.brand && filters.brand.toLowerCase() === b.toLowerCase()))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return {
      total: list.length,
      brands: sorted,
    };
  }, [allTyres, filters, search]);

  /* 9. Dynamic Speed Indexes: derived from all active filters EXCEPT speedIndex */
  const availableSpeedIndexes = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "speedIndex"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.speedIndex) {
        const si = t.speedIndex.toUpperCase();
        map.set(si, (map.get(si) || 0) + 1);
      }
    });
    const filtered = SPEED_INDEXES.filter((si) => map.has(si) || filters.speedIndex.toUpperCase() === si).map(
      (si) => [si, map.get(si) || 0] as [string, number]
    );
    return {
      total: list.length,
      indexes: filtered,
    };
  }, [allTyres, filters, search]);

  /* 10. Dynamic EU Fuel Efficiency */
  const availableFuelGrades = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "fuelEfficiency"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.fuelEfficiency) {
        const g = t.fuelEfficiency.toUpperCase();
        map.set(g, (map.get(g) || 0) + 1);
      }
    });
    return EU_GRADES.filter((g) => map.has(g) || filters.fuelEfficiency.toUpperCase() === g).map(
      (g) => [g, map.get(g) || 0] as [string, number]
    );
  }, [allTyres, filters, search]);

  /* 11. Dynamic EU Wet Grip */
  const availableWetGripGrades = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "wetGrip"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.wetGrip) {
        const g = t.wetGrip.toUpperCase();
        map.set(g, (map.get(g) || 0) + 1);
      }
    });
    return EU_GRADES.filter((g) => map.has(g) || filters.wetGrip.toUpperCase() === g).map(
      (g) => [g, map.get(g) || 0] as [string, number]
    );
  }, [allTyres, filters, search]);

  /* 12. Dynamic DOT Production Years */
  const availableDotYears = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "dotYear"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.dotYear) {
        const yr = t.dotYear.toString();
        map.set(yr, (map.get(yr) || 0) + 1);
      }
    });
    return DOT_YEARS.filter((yr) => map.has(yr) || filters.dotYear === yr).map(
      (yr) => [yr, map.get(yr) || 0] as [string, number]
    );
  }, [allTyres, filters, search]);

  /* 13. Dynamic Price Range */
  const priceRange = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "priceMin"));
    const prices = list.map((t) => t.price).filter((p) => typeof p === "number" && !isNaN(p));
    if (prices.length === 0) return { min: 0, max: 999 };
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [allTyres, filters, search]);

  /* 14. Dynamic Features */
  const availableFeatures = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "features"));
    const countFor = (key: keyof Tyre) => list.filter((t) => Boolean(t[key])).length;
    const all = [
      { key: "runflat" as const, label: "Run-flat", count: countFor("runflat") },
      { key: "reinforced" as const, label: "Versterkt (XL)", count: countFor("reinforced") },
      { key: "highLoad" as const, label: "Hoge draagkracht (HL)", count: countFor("highLoad") },
      { key: "threepmsfRated" as const, label: "3PMSF 🏔️ (alpine gecertificeerd)", count: countFor("threepmsfRated") },
      { key: "msMarking" as const, label: "M+S ❄️ (modder & sneeuw)", count: countFor("msMarking") },
      { key: "iceGrip" as const, label: "🧊 Noordse band (ijsgrip)", count: countFor("iceGrip") },
      { key: "electric" as const, label: "⚡ EV-geschikt (EVR/EVC)", count: countFor("electric") },
      { key: "rimProtection" as const, label: "Velgbescherming (FSL)", count: countFor("rimProtection") },
      { key: "selfSealing" as const, label: "🛡️ Zelfdichtend (Seal)", count: countFor("selfSealing") },
      { key: "acoustic" as const, label: "🔇 Geluidsdemping (Acoustic)", count: countFor("acoustic") },
      { key: "demo" as const, label: "Demoband (0–50 km)", count: countFor("demo") },
      { key: "inStock" as const, label: "Alleen op voorraad", count: list.filter((t) => t.stock > 0).length },
    ];
    return all.filter((f) => f.count > 0 || filters[f.key] === true);
  }, [allTyres, filters, search]);

  /* 15. Dynamic OE Markings */
  const availableOe = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "oeMarking"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.oeMarking) {
        const oe = t.oeMarking.toUpperCase();
        map.set(oe, (map.get(oe) || 0) + 1);
      }
    });
    return OE_MARKINGS.filter(
      (m) => m.code === "" || map.has(m.code.toUpperCase()) || (filters.oeMarking && filters.oeMarking.toUpperCase() === m.code.toUpperCase())
    ).map((m) => ({
      ...m,
      count: m.code ? map.get(m.code.toUpperCase()) || 0 : list.length,
    }));
  }, [allTyres, filters, search]);

  /* 16. Dynamic Vehicle Classes */
  const availableTyreClasses = useMemo(() => {
    const list = allTyres.filter((t) => matchesFilters(t, filters, search, "tyreClass"));
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.tyreClass) {
        const tc = t.tyreClass.toUpperCase();
        map.set(tc, (map.get(tc) || 0) + 1);
      }
    });
    return TYRE_CLASSES.filter(
      (tc) => tc.code === "" || map.has(tc.code.toUpperCase()) || (filters.tyreClass && filters.tyreClass.toUpperCase() === tc.code.toUpperCase())
    ).map((tc) => ({
      ...tc,
      count: tc.code ? map.get(tc.code.toUpperCase()) || 0 : list.length,
    }));
  }, [allTyres, filters, search]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function handleWidthChange(w: string) {
    onChange({
      ...filters,
      width: w,
      profile: "",
      rim: "",
    });
  }

  function handleProfileChange(p: string) {
    onChange({
      ...filters,
      profile: p,
      rim: "",
    });
  }

  const hasAnyFilter = Object.entries(filters).some(([, v]) => v !== "" && v !== false);
  const hasAny = hasAnyFilter || Boolean(search?.trim());

  function handleResetAll() {
    onChange(EMPTY_FILTERS);
    if (onClearSearch) onClearSearch();
  }

  return (
    <aside className="fl-sidebar">
      <div className="fl-sidebar__header">
        <span className="fl-sidebar__title">
          <FilterIcon /> Filters
          {hasAny && <span className="fl-active-badge">{activeCount}</span>}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasAny && (
            <button className="fl-reset" onClick={handleResetAll}>
              Wis alles
            </button>
          )}
          {onClose && (
            <button className="fl-close-btn" onClick={onClose} aria-label="Sluit filters">
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="fl-sidebar__scroll">
        {/* Dynamic Search Context Banner */}
        {search.trim() && (
          <div className="fl-search-context">
            <div className="fl-search-context-info">
              <span className="fl-search-context-label">Zoekopdracht</span>
              <span className="fl-search-context-query">&ldquo;{search.trim()}&rdquo;</span>
              <span className="fl-search-context-count">
                {searchMatchedTyres.length} {searchMatchedTyres.length === 1 ? "band gevonden" : "banden gevonden"}
              </span>
            </div>
            {onClearSearch && (
              <button
                type="button"
                className="fl-search-context-clear"
                onClick={onClearSearch}
                title="Wis zoekopdracht"
                aria-label="Wis zoekopdracht"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Active Filters Summary Tags in Sidebar */}
        {hasAnyFilter && (
          <div className="fl-active-summary">
            <div className="fl-active-summary__header">
              <span>Actieve filters</span>
              <button type="button" className="fl-active-summary__clear-all" onClick={() => onChange(EMPTY_FILTERS)}>
                Wis alles
              </button>
            </div>
            <div className="fl-active-summary__chips">
              {(filters.width || filters.profile || filters.rim) && (
                <span className="fl-active-tag">
                  {[filters.width, filters.profile && `/${filters.profile}`, filters.rim && ` R${filters.rim}`].filter(Boolean).join("")}
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, width: "", profile: "", rim: "" })}
                    aria-label="Wis maat"
                  >
                    <CloseIcon size={10} />
                  </button>
                </span>
              )}
              {filters.brand && (
                <span className="fl-active-tag">
                  {filters.brand}
                  <button type="button" onClick={() => set("brand", "")} aria-label="Wis merk">
                    <CloseIcon size={10} />
                  </button>
                </span>
              )}
              {filters.season && (
                <span className="fl-active-tag">
                  {SEASON_LABEL[filters.season] || filters.season}
                  <button type="button" onClick={() => set("season", "")} aria-label="Wis seizoen">
                    <CloseIcon size={10} />
                  </button>
                </span>
              )}
              {filters.condition && (
                <span className="fl-active-tag">
                  {filters.condition === "NEW" ? "Nieuw" : "2de hands"}
                  <button type="button" onClick={() => set("condition", "")} aria-label="Wis conditie">
                    <CloseIcon size={10} />
                  </button>
                </span>
              )}
              {filters.speedIndex && (
                <span className="fl-active-tag">
                  Index {filters.speedIndex}
                  <button type="button" onClick={() => set("speedIndex", "")}><CloseIcon size={10} /></button>
                </span>
              )}
              {filters.fuelEfficiency && (
                <span className="fl-active-tag">
                  Brandstof {filters.fuelEfficiency}
                  <button type="button" onClick={() => set("fuelEfficiency", "")}><CloseIcon size={10} /></button>
                </span>
              )}
              {filters.wetGrip && (
                <span className="fl-active-tag">
                  Grip {filters.wetGrip}
                  <button type="button" onClick={() => set("wetGrip", "")}><CloseIcon size={10} /></button>
                </span>
              )}
              {filters.dotYear && (
                <span className="fl-active-tag">
                  DOT {filters.dotYear}
                  <button type="button" onClick={() => set("dotYear", "")}><CloseIcon size={10} /></button>
                </span>
              )}
              {filters.runflat && (
                <span className="fl-active-tag">Run-flat <button type="button" onClick={() => set("runflat", false)}><CloseIcon size={10} /></button></span>
              )}
              {filters.reinforced && (
                <span className="fl-active-tag">XL <button type="button" onClick={() => set("reinforced", false)}><CloseIcon size={10} /></button></span>
              )}
              {filters.threepmsfRated && (
                <span className="fl-active-tag">3PMSF 🏔️ <button type="button" onClick={() => set("threepmsfRated", false)}><CloseIcon size={10} /></button></span>
              )}
              {filters.msMarking && (
                <span className="fl-active-tag">M+S ❄️ <button type="button" onClick={() => set("msMarking", false)}><CloseIcon size={10} /></button></span>
              )}
              {filters.electric && (
                <span className="fl-active-tag">EV ⚡ <button type="button" onClick={() => set("electric", false)}><CloseIcon size={10} /></button></span>
              )}
              {filters.oeMarking && (
                <span className="fl-active-tag">OEM: {filters.oeMarking} <button type="button" onClick={() => set("oeMarking", "")}><CloseIcon size={10} /></button></span>
              )}
              {(filters.priceMin || filters.priceMax) && (
                <span className="fl-active-tag">
                  €{filters.priceMin || "0"}–€{filters.priceMax || "∞"}
                  <button type="button" onClick={() => onChange({ ...filters, priceMin: "", priceMax: "" })}><CloseIcon size={10} /></button>
                </span>
              )}
            </div>
          </div>
        )}

        {matchingTyres.length === 0 ? (
          <div className="fl-no-search-results">
            <p>Geen banden gevonden die aan alle geselecteerde criteria voldoen.</p>
            <button
              type="button"
              className="fl-reset"
              onClick={handleResetAll}
              style={{ padding: "6px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
            >
              Wis alle filters
            </button>
          </div>
        ) : (
          <>
            {/* Bandenmaat */}
            <FilterSection title="Bandenmaat" defaultOpen={true}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Breedte</label>
                  <select
                    className="fl-select"
                    value={filters.width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem" }}
                  >
                    <option value="">Alle breedtes ({availableWidths.total})</option>
                    {availableWidths.widths.map(([w, count]) => (
                      <option key={w} value={w}>{w} mm ({count})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Profiel</label>
                    <select
                      className="fl-select"
                      value={filters.profile}
                      onChange={(e) => handleProfileChange(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem" }}
                    >
                      <option value="">Alle ({availableProfiles.total})</option>
                      {availableProfiles.profiles.map(([p, count]) => (
                        <option key={p} value={p}>{p} ({count})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Velg</label>
                    <select
                      className="fl-select"
                      value={filters.rim}
                      onChange={(e) => set("rim", e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem" }}
                    >
                      <option value="">Alle ({availableRims.total})</option>
                      {availableRims.rims.map(([r, count]) => (
                        <option key={r} value={r}>{r}&quot; ({count})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Seizoen */}
            {availableSeasons.seasons.length > 0 && (
              <FilterSection title="Seizoen">
                <div className="fl-chip-group fl-chip-group--wrap">
                  <button className={`fl-chip ${filters.season === "" ? "fl-chip--active" : ""}`} onClick={() => set("season", "")}>
                    Alle <span className="fl-chip-count">({availableSeasons.total})</span>
                  </button>
                  {availableSeasons.seasons.map((s) => (
                    <button
                      key={s.key}
                      className={`fl-chip ${filters.season === s.key ? "fl-chip--active" : ""}`}
                      onClick={() => set("season", filters.season === s.key ? "" : s.key)}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                      <span className="fl-chip-count">({s.count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Conditie */}
            {availableConditions.conditions.length > 0 && (
              <FilterSection title="Conditie">
                <div className="fl-chip-group">
                  <button className={`fl-chip ${filters.condition === "" ? "fl-chip--active" : ""}`} onClick={() => set("condition", "")}>
                    Alle <span className="fl-chip-count">({availableConditions.total})</span>
                  </button>
                  {availableConditions.conditions.map((c) => (
                    <button
                      key={c.key}
                      className={`fl-chip ${filters.condition === c.key ? "fl-chip--active" : ""}`}
                      onClick={() => set("condition", filters.condition === c.key ? "" : c.key)}
                    >
                      <span>{c.label}</span>
                      <span className="fl-chip-count">({c.count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Merk */}
            {availableBrands.brands.length > 0 && (
              <FilterSection title="Merk">
                <div className="fl-chip-group fl-chip-group--wrap">
                  <button className={`fl-chip ${filters.brand === "" ? "fl-chip--active" : ""}`} onClick={() => set("brand", "")}>
                    Alle <span className="fl-chip-count">({availableBrands.total})</span>
                  </button>
                  {availableBrands.brands.map(([b, count]) => (
                    <button
                      key={b}
                      className={`fl-chip ${filters.brand.toLowerCase() === b.toLowerCase() ? "fl-chip--active" : ""}`}
                      onClick={() => set("brand", filters.brand.toLowerCase() === b.toLowerCase() ? "" : b)}
                    >
                      <span>{b}</span>
                      <span className="fl-chip-count">({count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Snelheidsindex */}
            {availableSpeedIndexes.indexes.length > 0 && (
              <FilterSection title="Snelheidsindex" defaultOpen={false}>
                <div className="fl-chip-group fl-chip-group--wrap">
                  <button className={`fl-chip ${filters.speedIndex === "" ? "fl-chip--active" : ""}`} onClick={() => set("speedIndex", "")}>
                    Alle
                  </button>
                  {availableSpeedIndexes.indexes.map(([si, count]) => (
                    <button
                      key={si}
                      className={`fl-chip fl-chip--sm ${filters.speedIndex.toUpperCase() === si ? "fl-chip--active" : ""}`}
                      onClick={() => set("speedIndex", filters.speedIndex.toUpperCase() === si ? "" : si)}
                    >
                      <span>{si}</span>
                      <span className="fl-chip-count">({count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Brandstofefficiëntie */}
            {availableFuelGrades.length > 0 && (
              <FilterSection title="EU Label: Brandstof" defaultOpen={false}>
                <div className="fl-chip-group">
                  <button className={`fl-chip ${filters.fuelEfficiency === "" ? "fl-chip--active" : ""}`} onClick={() => set("fuelEfficiency", "")}>
                    Alle
                  </button>
                  {availableFuelGrades.map(([g, count]) => (
                    <button
                      key={g}
                      className={`fl-chip fl-chip--sm ${filters.fuelEfficiency.toUpperCase() === g ? "fl-chip--active" : ""}`}
                      onClick={() => set("fuelEfficiency", filters.fuelEfficiency.toUpperCase() === g ? "" : g)}
                    >
                      <span>{g}</span>
                      <span className="fl-chip-count">({count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Grip nat wegdek */}
            {availableWetGripGrades.length > 0 && (
              <FilterSection title="EU Label: Grip nat" defaultOpen={false}>
                <div className="fl-chip-group">
                  <button className={`fl-chip ${filters.wetGrip === "" ? "fl-chip--active" : ""}`} onClick={() => set("wetGrip", "")}>
                    Alle
                  </button>
                  {availableWetGripGrades.map(([g, count]) => (
                    <button
                      key={g}
                      className={`fl-chip fl-chip--sm ${filters.wetGrip.toUpperCase() === g ? "fl-chip--active" : ""}`}
                      onClick={() => set("wetGrip", filters.wetGrip.toUpperCase() === g ? "" : g)}
                    >
                      <span>{g}</span>
                      <span className="fl-chip-count">({count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* DOT Bouwjaar */}
            {availableDotYears.length > 0 && (
              <FilterSection title="DOT Productiejaar" defaultOpen={false}>
                <div className="fl-chip-group fl-chip-group--wrap">
                  <button className={`fl-chip ${filters.dotYear === "" ? "fl-chip--active" : ""}`} onClick={() => set("dotYear", "")}>
                    Alle
                  </button>
                  {availableDotYears.map(([yr, count]) => (
                    <button
                      key={yr}
                      className={`fl-chip fl-chip--sm ${filters.dotYear === yr ? "fl-chip--active" : ""}`}
                      onClick={() => set("dotYear", filters.dotYear === yr ? "" : yr)}
                    >
                      <span>{yr}</span>
                      <span className="fl-chip-count">({count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Prijs */}
            <FilterSection title="Prijsbereik (€)" defaultOpen={false}>
              <div className="fl-price-row">
                <div className="fl-price-field">
                  <label className="fl-price-label">Van (€{priceRange.min})</label>
                  <input
                    className="fl-price-input"
                    type="number"
                    min="0"
                    placeholder={String(priceRange.min)}
                    value={filters.priceMin}
                    onChange={(e) => set("priceMin", e.target.value)}
                  />
                </div>
                <span className="fl-price-sep">—</span>
                <div className="fl-price-field">
                  <label className="fl-price-label">Tot (€{priceRange.max})</label>
                  <input
                    className="fl-price-input"
                    type="number"
                    min="0"
                    placeholder={String(priceRange.max)}
                    value={filters.priceMax}
                    onChange={(e) => set("priceMax", e.target.value)}
                  />
                </div>
              </div>
            </FilterSection>

            {/* Eigenschappen */}
            {availableFeatures.length > 0 && (
              <FilterSection title="Eigenschappen" defaultOpen={false}>
                <div className="fl-toggle-list">
                  {availableFeatures.map(({ key, label, count }) => (
                    <label key={key} className="fl-toggle">
                      <input
                        type="checkbox"
                        checked={filters[key] as boolean}
                        onChange={(e) => set(key, e.target.checked as Filters[typeof key])}
                      />
                      <span className="fl-toggle__track" />
                      <span className="fl-toggle__label">
                        {label} <span style={{ opacity: 0.65, fontSize: "0.78rem" }}>({count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* OE Homologatie */}
            {availableOe.length > 1 && (
              <FilterSection title="OEM Homologatie" defaultOpen={false}>
                <select
                  className="fl-select"
                  value={filters.oeMarking}
                  onChange={(e) => set("oeMarking", e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.82rem" }}
                >
                  {availableOe.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label} ({m.count})
                    </option>
                  ))}
                </select>
              </FilterSection>
            )}

            {/* Voertuigtype */}
            {availableTyreClasses.length > 1 && (
              <FilterSection title="Voertuigtype" defaultOpen={false}>
                <div className="fl-chip-group fl-chip-group--wrap">
                  {availableTyreClasses.map((tc) => (
                    <button
                      key={tc.code}
                      className={`fl-chip fl-chip--sm ${filters.tyreClass === tc.code ? "fl-chip--active" : ""}`}
                      onClick={() => set("tyreClass", filters.tyreClass === tc.code ? "" : tc.code)}
                    >
                      <span>{tc.code === "" ? "Alle" : tc.code}</span>
                      <span className="fl-chip-count">({tc.count})</span>
                    </button>
                  ))}
                </div>
              </FilterSection>
            )}
          </>
        )}
      </div>

      {onClose && (
        <div className="fl-sidebar__mobile-bar">
          <button className="fl-apply-btn" onClick={onClose}>
            Bekijk {resultCount ?? matchingTyres.length} {(resultCount ?? matchingTyres.length) === 1 ? "resultaat" : "resultaten"}
          </button>
        </div>
      )}
    </aside>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
function BandenCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allTyres, setAllTyres] = useState<Tyre[]>([]);
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [featuredTyres, setFeaturedTyres] = useState<Tyre[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(true);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "cart" | "fav" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ITEMS_PER_PAGE = 12;

  // Sync favorites
  useEffect(() => {
    setFavorites(getFavorites());
    const unsub = subscribeToFavorites(setFavorites);
    return () => unsub();
  }, []);

  // Read URL query parameters on initial load (favorites, size, season, condition, brand, search + all spec filters)
  useEffect(() => {
    if (searchParams.get("filter") === "favorites") setOnlyFavorites(true);

    const widthParam = searchParams.get("width");
    const profileParam = searchParams.get("profile") || searchParams.get("aspectRatio");
    const rimParam = searchParams.get("rim") || searchParams.get("diameter");
    const seasonParam = searchParams.get("season");
    const conditionParam = searchParams.get("condition");
    const brandParam = searchParams.get("brand");
    const searchParam = searchParams.get("search") || searchParams.get("q");
    const speedIndexParam = searchParams.get("speedIndex");
    const fuelParam = searchParams.get("fuelEfficiency");
    const wetGripParam = searchParams.get("wetGrip");
    const dotYearParam = searchParams.get("dotYear");
    const oeParam = searchParams.get("oeMarking") || searchParams.get("oe");
    const tyreClassParam = searchParams.get("tyreClass");
    const priceMinParam = searchParams.get("priceMin");
    const priceMaxParam = searchParams.get("priceMax");
    const sortParam = searchParams.get("sort");

    if (searchParam) setSearch(searchParam);
    if (sortParam) setSortBy(sortParam);

    let seasonVal = "";
    if (seasonParam) {
      const s = seasonParam.toUpperCase().trim();
      if (s === "SUMMER" || s === "ZOMER") seasonVal = "SUMMER";
      else if (s === "WINTER") seasonVal = "WINTER";
      else if (s === "ALL_SEASON" || s === "ALL-SEASON" || s === "ALLSEASON") seasonVal = "ALL_SEASON";
    }

    let conditionVal = "";
    if (conditionParam) {
      const c = conditionParam.toUpperCase().trim();
      if (c === "NEW" || c === "NIEUW") conditionVal = "NEW";
      else if (c === "USED" || c === "TWEEDEHANDS" || c === "2DEHANDS") conditionVal = "USED";
    }

    const getBool = (key: string) => searchParams.get(key) === "true";

    setFilters((prev) => ({
      ...prev,
      ...(widthParam ? { width: widthParam } : {}),
      ...(profileParam ? { profile: profileParam } : {}),
      ...(rimParam ? { rim: rimParam } : {}),
      ...(seasonVal ? { season: seasonVal } : {}),
      ...(conditionVal ? { condition: conditionVal } : {}),
      ...(brandParam ? { brand: brandParam } : {}),
      ...(speedIndexParam ? { speedIndex: speedIndexParam } : {}),
      ...(fuelParam ? { fuelEfficiency: fuelParam } : {}),
      ...(wetGripParam ? { wetGrip: wetGripParam } : {}),
      ...(dotYearParam ? { dotYear: dotYearParam } : {}),
      ...(oeParam ? { oeMarking: oeParam } : {}),
      ...(tyreClassParam ? { tyreClass: tyreClassParam } : {}),
      ...(priceMinParam ? { priceMin: priceMinParam } : {}),
      ...(priceMaxParam ? { priceMax: priceMaxParam } : {}),
      ...(searchParams.has("runflat") ? { runflat: getBool("runflat") } : {}),
      ...(searchParams.has("reinforced") ? { reinforced: getBool("reinforced") } : {}),
      ...(searchParams.has("threepmsfRated") ? { threepmsfRated: getBool("threepmsfRated") } : {}),
      ...(searchParams.has("msMarking") ? { msMarking: getBool("msMarking") } : {}),
      ...(searchParams.has("rimProtection") ? { rimProtection: getBool("rimProtection") } : {}),
      ...(searchParams.has("iceGrip") ? { iceGrip: getBool("iceGrip") } : {}),
      ...(searchParams.has("highLoad") ? { highLoad: getBool("highLoad") } : {}),
      ...(searchParams.has("electric") ? { electric: getBool("electric") } : {}),
      ...(searchParams.has("selfSealing") ? { selfSealing: getBool("selfSealing") } : {}),
      ...(searchParams.has("acoustic") ? { acoustic: getBool("acoustic") } : {}),
      ...(searchParams.has("demo") ? { demo: getBool("demo") } : {}),
      ...(searchParams.has("inStock") ? { inStock: getBool("inStock") } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount — URL is the initial source of truth

  // Push filter state back to URL so links are shareable
  useEffect(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (filters.season) p.set("season", filters.season);
    if (filters.condition) p.set("condition", filters.condition);
    if (filters.brand) p.set("brand", filters.brand);
    if (filters.width) p.set("width", filters.width);
    if (filters.profile) p.set("profile", filters.profile);
    if (filters.rim) p.set("rim", filters.rim);
    if (filters.speedIndex) p.set("speedIndex", filters.speedIndex);
    if (filters.fuelEfficiency) p.set("fuelEfficiency", filters.fuelEfficiency);
    if (filters.wetGrip) p.set("wetGrip", filters.wetGrip);
    if (filters.dotYear) p.set("dotYear", filters.dotYear);
    if (filters.oeMarking) p.set("oeMarking", filters.oeMarking);
    if (filters.tyreClass) p.set("tyreClass", filters.tyreClass);
    if (filters.priceMin) p.set("priceMin", filters.priceMin);
    if (filters.priceMax) p.set("priceMax", filters.priceMax);
    if (sortBy !== "popular") p.set("sort", sortBy);
    if (onlyFavorites) p.set("filter", "favorites");
    // Boolean flags
    const boolFlags: (keyof Filters)[] = [
      "runflat", "reinforced", "threepmsfRated", "msMarking", "rimProtection",
      "iceGrip", "highLoad", "electric", "selfSealing", "acoustic", "demo", "inStock",
    ];
    for (const key of boolFlags) {
      if (filters[key] === true) p.set(key, "true");
    }
    const qs = p.toString();
    router.replace(qs ? `/banden?${qs}` : "/banden", { scroll: false });
  }, [filters, search, sortBy, onlyFavorites]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((message: string, type: "cart" | "fav") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  function handleAddToCart(tyre: Tyre) {
    const primaryImg = tyre.images.find((i) => i.isPrimary) ?? tyre.images[0];
    addToCart({
      id: tyre.id,
      slug: tyre.slug,
      brand: tyre.brand,
      model: tyre.model,
      size: tyre.size,
      price: tyre.price,
      imageUrl: primaryImg?.url,
      stock: tyre.stock,
      season: tyre.season,
      condition: tyre.condition,
    });
    showToast(`${tyre.brand} ${tyre.model} toegevoegd aan winkelmand!`, "cart");
    // Open CartDrawer
    window.dispatchEvent(new CustomEvent("gent-open-cart"));
  }

  function handleToggleFav(tyre: Tyre) {
    const isNowFav = toggleFavorite(tyre.id);
    showToast(
      isNowFav
        ? `${tyre.brand} ${tyre.model} toegevoegd aan favorieten!`
        : `${tyre.brand} ${tyre.model} verwijderd uit favorieten.`,
      "fav"
    );
  }

  /* Reset to page 1 on filter, search, sort, or favorite filter change */
  useEffect(() => {
    setPage(1);
  }, [filters, search, sortBy, onlyFavorites]);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  /* Fetch all tyres once for sidebar option lists */
  useEffect(() => {
    fetch("/api/tyres").then((r) => r.json()).then(setAllTyres).catch(() => { });
  }, []);

  /* Fetch featured (uitgelicht) tyres once */
  useEffect(() => {
    setFeaturedLoading(true);
    fetch("/api/tyres?featured=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFeaturedTyres(data);
      })
      .catch(() => { })
      .finally(() => setFeaturedLoading(false));
  }, []);

  /* Fetch filtered tyres */
  const fetchTyres = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.season) params.set("season", filters.season);
      if (filters.condition) params.set("condition", filters.condition);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.width) params.set("width", filters.width);
      if (filters.profile) params.set("profile", filters.profile);
      if (filters.rim) params.set("rim", filters.rim);
      if (filters.speedIndex) params.set("speedIndex", filters.speedIndex);
      if (filters.fuelEfficiency) params.set("fuelEfficiency", filters.fuelEfficiency);
      if (filters.wetGrip) params.set("wetGrip", filters.wetGrip);
      if (filters.dotYear) params.set("dotYear", filters.dotYear);
      if (filters.runflat) params.set("runflat", "true");
      if (filters.reinforced) params.set("reinforced", "true");
      if (filters.threepmsfRated) params.set("threepmsfRated", "true");
      if (filters.msMarking) params.set("msMarking", "true");
      if (filters.rimProtection) params.set("rimProtection", "true");
      if (filters.iceGrip) params.set("iceGrip", "true");
      if (filters.highLoad) params.set("highLoad", "true");
      if (filters.electric) params.set("electric", "true");
      if (filters.selfSealing) params.set("selfSealing", "true");
      if (filters.acoustic) params.set("acoustic", "true");
      if (filters.demo) params.set("demo", "true");
      if (filters.oeMarking) params.set("oeMarking", filters.oeMarking);
      if (filters.tyreClass) params.set("tyreClass", filters.tyreClass);
      if (filters.inStock) params.set("inStock", "true");
      if (filters.priceMin) params.set("priceMin", filters.priceMin);
      if (filters.priceMax) params.set("priceMax", filters.priceMax);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/tyres?${params}`);
      if (res.ok) setTyres(await res.json());
    } finally { setLoading(false); }
  }, [filters, search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchTyres, 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchTyres]);

  /* Client-side sorting on price, popularity, newest + favorites filter */
  const sortedTyres = useMemo(() => {
    let list = [...tyres];
    if (onlyFavorites) {
      list = list.filter((t) => favorites.includes(t.id));
    }
    if (sortBy === "price_asc") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price_desc") {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "popular") {
      return list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (a.stock > 0 && b.stock === 0) return -1;
        if (a.stock === 0 && b.stock > 0) return 1;
        return b.stock - a.stock;
      });
    }
    return list;
  }, [tyres, sortBy, onlyFavorites, favorites]);

  const totalPages = Math.max(1, Math.ceil(sortedTyres.length / ITEMS_PER_PAGE));

  const paginatedTyres = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedTyres.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTyres, page]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    pages.push(1);
    if (page > 3) pages.push(-1);

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push(-1);
    pages.push(totalPages);
    return pages;
  }, [totalPages, page]);

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.querySelector(".bc-catalog");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const activeFilterCount =
    Object.entries(filters).filter(([, v]) => v !== "" && v !== false).length +
    (search.trim() ? 1 : 0);

  return (
    <>
      {/* Hero — compact breadcrumb only */}
      <section className="bc-hero bc-hero--compact">
        <div className="bc-hero__bg" />
        <div className="container bc-hero__inner">
          <nav className="bc-breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Banden</span>
          </nav>
        </div>
      </section>

      {/* Uitgelicht — featured tyre ad strip */}
      {(featuredLoading || featuredTyres.length > 0) && (
        <section className="bc-featured-strip" aria-label="Aanbevolen banden">
          <div className="container">
            <div className="bc-featured-strip__head">
              <span className="bc-featured-strip__label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Uitgelicht
              </span>
              <p className="bc-featured-strip__sub">Speciaal aanbevolen door ons team — van topkwaliteit direct beschikbaar</p>
            </div>
            <div className="bc-featured-strip__track">
              {featuredLoading ? (
                [...Array(6)].map((_, i) => <FeaturedTyreSkeleton key={i} />)
              ) : (
                featuredTyres.map((tyre) => {
                  const primaryImg = tyre.images.find((i) => i.isPrimary) ?? tyre.images[0];
                  const isNew = tyre.condition === "NEW";
                  const seasonLabel: Record<string, string> = { SUMMER: "Zomer", WINTER: "Winter", ALL_SEASON: "All-season" };
                  return (
                    <Link
                      key={tyre.id}
                      href={`/banden/${tyre.slug || tyre.id}`}
                      className="bc-feat-card"
                    >
                      <div className="bc-feat-card__img">
                        {primaryImg ? (
                          <Image src={primaryImg.url} alt={`${tyre.brand} ${tyre.model}`} fill sizes="180px" style={{ objectFit: "cover" }} />
                        ) : (
                          <div className="bc-feat-card__img-placeholder">
                            <svg width="40" height="40" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="#1e293b" stroke="#334155" strokeWidth="1.5" /><circle cx="50" cy="50" r="30" stroke="#475569" strokeWidth="10" fill="none" /><circle cx="50" cy="50" r="12" fill="#1e293b" stroke="#475569" strokeWidth="1.5" /></svg>
                          </div>
                        )}
                        <span className={`bc-feat-card__badge bc-feat-card__badge--${isNew ? "new" : "used"}`}>{isNew ? "Nieuw" : "2de hands"}</span>
                      </div>
                      <div className="bc-feat-card__body">
                        <span className="bc-feat-card__brand">{tyre.brand}</span>
                        <span className="bc-feat-card__model">{tyre.model}</span>
                        <span className="bc-feat-card__size">{tyre.size}</span>
                        <div className="bc-feat-card__meta">
                          <span className="bc-feat-card__season">{seasonLabel[tyre.season]}</span>
                          {tyre.stock > 0 ? (
                            <span className="bc-feat-card__stock bc-feat-card__stock--in">Op voorraad</span>
                          ) : (
                            <span className="bc-feat-card__stock bc-feat-card__stock--order">Leverbaar</span>
                          )}
                        </div>
                        <div className="bc-feat-card__price-row">
                          <span className="bc-feat-card__price">€{tyre.price.toFixed(2)}</span>
                          <span className="bc-feat-card__cta">Bekijk band →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* Catalog */}
      <section className="section bg-surface bc-catalog">
        <div className="container">
          {/* Search bar */}
          <div className="bc-search-wrap" style={{ marginBottom: 20 }}>
            <span className="bc-search-icon"><SearchIcon /></span>
            <input type="text" className="bc-search" placeholder="Zoek op merk, model, maat (bijv. 205/55 R16)…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="bc-search-clear" onClick={() => setSearch("")}><CloseIcon size={14} /></button>}
          </div>

          <div className={`bc-body ${!desktopSidebar ? "bc-body--no-sidebar" : ""}`}>
            {/* Sidebar — desktop toggleable, mobile drawer */}
            <div className={`bc-sidebar-wrap ${sidebarOpen ? "bc-sidebar-wrap--open" : ""} ${!desktopSidebar ? "bc-sidebar-wrap--desktop-hidden" : ""}`}>
              {sidebarOpen && <div className="bc-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                allTyres={allTyres}
                search={search}
                onClearSearch={() => setSearch("")}
                activeCount={activeFilterCount}
                onClose={() => setSidebarOpen(false)}
                resultCount={sortedTyres.length}
              />
            </div>

            {/* Main content */}
            <div className="bc-main">
              {/* Toolbar row with filter button on left and sort on right */}
              <div className="bc-toolbar">
                <div className="bc-toolbar__left">
                  <button
                    type="button"
                    className="bc-filter-toggle-btn"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth <= 900) {
                        setSidebarOpen(true);
                      } else {
                        setDesktopSidebar((v) => !v);
                      }
                    }}
                    aria-label="Toggle filters"
                  >
                    <FilterIcon />
                    <span>Filters</span>
                    {activeFilterCount > 0 && <span className="fl-active-badge">{activeFilterCount}</span>}
                  </button>
                  <div className="bc-count">
                    {loading ? (
                      <span className="bc-count__loading">Laden…</span>
                    ) : (
                      <><strong>{sortedTyres.length}</strong> {sortedTyres.length === 1 ? "band" : "banden"} gevonden</>
                    )}
                  </div>
                </div>

                {/* Right side: filter / sort on basis of price, popularity */}
                <div className="bc-toolbar__right">
                  <div className="bc-sort-control">
                    <span className="bc-sort-label">Sorteer:</span>
                    <div className="bc-sort-pills">
                      <button
                        type="button"
                        className={`bc-sort-pill ${sortBy === "popular" ? "bc-sort-pill--active" : ""}`}
                        onClick={() => setSortBy("popular")}
                      >
                        Populariteit
                      </button>
                      <button
                        type="button"
                        className={`bc-sort-pill ${sortBy === "price_asc" ? "bc-sort-pill--active" : ""}`}
                        onClick={() => setSortBy("price_asc")}
                      >
                        Prijs: laag → hoog
                      </button>
                      <button
                        type="button"
                        className={`bc-sort-pill ${sortBy === "price_desc" ? "bc-sort-pill--active" : ""}`}
                        onClick={() => setSortBy("price_desc")}
                      >
                        Prijs: hoog → laag
                      </button>
                    </div>

                    <select
                      className="bc-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sorteer banden op prijs of populariteit"
                    >
                      <option value="popular">Populariteit</option>
                      <option value="price_asc">Prijs: laag → hoog</option>
                      <option value="price_desc">Prijs: hoog → laag</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {(activeFilterCount > 0 || onlyFavorites) && (
                <div className="bc-active-filters">
                  {onlyFavorites && (
                    <span className="bc-active-chip" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.25)" }}>
                      <HeartIcon filled size={12} />
                      Alleen favorieten ({sortedTyres.length})
                      <button onClick={() => setOnlyFavorites(false)} aria-label="Favorietenfilter uitschakelen"><CloseIcon size={11} /></button>
                    </span>
                  )}
                  {(filters.width || filters.profile || filters.rim) && (
                    <span className="bc-active-chip">
                      Maat: {[filters.width, filters.profile && `/${filters.profile}`, filters.rim && ` R${filters.rim}`].filter(Boolean).join("")}
                      <button onClick={() => setFilters((f) => ({ ...f, width: "", profile: "", rim: "" }))} aria-label="Wis maatfilter"><CloseIcon size={11} /></button>
                    </span>
                  )}
                  {filters.season && <span className="bc-active-chip">{SEASON_LABEL[filters.season]} <button onClick={() => setFilters((f) => ({ ...f, season: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.condition && <span className="bc-active-chip">{filters.condition === "NEW" ? "Nieuw" : "2de hands"} <button onClick={() => setFilters((f) => ({ ...f, condition: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.brand && <span className="bc-active-chip">{filters.brand} <button onClick={() => setFilters((f) => ({ ...f, brand: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.speedIndex && <span className="bc-active-chip">Index {filters.speedIndex} <button onClick={() => setFilters((f) => ({ ...f, speedIndex: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.fuelEfficiency && <span className="bc-active-chip">Brandstof: {filters.fuelEfficiency} <button onClick={() => setFilters((f) => ({ ...f, fuelEfficiency: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.wetGrip && <span className="bc-active-chip">Grip nat: {filters.wetGrip} <button onClick={() => setFilters((f) => ({ ...f, wetGrip: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.dotYear && <span className="bc-active-chip">DOT {filters.dotYear} <button onClick={() => setFilters((f) => ({ ...f, dotYear: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.runflat && <span className="bc-active-chip">Run-flat <button onClick={() => setFilters((f) => ({ ...f, runflat: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.reinforced && <span className="bc-active-chip">XL <button onClick={() => setFilters((f) => ({ ...f, reinforced: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.highLoad && <span className="bc-active-chip">HL <button onClick={() => setFilters((f) => ({ ...f, highLoad: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.threepmsfRated && <span className="bc-active-chip">3PMSF 🏔️ <button onClick={() => setFilters((f) => ({ ...f, threepmsfRated: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.msMarking && <span className="bc-active-chip">M+S ❄️ <button onClick={() => setFilters((f) => ({ ...f, msMarking: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.iceGrip && <span className="bc-active-chip">🧊 Ijsgrip <button onClick={() => setFilters((f) => ({ ...f, iceGrip: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.electric && <span className="bc-active-chip">⚡ EV <button onClick={() => setFilters((f) => ({ ...f, electric: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.rimProtection && <span className="bc-active-chip">Velgbescherming <button onClick={() => setFilters((f) => ({ ...f, rimProtection: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.selfSealing && <span className="bc-active-chip">🛡️ Seal <button onClick={() => setFilters((f) => ({ ...f, selfSealing: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.acoustic && <span className="bc-active-chip">🔇 Acoustic <button onClick={() => setFilters((f) => ({ ...f, acoustic: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.demo && <span className="bc-active-chip">Demo <button onClick={() => setFilters((f) => ({ ...f, demo: false }))}><CloseIcon size={11} /></button></span>}
                  {filters.oeMarking && <span className="bc-active-chip">OEM: {filters.oeMarking} <button onClick={() => setFilters((f) => ({ ...f, oeMarking: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.tyreClass && <span className="bc-active-chip">{filters.tyreClass} <button onClick={() => setFilters((f) => ({ ...f, tyreClass: "" }))}><CloseIcon size={11} /></button></span>}
                  {filters.inStock && <span className="bc-active-chip">Op voorraad <button onClick={() => setFilters((f) => ({ ...f, inStock: false }))}><CloseIcon size={11} /></button></span>}
                  {(filters.priceMin || filters.priceMax) && (
                    <span className="bc-active-chip">
                      €{filters.priceMin || "0"} – €{filters.priceMax || "∞"}
                      <button onClick={() => setFilters((f) => ({ ...f, priceMin: "", priceMax: "" }))}><CloseIcon size={11} /></button>
                    </span>
                  )}
                  <button className="bc-active-chip bc-active-chip--clear" onClick={() => { setFilters(EMPTY_FILTERS); setOnlyFavorites(false); }}>Wis alles</button>
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="bc-grid" aria-busy="true" aria-label="Banden laden">
                  {[...Array(8)].map((_, i) => <TyreCardSkeleton key={i} />)}
                </div>
              ) : sortedTyres.length === 0 ? (
                <div className="bc-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <h3>Geen banden gevonden</h3>
                  <p>Geen exacte match gevonden. Pas de filters aan of bel ons — we ontvangen dagelijks nieuwe leveringen!</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="btn btn--outline" onClick={() => { setFilters(EMPTY_FILTERS); setSearch(""); }}>Filters wissen</button>
                    <Link href="/contact" className="btn btn--primary">Bandenmaat aanvragen</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bc-grid">
                    {paginatedTyres.map((tyre) => (
                      <TyreCard
                        key={tyre.id}
                        tyre={tyre}
                        isFav={favorites.includes(tyre.id)}
                        onToggleFav={handleToggleFav}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>

                  {sortedTyres.length > 0 && totalPages > 1 && (
                    <nav className="bc-pagination" aria-label="Paginering van bandenaanbod">
                      <span className="bc-pagination__info">
                        Resultaten <strong>{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sortedTyres.length)}</strong> van <strong>{sortedTyres.length}</strong> banden
                      </span>
                      <div className="bc-pagination__controls">
                        <button
                          type="button"
                          className="bc-page-btn bc-page-btn--nav"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1}
                          aria-label="Vorige pagina"
                        >
                          <span className="bc-page-arrow">‹</span>
                          <span className="bc-page-label">Vorige</span>
                        </button>

                        {pageNumbers.map((p, idx) =>
                          p === -1 ? (
                            <span key={`ellipsis-${idx}`} className="bc-page-ellipsis">
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              className={`bc-page-btn ${p === page ? "bc-page-btn--active" : ""}`}
                              onClick={() => handlePageChange(p)}
                              aria-current={p === page ? "page" : undefined}
                              aria-label={`Pagina ${p}`}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          className="bc-page-btn bc-page-btn--nav"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages}
                          aria-label="Volgende pagina"
                        >
                          <span className="bc-page-label">Volgende</span>
                          <span className="bc-page-arrow">›</span>
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              )}

              {/* CTA footer */}
              <div className="bc-cta">
                <p>Specifieke maat, run-flat of 4×4 band nodig?</p>
                <div className="bc-cta__btns">
                  <Link href="/contact" className="btn btn--dark btn--lg">Bandenmaat aanvragen</Link>
                  <a href="tel:+32467871205" className="btn btn--primary btn--lg">Bel: 0467 87 12 05</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="bc-toast-wrapper">
          <div className={`bc-toast ${toast.type === "cart" ? "bc-toast--cart" : "bc-toast--fav"}`}>
            <span className="bc-toast__icon">
              {toast.type === "cart" ? <CartSmallIcon size={18} /> : <HeartIcon filled size={18} />}
            </span>
            <span className="bc-toast__msg">{toast.message}</span>
            {toast.type === "cart" && (
              <button
                type="button"
                className="bc-toast__action"
                onClick={() => {
                  setToast(null);
                  window.dispatchEvent(new CustomEvent("gent-open-cart"));
                }}
              >
                Bekijk mand ›
              </button>
            )}
            <button
              type="button"
              className="bc-toast__close"
              onClick={() => setToast(null)}
              aria-label="Melding sluiten"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function BandenPage() {
  return (
    <Suspense fallback={<div className="container" style={{ minHeight: "80vh", paddingTop: 100 }} />}>
      <BandenCatalogContent />
    </Suspense>
  );
}
