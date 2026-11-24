"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, sendVerificationEmail } from "@/lib/auth-client";
import "./auth.css";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("callbackURL") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const resetSuccess = searchParams.get("reset") === "success";
  const verifiedSuccess = searchParams.get("verified") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResendNotice(null);
    setIsNotVerified(false);
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    });

    if (signInError) {
      const isUnverified =
        signInError.code === "EMAIL_NOT_VERIFIED" ||
        signInError.message?.toLowerCase().includes("not verified") ||
        signInError.message?.toLowerCase().includes("verifieer");

      if (isUnverified) {
        setIsNotVerified(true);
        setError("Uw e-mailadres is nog niet geverifieerd. Bevestig eerst uw e-mailadres via de verificatielink.");
      } else {
        setError(signInError.message ?? "Aanmelden mislukt. Controleer uw gegevens.");
      }
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleResendVerification() {
    if (!email || resendLoading) return;
    setResendLoading(true);
    setResendNotice(null);

    try {
      const res = await sendVerificationEmail({
        email,
        callbackURL: `/auth/signin?verified=true&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });

      if (res?.error) {
        setResendNotice(res.error.message || "Kon geen e-mail versturen. Probeer later opnieuw.");
      } else {
        setResendNotice(`Nieuwe verificatielink verstuurd naar ${email}! Controleer uw inbox.`);
      }
    } catch {
      setResendNotice("Er is een fout opgetreden bij het verzenden.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__icon">🔑</span>
          <h1 className="auth-title">Inloggen</h1>
          <p className="auth-subtitle">Welkom terug bij Gent Bandenservice</p>
        </div>

        {verifiedSuccess && (
          <div className="auth-success" style={{ marginBottom: 20 }} role="status">
            <span>✅</span>
            <span>Uw e-mailadres is succesvol geverifieerd! U kunt nu inloggen met uw account.</span>
          </div>
        )}

        {resetSuccess && (
          <div className="auth-success" style={{ marginBottom: 20 }} role="status">
            <span>✅</span>
            <span>Uw wachtwoord is succesvol gewijzigd. U kunt nu inloggen met uw nieuwe wachtwoord.</span>
          </div>
        )}

        {resendNotice && (
          <div className="auth-success" style={{ marginBottom: 20 }} role="status">
            <span>📧</span>
            <span>{resendNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
            <div className="auth-field__header">
              <label htmlFor="password" className="auth-label">
                Wachtwoord
              </label>
              <Link
                href={email ? `/auth/forgot-password?email=${encodeURIComponent(email)}` : "/auth/forgot-password"}
                className="auth-forgot-link"
              >
                Wachtwoord vergeten?
              </Link>
            </div>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                title={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <div>{error}</div>
              {isNotVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginTop: "8px",
                    color: "#38bdf8",
                    textDecoration: "underline",
                    cursor: resendLoading ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    display: "block",
                    fontWeight: 600,
                  }}
                >
                  {resendLoading ? "Bezig met verzenden..." : "📩 Nieuwe verificatielink naar mijn e-mail sturen"}
                </button>
              )}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Aanmelden..." : "Inloggen"}
          </button>
        </form>

        <p className="auth-switch">
          Nog geen account?{" "}
          <Link
            href={callbackUrl !== "/" ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signup"}
            className="auth-link"
          >
            Registreer hier
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card" style={{ textAlign: "center", padding: "60px 20px" }}>Laden…</div></div>}>
      <SignInContent />
    </Suspense>
  );
}

