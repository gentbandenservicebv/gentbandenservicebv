"use client";

import React, { useState, useEffect } from "react";
import { SiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/settings-types";
import { getMontagePriceForTyre, extractTyreDiameter } from "@/lib/montage";

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"ALL" | "DELIVERY" | "MONTAGE" | "SHOP" | "INVOICE" | "COMPANY">("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live calculator state
  const [calcSize, setCalcSize] = useState("205/55 R16");
  const [calcRunflat, setCalcRunflat] = useState(false);
  const [calcQty, setCalcQty] = useState(4);

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
    <div className="admin-settings-container">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="admin-settings-header">
        <div className="admin-settings-header__lead">
          <div className="admin-settings-header__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
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

        <div className="admin-settings-header__actions">
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
      <div className="admin-settings-nav">
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
            id: "MONTAGE",
            label: "Montage Tarieven",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
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
            className={`admin-settings-nav-btn ${activeSection === sec.id ? "admin-settings-nav-btn--active" : ""}`}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* ── SECTION 1: LEVERING & VERZENDING ───────────── */}
        {(activeSection === "ALL" || activeSection === "DELIVERY") && (
          <div className="admin-settings-card">
            {/* Section Title */}
            <div className="admin-settings-card__header">
              <div className="admin-settings-card__icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <h2 className="admin-settings-card__title">
                  Levertijd &amp; Verzending
                </h2>
                <p className="admin-settings-card__sub">
                  Beheer de levertijd die getoond wordt op productpagina&apos;s, bij afrekenen en in bestelbevestigingen.
                </p>
              </div>
            </div>

            {/* Live Customer Preview Banner */}
            <div className="admin-settings-preview">
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, color: "#38bdf8", fontWeight: 800 }}>
                  Live Klantpreview op de Website
                </span>
                <div className="admin-settings-preview__pills">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", padding: "4px 10px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", flexShrink: 0 }} />
                    {settings.in_stock_text || "Op voorraad"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa", padding: "4px 10px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", flexShrink: 0 }} />
                    Levering binnen {minDays}–{maxDays} {unit}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                    • Gratis verzending vanaf {settings.free_shipping_min_tyres || "2"} banden (1 band: €{Number(settings.shipping_cost || 9.95).toFixed(2)})
                  </span>
                </div>
              </div>

              {settings.delivery_note && (
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic", wordBreak: "break-word" }}>
                  &ldquo;{settings.delivery_note}&rdquo;
                </div>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="admin-settings-grid">
              {/* In Stock Label */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Tekst bij voorraad (in voorraad badge)
                </label>
                <input
                  type="text"
                  value={settings.in_stock_text}
                  onChange={(e) => handleChange("in_stock_text", e.target.value)}
                  placeholder="Bijv. Op voorraad of Direct leverbaar"
                  className="admin-settings-input"
                />
                <span className="admin-settings-hint">
                  Wordt getoond op bandenkaarten en productpagina&apos;s als stock &gt; 0 is.
                </span>
              </div>

              {/* Min Days */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Minimale levertijd
                </label>
                <div className="admin-settings-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.delivery_time_min}
                    onChange={(e) => handleChange("delivery_time_min", e.target.value)}
                    className="admin-code admin-settings-input"
                  />
                  <span>dagen</span>
                </div>
              </div>

              {/* Max Days */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Maximale levertijd
                </label>
                <div className="admin-settings-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.delivery_time_max}
                    onChange={(e) => handleChange("delivery_time_max", e.target.value)}
                    className="admin-code admin-settings-input"
                  />
                  <span>dagen</span>
                </div>
              </div>

              {/* Unit Dropdown */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Tijdseenheid
                </label>
                <select
                  value={settings.delivery_time_unit}
                  onChange={(e) => handleChange("delivery_time_unit", e.target.value)}
                  className="admin-settings-input"
                >
                  <option value="werkdagen">werkdagen (Ma - Vr)</option>
                  <option value="kalenderdagen">kalenderdagen</option>
                  <option value="dagen">dagen</option>
                  <option value="uren">uren (Express)</option>
                </select>
              </div>

              {/* Free Shipping Min Tyres */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Gratis verzending vanaf aantal banden
                </label>
                <div className="admin-settings-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.free_shipping_min_tyres}
                    onChange={(e) => handleChange("free_shipping_min_tyres", e.target.value)}
                    placeholder="2"
                    className="admin-code admin-settings-input"
                  />
                  <span>banden</span>
                </div>
                <span className="admin-settings-hint">
                  Standaard 2. Vanaf 2 banden is verzending altijd gratis.
                </span>
              </div>

              {/* Shipping Cost for 1 tyre */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Verzendkosten voor 1 band (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.shipping_cost}
                  onChange={(e) => handleChange("shipping_cost", e.target.value)}
                  placeholder="9.95"
                  className="admin-settings-input"
                />
                <span className="admin-settings-hint">
                  Kosten voor thuislevering als de klant minder dan het minimum aantal banden bestelt.
                </span>
              </div>

              {/* Delivery Note */}
              <div className="admin-settings-field admin-settings-field--full">
                <label className="admin-settings-label">
                  Extra leveringsnotitie (onder verzendopties)
                </label>
                <input
                  type="text"
                  value={settings.delivery_note}
                  onChange={(e) => handleChange("delivery_note", e.target.value)}
                  placeholder="Bijv. Snelle levering in heel België & Nederland • Track & Trace via e-mail"
                  className="admin-settings-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: MONTAGE TARIEVEN PER BANDENMAAT ───── */}
        {(activeSection === "ALL" || activeSection === "MONTAGE") && (
          <div className="admin-settings-card">
            {/* Header */}
            <div className="admin-settings-card__header">
              <div className="admin-settings-card__icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                  <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                  <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                  <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h2 className="admin-settings-card__title">
                      Montage Tarieven per Bandenmaat
                    </h2>
                    <p className="admin-settings-card__sub">
                      Stel montagetarieven (inclusief balanceren &amp; nieuw ventiel) in per velgmaat (inch) en eventuele runflat-toeslag.
                    </p>
                  </div>
                  {/* Preset Quick Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--outline"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          montage_price_13_15: "17.50",
                          montage_price_16: "19.99",
                          montage_price_17: "21.50",
                          montage_price_18: "22.50",
                          montage_price_19: "25.00",
                          montage_price_20: "27.50",
                          montage_price_21: "30.00",
                          montage_price_22_plus: "35.00",
                          montage_default_price: "19.99",
                          montage_runflat_surcharge: "0.00",
                        }));
                      }}
                      title="Herstel aanbevolen gestaffelde tarieven per inchmaat"
                      style={{ fontSize: "0.78rem" }}
                    >
                      ⚡ Staffel toepassen
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--outline"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          montage_price_13_15: "19.99",
                          montage_price_16: "19.99",
                          montage_price_17: "19.99",
                          montage_price_18: "19.99",
                          montage_price_19: "19.99",
                          montage_price_20: "19.99",
                          montage_price_21: "19.99",
                          montage_price_22_plus: "19.99",
                          montage_default_price: "19.99",
                        }));
                      }}
                      title="Zet alle maten op een vaste prijs van €19.99"
                      style={{ fontSize: "0.78rem" }}
                    >
                      €19.99 voor alle maten
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Visual Overview of Current Rates */}
            <div className="admin-settings-preview" style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.2)" }}>
              <div style={{ width: "100%" }}>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, color: "#f59e0b", fontWeight: 800 }}>
                  Actieve Montage Staffels (per band incl. balanceren &amp; ventiel)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {[
                    { label: "13\"–15\"", price: settings.montage_price_13_15 },
                    { label: "16\"", price: settings.montage_price_16 },
                    { label: "17\"", price: settings.montage_price_17 },
                    { label: "18\"", price: settings.montage_price_18 },
                    { label: "19\"", price: settings.montage_price_19 },
                    { label: "20\"", price: settings.montage_price_20 },
                    { label: "21\"", price: settings.montage_price_21 },
                    { label: "22\"+", price: settings.montage_price_22_plus },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: "0.85rem" }}>{tier.label}:</span>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>€{parseFloat(tier.price || "19.99").toFixed(2)}</span>
                    </div>
                  ))}
                  {parseFloat(settings.montage_runflat_surcharge || "0") > 0 && (
                    <div
                      style={{
                        padding: "6px 12px",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: 8,
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#f87171",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      Runflat: +€{parseFloat(settings.montage_runflat_surcharge).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Inputs Grid */}
            <div className="admin-settings-grid">
              {/* 13-15 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  13&quot; – 15&quot; inch (bijv. 175/65 R14, 195/65 R15)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_13_15}
                    onChange={(e) => handleChange("montage_price_13_15", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Kleine maten (stadsauto&apos;s en compacte wagens).</span>
              </div>

              {/* 16 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  16&quot; inch (bijv. 205/55 R16, 215/60 R16)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_16}
                    onChange={(e) => handleChange("montage_price_16", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Meest voorkomende standaard personenwagenmaat.</span>
              </div>

              {/* 17 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  17&quot; inch (bijv. 225/45 R17, 215/55 R17)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_17}
                    onChange={(e) => handleChange("montage_price_17", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Middenklasse en lichte sportieve maten.</span>
              </div>

              {/* 18 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  18&quot; inch (bijv. 225/40 R18, 245/45 R18)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_18}
                    onChange={(e) => handleChange("montage_price_18", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Populaire sportmaat en lichte SUV&apos;s.</span>
              </div>

              {/* 19 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  19&quot; inch (bijv. 235/35 R19, 255/35 R19)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_19}
                    onChange={(e) => handleChange("montage_price_19", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Grote sportvelgen en lage profielen.</span>
              </div>

              {/* 20 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  20&quot; inch (bijv. 255/40 R20, 275/35 R20)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_20}
                    onChange={(e) => handleChange("montage_price_20", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Grote SUV&apos;s, Tesla Model X/Y en luxe sedans.</span>
              </div>

              {/* 21 Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  21&quot; inch (bijv. 275/40 R21, 295/35 R21)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_21}
                    onChange={(e) => handleChange("montage_price_21", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Extra grote premium en performance wielen.</span>
              </div>

              {/* 22+ Inch */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  22&quot; inch en groter (bijv. 285/35 R22, 23&quot;, 24&quot;)
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_price_22_plus}
                    onChange={(e) => handleChange("montage_price_22_plus", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Maximale bandenmaten (zware montage machines vereist).</span>
              </div>

              {/* Runflat Toeslag */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Runflat toeslag per band
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">+€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_runflat_surcharge}
                    onChange={(e) => handleChange("montage_runflat_surcharge", e.target.value)}
                    placeholder="0.00"
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Extra toeslag per band indien de band Runflat (RFT/ROF/SSR) is (0 = geen toeslag).</span>
              </div>

              {/* Default / Fallback Price */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Standaard / Fallback montageprijs
                </label>
                <div className="admin-settings-input-wrap">
                  <span className="admin-settings-prefix">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.montage_default_price}
                    onChange={(e) => handleChange("montage_default_price", e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
                <span className="admin-settings-hint">Wordt gebruikt als de bandenmaat onbekend of niet herkenbaar is.</span>
              </div>
            </div>

            {/* Interactive Live Calculator / Tester */}
            <div style={{ marginTop: 24, padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(245, 158, 11, 0.3)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: "1rem" }}>🧮</span>
                <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f59e0b" }}>
                  Live Tarief Calculator (Test een bandenmaat)
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 4 }}>
                    Test bandenmaat
                  </label>
                  <input
                    type="text"
                    value={calcSize}
                    onChange={(e) => setCalcSize(e.target.value)}
                    placeholder="Bijv. 225/45 R17"
                    className="admin-settings-input"
                    style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                  />
                </div>
                <div style={{ flex: "0 0 110px" }}>
                  <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 4 }}>
                    Aantal banden
                  </label>
                  <select
                    value={calcQty}
                    onChange={(e) => setCalcQty(parseInt(e.target.value, 10))}
                    className="admin-settings-input"
                    style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                  >
                    <option value={1}>1 band</option>
                    <option value={2}>2 banden</option>
                    <option value={4}>4 banden</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer", color: "rgba(255,255,255,0.8)" }}>
                    <input
                      type="checkbox"
                      checked={calcRunflat}
                      onChange={(e) => setCalcRunflat(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#f59e0b" }}
                    />
                    Runflat band
                  </label>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 160 }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Berekende Montageprijs
                  </span>
                  {(() => {
                    const unitP = getMontagePriceForTyre(
                      { size: calcSize, runflat: calcRunflat },
                      settings
                    );
                    const totalP = (unitP * calcQty).toFixed(2);
                    const d = extractTyreDiameter(calcSize);
                    return (
                      <div>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>
                          €{totalP}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", display: "block" }}>
                          ({calcQty}× €{unitP.toFixed(2)} / band · {d ? `${d} inch` : "standaard"})
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 2: WINKEL & MELDINGEN ─────────────── */}
        {(activeSection === "ALL" || activeSection === "SHOP") && (
          <div className="admin-settings-card">
            {/* Section Title */}
            <div className="admin-settings-card__header">
              <div className="admin-settings-card__icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h2 className="admin-settings-card__title">
                  Winkelstatus &amp; Aankondigingen
                </h2>
                <p className="admin-settings-card__sub">
                  Beheer of klanten online kunnen bestellen en toon een aankondigingsbalk bovenaan de website.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Webshop Open Toggle */}
              <div className="admin-settings-toggle-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                  className="admin-settings-toggle-btn"
                  style={{
                    background: isShopOpen ? "#10b981" : "#334155",
                  }}
                  title={isShopOpen ? "Klik om winkel tijdelijk te sluiten" : "Klik om winkel te openen"}
                  aria-label={isShopOpen ? "Sluit webshop" : "Open webshop"}
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
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                    className="admin-settings-toggle-btn"
                    style={{
                      background: isBannerEnabled ? "#016eb9" : "#334155",
                    }}
                    title={isBannerEnabled ? "Verberg aankondiging" : "Toon aankondiging"}
                    aria-label={isBannerEnabled ? "Verberg aankondiging" : "Toon aankondiging"}
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
                  className="admin-settings-input"
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
                        flexWrap: "wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{settings.shop_message || "Welkom bij Gent Bandenservice BV • Snelle service & vakkundige montage"}</span>
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 4, fontSize: 12, flexShrink: 0 }}>
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
          <div className="admin-settings-card">
            {/* Section Title */}
            <div className="admin-settings-card__header">
              <div className="admin-settings-card__icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="admin-settings-card__title">
                  Facturatie &amp; Bankgegevens
                </h2>
                <p className="admin-settings-card__sub">
                  Gegevens die automatisch worden vermeld op PDF-facturen, online factuurweergaven en SEPA QR-codes.
                </p>
              </div>
            </div>

            <div className="admin-settings-grid">
              {/* IBAN */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Bankrekening IBAN
                </label>
                <input
                  type="text"
                  value={settings.company_iban}
                  onChange={(e) => handleChange("company_iban", e.target.value)}
                  placeholder="BE54 7310 7753 4697"
                  className="admin-code admin-settings-input"
                  style={{ color: "#38bdf8", fontWeight: 700 }}
                />
              </div>

              {/* BIC */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  value={settings.company_bic}
                  onChange={(e) => handleChange("company_bic", e.target.value)}
                  placeholder="KREDBEBB"
                  className="admin-code admin-settings-input"
                />
              </div>

              {/* Bank Name */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Bankinstelling
                </label>
                <input
                  type="text"
                  value={settings.invoice_bank_name}
                  onChange={(e) => handleChange("invoice_bank_name", e.target.value)}
                  placeholder="KBC Bank"
                  className="admin-settings-input"
                />
              </div>

              {/* Payment Days */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Standaard betalingstermijn (dagen)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.invoice_payment_days}
                  onChange={(e) => handleChange("invoice_payment_days", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* VAT Rate */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Standaard BTW-tarief (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.vat_rate}
                  onChange={(e) => handleChange("vat_rate", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* Invoice Footer Note */}
              <div className="admin-settings-field admin-settings-field--full">
                <label className="admin-settings-label">
                  Standaard opmerking / betaalinstructies onderaan factuur
                </label>
                <textarea
                  rows={2}
                  value={settings.invoice_footer_note}
                  onChange={(e) => handleChange("invoice_footer_note", e.target.value)}
                  className="admin-settings-input"
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 4: BEDRIJFSGEGEVENS ───────────────── */}
        {(activeSection === "ALL" || activeSection === "COMPANY") && (
          <div className="admin-settings-card">
            {/* Section Title */}
            <div className="admin-settings-card__header">
              <div className="admin-settings-card__icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="admin-settings-card__title">
                  Bedrijfs- &amp; Contactgegevens
                </h2>
                <p className="admin-settings-card__sub">
                  Officiële bedrijfsgegevens getoond op de website, in e-mails en op facturen.
                </p>
              </div>
            </div>

            <div className="admin-settings-grid">
              {/* Company Name */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* Company VAT */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  BTW / Ondernemingsnummer
                </label>
                <input
                  type="text"
                  value={settings.company_vat}
                  onChange={(e) => handleChange("company_vat", e.target.value)}
                  placeholder="BE 1010.428.169"
                  className="admin-settings-input"
                />
              </div>

              {/* Email */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* Phone */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Telefoonnummer / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* Address */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Adres / Locatie
                </label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={(e) => handleChange("contact_address", e.target.value)}
                  className="admin-settings-input"
                />
              </div>

              {/* Opening Hours */}
              <div className="admin-settings-field">
                <label className="admin-settings-label">
                  Openingsuren
                </label>
                <input
                  type="text"
                  value={settings.opening_hours}
                  onChange={(e) => handleChange("opening_hours", e.target.value)}
                  className="admin-settings-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM SAVE BAR ────────────────────────────── */}
        <div className="admin-settings-save-bar">
          <div className="admin-settings-save-bar__note">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", flexShrink: 0 }} />
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
