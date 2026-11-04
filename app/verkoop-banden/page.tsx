"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compression";
import "./verkoop-banden.css";

const SEASON_OPTIONS = [
  { value: "SUMMER", label: "Zomerbanden" },
  { value: "WINTER", label: "Winterbanden" },
  { value: "ALL_SEASON", label: "All-season (4 seizoenen)" },
];

type Step = "form" | "success";

interface FormData {
  name: string;
  email: string;
  phone: string;
  brand: string;
  model: string;
  size: string;
  season: string;
  quantity: string;
  treadDepth: string;
  dotYear: string;
  condition: string;
  extraNotes: string;
}

const INITIAL: FormData = {
  name: "",
  email: "",
  phone: "",
  brand: "",
  model: "",
  size: "",
  season: "",
  quantity: "4",
  treadDepth: "",
  dotYear: "",
  condition: "",
  extraNotes: "",
};

export default function VerkoopBandenPage() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormData>(INITIAL);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("secondhandPhotos", {
    onClientUploadComplete: (res) => {
      setUploadError(null);
      if (res && res.length > 0) {
        const newUrls = res.map((f) => f.ufsUrl || f.url);
        setPhotos((prev) => [...prev, ...newUrls].slice(0, 8));
      }
    },
    onUploadError: (err) => {
      console.error("[Upload] Error:", err);
      setUploadError(err.message || "Uploaden mislukt. Probeer het opnieuw.");
    },
  });

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Check remaining quota (max 8)
    const remaining = 8 - photos.length;
    if (remaining <= 0) {
      setUploadError("U kunt maximaal 8 foto's uploaden.");
      return;
    }
    
    const filesToUpload = selectedFiles.slice(0, remaining);
    compressImages(filesToUpload).then(({ files: compressed }) => {
      startUpload(compressed);
    }).catch(() => {
      startUpload(filesToUpload);
    });
    // Reset file input so user can choose more files later
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    
    if (droppedFiles.length === 0) {
      setUploadError("Selecteer enkel afbeeldingsbestanden (JPG, PNG, WebP).");
      return;
    }

    const remaining = 8 - photos.length;
    if (remaining <= 0) {
      setUploadError("U kunt maximaal 8 foto's uploaden.");
      return;
    }

    const filesToUpload = droppedFiles.slice(0, remaining);
    compressImages(filesToUpload).then(({ files: compressed }) => {
      startUpload(compressed);
    }).catch(() => {
      startUpload(filesToUpload);
    });
  }

  function removePhoto(indexToRemove: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/secondhand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity) || 4,
          treadDepth: form.treadDepth ? Number(form.treadDepth) : undefined,
          photos: photos.length > 0 ? JSON.stringify(photos) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Er is een fout opgetreden.");
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <div className="vb-hero">
        <div className="vb-hero__inner">
          <nav className="vb-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </Link>
            <span className="vb-breadcrumb__sep">›</span>
            <span>Tweedehands banden verkopen</span>
          </nav>

          <div className="vb-hero__badge">
            <span className="vb-hero__badge-dot" />
            Tweedehands inkoop
          </div>

          <h1 className="vb-hero__title">
            Verkoop uw tweedehands banden
            <br />
            <span className="vb-hero__title-accent">Wij kopen ze direct in</span>
          </h1>

          <p className="vb-hero__sub">
            Heeft u tweedehands banden die nog in goede staat zijn? Vul onderstaand formulier in met eventuele foto&apos;s. U ontvangt snel een eerlijk en vrijblijvend bod.
          </p>

          <div className="vb-hero__trust">
            <div className="vb-hero__trust-item">
              <span className="vb-hero__trust-icon">⚡</span>
              Reactie binnen 1–2 werkdagen
            </div>
            <div className="vb-hero__trust-item">
              <span className="vb-hero__trust-icon">💶</span>
              Eerlijk & marktconform bod
            </div>
            <div className="vb-hero__trust-item">
              <span className="vb-hero__trust-icon">🛡️</span>
              100% Vrijblijvend
            </div>
            <div className="vb-hero__trust-item">
              <span className="vb-hero__trust-icon">📍</span>
              Directe uitbetaling in Gent
            </div>
          </div>
        </div>

        {/* Steps strip */}
        <div className="vb-hero__steps">
          <div className="vb-hero__step">
            <div className="vb-hero__step-num">1</div>
            <div className="vb-hero__step-body">
              <strong>Formulier & foto&apos;s invullen</strong>
              <p>Beschrijf uw banden en voeg foto&apos;s toe</p>
            </div>
          </div>
          <div className="vb-hero__step-arrow">→</div>
          <div className="vb-hero__step">
            <div className="vb-hero__step-num">2</div>
            <div className="vb-hero__step-body">
              <strong>Onze expert beoordeelt</strong>
              <p>Wij controleren merk, profiel en conditie</p>
            </div>
          </div>
          <div className="vb-hero__step-arrow">→</div>
          <div className="vb-hero__step">
            <div className="vb-hero__step-num">3</div>
            <div className="vb-hero__step-body">
              <strong>U ontvangt ons bod</strong>
              <p>Per e-mail binnen 1–2 werkdagen</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <section className="vb-section">
        <div className="vb-container">
          {step === "success" ? (
            <div className="vb-success">
              <div className="vb-success__icon">✓</div>
              <h2 className="vb-success__title">Aanvraag succesvol ontvangen!</h2>
              <p className="vb-success__text">
                Bedankt, <strong>{form.name}</strong>. Wij hebben uw aanvraag voor{" "}
                <strong>
                  {form.quantity}× {form.brand} {form.model ? form.model + " " : ""}({form.size})
                </strong>{" "}
                goed ontvangen.
              </p>
              {photos.length > 0 && (
                <p className="vb-success__text" style={{ color: "#016eb9", fontWeight: 600 }}>
                  📸 {photos.length} foto{photos.length > 1 ? "&apos;s" : ""} succesvol meegestuurd
                </p>
              )}
              <p className="vb-success__text">
                U ontvangt een automatische bevestiging op{" "}
                <strong>{form.email}</strong>
                {form.phone ? ` en wij nemen eventueel telefonisch contact op via ${form.phone}` : ""}.
              </p>
              <div className="vb-success__note">
                ⏱ Geschatte reactietijd: binnen <strong>1–2 werkdagen</strong>
              </div>
              <div className="vb-success__actions">
                <button
                  className="vb-btn vb-btn--primary"
                  onClick={() => {
                    setForm(INITIAL);
                    setPhotos([]);
                    setStep("form");
                  }}
                >
                  Nieuwe aanvraag indienen
                </button>
                <Link href="/banden" className="vb-btn vb-btn--ghost">
                  Bekijk ons assortiment
                </Link>
              </div>
            </div>
          ) : (
            <div className="vb-layout">
              {/* ── Form ── */}
              <form className="vb-form" onSubmit={handleSubmit} noValidate>
                <div className="vb-form__header">
                  <h2 className="vb-form__title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#016eb9" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                    </svg>
                    Aanvraagformulier Tweedehands Banden
                  </h2>
                  <p className="vb-form__sub">
                    Vul de gegevens zo nauwkeurig mogelijk in. Hoe meer details en foto&apos;s u bezorgt, hoe sneller en beter wij u een passend bod kunnen doen.
                  </p>
                </div>

                {/* Section 01 — Contact */}
                <div className="vb-form-section">
                  <div className="vb-section-title-wrap">
                    <span className="vb-section-num">01</span>
                    <h3 className="vb-section-title">
                      Uw Contactgegevens
                      <span className="vb-section-subtitle">— Waar kunnen wij ons bod bezorgen?</span>
                    </h3>
                  </div>

                  <div className="vb-grid vb-grid--2">
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-name">
                        <span>Naam <span className="vb-required">*</span></span>
                      </label>
                      <input
                        id="vb-name"
                        className="vb-input"
                        type="text"
                        placeholder="bijv. Jan Janssen"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                      />
                    </div>
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-email">
                        <span>E-mailadres <span className="vb-required">*</span></span>
                      </label>
                      <input
                        id="vb-email"
                        className="vb-input"
                        type="email"
                        placeholder="bijv. jan@voorbeeld.be"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="vb-field" style={{ marginTop: 20 }}>
                    <label className="vb-label" htmlFor="vb-phone">
                      <span>Telefoonnummer <span className="vb-optional">(optioneel voor snelle opvolging)</span></span>
                    </label>
                    <input
                      id="vb-phone"
                      className="vb-input"
                      type="tel"
                      placeholder="+32 478 12 34 56"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 02 — Tyre details */}
                <div className="vb-form-section">
                  <div className="vb-section-title-wrap">
                    <span className="vb-section-num">02</span>
                    <h3 className="vb-section-title">
                      Bandengegevens
                      <span className="vb-section-subtitle">— Specificaties van uw banden</span>
                    </h3>
                  </div>

                  <div className="vb-grid vb-grid--2">
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-brand">
                        <span>Merk <span className="vb-required">*</span></span>
                      </label>
                      <input
                        id="vb-brand"
                        className="vb-input"
                        type="text"
                        placeholder="bijv. Michelin, Continental, Goodyear…"
                        required
                        value={form.brand}
                        onChange={(e) => set("brand", e.target.value)}
                      />
                    </div>
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-model">
                        <span>Model / Profielnaam <span className="vb-optional">(optioneel)</span></span>
                      </label>
                      <input
                        id="vb-model"
                        className="vb-input"
                        type="text"
                        placeholder="bijv. Pilot Sport 4, Primacy 4"
                        value={form.model}
                        onChange={(e) => set("model", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="vb-grid vb-grid--3" style={{ marginTop: 20 }}>
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-size">
                        <span>Bandenmaat <span className="vb-required">*</span></span>
                      </label>
                      <input
                        id="vb-size"
                        className="vb-input"
                        type="text"
                        placeholder="bijv. 205/55 R16"
                        required
                        value={form.size}
                        onChange={(e) => set("size", e.target.value)}
                      />
                      <span className="vb-hint">Staat afgedrukt op de zijkant van de band</span>
                    </div>

                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-season">
                        <span>Seizoen</span>
                      </label>
                      <select
                        id="vb-season"
                        className="vb-input vb-select"
                        value={form.season}
                        onChange={(e) => set("season", e.target.value)}
                      >
                        <option value="">Kies type seizoen…</option>
                        {SEASON_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-qty">
                        <span>Aantal stuks</span>
                      </label>
                      <select
                        id="vb-qty"
                        className="vb-input vb-select"
                        value={form.quantity}
                        onChange={(e) => set("quantity", e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={String(n)}>
                            {n} {n === 1 ? "band (1 stuk)" : `banden (${n} stuks)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 03 — Condition */}
                <div className="vb-form-section">
                  <div className="vb-section-title-wrap">
                    <span className="vb-section-num">03</span>
                    <h3 className="vb-section-title">
                      Staat & Profiel
                      <span className="vb-section-subtitle">— Hoe ziet de slijtage eruit?</span>
                    </h3>
                  </div>

                  <div className="vb-grid vb-grid--2">
                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-tread">
                        <span>Restprofiel (mm) <span className="vb-optional">(geschat)</span></span>
                      </label>
                      <input
                        id="vb-tread"
                        className="vb-input"
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        placeholder="bijv. 6.0"
                        value={form.treadDepth}
                        onChange={(e) => set("treadDepth", e.target.value)}
                      />
                      <span className="vb-hint">Nieuw is ~8mm, wettelijk minimum is 1.6mm</span>
                    </div>

                    <div className="vb-field">
                      <label className="vb-label" htmlFor="vb-dot">
                        <span>DOT-jaar (productiejaar) <span className="vb-optional">(optioneel)</span></span>
                      </label>
                      <input
                        id="vb-dot"
                        className="vb-input"
                        type="text"
                        placeholder="bijv. 2022 of 2023"
                        maxLength={4}
                        value={form.dotYear}
                        onChange={(e) => set("dotYear", e.target.value)}
                      />
                      <span className="vb-hint">4 cijfers in het ovale kader op de wang</span>
                    </div>
                  </div>

                  <div className="vb-field" style={{ marginTop: 20 }}>
                    <label className="vb-label" htmlFor="vb-condition">
                      <span>Algemene staat van de banden</span>
                    </label>
                    <select
                      id="vb-condition"
                      className="vb-input vb-select"
                      value={form.condition}
                      onChange={(e) => set("condition", e.target.value)}
                    >
                      <option value="">Kies de algemene toestand…</option>
                      <option value="Zo goed als nieuw (≥ 7 mm profiel, nauwelijks gereden)">
                        Zo goed als nieuw (≥ 7 mm profiel, nauwelijks gereden)
                      </option>
                      <option value="Zeer goede staat (5 – 7 mm profiel, gelijkmatige slijtage)">
                        Zeer goede staat (5 – 7 mm profiel, gelijkmatige slijtage)
                      </option>
                      <option value="Goede gebruikte staat (3 – 5 mm profiel)">
                        Goede gebruikte staat (3 – 5 mm profiel)
                      </option>
                      <option value="Matige staat (2 – 3 mm profiel, nadert vervanging)">
                        Matige staat (2 – 3 mm profiel, nadert vervanging)
                      </option>
                      <option value="Kleine beschadiging / lek / zijwandschade (vermeld in opmerkingen)">
                        Kleine beschadiging / lek / zijwandschade (vermeld in opmerkingen)
                      </option>
                    </select>
                  </div>

                  <div className="vb-field" style={{ marginTop: 20 }}>
                    <label className="vb-label" htmlFor="vb-notes">
                      <span>Extra opmerkingen of bijzonderheden</span>
                    </label>
                    <textarea
                      id="vb-notes"
                      className="vb-input vb-textarea"
                      placeholder="Bijvoorbeeld: inclusief velgen of enkel banden, gelijkmatige slijtage, merk auto waar ze onder zaten…"
                      rows={3}
                      value={form.extraNotes}
                      onChange={(e) => set("extraNotes", e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 04 — Photo Upload */}
                <div className="vb-form-section">
                  <div className="vb-section-title-wrap">
                    <span className="vb-section-num">04</span>
                    <h3 className="vb-section-title">
                      Foto&apos;s van de banden
                      <span className="vb-section-subtitle">— Aanbevolen voor het beste bod</span>
                    </h3>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />

                  <div
                    className={`vb-dropzone${isDragOver ? " vb-dropzone--drag" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div className="vb-dropzone__inner">
                      <div className="vb-dropzone__icon-wrap">
                        {isUploading ? (
                          <span className="vb-spinner" style={{ borderColor: "rgba(1,110,185,0.2)", borderTopColor: "#016eb9" }} />
                        ) : (
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="vb-dropzone__title">
                          {isUploading ? (
                            "Foto's worden geüpload…"
                          ) : (
                            <>
                              <span className="vb-dropzone__link">Klik om foto&apos;s te kiezen</span> of sleep ze hierheen
                            </>
                          )}
                        </p>
                        <p className="vb-dropzone__hint">
                          Tip: Neem duidelijke foto&apos;s van het loopvlak, het profiel en de merktekst op de zijkant.
                        </p>
                      </div>
                      <div className="vb-dropzone__formats">
                        JPG, PNG of WebP · Max. 8MB per foto · Max. 8 foto&apos;s ({photos.length}/8)
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="vb-error" style={{ marginTop: 14 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {uploadError}
                    </div>
                  )}

                  {/* Photo Preview Grid */}
                  {photos.length > 0 && (
                    <div className="vb-photo-grid">
                      {photos.map((url, idx) => (
                        <div key={idx} className="vb-photo-item">
                          <Image
                            src={url}
                            alt={`Band foto ${idx + 1}`}
                            width={140}
                            height={140}
                            className="vb-photo-img"
                            unoptimized
                          />
                          <button
                            type="button"
                            className="vb-photo-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(idx);
                            }}
                            title="Foto verwijderen"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {isUploading && (
                        <div className="vb-photo-item vb-photo-item--uploading">
                          <span className="vb-spinner" style={{ borderColor: "rgba(1,110,185,0.2)", borderTopColor: "#016eb9" }} />
                          <span>Uploaden…</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="vb-form__footer">
                  {error && (
                    <div className="vb-error" role="alert">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="vb-btn vb-btn--primary vb-btn--full"
                    disabled={loading || isUploading}
                  >
                    {loading ? (
                      <>
                        <span className="vb-spinner" />
                        Aanvraag wordt verzonden…
                      </>
                    ) : isUploading ? (
                      <>
                        <span className="vb-spinner" />
                        Foto&apos;s uploaden even geduld…
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Aanvraag en foto&apos;s verzenden
                      </>
                    )}
                  </button>

                  <p className="vb-form__privacy">
                    Uw contactgegevens worden uitsluitend gebruikt om uw inkoopaanvraag te verwerken.
                    Wij delen uw gegevens nooit met derden.{" "}
                    <Link href="/privacy">Privacybeleid</Link>
                  </p>
                </div>
              </form>

              {/* ── Sidebar ── */}
              <aside className="vb-aside">
                {/* What we buy */}
                <div className="vb-aside__card vb-aside__card--highlight">
                  <div className="vb-aside__header">
                    <div className="vb-aside__icon-wrap">🛞</div>
                    <h3 className="vb-aside__title">Welke banden kopen wij in?</h3>
                  </div>
                  <ul className="vb-aside__list">
                    {[
                      "Tweedehands banden in goede staat",
                      "Minimum restprofiel van 2,5 mm",
                      "Geen zijwandschade, scheuren of beulen",
                      "Maximale leeftijd ±8 jaar (DOT-code)",
                      "Alle A- en B-merken zijn welkom",
                      "Zomer-, winter- en all-season banden",
                    ].map((item) => (
                      <li key={item}>
                        <span className="vb-aside__check">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing info */}
                <div className="vb-aside__card">
                  <div className="vb-aside__header">
                    <div className="vb-aside__icon-wrap">💶</div>
                    <h3 className="vb-aside__title">Hoe bepalen wij de prijs?</h3>
                  </div>
                  <p className="vb-aside__text">
                    Ons inkoopbod is gebaseerd op het merk, de courante bandenmaat, het resterende profiel in millimeters en de algehele staat.
                  </p>
                  <p className="vb-aside__text">
                    Na akkoord op ons bod bent u welkom in onze werkplaats in Gent. De betaling gebeurt direct ter plaatse bij inlevering van de banden.
                  </p>
                </div>

                {/* Direct contact */}
                <div className="vb-aside__card vb-aside__card--contact">
                  <div className="vb-aside__header">
                    <div className="vb-aside__icon-wrap">📞</div>
                    <h3 className="vb-aside__title">Direct advies nodig?</h3>
                  </div>
                  <p className="vb-aside__text">
                    Twijfelt u of uw banden geschikt zijn? Bel ons gerust voor vrijblijvend advies.
                  </p>
                  <a href="tel:+32467871205" className="vb-aside__phone">
                    <span className="vb-aside__phone-icon">📱</span>
                    <span className="vb-aside__phone-text">
                      <span className="vb-aside__phone-label">Direct bellen</span>
                      <span className="vb-aside__phone-number">0467 87 12 05</span>
                    </span>
                  </a>
                  <div className="vb-aside__hours">
                    <span>🟢</span> Ma–Za: 09:00 – 18:00
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
