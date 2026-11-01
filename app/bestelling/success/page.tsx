"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { clearCart } from "@/lib/store";
import {
  WrenchIcon,
  MapPinIcon,
  CompassIcon,
  PhoneIcon,
  PackageIcon,
  FileTextIcon,
} from "@/app/components/appointments/AppointmentIcons";

interface SessionData {
  status: string;
  payment_status: string;
  orderId?: string | null;
  customer_details?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  amount_total?: number;
  line_items?: Array<{
    description: string;
    amount_total: number;
    quantity: number;
  }>;
  metadata?: {
    tyreId?: string;
    quantity?: string;
    withMontage?: string;
    deliveryAddress?: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Clear cart upon successful order
    clearCart();

    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSession(data);
      })
      .catch((err) => console.error("Error fetching session:", err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const withMontage = session?.metadata?.withMontage === "true";
  const totalAmount = session?.amount_total ? (session.amount_total / 100).toFixed(2) : null;

  return (
    <div
      style={{
        minHeight: "90vh",
        background: "#f8fafc",
        paddingTop: "clamp(130px, 16vh, 180px)",
        paddingBottom: "clamp(90px, 12vh, 140px)",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          padding: "48px 36px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        
        {/* Animated Check Icon */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span style={{ display: "inline-block", background: "#f0fdf4", color: "#166534", fontSize: "0.85rem", fontWeight: 700, padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>
          Betaling Geslaagd via Stripe
        </span>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0b192c", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Bedankt voor uw bestelling!
        </h1>

        <p style={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 28px" }}>
          We hebben uw betaling in goede orde ontvangen. Een bevestigingsmail met uw betaalbewijs is verzonden naar{" "}
          <strong>{session?.customer_details?.email || "uw e-mailadres"}</strong>.
        </p>

        {/* Highlight Card based on Montage vs Delivery */}
        {withMontage ? (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 16, padding: "24px", textAlign: "left", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", color: "#16a34a" }}>
                <WrenchIcon size={24} />
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#14532d" }}>
                Montage &amp; Balancering inbegrepen
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.925rem", color: "#166534", lineHeight: 1.55 }}>
              Uw banden zijn gereserveerd in onze werkplaats. U kunt direct langskomen voor montage of een afspraak inplannen:
            </p>
            <div style={{ marginTop: 16, padding: "14px 16px", background: "#ffffff", borderRadius: 12, border: "1px solid #bbf7d0" }}>
              <div style={{ fontWeight: 700, color: "#0b192c", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPinIcon size={16} style={{ color: "#16a34a" }} />
                <span>Gent Bandenservice BV</span>
              </div>
              <div style={{ color: "#475569", fontSize: "0.875rem", marginTop: 2 }}>Dendermondsesteenweg 428, 9040 Gent</div>
              <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: 4 }}>Ma – Za: 09:00 – 18:00</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <a
                href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Gent"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#16a34a", color: "#ffffff", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}
              >
                <CompassIcon size={16} />
                <span>Routebeschrijving</span>
              </a>
              <a
                href="tel:0467871205"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#ffffff", border: "1.5px solid #bbf7d0", color: "#166534", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}
              >
                <PhoneIcon size={16} />
                <span>Bel 0467 87 12 05</span>
              </a>
            </div>
          </div>
        ) : (
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 16, padding: "24px", textAlign: "left", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", color: "#016eb9" }}>
                <PackageIcon size={24} />
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0b192c" }}>
                Levering aan huis
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.925rem", color: "#475569", lineHeight: 1.55 }}>
              Uw bestelling wordt met zorg voorbereid en binnen 1-2 werkdagen verzonden.
              {session?.metadata?.deliveryAddress && (
                <span style={{ display: "block", marginTop: 8, fontWeight: 600, color: "#1e293b" }}>
                  Bezorgadres: {session.metadata.deliveryAddress}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Order Details Breakdown */}
        {session?.line_items && session.line_items.length > 0 && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", textAlign: "left", marginBottom: 28, background: "#fafafa" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "#0b192c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Aankoopoverzicht
            </h4>
            {session.line_items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: idx < session.line_items!.length - 1 ? "1px solid #e2e8f0" : "none", fontSize: "0.875rem", color: "#475569" }}>
                <span>{item.quantity}× {item.description}</span>
                <span style={{ fontWeight: 600, color: "#0b192c" }}>€{(item.amount_total / 100).toFixed(2)}</span>
              </div>
            ))}
            {totalAmount && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 8, borderTop: "2px solid #e2e8f0", fontWeight: 800, fontSize: "1.1rem", color: "#016eb9" }}>
                <span>Totaal betaald</span>
                <span>€{totalAmount}</span>
              </div>
            )}
          </div>
        )}

        {/* Invoice Download Action */}
        {session?.orderId && (
          <div style={{ marginBottom: 28 }}>
            <Link
              href={`/bestelling/factuur/${session.orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: "#016eb9",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(1, 110, 185, 0.35)",
              }}
            >
              <FileTextIcon size={18} />
              <span>Bekijk &amp; Print Uw Officiële Factuur</span>
            </Link>
            <p style={{ margin: "8px 0 0", fontSize: "0.825rem", color: "#64748b" }}>
              U kunt uw factuur op elk gewenst moment online openen of opslaan als PDF.
            </p>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/banden"
            style={{
              padding: "12px 24px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#0b192c",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Verder winkelen
          </Link>
          <Link
            href="/"
            style={{
              padding: "12px 24px",
              background: "#f1f5f9",
              color: "#1e293b",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Naar homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BestellingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "85vh",
            paddingTop: "160px",
            paddingBottom: "100px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: "1.05rem",
          }}
        >
          Bestelling verifiëren…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
