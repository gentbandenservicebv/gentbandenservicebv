"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DimensionCombination {
  w: number;
  p: number;
  d: number;
  rimKey: string;
  isC: boolean;
  s: string;
  stock: number;
}

interface DimensionsData {
  totalInStock: number;
  totalVariants: number;
  widths: number[];
  profiles: number[];
  diameters: string[];
  combinations: DimensionCombination[];
}

// Fallback combinations in case database is loading or unavailable
const FALLBACK_COMBINATIONS: DimensionCombination[] = [
  { w: 195, p: 65, d: 15, rimKey: "15", isC: false, s: "ALL_SEASON", stock: 12 },
  { w: 205, p: 55, d: 16, rimKey: "16", isC: false, s: "SUMMER", stock: 24 },
  { w: 205, p: 60, d: 16, rimKey: "16", isC: false, s: "ALL_SEASON", stock: 8 },
  { w: 215, p: 55, d: 17, rimKey: "17", isC: false, s: "SUMMER", stock: 10 },
  { w: 215, p: 65, d: 16, rimKey: "16C", isC: true, s: "ALL_SEASON", stock: 16 },
  { w: 225, p: 40, d: 18, rimKey: "18", isC: false, s: "SUMMER", stock: 14 },
  { w: 225, p: 40, d: 19, rimKey: "19", isC: false, s: "SUMMER", stock: 6 },
  { w: 225, p: 45, d: 17, rimKey: "17", isC: false, s: "SUMMER", stock: 18 },
  { w: 225, p: 45, d: 18, rimKey: "18", isC: false, s: "ALL_SEASON", stock: 12 },
  { w: 235, p: 65, d: 16, rimKey: "16C", isC: true, s: "ALL_SEASON", stock: 8 },
];

const POPULAR_SIZES = [
  { label: "205/55 R16", w: "205", p: "55", r: "16" },
  { label: "195/65 R15", w: "195", p: "65", r: "15" },
  { label: "215/65 R16C", w: "215", p: "65", r: "16C" },
  { label: "225/45 R17", w: "225", p: "45", r: "17" },
  { label: "225/40 R18", w: "225", p: "40", r: "18" },
  { label: "205/60 R16", w: "205", p: "60", r: "16" },
];

function sortRims(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

function formatRimDisplay(rimVal: string): string {
  if (rimVal.endsWith("C")) {
    const num = parseInt(rimVal, 10);
    return `${num}"C (Bestelwagen)`;
  }
  return `${rimVal}"`;
}

export default function TireFinder() {
  const router = useRouter();

  const [data, setData] = useState<DimensionsData | null>(null);

  // Form selections
  const [width, setWidth] = useState<string>("");
  const [profile, setProfile] = useState<string>("");
  const [rim, setRim] = useState<string>("");
  const [season, setSeason] = useState<string>("all");

  // Fetch real dimensions & live stock from the database API
  useEffect(() => {
    let active = true;
    fetch("/api/tyres/dimensions")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((json: DimensionsData) => {
        if (active && json && Array.isArray(json.combinations) && json.combinations.length > 0) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error("Bandenmaten API fallback actief:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const allCombinations = useMemo(() => {
    return data?.combinations ?? FALLBACK_COMBINATIONS;
  }, [data]);

  // 1. SMART WIDTHS:
  // Derived strictly from combinations existing in the DB (filtered by profile/rim if already selected)
  const availableWidths = useMemo(() => {
    let list = allCombinations;
    if (profile) {
      list = list.filter((c) => c.p === Number(profile));
    }
    if (rim) {
      list = list.filter((c) => (c.rimKey || String(c.d)) === rim);
    }
    return Array.from(new Set(list.map((c) => c.w))).sort((a, b) => a - b);
  }, [allCombinations, profile, rim]);

  // 2. SMART PROFILES:
  // When a width is selected (e.g. 225), ONLY shows profiles that exist in the DB for that width (e.g. 40, 45)
  const availableProfiles = useMemo(() => {
    let list = allCombinations;
    if (width) {
      list = list.filter((c) => c.w === Number(width));
    }
    if (rim) {
      list = list.filter((c) => (c.rimKey || String(c.d)) === rim);
    }
    return Array.from(new Set(list.map((c) => c.p))).sort((a, b) => a - b);
  }, [allCombinations, width, rim]);

  // 3. SMART RIMS:
  // When width and profile are selected (e.g. 225/40), ONLY shows diameters that exist in the DB for that combo (e.g. 18, 19, NOT 15!)
  const availableRims = useMemo(() => {
    let list = allCombinations;
    if (width) {
      list = list.filter((c) => c.w === Number(width));
    }
    if (profile) {
      list = list.filter((c) => c.p === Number(profile));
    }
    const keys = Array.from(new Set(list.map((c) => c.rimKey || String(c.d))));
    return keys.sort(sortRims);
  }, [allCombinations, width, profile]);

  // Stock lookup maps for the current filtered view
  const stockMapWidth = useMemo(() => {
    const map = new Map<number, number>();
    allCombinations.forEach((c) => {
      if (profile && c.p !== Number(profile)) return;
      if (rim && (c.rimKey || String(c.d)) !== rim) return;
      map.set(c.w, (map.get(c.w) || 0) + c.stock);
    });
    return map;
  }, [allCombinations, profile, rim]);

  const stockMapProfile = useMemo(() => {
    const map = new Map<number, number>();
    allCombinations.forEach((c) => {
      if (width && c.w !== Number(width)) return;
      if (rim && (c.rimKey || String(c.d)) !== rim) return;
      map.set(c.p, (map.get(c.p) || 0) + c.stock);
    });
    return map;
  }, [allCombinations, width, rim]);

  const stockMapRim = useMemo(() => {
    const map = new Map<string, number>();
    allCombinations.forEach((c) => {
      if (width && c.w !== Number(width)) return;
      if (profile && c.p !== Number(profile)) return;
      const key = c.rimKey || String(c.d);
      map.set(key, (map.get(key) || 0) + c.stock);
    });
    return map;
  }, [allCombinations, width, profile]);

  // Auto-reset selections when they are no longer valid in the newly filtered list
  useEffect(() => {
    if (profile && availableProfiles.length > 0 && !availableProfiles.includes(Number(profile))) {
      setProfile("");
    }
  }, [availableProfiles, profile]);

  useEffect(() => {
    if (rim && availableRims.length > 0 && !availableRims.includes(rim)) {
      setRim("");
    }
  }, [availableRims, rim]);

  // Compute live matching stock & model count
  const matchingStats = useMemo(() => {
    let list = allCombinations;
    const hasFilters = Boolean(width || profile || rim || (season && season !== "all"));

    if (!hasFilters) {
      return {
        totalStock: data?.totalInStock || list.reduce((sum, i) => sum + i.stock, 0),
        variants: data?.totalVariants || list.length,
        isDefault: true,
      };
    }

    if (width) {
      list = list.filter((c) => c.w === Number(width));
    }
    if (profile) {
      list = list.filter((c) => c.p === Number(profile));
    }
    if (rim) {
      list = list.filter((c) => (c.rimKey || String(c.d)) === rim);
    }
    if (season && season !== "all") {
      const sMap: Record<string, string> = {
        zomer: "SUMMER",
        winter: "WINTER",
        "all-season": "ALL_SEASON",
      };
      const mapped = sMap[season];
      if (mapped) {
        list = list.filter((c) => c.s === mapped);
      }
    }

    const totalStock = list.reduce((sum, item) => sum + item.stock, 0);
    return {
      totalStock,
      variants: list.length,
      isDefault: false,
    };
  }, [allCombinations, data, width, profile, rim, season]);

  // Handle form submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (width) params.set("width", width);
    if (profile) params.set("profile", profile);
    if (rim) params.set("rim", rim);
    if (season && season !== "all") params.set("season", season);

    const queryString = params.toString();
    router.push(queryString ? `/banden?${queryString}` : "/banden");
  }

  function handleReset() {
    setWidth("");
    setProfile("");
    setRim("");
    setSeason("all");
  }

  function handleQuickSelect(size: { w: string; p: string; r: string }) {
    if (width === size.w && profile === size.p && rim === size.r) {
      handleReset();
    } else {
      setWidth(size.w);
      setProfile(size.p);
      setRim(size.r);
    }
  }

  const hasSelections = Boolean(width || profile || rim || (season && season !== "all"));

  return (
    <div className="finder-card">
      <div className="finder-card__header">
        <span className="finder-card__icon">
          <TireSearchIcon />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className="finder-card__title">Vind uw banden</h2>
            {hasSelections && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary-light)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                Reset
              </button>
            )}
          </div>
          <p className="finder-card__sub">
            Direct filteren op actuele voorraad in Gent
          </p>
        </div>
      </div>

      {/* Live Database Stock Indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          marginBottom: 16,
          background: matchingStats.isDefault || matchingStats.totalStock > 0
            ? "rgba(34, 197, 94, 0.1)"
            : "rgba(1, 110, 185, 0.12)",
          border: matchingStats.isDefault || matchingStats.totalStock > 0
            ? "1px solid rgba(34, 197, 94, 0.25)"
            : "1px solid rgba(1, 110, 185, 0.3)",
          borderRadius: "8px",
          fontSize: "0.82rem",
          color: matchingStats.isDefault || matchingStats.totalStock > 0 ? "#86efac" : "#93c5fd",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: matchingStats.isDefault || matchingStats.totalStock > 0 ? "#22c55e" : "#3b82f6",
            boxShadow: matchingStats.isDefault || matchingStats.totalStock > 0
              ? "0 0 8px rgba(34, 197, 94, 0.7)"
              : "0 0 8px rgba(59, 130, 246, 0.7)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            flexShrink: 0,
          }}
        />
        <span>
          {hasSelections ? (
            matchingStats.totalStock > 0 ? (
              <>
                <strong>{matchingStats.totalStock.toLocaleString("nl-NL")}</strong> banden op voorraad{" "}
                <span style={{ opacity: 0.75 }}>({matchingStats.variants} types)</span>
              </>
            ) : (
              <>
                <strong>Direct leverbaar op bestelling</strong>{" "}
                <span style={{ opacity: 0.85 }}>(snelle montage in Gent)</span>
              </>
            )
          ) : (
            <>
              <strong>
                {(matchingStats.totalStock > 0 ? matchingStats.totalStock : 2500).toLocaleString("nl-NL")}
              </strong>{" "}
              banden direct leverbaar in Gent
            </>
          )}
        </span>
      </div>

      <form className="finder-card__form" onSubmit={handleSubmit}>
        <div className="finder-row">
          {/* Breedte */}
          <div className="form-group finder-group">
            <label className="form-label" htmlFor="finder-width">
              Breedte
            </label>
            <select
              id="finder-width"
              name="width"
              className="form-input"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            >
              <option value="">Breedte</option>
              {availableWidths.map((w) => {
                const stock = stockMapWidth.get(w) || 0;
                return (
                  <option key={w} value={w}>
                    {w} {stock > 0 ? `(${stock} op voorraad)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="finder-sep">/</div>

          {/* Profiel (Aspect Ratio) */}
          <div className="form-group finder-group">
            <label className="form-label" htmlFor="finder-profile">
              Profiel
            </label>
            <select
              id="finder-profile"
              name="profile"
              className="form-input"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            >
              <option value="">Profiel</option>
              {availableProfiles.map((p) => {
                const stock = stockMapProfile.get(p) || 0;
                return (
                  <option key={p} value={p}>
                    {p} {stock > 0 ? `(${stock} op voorraad)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="finder-sep">R</div>

          {/* Velg / Diameter */}
          <div className="form-group finder-group">
            <label className="form-label" htmlFor="finder-rim">
              Velg
            </label>
            <select
              id="finder-rim"
              name="rim"
              className="form-input"
              value={rim}
              onChange={(e) => setRim(e.target.value)}
            >
              <option value="">Velg</option>
              {availableRims.map((r) => {
                const stock = stockMapRim.get(r) || 0;
                return (
                  <option key={r} value={r}>
                    {formatRimDisplay(r)} {stock > 0 ? `(${stock} op voorraad)` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick popular size shortcuts */}
        <div className="finder-quick">
          <span className="finder-quick__label">Populaire maten:</span>
          <div className="finder-quick__chips">
            {POPULAR_SIZES.map((s) => {
              const isActive = width === s.w && profile === s.p && rim === s.r;
              return (
                <button
                  key={s.label}
                  type="button"
                  className={`finder-quick__chip ${isActive ? "finder-quick__chip--active" : ""}`}
                  onClick={() => handleQuickSelect(s)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seizoen */}
        <div className="form-group">
          <label className="form-label">Seizoen</label>
          <div className="finder-season">
            {[
              { val: "all", label: "Alles" },
              { val: "zomer", label: "🌞 Zomer" },
              { val: "winter", label: "❄️ Winter" },
              { val: "all-season", label: "🌤 4-seiz." },
            ].map((s) => (
              <label key={s.val} className="finder-season__opt">
                <input
                  type="radio"
                  name="season"
                  value={s.val}
                  checked={season === s.val}
                  onChange={() => setSeason(s.val)}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn--primary w-full finder-card__submit">
          <span>
            {hasSelections
              ? matchingStats.totalStock > 0
                ? `Banden bekijken (${matchingStats.totalStock.toLocaleString("nl-NL")})`
                : "Banden zoeken & bestellen"
              : "Banden zoeken"}
          </span>
          <SearchIcon />
        </button>
      </form>

      <p className="finder-card__hint">
        Staat uw maat er niet bij?{" "}
        <Link href="/contact" className="finder-card__hint-link">
          Neem contact op →
        </Link>
      </p>
    </div>
  );
}

function TireSearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M21 21l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15 15l-2.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
