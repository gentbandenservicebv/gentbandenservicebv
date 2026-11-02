"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface PageViewEntry {
  id: string;
  path: string;
  title: string | null;
  duration: number | null;
  createdAt: string;
}

interface VisitorSessionEntry {
  id: string;
  visitorId: string;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  entryPath: string;
  exitPath: string | null;
  pageViewsCount: number;
  duration: number;
  firstSeen: string;
  lastSeen: string;
  pageViews: PageViewEntry[];
}

interface AnalyticsPayload {
  activeVisitors: number;
  today: {
    pageViews: number;
    sessions: number;
  };
  period: {
    range: string;
    pageViews: number;
    sessions: number;
    avgDuration: number;
  };
  topPages: {
    path: string;
    title: string;
    views: number;
    uniqueVisitors: number;
  }[];
  deviceStats: {
    name: string;
    count: number;
  }[];
  browserStats: {
    name: string;
    count: number;
  }[];
  recentSessions: VisitorSessionEntry[];
}

export default function AdminAnalyticsView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<VisitorSessionEntry | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds for live visitors
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return "< 5s";
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s geleden`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m geleden`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`;
    return new Date(dateStr).toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredSessions = (data?.recentSessions || []).filter((s) => {
    if (deviceFilter !== "ALL" && s.device !== deviceFilter) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.visitorId.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.entryPath.toLowerCase().includes(q) ||
      (s.exitPath && s.exitPath.toLowerCase().includes(q)) ||
      (s.referrer && s.referrer.toLowerCase().includes(q)) ||
      s.pageViews.some((pv) => pv.path.toLowerCase().includes(q) || (pv.title && pv.title.toLowerCase().includes(q)))
    );
  });

  const totalDeviceCount = (data?.deviceStats || []).reduce((acc, d) => acc + d.count, 0) || 1;
  const maxPageViews = data?.topPages?.[0]?.views || 1;

  return (
    <div className="admin-analytics-container">
      {/* ── HEADER & CONTROLS ──────────────────────────── */}
      <div className="admin-analytics-header">
        <div className="admin-analytics-header__lead">
          <div className="admin-analytics-header__icon-box" aria-hidden="true">
            🍪
          </div>
          <div>
            <div className="admin-analytics-header__badge-row">
              <span className="admin-analytics-header__tag admin-analytics-header__tag--live">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                    display: "inline-block",
                  }}
                />
                Realtime Bezoekers
              </span>
              <span className="admin-analytics-header__tag">First-Party Cookies</span>
              <span className="admin-analytics-header__tag">AVG / GDPR-Conform</span>
            </div>
            <h1 className="admin-analytics-header__title">
              Bezoekersactiviteit &amp; Cookies
            </h1>
            <p className="admin-analytics-header__sub">
              Volg live websitebezoekers, bezochte pagina&apos;s, navigatiepaden en sessieduur via first-party cookies.
            </p>
          </div>
        </div>

        <div className="admin-analytics-header__controls">
          {/* Period selector */}
          <div
            style={{
              display: "flex",
              background: "#0d0f16",
              borderRadius: 10,
              padding: 3,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {[
              { id: "24h", label: "24 uur" },
              { id: "7d", label: "7 dagen" },
              { id: "30d", label: "30 dagen" },
              { id: "all", label: "Alles" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRange(p.id as typeof range)}
                style={{
                  background: range === p.id ? "linear-gradient(135deg, #016eb9, #0284c7)" : "transparent",
                  color: range === p.id ? "#fff" : "rgba(255,255,255,0.6)",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 15px",
                  fontSize: "0.78rem",
                  fontWeight: range === p.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: range === p.id ? "0 2px 8px rgba(1,110,185,0.4)" : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              fontSize: "0.82rem",
              background: "#161922",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              borderRadius: 10,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? "Bijwerken..." : "Vernieuwen"}</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS ROW ──────────────────────────── */}
      <div className="admin-stats-grid">
        {/* Realtime Live Online */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 100%)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 16,
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 12px #10b981",
                  display: "inline-block",
                  animation: "pulse 1.8s infinite",
                }}
              />
              Live Bezoekers
            </span>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {data?.activeVisitors ?? 0}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
            Actief op de website in de afgelopen 15 min.
          </p>
        </div>

        {/* Pageviews Today */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#60c0ff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Weergaven Vandaag
            </span>
            <span style={{ fontSize: "1.2rem" }}>👁️</span>
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {data?.today?.pageViews ?? 0}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
            Over {data?.today?.sessions ?? 0} unieke sessies vandaag
          </p>
        </div>

        {/* Total Pageviews in period */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Totaal Periode ({range})
            </span>
            <span style={{ fontSize: "1.2rem" }}>📈</span>
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {data?.period?.pageViews ?? 0}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
            {data?.period?.sessions ?? 0} sessies geregistreerd
          </p>
        </div>

        {/* Average Duration */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Gem. Sessieduur
            </span>
            <span style={{ fontSize: "1.2rem" }}>⏱️</span>
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {formatDuration(data?.period?.avgDuration || 0)}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
            Actieve verblijftijd op de website
          </p>
        </div>
      </div>

      {/* ── TWO-COLUMN SECTION: TOP PAGES & DEVICES ─────── */}
      <div className="admin-dashboard-split-grid" style={{ marginBottom: 32 }}>
        {/* Most visited pages */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📄</span> Meest Bezochte Pagina&apos;s
            </h3>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Top {data?.topPages?.length || 0}</span>
          </div>

          {(!data?.topPages || data.topPages.length === 0) ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
              Nog geen paginaweergaven geregistreerd in deze periode.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.topPages.map((page, idx) => {
                const percent = Math.round((page.views / maxPageViews) * 100);
                return (
                  <div key={page.path} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", width: 18 }}>#{idx + 1}</span>
                        <Link
                          href={page.path}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#60c0ff",
                            textDecoration: "none",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={page.path}
                        >
                          {page.path}
                        </Link>
                        {page.title && page.title !== page.path && (
                          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>
                            ({page.title.length > 28 ? page.title.slice(0, 28) + "..." : page.title})
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: "#fff" }}>{page.views}</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                          ({page.uniqueVisitors} uniek)
                        </span>
                      </div>
                    </div>

                    {/* Progress visual bar */}
                    <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #016eb9, #38bdf8)",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device & Browser breakdown */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Devices */}
          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>💻</span> Apparaten
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data?.deviceStats || []).map((dev) => {
                const pct = Math.round((dev.count / totalDeviceCount) * 100);
                const icon = dev.name === "Mobile" ? "📱" : dev.name === "Tablet" ? "📟" : "🖥️";
                return (
                  <div key={dev.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                      <span style={{ color: "#e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{icon}</span> {dev.name}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                        {dev.count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: dev.name === "Mobile" ? "#10b981" : "#016eb9",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browsers */}
          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🌐</span> Browsers
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {(data?.browserStats || []).map((b) => (
                <div
                  key={b.name}
                  style={{
                    background: "#10121a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{b.name}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginTop: 2 }}>{b.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── VISITOR JOURNEY & SESSIONS EXPLORER ──────────── */}
      <div
        style={{
          background: "#161922",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🧭</span> Bezoekerssessies &amp; Navigatiepaden
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              Chronologisch overzicht van wie de website bezocht, welke pagina&apos;s werden bekeken en hoelang.
            </p>
          </div>

          {/* Search & filter toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Zoek op pad, cookie of referrer..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="admin-input"
              style={{
                flex: "1 1 200px",
                minWidth: 160,
                padding: "8px 12px",
                fontSize: "0.82rem",
                background: "#10121a",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#fff",
                margin: 0,
              }}
            />

            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="admin-select"
              style={{
                flex: "1 1 140px",
                minWidth: 130,
                padding: "8px 12px",
                fontSize: "0.82rem",
                background: "#10121a",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#fff",
                margin: 0,
              }}
            >
              <option value="ALL">Alle Apparaten</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobiel</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
        </div>

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            Geen sessies gevonden met deze filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSessions.map((session) => {
              const isRecent = Date.now() - new Date(session.lastSeen).getTime() < 15 * 60 * 1000;
              const deviceIcon = session.device === "Mobile" ? "📱" : session.device === "Tablet" ? "📟" : "🖥️";

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    background: "#10121a",
                    border: isRecent ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(1,110,185,0.5)";
                    e.currentTarget.style.background = "#141721";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isRecent ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "#10121a";
                  }}
                >
                  {/* Top metadata line */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {isRecent && (
                        <span
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            color: "#34d399",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                          LIVE
                        </span>
                      )}

                      {/* Visitor Cookie Badge */}
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.78rem",
                          background: "rgba(255,255,255,0.05)",
                          color: "#93c5fd",
                          padding: "2px 8px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        title={`Visitor Cookie ID: ${session.visitorId}`}
                      >
                        🍪 {session.visitorId.slice(0, 14)}...
                      </span>

                      {/* Device & Browser */}
                      <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
                        {deviceIcon} {session.device || "Desktop"} · {session.browser || "Browser"} · {session.os || "OS"}
                      </span>

                      {/* Referrer */}
                      {session.referrer && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: "rgba(245,158,11,0.1)",
                            color: "#fbbf24",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                          title={`Referrer: ${session.referrer}`}
                        >
                          🔗 {session.referrer.length > 30 ? session.referrer.slice(0, 30) + "..." : session.referrer}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      <span>⏱️ Duur: <strong>{formatDuration(session.duration)}</strong></span>
                      <span>{session.pageViewsCount} {session.pageViewsCount === 1 ? "pagina" : "pagina's"}</span>
                      <span>{formatTimeAgo(session.lastSeen)}</span>
                    </div>
                  </div>

                  {/* Navigational Journey / Breadcrumbs */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginRight: 4 }}>
                      Pad:
                    </span>
                    {session.pageViews.map((pv, pIdx) => (
                      <React.Fragment key={pv.id}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            background: pIdx === session.pageViews.length - 1 ? "rgba(1,110,185,0.2)" : "rgba(255,255,255,0.04)",
                            border: pIdx === session.pageViews.length - 1 ? "1px solid rgba(1,110,185,0.4)" : "1px solid rgba(255,255,255,0.06)",
                            color: pIdx === session.pageViews.length - 1 ? "#60c0ff" : "rgba(255,255,255,0.8)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontFamily: "monospace",
                          }}
                          title={`${pv.title || pv.path} (${pv.duration ? `${pv.duration}s` : "lopend"})`}
                        >
                          {pv.path.length > 25 ? pv.path.slice(0, 25) + "..." : pv.path}
                          {pv.duration && pv.duration > 0 ? (
                            <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 4, fontSize: "0.68rem" }}>
                              {pv.duration}s
                            </span>
                          ) : null}
                        </span>
                        {pIdx < session.pageViews.length - 1 && (
                          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: DETAILED SESSION INSPECTOR ────────────── */}
      {selectedSession && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSession(null);
          }}
        >
          <div
            className="admin-modal"
            style={{
              maxWidth: 720,
              background: "#161922",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, rgba(1,110,185,0.14) 0%, rgba(1,110,185,0.02) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔍</span> Bezoekerssessie Detail
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                  Sessie ID: <code>{selectedSession.id}</code>
                </p>
              </div>

              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-btn--xs"
                onClick={() => setSelectedSession(null)}
                style={{ fontSize: 16, lineHeight: 1, padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Session overview cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ background: "#10121a", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Visitor Cookie (gbs_vid)</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#93c5fd", fontFamily: "monospace", marginTop: 4 }}>
                    {selectedSession.visitorId}
                  </div>
                </div>

                <div style={{ background: "#10121a", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Apparaat &amp; Omgeving</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>
                    {selectedSession.device} · {selectedSession.browser} ({selectedSession.os})
                  </div>
                </div>

                <div style={{ background: "#10121a", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Totale Duur</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>
                    {formatDuration(selectedSession.duration)}
                  </div>
                </div>

                <div style={{ background: "#10121a", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Aanvang</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>
                    {new Date(selectedSession.firstSeen).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Sequential Page Views Timeline */}
              <div>
                <h4 style={{ margin: "0 0 14px", fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>
                  Chronologische Paginaweergaven ({selectedSession.pageViews.length})
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedSession.pageViews.map((pv, idx) => (
                    <div
                      key={pv.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        background: "#10121a",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#016eb9",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {idx + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <Link
                            href={pv.path}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#60c0ff",
                              textDecoration: "none",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.88rem",
                            }}
                          >
                            {pv.path}
                          </Link>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                            {new Date(pv.createdAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>

                        {pv.title && (
                          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                            {pv.title}
                          </div>
                        )}

                        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                          ⏱️ Tijd op deze pagina: <strong>{formatDuration(pv.duration || 0)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
