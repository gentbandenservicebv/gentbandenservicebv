"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { addToCart, toggleFavorite, getFavorites, subscribeToFavorites } from "@/lib/store";
import { getSpecTooltip } from "@/lib/tyre-specs";
import { SummerIcon, WinterIcon, AllSeasonIcon } from "@/app/components/SeasonIcons";
import "@/app/banden/banden.css";

export interface TyreCardData {
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
  treadDepth?: number | null;
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
  description?: string | null;
  featured?: boolean;
  images: { id: string; url: string; isPrimary?: boolean; order?: number }[];
}

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
  SUMMER: <SummerIcon size={14} />,
  WINTER: <WinterIcon size={14} />,
  ALL_SEASON: <AllSeasonIcon size={14} />,
};

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

export default function TyreCard({ tyre }: { tyre: TyreCardData }) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().includes(tyre.id));
    const unsub = subscribeToFavorites((favs) => {
      setIsFav(favs.includes(tyre.id));
    });
    return () => unsub();
  }, [tyre.id]);

  const primaryImg = tyre.images?.find((i) => i.isPrimary) ?? tyre.images?.[0];
  const isNew = tyre.condition === "NEW";
  const speedLoad = [tyre.loadIndex, tyre.speedIndex].filter(Boolean).join("");
  const productHref = `/banden/${tyre.slug || tyre.id}`;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: tyre.id,
      slug: tyre.slug,
      brand: tyre.brand,
      model: tyre.model,
      size: tyre.size,
      price: tyre.price,
      stock: tyre.stock,
      imageUrl: primaryImg?.url,
      season: tyre.season,
      condition: tyre.condition,
    });
    setAdded(true);
    window.dispatchEvent(new CustomEvent("gent-open-cart"));
    setTimeout(() => setAdded(false), 1600);
  }

  function handleToggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(tyre.id);
  }

  return (
    <article className="tyre-card">
      <Link href={productHref} className="tyre-card__img-wrap" tabIndex={-1}>
        {primaryImg && !imgError ? (
          <Image
            src={primaryImg.url}
            alt={`${tyre.brand} ${tyre.model}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="tyre-card__img-placeholder">
            <TireIcon size={80} />
          </div>
        )}
        <span className={`tyre-card__badge tyre-card__badge--${isNew ? "new" : "used"}`}>
          {isNew ? "Nieuw" : "2de hands"}
        </span>
        {tyre.images && tyre.images.length > 1 && (
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
          <span className={`tyre-card__season-tag tyre-card__season-tag--${(tyre.season || "").toLowerCase().replace("_", "-")}`}>
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
          {tyre.oeMarking && tyre.oeMarking.split(/[,/]+/).map((s) => s.trim()).filter(Boolean).map((oe) => (
            <span key={oe} className="tc-pill" style={{ background: "rgba(147, 51, 234, 0.12)", color: "#7c3aed", borderColor: "rgba(147, 51, 234, 0.3)" }} data-tooltip={getSpecTooltip(oe)} title={getSpecTooltip(oe)}>
              {oe}
            </span>
          ))}
          {tyre.tyreClass && (
            <span className="tc-pill" style={{ background: "rgba(100, 116, 139, 0.1)", color: "#334155", borderColor: "rgba(100, 116, 139, 0.25)" }} data-tooltip={getSpecTooltip(tyre.tyreClass)} title={getSpecTooltip(tyre.tyreClass)}>
              {tyre.tyreClass}
            </span>
          )}
          {tyre.treadDepth && (
            <span className="tc-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }} data-tooltip={getSpecTooltip("Profieldiepte")} title={getSpecTooltip("Profieldiepte")}>
              Profiel {tyre.treadDepth}mm
            </span>
          )}
        </div>

        <div className="tyre-card__footer">
          <div>
            <div className="tyre-card__price">
              €{tyre.price.toFixed(2)}
              <span className="tyre-card__price-unit">/st</span>
            </div>
            <div className="tyre-card__stock">
              <span className="tyre-card__stock--in">
                ● Direct op voorraad
              </span>
            </div>
          </div>

          <div className="tyre-card__actions">
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
