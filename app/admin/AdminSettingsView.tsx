"use client";

import React, { useState, useEffect } from "react";
import { SiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/settings-types";

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"ALL" | "DELIVERY" | "SHOP" | "INVOICE" | "COMPANY">("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "Instellingen succesvol opgeslagen!" });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Fout bij opslaan van instellingen." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Netwerkfout bij opslaan." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
        <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid rgba(56,189,248,0.2)", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 14, fontSize: "0.9rem" }}>Instellingen laden...</p>
      </div>
    );
  }

  const minDays = parseInt(settings.delivery_time_min, 10) || 2;
  const maxDays = parseInt(settings.delivery_time_max, 10) || 5;
  const unit = settings.delivery_time_unit || "werkdagen";
  const isShopOpen = settings.shop_open === "true";
  const isBannerEnabled = settings.shop_banner_enabled === "true";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(1, 110, 185, 0.25) 0%, rgba(2, 132, 199, 0.15) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              boxShadow: "0 0 20px rgba(1, 110, 185, 0.2)",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h1 className="admin-page-title" style={{ margin: 0 }}>Instellingen &amp; Configuratie</h1>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                Actief
              </span>
            </div>
            <p className="admin-page-sub" style={{ margin: 0 }}>
              Beheer levertijden, webshopstatus, facturatievoorkeuren en bedrijfsgegevens
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="admin-btn admin-btn--outline"
            onClick={() => {
              setLoading(true);
              fetch("/api/settings")
                .then((r) => r.json())
                .then((d) => setSettings((prev) => ({ ...prev, ...d })))
                .finally(() => setLoading(false));
            }}
            disabled={saving}
            title="Herladen van database"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Herladen
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => handleSave()}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
          >
            {saving ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Opslaan...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Wijzigingen Opslaan
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION ALERT ────────────────────────────── */}
      {statusMessage && (
        <div
          className={`admin-alert admin-alert--${statusMessage.type}`}
          style={{ marginBottom: 20 }}
          onClick={() => setStatusMessage(null)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {statusMessage.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── SECTION NAVIGATION PILLS ─────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {[
          {
            id: "ALL",
            label: "Alles tonen",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ),
          },
          {
            id: "DELIVERY",
            label: "Levering & Verzending",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ),
          },
          {
            id: "SHOP",
            label: "Winkel & Meldingen",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
          {
            id: "INVOICE",
            label: "Facturatie & Bank",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
          {
            id: "COMPANY",
            label: "Bedrijfsgegevens",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id as any)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "0.85rem",
              fontWeight: activeSection === sec.id ? 700 : 500,
              background: activeSection === sec.id ? "#016eb9" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeSection === sec.id ? "#0284c7" : "rgba(255,255,255,0.08)"}`,
              color: activeSection === sec.id ? "#ffffff" : "rgba(255,255,255,0.7)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── SECTION 1: LEVERING & VERZENDING ───────────── */}
        {(activeSection === "ALL" || activeSection === "DELIVERY") && (
          <div
            style={{
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Levertijd &amp; Verzending
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
                  Beheer de levertijd die getoond wordt op productpagina&apos;s, bij afrekenen en in bestelbevestigingen.
                </p>
              </div>
            </div>

            {/* Live Customer Preview Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(1, 110, 185, 0.12) 0%, rgba(56, 189, 248, 0.06) 100%)",
                border: "1px dashed rgba(56, 189, 248, 0.35)",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, color: "#38bdf8", fontWeight: 800 }}>
                  Live Klantpreview op de Website
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", padding: "4px 10px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    {settings.in_stock_text || "Op voorraad"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa", padding: "4px 10px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
                    Levering binnen {minDays}–{maxDays} {unit}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                    • Gratis verzending vanaf {settings.free_shipping_min_tyres || "2"} banden (1 band: €{Number(settings.shipping_cost || 9.95).toFixed(2)})
                  </span>
                </div>
              </div>

              {settings.delivery_note && (
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                  &ldquo;{settings.delivery_note}&rdquo;
                </div>
              )}
            </div>

            {/* Inputs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {/* In Stock Label */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Tekst bij voorraad (in voorraad badge)
                </label>
                <input
                  type="text"
                  value={settings.in_stock_text}
                  onChange={(e) => handleChange("in_stock_text", e.target.value)}
                  placeholder="Bijv. Op voorraad of Direct leverbaar"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                  Wordt getoond op bandenkaarten en productpagina&apos;s als stock &gt; 0 is.
                </span>
              </div>

              {/* Min Days */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Minimale levertijd
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.delivery_time_min}
                    onChange={(e) => handleChange("delivery_time_min", e.target.value)}
                    className="admin-code"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0d0f16",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
                    dagen
                  </span>
                </div>
              </div>

              {/* Max Days */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Maximale levertijd
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.delivery_time_max}
                    onChange={(e) => handleChange("delivery_time_max", e.target.value)}
                    className="admin-code"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0d0f16",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
                    dagen
                  </span>
                </div>
              </div>

              {/* Unit Dropdown */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Tijdseenheid
                </label>
                <select
                  value={settings.delivery_time_unit}
                  onChange={(e) => handleChange("delivery_time_unit", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="werkdagen">werkdagen (Ma - Vr)</option>
                  <option value="kalenderdagen">kalenderdagen</option>
                  <option value="dagen">dagen</option>
                  <option value="uren">uren (Express)</option>
                </select>
              </div>

              {/* Free Shipping Min Tyres */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Gratis verzending vanaf aantal banden
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.free_shipping_min_tyres}
                    onChange={(e) => handleChange("free_shipping_min_tyres", e.target.value)}
                    placeholder="2"
                    className="admin-code"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0d0f16",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
                    banden
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                  Standaard 2. Vanaf 2 banden is verzending altijd gratis.
                </span>
              </div>

              {/* Shipping Cost for 1 tyre */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Verzendkosten voor 1 band (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.shipping_cost}
                  onChange={(e) => handleChange("shipping_cost", e.target.value)}
                  placeholder="9.95"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                  Kosten voor thuislevering als de klant minder dan het minimum aantal banden bestelt.
                </span>
              </div>

              {/* Delivery Note */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Extra leveringsnotitie (onder verzendopties)
                </label>
                <input
                  type="text"
                  value={settings.delivery_note}
                  onChange={(e) => handleChange("delivery_note", e.target.value)}
                  placeholder="Bijv. Snelle levering in heel België & Nederland • Track & Trace via e-mail"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 2: WINKEL & MELDINGEN ─────────────── */}
        {(activeSection === "ALL" || activeSection === "SHOP") && (
          <div
            style={{
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Winkelstatus &amp; Aankondigingen
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
                  Beheer of klanten online kunnen bestellen en toon een aankondigingsbalk bovenaan de website.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Webshop Open Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "#0d0f16",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>
                      Webshop Bestellingen
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: isShopOpen ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: isShopOpen ? "#10b981" : "#ef4444",
                        border: `1px solid ${isShopOpen ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      }}
                    >
                      {isShopOpen ? "GEOPEND" : "GESLOTEN"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                    Wanneer gesloten kunnen klanten de catalogus bekijken, maar geen betalingen verrichten.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleChange("shop_open", isShopOpen ? "false" : "true")}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: isShopOpen ? "#10b981" : "#334155",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                  }}
                  title={isShopOpen ? "Klik om winkel tijdelijk te sluiten" : "Klik om winkel te openen"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: isShopOpen ? 26 : 3,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#ffffff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Announcement Banner Toggle & Input */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#0d0f16",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>
                        Aankondigingsbalk bovenaan de website
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: isBannerEnabled ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.08)",
                          color: isBannerEnabled ? "#38bdf8" : "rgba(255,255,255,0.5)",
                          border: `1px solid ${isBannerEnabled ? "rgba(56, 189, 248, 0.3)" : "rgba(255,255,255,0.12)"}`,
                        }}
                      >
                        {isBannerEnabled ? "ZICHTBAAR" : "VERBORGEN"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                      Toon een opvallende mededeling bovenaan alle pagina&apos;s (bijv. vakantie, actie of feestdagen).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isBannerEnabled;
                      handleChange("shop_banner_enabled", next ? "true" : "false");
                      if (next && !settings.shop_message) {
                        handleChange("shop_message", "Wegens drukte kunnen levertijden licht afwijken. Werkplaats normaal geopend!");
                      }
                    }}
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      background: isBannerEnabled ? "#016eb9" : "#334155",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s ease",
                    }}
                    title={isBannerEnabled ? "Verberg aankondiging" : "Toon aankondiging"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: isBannerEnabled ? 26 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                </div>

                <input
                  type="text"
                  value={settings.shop_message}
                  onChange={(e) => handleChange("shop_message", e.target.value)}
                  placeholder="Bijv. Wegens inventarisatie worden bestellingen vanaf maandag verzonden. Werkplaats blijft normaal geopend!"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#161924",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />

                {isBannerEnabled && (
                  <div style={{ marginTop: 12 }}>
                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, color: "#38bdf8", fontWeight: 800 }}>
                      Live Preview van de Balk op de Website:
                    </span>
                    <div
                      style={{
                        marginTop: 6,
                        background: "linear-gradient(90deg, #016eb9 0%, #0284c7 100%)",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        padding: "9px 16px",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {settings.shop_message || "Welkom bij Gent Bandenservice BV • Snelle service & vakkundige montage"}
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                        ✕ Sluiten
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: FACTURATIE & BANK ──────────────── */}
        {(activeSection === "ALL" || activeSection === "INVOICE") && (
          <div
            style={{
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Facturatie &amp; Bankgegevens
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
                  Gegevens die automatisch worden vermeld op PDF-facturen, online factuurweergaven en SEPA QR-codes.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {/* IBAN */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Bankrekening IBAN
                </label>
                <input
                  type="text"
                  value={settings.company_iban}
                  onChange={(e) => handleChange("company_iban", e.target.value)}
                  placeholder="BE54 7310 7753 4697"
                  className="admin-code"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#38bdf8",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* BIC */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  value={settings.company_bic}
                  onChange={(e) => handleChange("company_bic", e.target.value)}
                  placeholder="KREDBEBB"
                  className="admin-code"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Bank Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Bankinstelling
                </label>
                <input
                  type="text"
                  value={settings.invoice_bank_name}
                  onChange={(e) => handleChange("invoice_bank_name", e.target.value)}
                  placeholder="KBC Bank"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Payment Days */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Standaard betalingstermijn (dagen)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.invoice_payment_days}
                  onChange={(e) => handleChange("invoice_payment_days", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* VAT Rate */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Standaard BTW-tarief (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.vat_rate}
                  onChange={(e) => handleChange("vat_rate", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Invoice Footer Note */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Standaard opmerking / betaalinstructies onderaan factuur
                </label>
                <textarea
                  rows={2}
                  value={settings.invoice_footer_note}
                  onChange={(e) => handleChange("invoice_footer_note", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 4: BEDRIJFSGEGEVENS ───────────────── */}
        {(activeSection === "ALL" || activeSection === "COMPANY") && (
          <div
            style={{
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(168, 85, 247, 0.12)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  Bedrijfs- &amp; Contactgegevens
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
                  Officiële bedrijfsgegevens getoond op de website, in e-mails en op facturen.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {/* Company Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Company VAT */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  BTW / Ondernemingsnummer
                </label>
                <input
                  type="text"
                  value={settings.company_vat}
                  onChange={(e) => handleChange("company_vat", e.target.value)}
                  placeholder="BE 1010.428.169"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Telefoonnummer / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Address */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Adres / Locatie
                </label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={(e) => handleChange("contact_address", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {/* Opening Hours */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                  Openingsuren
                </label>
                <input
                  type="text"
                  value={settings.opening_hours}
                  onChange={(e) => handleChange("opening_hours", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0d0f16",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM SAVE BAR ────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#161924",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "16px 24px",
            position: "sticky",
            bottom: 20,
            zIndex: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Alle instellingen worden direct actief op de website en in de database.
            </span>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 24px" }}
          >
            {saving ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Bezig met opslaan...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Instellingen Opslaan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
