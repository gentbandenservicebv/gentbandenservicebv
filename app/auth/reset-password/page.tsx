"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../signin/auth.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const tokenError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Handle automatic redirect after success
  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/auth/signin?reset=success");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Geen geldige hersteltoken gevonden. Vraag een nieuwe link aan.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Het wachtwoord moet minimaal 8 tekens lang zijn.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          token,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.code === "INVALID_TOKEN" || data?.message?.includes("token")) {
          throw new Error("Deze herstellink is ongeldig of verlopen. Vraag een nieuwe link aan.");
        }
        throw new Error(data?.message || "Er is een fout opgetreden bij het instellen van uw wachtwoord.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er is een onverwachte fout opgetreden.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const isInvalidToken = !token || tokenError === "INVALID_TOKEN";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__icon">{success ? "🎉" : "🛡️"}</span>
          <h1 className="auth-title">
            {success ? "Wachtwoord gewijzigd" : "Nieuw wachtwoord instellen"}
          </h1>
          <p className="auth-subtitle">
            {success
              ? "Uw account is nu beveiligd met uw nieuwe wachtwoord"
              : "Kies een nieuw en veilig wachtwoord voor uw account"}
          </p>
        </div>

        {success ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="auth-success" role="status">
              <span>✅</span>
              <div>
                <strong>Gelukt!</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                  Uw wachtwoord is succesvol bijgewerkt. U wordt over {countdown} seconde{countdown !== 1 ? "n" : ""} automatisch doorgestuurd naar het inlogscherm.
                </p>
              </div>
            </div>

            <Link
              href="/auth/signin?reset=success"
              className="auth-submit"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              Nu inloggen →
            </Link>
          </div>
        ) : isInvalidToken ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="auth-error" role="alert">
              <strong>Ongeldige of verlopen herstellink</strong>
              <p style={{ margin: "6px 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                Deze link is niet meer geldig of is al eens gebruikt. Vraag een nieuwe herstellink aan om door te gaan.
              </p>
            </div>

            <Link
              href="/auth/forgot-password"
              className="auth-submit"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              Nieuwe herstellink aanvragen
            </Link>

            <p className="auth-switch">
              <Link href="/auth/signin" className="auth-link">
                ← Terug naar inloggen
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="newPassword" className="auth-label">
                Nieuw wachtwoord
              </label>
              <div className="auth-password-wrap">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Minimaal 8 tekens"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
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
              <span className="auth-hint">
                Gebruik minimaal 8 tekens met letters en cijfers.
              </span>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">
                Bevestig nieuw wachtwoord
              </label>
              <div className="auth-password-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Herhaal uw nieuwe wachtwoord"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                  title={showConfirmPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Wachtwoord bijwerken..." : "Wachtwoord opslaan"}
            </button>
          </form>
        )}

        <p className="auth-switch" style={{ marginTop: 24 }}>
          <Link href="/auth/signin" className="auth-link">
            ← Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
