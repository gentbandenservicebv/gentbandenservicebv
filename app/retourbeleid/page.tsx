"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./retourbeleid.css";

const RETURN_REASONS = [
  { value: "WRONG_SIZE", label: "Verkeerde bandenmaat besteld" },
  { value: "WITHDRAWAL", label: "Bedenktijd (14 dagen herroepingsrecht)" },
  { value: "NOT_NEEDED", label: "Niet meer nodig / aankoop geannuleerd" },
  { value: "INCORRECT_DELIVERY", label: "Verkeerd artikel of aantal geleverd" },
  { value: "DAMAGED", label: "Beschadiging of productiefout (garantie)" },
  { value: "OTHER", label: "Andere reden" },
];

function ReturnPortalForm() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("WRONG_SIZE");
  const [reasonDetails, setReasonDetails] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("U dient te bevestigen dat de banden ongebruikt en ongemonteerd zijn.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() || undefined,
          reason,
          reasonDetails: reasonDetails.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Retourverzoek kon niet worden ingediend.");
      }

      setSuccessData({
        id: data.returnRequest.id,
        orderId: data.returnRequest.orderId,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is een onverwachte fout opgetreden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="retour-portal-box" id="retour-formulier">
      <div className="retour-portal-header">
        <h2>
          <span>🔄</span> Direct Online Retour Aanmelden
        </h2>
        <p>
          Vul uw bestelnummer en e-mailadres in om uw retourzending binnen 1 minuut aan te melden.
        </p>
      </div>

      {successData ? (
        <div className="retour-success-box">
          <div className="retour-success-icon">✅</div>
          <h3>Retourverzoek Succesvol Ingediend!</h3>
          <p>
            Uw retouraanvraag is geregistreerd onder referentie{" "}
            <strong>#{successData.id.slice(-8).toUpperCase()}</strong> voor bestelling{" "}
            <strong>#{successData.orderId.slice(-8).toUpperCase()}</strong>.
          </p>
          <p style={{ fontSize: "0.86rem", color: "#166534" }}>
            Wij hebben een bevestigingsmail gestuurd naar <strong>{email}</strong> met de verdere stappen.
            U kunt de banden tijdens kantooruren inleveren in onze werkplaats in Gent, of onze instructies per mail afwachten.
          </p>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => {
              setSuccessData(null);
              setOrderId("");
              setReasonDetails("");
              setTermsAccepted(false);
            }}
            style={{ marginTop: 10, fontSize: "0.88rem" }}
          >
            Nog een retour aanmelden
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="retour-form">
          {error && <div className="retour-alert-error">{error}</div>}

          <div className="retour-form-row">
            <div className="retour-form-group">
              <label htmlFor="orderId">Bestelnummer *</label>
              <input
                id="orderId"
                type="text"
                placeholder="bv. #1A2B3C4D of volledige ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
              />
            </div>

            <div className="retour-form-group">
              <label htmlFor="email">E-mailadres bestelling *</label>
              <input
                id="email"
                type="email"
                placeholder="uw.email@domein.be"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="retour-form-row">
            <div className="retour-form-group">
              <label htmlFor="name">Uw volledige naam *</label>
              <input
                id="name"
                type="text"
                placeholder="bv. Jan Peeters"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="retour-form-group">
              <label htmlFor="phone">Telefoonnummer (optioneel)</label>
              <input
                id="phone"
                type="tel"
                placeholder="bv. 0467 87 12 05"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="retour-form-group">
            <label htmlFor="reason">Reden van retour *</label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="retour-form-group">
            <label htmlFor="reasonDetails">Toelichting / Betrokken banden (optioneel)</label>
            <textarea
              id="reasonDetails"
              rows={3}
              placeholder="Welke banden wenst u te retourneren? Eventuele toelichting voor ons team..."
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
            />
          </div>

          <label className="retour-checkbox-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <span>
              Ik bevestig dat de banden <strong>ongebruikt, ongemonteerd en onbeschadigd</strong> zijn met originele etiketten/stickers intact conform het retourbeleid.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn--primary retour-submit-btn"
          >
            {submitting ? "Retourverzoek indienen…" : "📦 Retourverzoek Versturen"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function RetourbeleidPage() {
  return (
    <div className="retour-page">
      {/* Hero */}
      <section className="retour-hero">
        <div className="container">
          <div className="breadcrumb" style={{ marginBottom: 14 }}>
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Retourbeleid &amp; Herroeping</span>
          </div>

          <div className="retour-hero__badge">
            <span>🛡️</span> 14 Dagen Bedenktijd Conform Belgische Wet
          </div>

          <h1 className="retour-hero__title">
            Retourbeleid &amp; Herroepingsrecht
          </h1>

          <p className="retour-hero__sub">
            Eerlijk, duidelijk en zorgeloos. Lees hier alles over het retourneren van uw banden, de wettelijke voorwaarden en meld uw retour direct online aan.
          </p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="retour-pillars-section">
        <div className="container">
          <div className="retour-pillars-grid">
            <div className="retour-pillar-card">
              <div className="retour-pillar-icon">⏱️</div>
              <h3>14 Dagen Bedenktijd</h3>
              <p>Wettelijk herroepingsrecht conform Boek VI van het Belgisch Wetboek van Economisch Recht.</p>
            </div>

            <div className="retour-pillar-card">
              <div className="retour-pillar-icon">🛞</div>
              <h3>Ongemonteerde Staat</h3>
              <p>Banden moeten ongebruikt, ongemonteerd en voorzien van originele fabriekslabels zijn.</p>
            </div>

            <div className="retour-pillar-card">
              <div className="retour-pillar-icon">📍</div>
              <h3>Gratis Inleveren</h3>
              <p>Breng uw retour kosteloos binnen in onze werkplaats aan de Dendermondsesteenweg 428 te Gent.</p>
            </div>

            <div className="retour-pillar-card">
              <div className="retour-pillar-icon">💶</div>
              <h3>Snelle Terugbetaling</h3>
              <p>Terugbetaling binnen 5 tot 10 werkdagen na inspectie via uw oorspronkelijke betaalmethode (Stripe).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Interactive Form Layout */}
      <section className="container">
        <div className="retour-content-layout">
          {/* Left Column: Legal Policy Details */}
          <article className="retour-article">
            <h2>1. Wettelijk Herroepingsrecht (14 kalenderdagen)</h2>
            <p>
              Als consument heeft u bij aankoop via onze webshop het recht om binnen een termijn van <strong>14 kalenderdagen</strong> zonder opgave van redenen de overeenkomst te herroepen.
            </p>
            <p>
              De herroepingstermijn verstrijkt 14 dagen na de dag waarop u (of een door u aangewezen derde, die niet de vervoerder is) de banden fysiek in bezit heeft gekregen.
            </p>

            <div className="retour-highlight-box">
              <strong>💡 Eenvoudige herroeping:</strong> U kunt uw herroepingsrecht direct uitoefenen via het interactieve formulier op deze pagina of via uw persoonlijke accountoverzicht.
            </div>

            <h2>2. Voorwaarden voor Retournering van Banden</h2>
            <p>
              Vanwege de strenge veiligheidsvoorschriften die gelden voor autobanden, gelden specifieke voorwaarden voor acceptatie van retouren:
            </p>
            <ul>
              <li>
                <strong>Ongebruikt en ongemonteerd:</strong> Banden die reeds op een velg zijn gemonteerd geweest of bereden zijn, kunnen om veiligheidstechnische redenen <em>niet</em> meer als nieuw verkocht worden en zijn uitgesloten van herroeping (conform art. VI.53 WER).
              </li>
              <li>
                <strong>Originele staat:</strong> De banden dienen schoon te zijn en de originele fabrieksstickers, barcodes en etiketten moeten aanwezig en onbeschadigd zijn.
              </li>
              <li>
                <strong>Geen demomontage of sporen:</strong> Banden met montagevet, velgklemmensporen of bandenspanningrestanten worden afgekeurd.
              </li>
            </ul>

            <div className="retour-warning-box">
              <strong>⚠️ Reeds gemonteerd in onze werkplaats?</strong> Indien u gekozen heeft voor montage in onze werkplaats, vervalt het herroepingsrecht zodra de montagedienst met uw uitdrukkelijke toestemming volledig is uitgevoerd en de banden op uw voertuig zijn geplaatst.
            </div>

            <h2>3. Hoe verloopt het retourproces?</h2>
            <p>Het retourneren van uw bestelling verloopt in 4 duidelijke stappen:</p>
            <ul>
              <li>
                <strong>Stap 1 — Aanmelden:</strong> Vul het online retourformulier in op deze pagina met uw bestelnummer en e-mailadres.
              </li>
              <li>
                <strong>Stap 2 — Bevestiging &amp; Instructies:</strong> Ons team controleert uw gegevens en stuurt u binnen 1 werkdag de retourinstructies.
              </li>
              <li>
                <strong>Stap 3 — Overdracht van de banden:</strong>
                <ul>
                  <li><em>Optie A (Gratis):</em> Breng de banden kosteloos binnen in onze werkplaats te Gent.</li>
                  <li><em>Optie B (Verzending):</em> Laat de banden ophalen door een koerier of stuur ze verzekerd op.</li>
                </ul>
              </li>
              <li>
                <strong>Stap 4 — Technische controle &amp; Terugbetaling:</strong> Na fysieke verificatie van het loopvlak en de hiel wordt het aankoopbedrag direct teruggestort.
              </li>
            </ul>

            <h2>4. Retourkosten</h2>
            <p>
              <strong>Inleveren in Gent:</strong> Het persoonlijk afgeven van de geretourneerde banden in onze werkplaats (Dendermondsesteenweg 428, 9040 Gent) is te allen tijde <strong>100% gratis</strong>.
            </p>
            <p>
              <strong>Retourzending per post/koerier:</strong> Indien u kiest voor ophaling aan huis of verzending via een pakketdienst, zijn de rechtstreekse kosten van het terugzenden voor uw rekening (rekening houdend met ca. €10 tot €15 per band afhankelijk van gewicht en transporteur), tenzij er sprake is van een foutieve levering door Gent Bandenservice BV.
            </p>

            <h2>5. Terugbetaling</h2>
            <p>
              Wij betalen u terug met hetzelfde betaalmiddel als waarmee u de oorspronkelijke transactie heeft verricht (via Stripe: Bancontact, iDEAL, Visa, Mastercard of Maestro), tenzij uitdrukkelijk anders overeengekomen.
            </p>
            <p>
              De terugbetaling vindt plaats binnen <strong>5 tot uiterlijk 10 werkdagen</strong> nadat wij de goederen hebben ontvangen en gecontroleerd.
            </p>

            <h2>6. Fabrieksgarantie &amp; Beschadigingen</h2>
            <p>
              Heeft u een band ontvangen met een transportschade of vermoedt u een productiefout? Op alle nieuwe banden geldt de wettelijke fabrieksgarantie van 2 jaar conform de Europese consumentenrichtlijn.
            </p>
            <p>
              Neem in dat geval onmiddellijk contact met ons op via <a href="tel:0467871205" style={{ color: "var(--primary)", fontWeight: 700 }}>0467 87 12 05</a> of <a href="mailto:info@gentbandenservice.be" style={{ color: "var(--primary)", fontWeight: 700 }}>info@gentbandenservice.be</a> zodat we direct kosteloos een omruiling of inspectie kunnen inplannen.
            </p>
          </article>

          {/* Right Column: Sticky Interactive Return Portal Form */}
          <aside>
            <Suspense fallback={<div className="retour-portal-box"><p>Formulier laden…</p></div>}>
              <ReturnPortalForm />
            </Suspense>
          </aside>
        </div>
      </section>
    </div>
  );
}
