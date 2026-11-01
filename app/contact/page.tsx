"use client";

import { useState } from "react";
import Link from "next/link";
import "./contact.css";

const SUBJECT_OPTIONS = [
  "Algemene vraag",
  "Vrijblijvende offerte / Prijsopgave",
  "Bandenadvies & Beschikbaarheid",
  "Zakelijk / Bedrijfswagenpark",
  "Nieuwe of tweedehands banden",
  "Andere vraag",
];

const faqs = [
  {
    q: "Hoe snel reageren jullie op een contactaanvraag?",
    a: "Tijdens onze openingsuren (maandag t/m zaterdag tussen 09:00 en 18:00) reageren wij gemiddeld binnen 1 tot 2 uur per e-mail of telefoon. Buiten de openingsuren ontvangt u de eerstvolgende ochtend antwoord.",
  },
  {
    q: "Kan ik direct een werkplaatsafspraak maken via dit formulier?",
    a: "Dit contactformulier is bedoeld voor algemene vragen, offertes en advies. Wilt u direct een datum en tijdslot reserveren voor montage of herstelling? Gebruik dan onze interactieve online afsprakenplanner via gentbandenservice.be/afspraak.",
  },
  {
    q: "Kan ik bij spoed (lekke band) direct langskomen zonder bericht?",
    a: "Ja, absoluut! Bij een acute lekke band of dringende pech kunt u direct zonder voorafgaand bericht naar onze werkplaats aan de Dendermondsesteenweg 428 rijden. We helpen u zo snel mogelijk weer veilig op weg.",
  },
  {
    q: "Welke betaalmogelijkheden zijn er in de werkplaats?",
    a: "U kunt bij ons eenvoudig en veilig betalen met Bancontact, Maestro, Visa, Mastercard, Payconiq en contant. Bedrijven kunnen na goedkeuring op factuur betalen.",
  },
  {
    q: "Zijn er parkeerplaatsen bij de werkplaats?",
    a: "Jazeker, wij beschikken over een ruime, gratis parking direct voor de werkplaats op eigen terrein. U hoeft dus nooit te zoeken naar een parkeerplek in de straat.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECT_OPTIONS[0],
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er is een fout opgetreden bij het verzenden.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Er is een onverwachte fout opgetreden. Probeer het later opnieuw.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrorMessage(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: SUBJECT_OPTIONS[0],
      message: "",
    });
  };

  return (
    <>
      {/* Page Hero */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Contact</span>
          </div>
          <h1 className="h1 text-white" style={{ marginTop: 16 }}>
            Contacteer Ons
          </h1>
          <p className="page-hero__sub">
            Heeft u een vraag over onze diensten, bandenmaten of zoekt u een vrijblijvende offerte? Stuur ons gerust een bericht.
          </p>
        </div>
      </div>

      {/* Main Contact Section */}
      <section className="contact-layout">
        <div className="container">
          <div className="contact-grid">
            {/* Left: Contact Channels & Workshop Details */}
            <div className="contact-info">
              {/* Callout to online appointment wizard */}
              <div className="contact-appointment-callout">
                <div className="callout-icon">📅</div>
                <div className="callout-content">
                  <h3 className="callout-title">Direct een afspraak inplannen?</h3>
                  <p className="callout-text">
                    Wilt u banden laten monteren, balanceren of herstellen? Kies zelf realtime uw gewenste datum &amp; uur in onze wizard.
                  </p>
                  <Link href="/afspraak" className="btn btn--primary btn--sm callout-btn">
                    Naar de Afsprakenplanner →
                  </Link>
                </div>
              </div>

              {/* Direct Call Card */}
              <div className="contact-channel-card">
                <div className="contact-channel-icon">
                  <PhoneIcon />
                </div>
                <div>
                  <div className="contact-channel-title">Direct telefonisch contact</div>
                  <a href="tel:+32467871205" className="contact-channel-value">
                    0467 87 12 05
                  </a>
                  <div className="contact-channel-desc">
                    Maandag t/m zaterdag bereikbaar voor direct advies en spoedgevallen.
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="contact-channel-card contact-channel-card--whatsapp">
                <div className="contact-channel-icon">
                  <WhatsAppIcon />
                </div>
                <div>
                  <div className="contact-channel-title">WhatsApp Support</div>
                  <a
                    href="https://wa.me/32467871205"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-channel-value"
                  >
                    Stuur een WhatsApp bericht
                  </a>
                  <div className="contact-channel-desc">
                    Stuur eenvoudig een foto van uw bandenmaat of bandenschade voor snel advies.
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="contact-channel-card">
                <div className="contact-channel-icon">
                  <MailIcon />
                </div>
                <div>
                  <div className="contact-channel-title">E-mailadres</div>
                  <a href="mailto:contact@gentbandenservice.be" className="contact-channel-value">
                    contact@gentbandenservice.be
                  </a>
                  <div className="contact-channel-desc">
                    Voor offertes, zakelijke aanvragen en facturatie.
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="contact-channel-card">
                <div className="contact-channel-icon">
                  <LocationIcon />
                </div>
                <div>
                  <div className="contact-channel-title">Werkplaats &amp; Showroom</div>
                  <div className="contact-channel-value" style={{ fontSize: "1.05rem" }}>
                    Dendermondsesteenweg 428
                  </div>
                  <div className="contact-channel-desc">
                    9040 Sint-Amandsberg (Gent) — Gratis ruime parking op eigen terrein.
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="contact-hours-card">
                <div className="contact-hours-title">
                  <span>Openingsuren</span>
                  <span className="contact-badge-open">
                    <span className="contact-badge-dot" />
                    Ma – Za Geopend
                  </span>
                </div>
                <div className="contact-hours-table">
                  <div className="contact-hours-row">
                    <span>Maandag – Vrijdag</span>
                    <strong>09:00 – 18:00</strong>
                  </div>
                  <div className="contact-hours-row">
                    <span>Zaterdag</span>
                    <strong>09:00 – 18:00</strong>
                  </div>
                  <div className="contact-hours-row">
                    <span>Zondag</span>
                    <strong style={{ color: "#94a3b8" }}>Gesloten (enkel spoed)</strong>
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <a
                    href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Sint-Amandsberg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--outline w-full"
                    style={{ fontSize: "0.88rem", padding: "10px 14px", justifyContent: "center" }}
                  >
                    📍 Routebeschrijving in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Right: The Pure Contact Form */}
            <div className="contact-form-card">
              <div className="contact-form-header">
                <span className="label">Contactformulier</span>
                <h2 className="h2 text-dark" style={{ marginTop: 6, fontSize: "1.85rem" }}>
                  Stuur ons een bericht
                </h2>
                <p className="text-muted" style={{ fontSize: "0.95rem", marginTop: 8, lineHeight: 1.5 }}>
                  Heeft u een specifieke vraag of wenst u een prijsopgave? Vul onderstaande gegevens in en we nemen zo spoedig mogelijk contact met u op.
                </p>
              </div>

              {submitted ? (
                <div className="form-success-box">
                  <div className="form-success-icon">✓</div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: 8, color: "#065f46" }}>
                    Bericht succesvol verzonden!
                  </h3>
                  <p style={{ lineHeight: 1.6, color: "#047857", maxWidth: 480, margin: "0 auto" }}>
                    Bedankt voor uw bericht, <strong>{formData.name}</strong>. We hebben uw aanvraag over &ldquo;{formData.subject}&rdquo; goed ontvangen.
                    We sturen zo snel mogelijk een reactie naar <strong>{formData.email}</strong>{formData.phone ? ` of contacteren u telefonisch op ${formData.phone}` : ""}.
                  </p>
                  <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={handleReset}
                      className="btn btn--outline"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Nog een bericht sturen
                    </button>
                    <Link
                      href="/"
                      className="btn btn--primary"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Terug naar Home
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-pure-form">
                  {errorMessage && (
                    <div className="form-error-alert" role="alert">
                      <span>⚠️ {errorMessage}</span>
                    </div>
                  )}

                  <div className="form-grid-2">
                    {/* Name */}
                    <div className="form-field">
                      <label htmlFor="contact-name">
                        Uw volledige naam <span className="req">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        className="form-input"
                        placeholder="bijv. Jan De Smet"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    {/* Email */}
                    <div className="form-field">
                      <label htmlFor="contact-email">
                        E-mailadres <span className="req">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        className="form-input"
                        placeholder="bijv. jan@voorbeeld.be"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    {/* Phone */}
                    <div className="form-field">
                      <label htmlFor="contact-phone">
                        Telefoonnummer <span className="text-muted" style={{ fontWeight: 400, fontSize: "0.8rem" }}>(optioneel)</span>
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        className="form-input"
                        placeholder="bijv. 0470 12 34 56"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    {/* Subject */}
                    <div className="form-field">
                      <label htmlFor="contact-subject">
                        Onderwerp <span className="req">*</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="contact-subject"
                          className="form-select"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          disabled={loading}
                        >
                          {SUBJECT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="form-field">
                    <label htmlFor="contact-message">
                      Uw bericht of vraag <span className="req">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      className="form-textarea"
                      placeholder="Beschrijf hier uw vraag, gewenste bandenmaat of opmerking zo duidelijk mogelijk..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  {/* Privacy notice */}
                  <div className="form-privacy-note">
                    <span className="privacy-shield-icon">🔒</span>
                    <span>
                      Wij respecteren uw privacy. Uw gegevens worden uitsluitend gebruikt om uw contactaanvraag te beantwoorden.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn--primary btn--lg w-full contact-submit-btn"
                  >
                    {loading ? (
                      <span className="btn-loading-flex">
                        <span className="spinner-dots" />
                        Bericht wordt verstuurd...
                      </span>
                    ) : (
                      <span className="btn-send-flex">
                        <span>Bericht versturen</span>
                        <span className="btn-arrow">→</span>
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map & Location Highlights */}
      <section className="contact-map-section">
        <div className="container">
          <div className="map-card-wrapper">
            <div className="map-card-info">
              <span className="label">Bereikbaarheid</span>
              <h2 className="h3 text-dark" style={{ marginTop: 8 }}>
                Vlot bereikbaar in regio Gent
              </h2>
              <p className="text-muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
                Gent Bandenservice BV is strategisch gelegen aan de Dendermondsesteenweg 428 in Sint-Amandsberg, op slechts 5 minuten van station Gent-Dampoort en vlot toegankelijk via de R4 en R40.
              </p>
              <ul className="map-features-list">
                <li>
                  <span className="check-bullet">✓</span>
                  <strong>Gratis parking</strong> voor personenwagens, bestelwagens en lichte vrachtwagens.
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  <strong>Comfortabele wachtruimte</strong> met gratis WiFi en koffie terwijl wij aan uw banden werken.
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  <strong>Moderne montagestraten</strong> met state-of-the-art balanceer- en richtapparatuur.
                </li>
              </ul>
              <a
                href="https://maps.google.com/?q=Gent+Bandenservice+Dendermondsesteenweg+428+9040+Sint-Amandsberg"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ marginTop: 24, alignSelf: "flex-start" }}
              >
                🗺️ Open routeplanner in Google Maps
              </a>
            </div>

            <div className="map-embed-container">
              <iframe
                title="Locatie Gent Bandenservice"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2507.971578335035!2d3.753381676887532!3d51.05364177171358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3713f044942cf%3A0xe1001eb708942b08!2sDendermondsesteenweg%20428%2C%209040%20Gent!5e0!3m2!1snl!2sbe!4v1716382901234!5m2!1snl!2sbe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contact-faq">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <span className="label">Veelgestelde Vragen</span>
            <h2 className="h2 text-dark">Heeft u nog een vraag?</h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Krijg snel antwoord op veelgestelde vragen over onze service en werkwijze.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item${isOpen ? " faq-item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-chevron">▾</span>
                  </button>
                  {isOpen && <div className="faq-answer">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.12 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.22 1.21h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.48 1.34 5L2 22l5.17-1.34c1.47.8 3.14 1.23 4.87 1.23 5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.25c-1.54 0-3.04-.42-4.36-1.21l-.31-.19-3.23.85.86-3.15-.2-.33c-.87-1.38-1.33-2.99-1.33-4.64 0-4.55 3.7-8.25 8.24-8.25 4.54 0 8.24 3.7 8.24 8.25 0 4.55-3.7 8.25-8.21 8.25zm4.51-6.17c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.23-.19-.48-.32z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" />
      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
