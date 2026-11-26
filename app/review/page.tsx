"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import "./review.css";

interface TyrePreview {
  id: string;
  brand: string;
  model: string;
  size: string;
  slug?: string | null;
  image?: string | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "1 ster — Zeer ontevreden",
  2: "2 sterren — Matig",
  3: "3 sterren — Voldoende / Gemiddeld",
  4: "4 sterren — Goed & tevreden",
  5: "5 sterren — Uitstekend! Zeer aan te bevelen",
};

function ReviewContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const rawTyreId = searchParams.get("tyreId");
  const initialRating = Number(searchParams.get("rating")) || 5;

  const { data: session } = useSession();

  const [tyreId, setTyreId] = useState(rawTyreId || "");
  const [tyre, setTyre] = useState<TyrePreview | null>(null);
  const [loadingTyre, setLoadingTyre] = useState(Boolean(rawTyreId));
  const [availableTyres, setAvailableTyres] = useState<TyrePreview[]>([]);

  const [rating, setRating] = useState<number>(Math.min(Math.max(initialRating, 1), 5));
  const [hoverRating, setHoverRating] = useState<number>(0);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Scroll to top when review is submitted so success card is centered in view
  useEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [submitted]);

  // Auto-fill from session
  useEffect(() => {
    if (session?.user) {
      if (!userName && session.user.name) setUserName(session.user.name);
      if (!userEmail && session.user.email) setUserEmail(session.user.email);
    }
  }, [session, userName, userEmail]);

  // Load tyre details if tyreId is provided
  useEffect(() => {
    if (!tyreId) {
      setLoadingTyre(false);
      // Fetch some tyres for selection fallback
      fetch("/api/tyres?limit=20")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableTyres(
              data.map((t: any) => ({
                id: t.id,
                brand: t.brand,
                model: t.model,
                size: t.size,
                slug: t.slug,
                image: t.images?.[0]?.url || null,
              }))
            );
          }
        })
        .catch(() => {});
      return;
    }

    setLoadingTyre(true);
    fetch(`/api/tyres/${tyreId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setTyre({
            id: data.id,
            brand: data.brand,
            model: data.model,
            size: data.size,
            slug: data.slug,
            image: data.images?.[0]?.url || null,
          });
        }
      })
      .catch((err) => console.error("Error fetching tyre:", err))
      .finally(() => setLoadingTyre(false));
  }, [tyreId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tyreId) {
      setError("Selecteer a.u.b. welke band u wilt beoordelen.");
      return;
    }

    if (!userName.trim()) {
      setError("Vul a.u.b. uw naam in.");
      return;
    }

    if (!userEmail.trim()) {
      setError("Vul a.u.b. uw e-mailadres in.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError("Schrijf a.u.b. een korte toelichting (min. 5 tekens).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tyreId,
          appointmentId: appointmentId || undefined,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          userName: userName.trim(),
          userEmail: userEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fout bij opslaan van review");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="review-page">
        <div className="review-container">
          <div className="review-card review-success-card">
            <span className="review-success-icon">🎉</span>
            <h1 className="review-title">Hartelijk dank voor uw review!</h1>
            <p className="review-subtitle" style={{ marginBottom: "28px" }}>
              Uw ervaring is succesvol opgeslagen. U helpt hiermee andere bestuurders bij het kiezen van de juiste banden.
            </p>

            <div className="review-success-score-box">
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                {"⭐".repeat(rating)}
              </div>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#fbbf24", fontWeight: 700 }}>
                {RATING_LABELS[rating] || `${rating} sterren`}
              </p>
            </div>

            <div className="review-success-actions">
              {tyre?.slug && (
                <Link
                  href={`/banden/${tyre.slug}`}
                  className="review-submit"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Bekijk {tyre.brand} {tyre.model} →
                </Link>
              )}

              <Link
                href="/banden"
                className="review-back-catalog-btn"
              >
                Naar bandenaanbod
              </Link>
            </div>

            <div className="review-google-box">
              <p style={{ margin: "0 0 6px" }}>
                Wilt u ook onze werkplaats in Gent beoordelen op Google?
              </p>
              <a
                href="https://maps.google.com/?cid=gentbandenservice"
                target="_blank"
                rel="noopener noreferrer"
                className="review-google-link"
              >
                ⭐ Plaats ook een review op Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeStarCount = hoverRating || rating;

  return (
    <div className="review-page">
      <div className="review-container">
        <div className="review-card">
          <div className="review-header">
            <span className="review-badge">⭐ Ervaring delen</span>
            <h1 className="review-title">Schrijf een review</h1>
            <p className="review-subtitle">
              Deel uw ervaring over uw banden en onze service bij Gent Bandenservice
            </p>
          </div>

          {/* Tyre card if known */}
          {loadingTyre ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
              Gegevens laden…
            </div>
          ) : tyre ? (
            <div className="review-tyre-card">
              <div className="review-tyre-img">
                {tyre.image ? (
                  <Image
                    src={tyre.image}
                    alt={`${tyre.brand} ${tyre.model}`}
                    width={64}
                    height={64}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  "🛞"
                )}
              </div>
              <div className="review-tyre-info">
                <h3>
                  {tyre.brand} {tyre.model}
                </h3>
                <p>Maat: {tyre.size}</p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "24px" }}>
              <label className="review-label" style={{ marginBottom: "8px", display: "block" }}>
                Kies de band die u wilt beoordelen:
              </label>
              <select
                value={tyreId}
                onChange={(e) => setTyreId(e.target.value)}
                className="review-input"
                style={{ width: "100%", background: "#1a1f2c" }}
                required
              >
                <option value="">-- Selecteer een band --</option>
                {availableTyres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.brand} {t.model} ({t.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="review-form">
            {/* Stars selection */}
            <div className="review-stars-group">
              <span className="review-stars-label">Uw beoordeling</span>
              <div className="review-stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`review-star-btn ${star <= activeStarCount ? "review-star-btn--filled" : ""}`}
                    aria-label={`${star} sterren`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div className="review-rating-text">
                {RATING_LABELS[activeStarCount] || ""}
              </div>
            </div>

            {/* Title */}
            <div className="review-field">
              <label htmlFor="review-title" className="review-label">
                Titel van uw review (optioneel)
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="review-input"
                placeholder="Bijv. Uitstekende grip en heel stille banden"
                maxLength={80}
              />
            </div>

            {/* Comment */}
            <div className="review-field">
              <label htmlFor="review-comment" className="review-label">
                Uw ervaring / toelichting *
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="review-textarea"
                placeholder="Vertel over het rijgedrag, grip bij regen, geluid of de montage in onze werkplaats..."
                required
                rows={4}
              />
            </div>

            {/* Name & Email in responsive grid */}
            <div className="review-grid-2">
              <div className="review-field">
                <label htmlFor="review-name" className="review-label">
                  Uw naam *
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="review-input"
                  placeholder="Jan Janssens"
                  required
                />
              </div>

              <div className="review-field">
                <label htmlFor="review-email" className="review-label">
                  E-mailadres *
                </label>
                <input
                  id="review-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="review-input"
                  placeholder="uw@email.be"
                  required
                />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              Uw e-mailadres wordt nooit openbaar getoond; enkel uw voornaam/naam verschijnt bij uw review.
            </p>

            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  borderRadius: "12px",
                  color: "#fca5a5",
                  fontSize: "0.88rem",
                }}
                role="alert"
              >
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="review-submit" disabled={submitting}>
              {submitting ? "Review plaatsen..." : "Review plaatsen ⭐"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              ← Terug naar Gent Bandenservice
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="review-page">
          <div className="review-container">
            <div className="review-card" style={{ textAlign: "center", padding: "60px 20px" }}>
              Laden…
            </div>
          </div>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
