import type { Metadata } from "next";
import Link from "next/link";
import "./diensten.css";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Diensten & Tarieven — Montage, Balans & Herstelling Gent",
  description:
    "Professionele bandenservice in Gent: montage & balanceren, gecertificeerde koud-vulkanisatie bandenherstelling, TPMS sensoren en seizoenswissel. Transparante tarieven vanaf €15.",
  alternates: {
    canonical: `${SITE_URL}/diensten`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/diensten`,
    siteName: "Gent Bandenservice BV",
    title: "Diensten & Tarieven — Montage, Balans & Herstelling Gent | Gent Bandenservice BV",
    description:
      "Vakkundige bandenservice in Gent: montage & balanceren, gecertificeerde bandenherstelling, TPMS sensoren en wielwissel. Bekijk onze eerlijke tarieven.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Bandendiensten en tarieven bij Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diensten & Tarieven — Gent Bandenservice BV",
    description:
      "Professionele montage, balanceren, herstelling en TPMS diagnose in Gent. Transparante prijzen.",
    images: [OG_IMAGE],
  },
};

interface ServiceItem {
  id: string;
  badge: string;
  iconSvg: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  price: string;
  priceNote?: string;
  time: string;
  appointmentServiceCode: string;
  popular?: boolean;
}

const servicesData: ServiceItem[] = [
  {
    id: "montage",
    badge: "Meest Gekozen",
    popular: true,
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="2" y1="12" x2="4" y2="12" />
      </svg>
    ),
    title: "Montage & Balanceren",
    tagline: "Computergestuurde bandenmontage met maximale bescherming voor uw velgen",
    description:
      "Vakkundige montage van eigen meegebrachte banden of banden uit onze voorraad op stalen en lichtmetalen velgen tot 24 inch. Onze geavanceerde balanceermachines neutraliseren iedere onbalans tot op de gram nauwkeurig.",
    features: [
      "Contactloos opspannen ter preventie van velgrandschade",
      "Dynamische computeruitbalancering per wiel met zinkgewichten",
      "Nieuwe kwaliteitsventielen standaard inbegrepen",
      "Vastgezet met geijkte momentsleutel volgens fabrieksspecificatie",
      "Geschikt voor Runflat en Electric Vehicle (EV) banden",
    ],
    price: "v.a. €20",
    priceNote: "per band incl. btw & balanceren",
    time: "≈ 40 min (4 banden)",
    appointmentServiceCode: "FITTING",
  },
  {
    id: "herstelling",
    badge: "Direct Binnenrijden",
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "Bandenherstelling",
    tagline: "Veilige koud-vulkanisatie van binnenuit conform Europese norm",
    description:
      "Niet elke lekke band hoeft meteen vervangen te worden. We demonteren de band om het karkas van binnenuit te inspecteren en repareren het loopvlak duurzaam met een gecertificeerde paddenstoel-plug.",
    features: [
      "Grondige interne karkasinspectie op verborgen koordlaagschade",
      "Gecertificeerde koud-vulkanisatie met minicombi-plug",
      "Inclusief opnieuw uitbalanceren en hermontage op de velg",
      "Garantie op het gerepareerde loopvlak",
      "Bij acute pech direct welkom zonder voorafgaande afspraak",
    ],
    price: "v.a. €20",
    priceNote: "inclusief balanceren & controle",
    time: "≈ 25 min",
    appointmentServiceCode: "REPAIR",
  },
  {
    id: "wielenwissel",
    badge: "Seizoenswissel",
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m10 15 5-3-5-3v6Z" />
      </svg>
    ),
    title: "Wielen Wisselen (Zomer / Winter)",
    tagline: "Snelle en zorgeloze omwissel van complete wielensets",
    description:
      "Breng uw complete wielen (banden op velg) mee naar de werkplaats. Wij wisselen de set vlot om, brengen alle 4 de banden op de juiste spanning en controleren de staat van de banden.",
    features: [
      "Omwisselen van 4 complete wielen op de auto",
      "Inspectie van profieldiepte en slijtagepatroon",
      "Banden op correcte bandenspanning volgens fabrieksopgave",
      "Aandraaien met geijkte momentsleutel",
      "Optioneel: direct opnieuw balanceren voor trillingsvrij rijplezier",
    ],
    price: "v.a. €30",
    priceNote: "voor een complete set van 4 wielen",
    time: "≈ 20 min",
    appointmentServiceCode: "OTHER",
  },
  {
    id: "tpms",
    badge: "Keuringsplicht",
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
        <circle cx="12" cy="12" r="2" />
        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
        <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
      </svg>
    ),
    title: "TPMS Sensoren & Diagnose",
    tagline: "Vervanging, programmering en inleren van bandenspanningssensoren",
    description:
      "Brandt het TPMS waarschuwingslampje op uw dashboard? Wij beschikken over geavanceerde OBD-diagnoseapparatuur om sensorbatterijen uit te lezen, sensor-ID's te klonen of nieuwe sensoren in te leren.",
    features: [
      "Uitlezen van batterijstatus en signaalsterkte per wiel",
      "Vervanging met kwalitatieve OEM-compatibele TPMS sensoren",
      "Direct softwarematig inleren via de OBD-II poort van uw wagen",
      "Compatibel met 99% van alle automerken (BMW, Mercedes, VAG, Renault, Tesla e.a.)",
      "Gegarandeerde goedkeuring voor de periodieke autokeuring",
    ],
    price: "v.a. €40",
    priceNote: "per sensor incl. montage & inleren",
    time: "≈ 30 min",
    appointmentServiceCode: "OTHER",
  },
  {
    id: "bandenverkoop",
    badge: "Ruime Voorraad",
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    title: "Nieuwe & Tweedehands Banden",
    tagline: "Topmerken en streng gekeurde tweedehands banden direct leverbaar",
    description:
      "Zoekt u scherpe prijzen voor A-merken (Michelin, Continental, Bridgestone, Goodyear, Pirelli) of gekeurde tweedehands banden met 5 tot 7 mm profiel? Wij hebben honderden banden direct op voorraad in Gent.",
    features: [
      "Grote fysieke voorraad zomer-, winter- en 4-seizoenenbanden",
      "Gekeurde tweedehands banden van A-merken vanaf €35 inclusief btw",
      "Nieuwe kwaliteitsbanden tegen uiterst competitieve dagprijzen",
      "Directe montage mogelijk zonder wachttijd",
      "Eerlijk advies afgestemd op uw rijstijl en kilometrage",
    ],
    price: "v.a. €35",
    priceNote: "per tweedehands band incl. btw",
    time: "Direct uit voorraad",
    appointmentServiceCode: "FITTING",
  },
  {
    id: "inspectie",
    badge: "100% Gratis",
    iconSvg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    title: "Gratis Bandeninspectie",
    tagline: "Vrijblijvende controle op profieldiepte, spanning en slijtage",
    description:
      "Twijfelt u over de veiligheid van uw banden voor een vakantierit of autokeuring? Rijd even langs voor een gratis visuele inspectie. U krijgt helder en eerlijk advies zonder enige aankoopverplichting.",
    features: [
      "Exacte meting van profieldiepte op 3 meetpunten per band",
      "Controle op droogtescheurtjes, canvasbreuken en bulten",
      "Opsporen van afwijkende slijtagepatronen",
      "Banden op correcte bandenspanning brengen volgens fabriekswaarde",
      "Eerlijk advies of vervanging werkelijk noodzakelijk is",
    ],
    price: "GRATIS",
    priceNote: "zonder enige aankoopverplichting",
    time: "≈ 15 min",
    appointmentServiceCode: "INSPECTION",
  },
];

const priceTableData = [
  { service: "Montage & balanceren stalen velg (t/m 16\")", price: "€20,00 / band", time: "≈ 10 min / band" },
  { service: "Montage & balanceren lichtmetalen velg (15\" t/m 18\")", price: "€25,00 / band", time: "≈ 10 min / band" },
  { service: "Montage & balanceren grote velg (19\" t/m 22\")", price: "€27,50 / band", time: "≈ 12 min / band" },
  { service: "Montage & balanceren Runflat / EV versterkte banden", price: "€30,00 / band", time: "≈ 15 min / band" },
  { service: "Bandenherstelling (koud-vulkanisatie van binnenuit met plug)", price: "€20,00 / band", time: "≈ 25 min" },
  { service: "Wielenwissel complete set (4 complete wielen op de auto)", price: "€30,00 / set", time: "≈ 20 min" },
  { service: "Wielenwissel + balanceren complete set (4 wielen)", price: "€50,00 / set", time: "≈ 30 min" },
  { service: "TPMS sensor diagnose & storingsreset", price: "€15,00", time: "≈ 15 min" },
  { service: "Nieuwe TPMS sensor leveren, inleren & monteren", price: "€40,00 / sensor", time: "≈ 25 min" },
  { service: "Gekeurde tweedehands banden A-merken (5-7mm profiel)", price: "v.a. €35,00 / band", time: "Direct leverbaar" },
  { service: "Nieuwe banden A-merken (Michelin, Continental, Pirelli...)", price: "Scherpe dagprijzen", time: "Op aanvraag" },
  { service: "Gratis visuele banden- en spanningsinspectie", price: "€0,00 (Gratis)", time: "≈ 15 min" },
];

const faqs = [
  {
    q: "Moet ik een afspraak maken voor een lekke band?",
    a: "Nee! Bij acute pech of een lekke band hoeft u geen afspraak te maken. U kunt tijdens openingsuren direct binnenrijden bij onze werkplaats aan de Dendermondsesteenweg 428. We repareren uw band zo snel mogelijk terwijl u wacht.",
  },
  {
    q: "Verkopen jullie ook tweedehands banden?",
    a: "Jazeker! We hebben doorlopend een grote voorraad gekeurde tweedehands banden van A-merken (Michelin, Continental, Pirelli, Bridgestone, Goodyear) met minimaal 5 tot 7 mm profiel, vanaf €35 per band inclusief btw. Vraag gerust naar uw bandenmaat.",
  },
  {
    q: "Kan ik ook zelf aangekochte banden bij jullie laten monteren?",
    a: "Ja, absoluut! U bent van harte welkom met eigen banden die u elders online heeft gekocht. Wij monteren en balanceren deze vakkundig met dezelfde zorgvuldigheid en precisie.",
  },
  {
    q: "Hoe weet ik of mijn lekke band gerepareerd kan worden?",
    a: "Een band kan veilig gerepareerd worden als het lek zich in het centrale loopvlak bevindt (niet in de schouder of zijwand) en kleiner is dan 6 mm. Zodra we de band demonteren, controleren we of de binnenkant niet beschadigd is door rijden met te lage spanning.",
  },
  {
    q: "Kan ik wachten terwijl er aan mijn auto gewerkt wordt?",
    a: "Zeker! In onze comfortabele wachtruimte geniet u van verse koffie, water en snelle gratis WiFi. De meeste montages of herstellingen zijn binnen 30 tot 45 minuten klaar.",
  },
];

export default function DienstenPage() {
  return (
    <>
      {/* Page Hero */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Diensten</span>
          </div>
          <span className="hero-trust-badge">
            <span className="badge-sparkle">★</span> Bandspecialist in Gent &amp; Omstreken
          </span>
          <h1 className="h1 text-white" style={{ marginTop: 14 }}>
            Onze Bandendiensten &amp; Tarieven
          </h1>
          <p className="page-hero__sub">
            Van computergestuurde montage en balancering tot snelle bandenherstelling, TPMS-diagnose en scherpe bandenverkoop. Klaar terwijl u wacht met heldere prijzen en garantie.
          </p>

          {/* Quick highlight pills */}
          <div className="hero-pills-row">
            <div className="hero-pill">
              <span className="hero-pill-icon">⏱️</span>
              <span>Klaar binnen 45 min</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">🅿️</span>
              <span>Ruime parking voor de deur</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">🛡️</span>
              <span>100% Gecertificeerd vakmanschap</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">☕</span>
              <span>Wachtruimte met gratis WiFi &amp; koffie</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Services Grid */}
      <section className="section bg-surface diensten-main-section">
        <div className="container">
          <div className="diensten-header-intro">
            <span className="label">Vakmanschap &amp; Precisie</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Alles voor uw banden onder één dak
            </h2>
            <p className="text-muted" style={{ maxWidth: 680, margin: "8px auto 0", fontSize: "0.98rem" }}>
              Wij werken met moderne montagestraten en geijkte apparatuur om uw velgen en banden in absolute topconditie te houden.
            </p>
          </div>

          <div className="diensten-cards-grid">
            {servicesData.map((s) => (
              <article key={s.id} id={s.id} className={`dienst-card ${s.popular ? "dienst-card--popular" : ""}`}>
                {s.popular && <div className="card-popular-ribbon">Aanrader</div>}

                <div className="dienst-card__top">
                  <div className="dienst-card__header-flex">
                    <div className="dienst-card__icon-wrap">
                      {s.iconSvg}
                    </div>
                    <div className="dienst-card__badge-tag">{s.badge}</div>
                  </div>

                  <h3 className="dienst-card__title">{s.title}</h3>
                  <p className="dienst-card__tagline">{s.tagline}</p>
                  <p className="dienst-card__desc">{s.description}</p>
                </div>

                <div className="dienst-card__features-wrap">
                  <span className="features-headline">Inbegrepen in deze service:</span>
                  <ul className="dienst-card__features">
                    {s.features.map((f, idx) => (
                      <li key={idx}>
                        <span className="feat-check">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="dienst-card__bottom">
                  <div className="dienst-card__price-box">
                    <div className="dienst-card__price-val">{s.price}</div>
                    <div className="dienst-card__price-sub">{s.priceNote}</div>
                    <div className="dienst-card__time">
                      <span className="clock-mini">🕒</span> {s.time}
                    </div>
                  </div>

                  <div className="dienst-card__cta-group">
                    <Link
                      href={`/afspraak?service=${s.appointmentServiceCode}`}
                      className="btn btn--primary w-full dienst-cta-primary"
                    >
                      <span>Afspraak inplannen</span>
                      <span className="arrow-btn">→</span>
                    </Link>
                    <a
                      href="https://wa.me/32467871205?text=Hallo%20Gent%20Bandenservice,%20ik%20heb%20een%20vraag%20over%20"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--outline w-full dienst-cta-secondary"
                    >
                      💬 WhatsApp advies
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing Table */}
      <section className="section bg-white pricing-table-section">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <span className="label">Eerlijk &amp; Transparant</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Onze Volledige Tarievenlijst
            </h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Geen verborgen meerkosten. Alle onderstaande tarieven zijn inclusief 21% btw, milieubijdrage en balanceren.
            </p>
          </div>

          <div className="pricing-table-wrapper">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Dienst &amp; Wieltype</th>
                  <th>Geschatte Duur</th>
                  <th style={{ textAlign: "right" }}>Prijs (incl. btw)</th>
                </tr>
              </thead>
              <tbody>
                {priceTableData.map((row, idx) => (
                  <tr key={idx} className={row.price.includes("GRATIS") ? "tr-highlight" : ""}>
                    <td className="td-service">
                      <strong>{row.service}</strong>
                    </td>
                    <td className="td-time">
                      <span className="time-pill">{row.time}</span>
                    </td>
                    <td className="td-price" style={{ textAlign: "right" }}>
                      <span className="price-tag">{row.price}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pricing-footer-note">
            <span>💡 <strong>Tip:</strong> Heeft u speciale runflat-, camper- of bestelwagenbanden? Neem gerust vooraf contact met ons op via <a href="tel:+32467871205">0467 87 12 05</a> voor gericht advies.</span>
          </div>
        </div>
      </section>

      {/* How it works (3 Steps Connected Workflow) */}
      <section className="section bg-surface how-it-works-section">
        <div className="container">
          <div className="how-it-works-header">
            <span className="label">Eenvoudig &amp; Transparant</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Hoe verloopt uw bezoek?
            </h2>
            <p className="text-muted" style={{ maxWidth: 620, margin: "8px auto 0", fontSize: "0.98rem" }}>
              Van het eerste contact tot een veilige rit: in 3 eenvoudige stappen snel en vakkundig geholpen.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="process-card">
              <div className="process-card__top">
                <span className="process-step-badge">Stap 01</span>
                <span className="process-time-tag">⏱️ 2 min online</span>
              </div>
              <div className="process-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="process-title">1. Reserveren of Binnenrijden</h3>
              <p className="process-desc">
                Plan vooraf uw gewenste datum en tijdslot in onze realtime planner om wachttijd te vermijden, of rijd bij een acute lekke band direct binnen.
              </p>
              <ul className="process-perks">
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Geen wachttijd met online reservatie</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Pech of lek? Direct welkom zonder afspraak</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Geen verplichte vooruitbetaling</span>
                </li>
              </ul>
            </div>

            {/* Connection Arrow for Desktop */}
            <div className="process-connector" aria-hidden="true">
              <span className="connector-arrow">→</span>
            </div>

            {/* Step 2 */}
            <div className="process-card process-card--highlight">
              <div className="process-card__top">
                <span className="process-step-badge process-step-badge--active">Stap 02</span>
                <span className="process-time-tag">☕ 25 – 45 min</span>
              </div>
              <div className="process-icon-wrap process-icon-wrap--active">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                </svg>
              </div>
              <h3 className="process-title">2. Vakkundige Montage &amp; Balans</h3>
              <p className="process-desc">
                Onze monteurs voeren de de-(mon)tage schadevrij uit en balanceren uw wielen computergestuurd, terwijl u ontspant in onze lounge.
              </p>
              <ul className="process-perks">
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>100% velgbescherming bij (de)montage</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Dynamische computerbalancering</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Koffie, water &amp; snelle WiFi in de wachtruimte</span>
                </li>
              </ul>
            </div>

            {/* Connection Arrow for Desktop */}
            <div className="process-connector" aria-hidden="true">
              <span className="connector-arrow">→</span>
            </div>

            {/* Step 3 */}
            <div className="process-card">
              <div className="process-card__top">
                <span className="process-step-badge">Stap 03</span>
                <span className="process-time-tag">🚗 Rijklaar</span>
              </div>
              <div className="process-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="process-title">3. Veilig &amp; Gekeurd Vertrekken</h3>
              <p className="process-desc">
                We controleren de momentsleutel-aandraaiing en bandenspanning rondom. U rekent eenvoudig af en rijdt zorgeloos en veilig de weg op.
              </p>
              <ul className="process-perks">
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Controle momentsleutel &amp; juiste spanning</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Bancontact, Payconiq, Cash of Factuur</span>
                </li>
                <li>
                  <span className="perk-bullet">✓</span>
                  <span>Volledige garantie op montagewerk</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Action Pill below process */}
          <div className="how-it-works-action-banner">
            <div className="action-banner-text">
              <span className="action-pill-icon">✨</span>
              <span><strong>Vandaag nog langskomen?</strong> Bekijk direct de actuele vrije tijdsloten in onze online planner.</span>
            </div>
            <Link href="/afspraak" className="btn btn--primary btn--sm action-banner-btn">
              <span>Afspraak Inplannen</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Workshop Equipment & Quality Banner */}
      <section className="section bg-dark workshop-features-section">
        <div className="container">
          <div className="workshop-banner-grid">
            <div className="workshop-banner-text">
              <span className="label" style={{ color: "var(--primary-light)" }}>Waarom Gent Bandenservice BV?</span>
              <h2 className="h2 text-white" style={{ marginTop: 8 }}>
                Professionele apparatuur en vakkennis voor elk type band
              </h2>
              <p className="text-white-sub" style={{ marginTop: 14, lineHeight: 1.6 }}>
                Wij werken met zorg en precisie. Onze apparatuur zorgt ervoor dat ook kwetsbare aluminium velgen, brede sportbanden en moderne elektrische voertuigen met de grootste voorzichtigheid worden behandeld.
              </p>

              <div className="workshop-usps">
                <div className="usp-item">
                  <div className="usp-icon">💎</div>
                  <div>
                    <strong>100% Velgrandbescherming</strong>
                    <p>Onze monteermachines raken de velgrand niet aan tijdens de-(mon)tage.</p>
                  </div>
                </div>

                <div className="usp-item">
                  <div className="usp-icon">🎯</div>
                  <div>
                    <strong>Dynamische 3D Computerbalancering</strong>
                    <p>Geen trillingen meer op de snelweg dankzij uiterst precieze kalibratie.</p>
                  </div>
                </div>

                <div className="usp-item">
                  <div className="usp-icon">⚡</div>
                  <div>
                    <strong>EV &amp; Runflat Ervaring</strong>
                    <p>Geschikt voor zware elektrische wagens (Tesla, Polestar e.a.) en stugge Runflat banden.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="workshop-contact-quick-box">
              <h3 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, marginBottom: 12 }}>
                Snel een monteur spreken?
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 20 }}>
                Twijfelt u over een trilling, bandenmaat of lekke band? Onze technici staan klaar met direct advies.
              </p>

              <a href="tel:+32467871205" className="btn btn--primary w-full" style={{ justifyContent: "center", marginBottom: 12 }}>
                📞 0467 87 12 05
              </a>

              <Link href="/afspraak" className="btn btn--outline w-full" style={{ justifyContent: "center", borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}>
                📅 Online afspraak maken
              </Link>

              <div style={{ marginTop: 18, textAlign: "center", fontSize: "0.82rem", color: "#64748b" }}>
                Maandag t/m Zaterdag 09:00 – 18:00
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="section bg-white diensten-faq-section">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 36px" }}>
            <span className="label">Vragen &amp; Antwoorden</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Veelgestelde Vragen over Onze Diensten
            </h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Heeft u nog twijfels? Hier vindt u direct antwoord op de meest gestelde vragen.
            </p>
          </div>

          <div className="diensten-faq-list">
            {faqs.map((faq, idx) => (
              <details key={idx} className="diensten-faq-item">
                <summary className="diensten-faq-summary">
                  <span>{faq.q}</span>
                  <span className="diensten-faq-chevron">▾</span>
                </summary>
                <div className="diensten-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="diensten-cta-banner">
        <div className="container">
          <div className="cta-banner-content">
            <h2 className="h2 text-white">Klaar voor een veilige rit?</h2>
            <p className="text-white-sub" style={{ marginTop: 8, fontSize: "1.05rem" }}>
              Kies uw gewenste tijdslot in onze realtime afsprakenplanner of kom direct langs in Gent.
            </p>
            <div className="cta-banner-buttons">
              <Link href="/afspraak" className="btn btn--primary btn--lg">
                📅 Direct Afspraak Maken
              </Link>
              <Link href="/contact" className="btn btn--outline btn--lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                ✉️ Stel een vraag via het contactformulier
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
