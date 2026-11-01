"use client";

import Link from "next/link";

export default function BestellingCancelPage() {
  return (
    <div
      style={{
        minHeight: "90vh",
        background: "#f8fafc",
        paddingTop: "clamp(130px, 16vh, 180px)",
        paddingBottom: "clamp(90px, 12vh, 140px)",
        paddingLeft: "20px",
        paddingRight: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 620,
          width: "100%",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          padding: "52px 36px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "#fef2f2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
          }}
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <span
          style={{
            display: "inline-block",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.85rem",
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          Betaling Afgebroken
        </span>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#0b192c",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Betaling geannuleerd
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "1rem",
            lineHeight: 1.65,
            maxWidth: 480,
            margin: "0 auto 32px",
          }}
        >
          Uw betaling is niet afgerond en er is niets in rekening gebracht. Uw winkelmandje is bewaard gebleven. Heeft u vragen over onze banden of wilt u liever telefonisch bestellen? Ons team staat voor u klaar.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/checkout"
            style={{
              padding: "13px 26px",
              background: "#016eb9",
              color: "#ffffff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(1, 110, 185, 0.3)",
            }}
          >
            Opnieuw proberen
          </Link>
          <Link
            href="/banden"
            style={{
              padding: "13px 26px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#0b192c",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Terug naar bandenoverzicht
          </Link>
          <Link
            href="/contact"
            style={{
              padding: "13px 26px",
              background: "#f1f5f9",
              color: "#1e293b",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Contacteer ons
          </Link>
        </div>
      </div>
    </div>
  );
}

