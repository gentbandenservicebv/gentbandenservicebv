"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp, sendVerificationEmail } from "@/lib/auth-client";
import "../signin/auth.css";

function SignUpContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || searchParams.get("callbackURL") || "/";

  // When clicking verification link in email, redirect to signin with success message or intended destination
  const verificationCallback =
    rawCallback !== "/"
      ? `/auth/signin?verified=true&callbackUrl=${encodeURIComponent(rawCallback)}`
      : "/auth/signin?verified=true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      callbackURL: verificationCallback,
    });

    if (signUpError) {
      setError(signUpError.message ?? "Registratie mislukt. Probeer opnieuw.");
      setLoading(false);
    } else {
      setRegisteredEmail(email);
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    if (!registeredEmail || resending) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await sendVerificationEmail({
        email: registeredEmail,
        callbackURL: verificationCallback,
      });

      if (res?.error) {
        setResendStatus({
          type: "error",
          message: res.error.message || "Kon de e-mail niet opnieuw versturen. Probeer het later.",
        });
      } else {
        setResendStatus({
          type: "success",
          message: "Een nieuwe verificatielink is succesvol verstuurd!",
        });
      }
    } catch {
      setResendStatus({
        type: "error",
        message: "Er is een onverwachte fout opgetreden bij het versturen.",
      });
    } finally {
      setResending(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-logo">
            <span className="auth-logo__icon" style={{ fontSize: "2rem" }}>
              📨
            </span>
            <h1 className="auth-title">Controleer uw e-mail</h1>
            <p className="auth-subtitle">Activeer uw account bij Gent Bandenservice</p>
          </div>

          <div
            style={{
              background: "rgba(1, 110, 185, 0.12)",
              border: "1px solid rgba(1, 110, 185, 0.3)",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#fff", lineHeight: "1.5" }}>
              We hebben een verificatielink gestuurd naar:
            </p>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#38bdf8",
                wordBreak: "break-all",
              }}
            >
              {registeredEmail}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
              Klik op de link in de e-mail om uw e-mailadres te bevestigen. Daarna kunt u meteen inloggen en uw bestellingen of afspraken beheren.
            </p>
          </div>

          {resendStatus && (
            <div
              className={resendStatus.type === "success" ? "auth-success" : "auth-error"}
              style={{ marginBottom: "20px", textAlign: "left" }}
              role="status"
            >
              {resendStatus.type === "success" ? "✅ " : "⚠️ "}
              {resendStatus.message}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            <Link
              href={
                rawCallback !== "/"
                  ? `/auth/signin?callbackUrl=${encodeURIComponent(rawCallback)}`
                  : "/auth/signin"
              }
              className="auth-submit"
              style={{
                display: "inline-block",
                textAlign: "center",
                textDecoration: "none",
                lineHeight: "1.4",
              }}
            >
              Naar inloggen
            </Link>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resending}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                padding: "12px 18px",
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.88rem",
                cursor: resending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {resending ? "Versturen..." : "Geen e-mail ontvangen? Verstuur opnieuw"}
            </button>
          </div>

          <p className="auth-hint" style={{ marginBottom: "16px" }}>
            Tip: controleer ook uw map met spam of ongewenste e-mail als u na 2 minuten nog niets ziet.
          </p>

          <p className="auth-switch">
            <Link href="/" className="auth-link">
              ← Terug naar home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__icon">✨</span>
          <h1 className="auth-title">Account aanmaken</h1>
          <p className="auth-subtitle">Registreer bij Gent Bandenservice</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name" className="auth-label">
              Volledige naam
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Jan Janssens"
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              E-mailadres
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
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Minimaal 8 tekens"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Account aanmaken..." : "Registreren"}
          </button>
        </form>

        <p className="auth-switch">
          Al een account?{" "}
          <Link
            href={rawCallback !== "/" ? `/auth/signin?callbackUrl=${encodeURIComponent(rawCallback)}` : "/auth/signin"}
            className="auth-link"
          >
            Inloggen
          </Link>
        </p>
        <p className="auth-switch">
          <Link href="/" className="auth-link">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card" style={{ textAlign: "center", padding: "60px 20px" }}>Laden…</div></div>}>
      <SignUpContent />
    </Suspense>
  );
}

