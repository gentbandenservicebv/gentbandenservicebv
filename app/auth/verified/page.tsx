"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "../signin/auth.css";

function VerifiedContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("callbackURL") || "/profile";

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo">
          <span
            className="auth-logo__icon"
            style={{
              fontSize: "2rem",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1))",
              borderColor: "rgba(34, 197, 94, 0.4)",
              boxShadow: "0 8px 32px rgba(34, 197, 94, 0.2)",
            }}
          >
            ✅
          </span>
          <h1 className="auth-title">E-mailadres geverifieerd!</h1>
          <p className="auth-subtitle">Uw account bij Gent Bandenservice is nu volledig geactiveerd</p>
        </div>

        <div
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "28px",
            textAlign: "left",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "#86efac", fontWeight: 600 }}>
            🎉 Welkom bij Gent Bandenservice!
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.5" }}>
            U kunt nu direct banden bestellen, een montage-afspraak inplannen of uw eerdere bestellingen bekijken.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <Link
            href={callbackUrl}
            className="auth-submit"
            style={{
              display: "inline-block",
              textAlign: "center",
              textDecoration: "none",
              lineHeight: "1.4",
            }}
          >
            Doorgaan naar account
          </Link>

          <Link
            href="/banden"
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              padding: "12px 18px",
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "0.9rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Bekijk bandenaanbod →
          </Link>
        </div>

        <p className="auth-switch">
          <Link href="/" className="auth-link">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
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
      <VerifiedContent />
    </Suspense>
  );
}
