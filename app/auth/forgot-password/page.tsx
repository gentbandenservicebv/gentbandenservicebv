"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../signin/auth.css";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo: "/auth/reset-password",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Er is een fout opgetreden bij het aanvragen van het herstel.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er is een onverwachte fout opgetreden.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__icon">🔐</span>
          <h1 className="auth-title">Wachtwoord vergeten</h1>
          <p className="auth-subtitle">
            {submitted
              ? "Controleer uw e-mailinbox"
              : "Vul uw e-mailadres in om een herstellink te ontvangen"}
          </p>
        </div>

        {submitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="auth-success" role="status">
              <span>📧</span>
              <div>
                <strong>Herstellink verstuurd!</strong>
                <p style={{ margin: "6px 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                  Als er een account bestaat voor <strong>{email}</strong>, hebben we een e-mail gestuurd met instructies om uw wachtwoord opnieuw in te stellen.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "16px",
                fontSize: "0.82rem",
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.5,
              }}
            >
              ⏱️ De herstellink is <strong>1 uur</strong> geldig.<br />
              🔍 Geen e-mail gezien? Controleer ook uw map met ongewenste e-mail (spam).
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <Link
                href="/auth/signin"
                className="auth-submit"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                Terug naar inloggen
              </Link>

              <button
                type="button"
                className="auth-link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
                onClick={() => setSubmitted(false)}
              >
                Ander e-mailadres proberen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                E-mailadres van uw account
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="uw@email.be"
                required
                autoComplete="email"
                autoFocus
              />
              <span className="auth-hint">
                We sturen een beveiligde herstellink naar dit e-mailadres.
              </span>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Herstellink versturen..." : "Herstellink versturen"}
            </button>
          </form>
        )}

        {!submitted && (
          <p className="auth-switch" style={{ marginTop: 24 }}>
            Weet u uw wachtwoord weer?{" "}
            <Link href="/auth/signin" className="auth-link">
              Inloggen
            </Link>
          </p>
        )}

        <p className="auth-switch">
          <Link href="/" className="auth-link">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            Laden…
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
