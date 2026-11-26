"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import "@/app/bestelling/factuur/[id]/invoice.css";
import { generateEpcQrDataUrl, DEFAULT_COMPANY_IBAN } from "@/lib/invoice-qr";
import { parseWarrantyFromNotes } from "@/lib/warranty";

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  vatRate?: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerStreet?: string | null;
  customerCity?: string | null;
  customerPostal?: string | null;
  customerCountry?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  status: "PENDING" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  paymentMethod: string | null;
  items: string; // JSON
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
  warranty?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
}

function InvoiceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedText, setCopiedText] = useState<string>("");

  useEffect(() => {
    fetch(`/api/invoices/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Factuur niet gevonden");
        return res.json();
      })
      .then((data) => setInvoice(data))
      .catch((err) => setError(err.message || "Er is een fout opgetreden bij het laden van de factuur."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (
      invoice &&
      invoice.status !== "PAID" &&
      (!invoice.paymentMethod || invoice.paymentMethod.toLowerCase().includes("overschrijving"))
    ) {
      generateEpcQrDataUrl({
        amount: invoice.totalAmount,
        invoiceNumber: invoice.invoiceNumber,
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [invoice]);

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(""), 2000);
    }
  };

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

  if (error || !invoice) {
    return (
      <div className="invoice-page">
        <div className="invoice-error-card">
          <h2>Factuur niet gevonden</h2>
          <p>{error || "Er is geen factuur met dit nummer gevonden."}</p>
          <Link href="/" className="invoice-back-btn">
            ← Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  let parsedItems: InvoiceItem[] = [];
  try {
    parsedItems = JSON.parse(invoice.items);
  } catch {
    parsedItems = [{ description: "Dienst / Product", quantity: 1, price: invoice.totalAmount }];
  }

  const isPaid = invoice.status === "PAID";
  const { warranty: parsedWarranty, notes: cleanNotes } = parseWarrantyFromNotes(invoice.notes);
  const effectiveWarranty = (invoice.warranty || parsedWarranty || "").trim();
  const displayNotes = cleanNotes || (effectiveWarranty ? "" : invoice.notes);
  const issueDateFormatted = new Date(invoice.issueDate).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="invoice-page">
      {/* Top Action Bar (hidden on print) */}
      <div className="invoice-action-bar">
        <div className="invoice-action-bar__inner">
          <Link href="/" className="invoice-nav-link">
            ← Gent Bandenservice BV
          </Link>
          <div className="invoice-actions" style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="invoice-print-btn"
              title="Afdrukken of opslaan als PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Afdrukken / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main A4 Document Canvas */}
      <div className="invoice-wrapper">
        <div className="invoice-card" id="printable-invoice">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-company">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-transparent.png"
                  alt="Gent Bandenservice Logo"
                  width={56}
                  height={64}
                  style={{ objectFit: "contain" }}
                />
                <div>
                  <h1 className="invoice-logo" style={{ margin: 0, lineHeight: 1.1 }}>
                    Gent <span>Bandenservice</span>
                  </h1>
                  <p className="invoice-company-sub" style={{ margin: "3px 0 0" }}>Vakkundig bandencentrum &amp; werkplaats</p>
                </div>
              </div>
              <div className="invoice-company-details">
                <p>Dendermondsesteenweg 428</p>
                <p>9040 Gent (Sint-Amandsberg), België</p>
                <p>Tel: 0467 87 12 05 · E-mail: info@gentbandenservice.be</p>
                <p>BTW / Ondernemingsnr: <strong>BE 1041.093.575</strong> · RPR Gent</p>
              </div>
            </div>

            <div className="invoice-meta-box" style={{ textAlign: "right" }}>
              <div style={{ display: "inline-block", textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    background: isPaid ? "#dcfce7" : "#fef3c7",
                    color: isPaid ? "#15803d" : "#b45309",
                    border: `1.5px solid ${isPaid ? "#86efac" : "#fde68a"}`,
                    marginBottom: 10,
                  }}
                >
                  {isPaid ? "✓ BETAALD" : "⏳ OPENSTAAND"}
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  FACTUUR
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#016eb9", marginTop: 2 }}>
                  #{invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 8 }}>
                  <p style={{ margin: "2px 0" }}><strong>Factuurdatum:</strong> {issueDateFormatted}</p>
                  <p style={{ margin: "2px 0" }}><strong>Vervaldatum:</strong> {dueDateFormatted}</p>
                  {invoice.paymentMethod && <p style={{ margin: "2px 0" }}><strong>Betaalwijze:</strong> {invoice.paymentMethod}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-divider" />

          {/* Client Details */}
          <div className="invoice-addresses" style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>
                Gefactureerd aan:
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                {invoice.customerName}
              </div>
              {invoice.companyName && (
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#016eb9", marginTop: 2 }}>
                  {invoice.companyName}
                </div>
              )}
              {invoice.vatNumber && (
                <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: 2 }}>
                  BTW-nr: <strong>{invoice.vatNumber}</strong>
                </div>
              )}
              {(invoice.customerStreet || invoice.customerCity) && (
                <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: 4 }}>
                  {invoice.customerStreet && <div>{invoice.customerStreet}</div>}
                  {(invoice.customerPostal || invoice.customerCity) && (
                    <div>{invoice.customerPostal} {invoice.customerCity}</div>
                  )}
                  {invoice.customerCountry && <div>{invoice.customerCountry}</div>}
                </div>
              )}
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                {invoice.customerEmail} {invoice.customerPhone && `· ${invoice.customerPhone}`}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table className="invoice-table" style={{ width: "100%", marginBottom: 24 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Omschrijving</th>
                <th style={{ textAlign: "center", width: 70 }}>Aantal</th>
                <th style={{ textAlign: "right", width: 110 }}>Stukprijs</th>
                <th style={{ textAlign: "right", width: 110 }}>Totaal (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {parsedItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{item.description}</strong>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>€{item.price.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                    €{(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="invoice-total-section" style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
            <div className="invoice-vat-notice" style={{ maxWidth: 360 }}>
              <span className="invoice-vat-badge">Inclusief 21% BTW</span>
              <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                Prijzen zijn vermeld in Euro (€) inclusief 21% Belgische BTW en wettelijke milieubijdrage (Recupel).
              </p>
            </div>

            <div className="invoice-totals-box" style={{ minWidth: 260 }}>
              <div className="invoice-total-row">
                <span>Subtotaal (excl. BTW)</span>
                <span>€{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="invoice-total-row">
                <span>BTW (21%)</span>
                <span>€{invoice.vatAmount.toFixed(2)}</span>
              </div>
              <div className="invoice-total-row invoice-total-row--final" style={{ borderTop: "2px solid #0f172a", paddingTop: 8 }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>Totaalbedrag</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#016eb9" }}>
                  €{invoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Garantiebewijs if set */}
          {effectiveWarranty && (
            <div
              style={{
                marginTop: 22,
                padding: "16px 20px",
                background: "#f0fdf4",
                borderRadius: 12,
                border: "1.5px solid #86efac",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "1.3rem" }}>🛡️</span>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#15803d", display: "block" }}>
                    Officieel Garantiebewijs — Gent Bandenservice BV
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "#166534" }}>
                    Geldig in onze werkplaats te Dendermondsesteenweg 428, 9040 Gent
                  </span>
                </div>
              </div>
              <div style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#14532d", fontWeight: 700, padding: "8px 12px", background: "#ffffff", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                {effectiveWarranty}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#166534", lineHeight: 1.45 }}>
                Deze factuur geldt als uw aankoop- en garantiebewijs. De garantie dekt materiaal- en montagefouten bij normaal gebruik conform de geldende garantievoorwaarden.
              </p>
            </div>
          )}

          {/* Notes if any */}
          {displayNotes && (
            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <strong style={{ fontSize: "0.825rem", color: "#1e293b", display: "block", marginBottom: 3 }}>
                Opmerkingen:
              </strong>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                {displayNotes}
              </p>
            </div>
          )}

          {/* Payment callout if pending */}
          {!isPaid && (
            <div style={{ marginTop: 24, padding: "20px 24px", background: "#f8fafc", borderRadius: 12, border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                {/* Left: Bank details & Instructions */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#016eb9", background: "rgba(1, 110, 185, 0.1)", padding: "4px 10px", borderRadius: 6 }}>
                      Overschrijving
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                      Betalingsinstructies
                    </strong>
                  </div>

                  <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                    Gelieve het bedrag van <strong style={{ color: "#0f172a" }}>€{invoice.totalAmount.toFixed(2)}</strong> over te maken vóór <strong style={{ color: "#0f172a" }}>{dueDateFormatted}</strong>.
                  </p>

                  {/* Bank info grid with 1-click copy */}
                  <div style={{ display: "grid", gap: 10, background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                    {/* IBAN */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>IBAN Rekeningnummer</div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontFamily: "monospace", fontSize: "0.95rem", letterSpacing: "0.05em" }}>
                          {DEFAULT_COMPANY_IBAN.replace(/(.{4})/g, "$1 ").trim()}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="no-print"
                        onClick={() => handleCopy(DEFAULT_COMPANY_IBAN, "iban")}
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                      >
                        {copiedText === "iban" ? "✓ Gekopieerd" : "Kopieer"}
                      </button>
                    </div>

                    {/* Begunstigde */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Begunstigde</div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>Gent Bandenservice BV</div>
                    </div>

                    {/* Mededeling */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Mededeling / Referentie</div>
                        <div style={{ fontWeight: 800, color: "#016eb9", fontFamily: "monospace", fontSize: "0.92rem" }}>
                          #{invoice.invoiceNumber}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="no-print"
                        onClick={() => handleCopy(invoice.invoiceNumber, "ref")}
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                      >
                        {copiedText === "ref" ? "✓ Gekopieerd" : "Kopieer"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: EPC QR Code */}
                {qrDataUrl && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: "#ffffff", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                      Scan &amp; Betaal
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="SEPA Betaal QR Code"
                      width={140}
                      height={140}
                      style={{ display: "block", borderRadius: 8 }}
                    />
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 8, maxWidth: 150, lineHeight: 1.3 }}>
                      Scan met uw bank-app (KBC, Belfius, ING, Fortis)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer legal */}
          <div className="invoice-footer" style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #e2e8f0", textAlign: "center", fontSize: "0.775rem", color: "#64748b", lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#334155" }}>
              Gent Bandenservice BV · Dendermondsesteenweg 428, 9040 Gent · BTW: BE 1041.093.575 · RPR Gent
            </p>
            <p style={{ margin: 0 }}>
              Bedankt voor uw vertrouwen in Gent Bandenservice BV!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage(props: { params: Promise<{ id: string }> }) {
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
      <InvoiceDetailContent {...props} />
    </Suspense>
  );
}
