"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { formatUserNotes } from "@/lib/sanitize-notes";
import {
  CheckIcon,
  MapPinIcon,
  WrenchIcon,
  PackageIcon,
  PrinterIcon,
} from "@/app/components/appointments/AppointmentIcons";
import "./invoice.css";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  tyre: {
    brand: string;
    model: string;
    size: string;
    condition: string;
    season: string;
  };
}

interface OrderData {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  serviceType: string | null;
  deliveryStreet: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  deliveryCountry: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  items: OrderItem[];
}

function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Factuur kon niet worden gevonden.");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message || "Er is een fout opgetreden bij het laden van de factuur."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="invoice-page">
        <div className="invoice-loading">
          <div className="invoice-spinner" />
          <p>Factuur laden…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="invoice-page">
        <div className="invoice-error-card">
          <h2>Factuur niet gevonden</h2>
          <p>{error || "Er is geen bestelling met dit factuurnummer gevonden."}</p>
          <Link href="/" className="invoice-back-btn">
            ← Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNumber = `GBV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-6).toUpperCase()}`;
  const customerName = order.user?.name || order.guestName || "Klant";
  const customerEmail = order.user?.email || order.guestEmail || "";
  const customerPhone = order.guestPhone || order.user?.phone || "";
  const deliveryAddress = order.deliveryAddress || (order.deliveryStreet ? `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}` : "");

  // Check if montage was included
  const hasMontage = order.serviceType === "MONTAGE" || order.notes?.includes("Montage & balancering inbegrepen") || false;
  const totalTyres = order.items.reduce((acc, it) => acc + it.quantity, 0);
  const montageTotal = hasMontage ? 19.99 * totalTyres : 0;
  const tyreTotal = order.items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  return (
    <div className="invoice-page">
      {/* Top Action Bar (hidden when printing) */}
      <div className="invoice-action-bar">
        <div className="invoice-action-bar__inner">
          <Link href="/banden" className="invoice-nav-link">
            ← Terug naar banden
          </Link>
          <div className="invoice-actions">
            <button
              type="button"
              className="invoice-print-btn"
              onClick={() => window.print()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Factuur afdrukken / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="invoice-container">
        <div className="invoice-card" id="printable-invoice">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-company">
              <h1 className="invoice-brand">Gent Bandenservice BV</h1>
              <p className="invoice-company-sub">Uw bandspecialist in Gent en omstreken</p>
              <div className="invoice-company-meta">
                <span>Dendermondsesteenweg 428, 9040 Gent</span>
                <span>BTW: BE 1041.093.575</span>
                <span>Tel: 0467 87 12 05</span>
                <span>E-mail: info@gentbandenservice.be</span>
              </div>
            </div>

            <div className="invoice-badge-box">
              <span className="invoice-type-tag">OFFICIËLE VERKOOPFACTUUR</span>
              <div className="invoice-number-large">#{invoiceNumber}</div>
              <div className="invoice-date-meta">
                <div><strong>Factuurdatum:</strong> {new Date(order.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                <div>
                  <strong>Betaalstatus:</strong>{" "}
                  <span className="invoice-paid-badge" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <CheckIcon size={13} />
                    <span>Voldaan via Stripe</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-divider" />

          {/* Client & Fulfillment Info */}
          <div className="invoice-info-grid">
            <div className="invoice-info-block">
              <h3 className="invoice-section-title">Factuurgegevens Klant</h3>
              <div className="invoice-info-content">
                <strong>{customerName}</strong>
                {customerEmail && <div>{customerEmail}</div>}
                {customerPhone && <div>Tel: {customerPhone}</div>}
                {deliveryAddress && !hasMontage && (
                  <div style={{ marginTop: 6, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPinIcon size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <span>{deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="invoice-info-block">
              <h3 className="invoice-section-title">Levering &amp; Uitvoering</h3>
              <div className="invoice-info-content">
                {hasMontage ? (
                  <div className="invoice-service-tag invoice-service-tag--montage">
                    <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <WrenchIcon size={15} />
                      <span>Montage in de werkplaats</span>
                    </strong>
                    <p>Gent Bandenservice BV, Dendermondsesteenweg 428, 9040 Gent ({totalTyres} band{totalTyres > 1 ? "en" : ""})</p>
                  </div>
                ) : (
                  <div className="invoice-service-tag invoice-service-tag--delivery">
                    <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <PackageIcon size={15} />
                      <span>Levering aan huis</span>
                    </strong>
                    <p>{deliveryAddress ? `Bezorging naar: ${deliveryAddress}` : "Verzending per koerier naar opgegeven adres"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Omschrijving</th>
                <th>Seizoen / Conditie</th>
                <th style={{ textAlign: "center" }}>Aantal</th>
                <th style={{ textAlign: "right" }}>Stukprijs (incl. BTW)</th>
                <th style={{ textAlign: "right" }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="invoice-item-title">{item.tyre.brand} {item.tyre.model}</strong>
                    <span className="invoice-item-size">Maat: {item.tyre.size}</span>
                  </td>
                  <td>
                    <span className="invoice-item-meta">
                      {item.tyre.condition === "NEW" ? "Nieuw" : "2de hands"} ·{" "}
                      {item.tyre.season === "SUMMER" ? "Zomer" : item.tyre.season === "WINTER" ? "Winter" : "All-Season"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    €{item.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    €{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}

              {hasMontage && (
                <tr className="invoice-montage-row">
                  <td>
                    <strong className="invoice-item-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <WrenchIcon size={15} />
                      <span>Montage &amp; Elektronische Balancering</span>
                    </strong>
                    <span className="invoice-item-size">Vakkundige montage werkplaats Dendermondsesteenweg 428, 9040 Gent</span>
                  </td>
                  <td>
                    <span className="invoice-item-meta">Service ter plaatse</span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    {totalTyres}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    €19.99
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    €{montageTotal.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="invoice-total-section">
            <div className="invoice-vat-notice">
              <span className="invoice-vat-badge">Inclusief 21% BTW</span>
              <p>Alle vermelde prijzen zijn inclusief 21% Belgische BTW en milieubijdrage (Recupel/Banden).</p>
            </div>

            <div className="invoice-totals-box">
              <div className="invoice-total-row">
                <span>Subtotaal banden</span>
                <span>€{tyreTotal.toFixed(2)}</span>
              </div>
              {hasMontage && (
                <div className="invoice-total-row">
                  <span>Montage &amp; Balancering</span>
                  <span>€{montageTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="invoice-total-row invoice-total-row--final">
                <span>Totaal voldaan</span>
                <span>€{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes if any - Sanitized so technical Stripe IDs are never displayed to customers */}
          {(() => {
            const cleanNotes = formatUserNotes(order.notes);
            return cleanNotes ? (
              <div className="invoice-notes-box">
                <strong>Opmerkingen / Notities:</strong>
                <p>{cleanNotes}</p>
              </div>
            ) : null;
          })()}

          {/* Footer legal */}
          <div className="invoice-footer">
            <p>Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · RPR Gent · BTW BE 1041.093.575</p>
            <p>Bedankt voor uw vertrouwen in Gent Bandenservice BV!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="invoice-page">
          <div className="invoice-loading">
            <div className="invoice-spinner" />
            <p>Factuur laden…</p>
          </div>
        </div>
      }
    >
      <InvoiceContent {...props} />
    </Suspense>
  );
}
