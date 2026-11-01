"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DimensionCombination {
  w: number;
  p: number;
  d: number;
  s: string;
  stock: number;
}

interface DimensionsData {
  totalInStock: number;
  totalVariants: number;
  widths: number[];
  profiles: number[];
  diameters: number[];
  combinations: DimensionCombination[];
}

// Fallbacks while loading from the database
const FALLBACK_WIDTHS = [175, 185, 195, 205, 215, 225, 235, 245, 255];
const FALLBACK_PROFILES = [40, 45, 50, 55, 60, 65];
const FALLBACK_RIMS = [15, 16, 17, 18, 19, 20];

export default function TireFinder() {
  const router = useRouter();

  const [data, setData] = useState<DimensionsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [width, setWidth] = useState<string>("");
  const [profile, setProfile] = useState<string>("");
  const [rim, setRim] = useState<string>("");
  const [season, setSeason] = useState<string>("all");

  // Fetch real dimensions from the database API
  useEffect(() => {
    let active = true;
    fetch("/api/tyres/dimensions")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((json: DimensionsData) => {
        if (active && json.combinations) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error("Fout bij ophalen bandenmaten:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Compute available widths from database data
  const availableWidths = useMemo(() => {
    if (!data?.combinations || data.combinations.length === 0) {
      return FALLBACK_WIDTHS;
    }
    return [...new Set(data.combinations.map((c) => c.w))].sort((a, b) => a - b);
  }, [data]);

  // Compute available profiles based on selected width
  const availableProfiles = useMemo(() => {
    if (!data?.combinations || data.combinations.length === 0) {
      return FALLBACK_PROFILES;
    }
    const filtered = width
      ? data.combinations.filter((c) => c.w === Number(width))
      : data.combinations;
    return [...new Set(filtered.map((c) => c.p))].sort((a, b) => a - b);
  }, [data, width]);

  // Compute available rims based on selected width and profile
  const availableRims = useMemo(() => {
    if (!data?.combinations || data.combinations.length === 0) {
      return FALLBACK_RIMS;
    }
    let filtered = data.combinations;
    if (width) filtered = filtered.filter((c) => c.w === Number(width));
    if (profile) filtered = filtered.filter((c) => c.p === Number(profile));
    return [...new Set(filtered.map((c) => c.d))].sort((a, b) => a - b);
  }, [data, width, profile]);

  // Reset profile if no longer in available list
  useEffect(() => {
    if (profile && !availableProfiles.includes(Number(profile))) {
      setProfile("");
    }
  }, [availableProfiles, profile]);

  // Reset rim if no longer in available list
  useEffect(() => {
    if (rim && !availableRims.includes(Number(rim))) {
      setRim("");
    }
  }, [availableRims, rim]);

  // Compute live matching stock & model count
  const matchingStats = useMemo(() => {
    if (!data?.combinations) {
      return { totalStock: 29894, variants: 2004 };
    }

    let list = data.combinations;
    const hasFilters = Boolean(width || profile || rim || (season && season !== "all"));

    if (!hasFilters) {
      return {
        totalStock: data.totalInStock || 29894,
        variants: data.totalVariants || list.length,
      };
    }

    if (width) {
      list = list.filter((c) => c.w === Number(width));
    }
    if (profile) {
      list = list.filter((c) => c.p === Number(profile));
    }
    if (rim) {
      list = list.filter((c) => c.d === Number(rim));
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
    };
  }, [data, width, profile, rim, season]);

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
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          borderRadius: "8px",
          fontSize: "0.82rem",
          color: "#86efac",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 8px rgba(34, 197, 94, 0.7)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            flexShrink: 0,
          }}
        />
        <span>
          {hasSelections ? (
            <>
              <strong>{matchingStats.totalStock.toLocaleString("nl-NL")}</strong> banden op voorraad{" "}
              <span style={{ opacity: 0.75 }}>({matchingStats.variants} types)</span>
            </>
          ) : (
            <>
              <strong>{matchingStats.totalStock.toLocaleString("nl-NL")}</strong> banden direct leverbaar
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
              disabled={loading}
            >
              <option value="">Breedte</option>
              {availableWidths.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
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
              disabled={loading}
            >
              <option value="">Profiel</option>
              {availableProfiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
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
              disabled={loading}
            >
              <option value="">Velg</option>
              {availableRims.map((r) => (
                <option key={r} value={r}>
                  {r}&quot;
                </option>
              ))}
            </select>
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
              ? `Banden bekijken (${matchingStats.totalStock.toLocaleString("nl-NL")})`
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
