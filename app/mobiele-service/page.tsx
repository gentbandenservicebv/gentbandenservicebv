import type { Metadata } from "next";
import Link from "next/link";
import "./mobiele-service.css";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Mobiele Bandenservice Gent — Bandenmontage aan Huis of Bedrijf | Gent Bandenservice BV",
  description:
    "Wij komen naar u toe! Mobiele bandenmontage, lekke band herstelling en seizoenswissel aan huis, op de parking of bij uw bedrijf in Gent en omstreken. Bel 0467 87 12 05.",
  keywords: [
    "mobiele bandenservice gent",
    "banden vervangen aan huis gent",
    "mobiele bandenmontage",
    "lekke band herstellen gent",
    "pechverhelping banden gent",
    "bandenmonteur op locatie",
    "bandenwissel aan huis gent",
    "winterbanden wisselen thuis",
    "mobiele bandencentrale gent",
    "banden depannage gent",
  ],
  alternates: {
    canonical: `${SITE_URL}/mobiele-service`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/mobiele-service`,
    siteName: "Gent Bandenservice BV",
    title:
      "Mobiele Bandenservice Gent — Bandenmontage aan Huis of Bedrijf | Gent Bandenservice BV",
    description:
      "Vakkundige mobiele bandenservice in Gent en omstreken: lekke band, montage of wielenwissel — wij rijden naar u toe. Snel, veilig en transparant geprijsd.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Mobiele bandenservice Gent — Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobiele Bandenservice Gent — Gent Bandenservice BV",
    description:
      "Lekke band, montage of wielenwissel aan huis? Wij rijden naar u toe in Gent en omstreken. Bel 0467 87 12 05.",
    images: [OG_IMAGE],
  },
};

interface MobileService {
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
  popular?: boolean;
}

const mobileServices: MobileService[] = [
  {
    id: "lekke-band-ter-plaatse",
    badge: "Meest Gevraagd",
    popular: true,
    iconSvg: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Lekke Band — Noodservice",
    tagline: "Wij rijden naar u toe voor een snelle reparatie of vervanging",
    description:
      "Lekke band onderweg, op de parking of thuis? Bel ons en wij komen zo snel mogelijk ter plaatse. We repareren het lek van binnenuit of zetten een nieuwe band op — u hoeft zelf niets te doen.",
    features: [
      "Snelle interventie bij pech op de weg of parking",
      "Koud-vulkanisatie reparatie ter plaatse indien mogelijk",
      "Vervanging door een band uit ons rijdend depot",
      "Inclusief balanceren met draagbaar apparaat",
      "Geen gevaarlijk wachten langs de baan",
    ],
    price: "op aanvraag",
    priceNote: "afhankelijk van locatie en service",
    time: "≈ 30–60 min",
  },
  {
    id: "montage-aan-huis",
    badge: "Populair",
    iconSvg: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Bandenmontage aan Huis",
    tagline: "Nieuwe banden gemonteerd zonder dat u naar de werkplaats rijdt",
    description:
      "Heeft u nieuwe banden besteld of gekocht? Plan een afspraak en wij komen uw banden vakkundig monteren en balanceren — in uw oprit, garage of op de parking. Professioneel en velgvriendelijk.",
    features: [
      "Professionele mobiele monteermachine en balanceertoestel",
      "Contactloos opspannen om velgrandschade te voorkomen",
      "Computergestuurde balancering ter plaatse",
      "Nieuwe ventielen standaard inbegrepen",
      "Aandraaien met geijkte momentsleutel",
    ],
    price: "v.a. €30",
    priceNote: "per band + verplaatsingskosten",
    time: "≈ 60–90 min (4 banden)",
  },
  {
    id: "seizoenswissel-aan-huis",
    badge: "Seizoenswissel",
    iconSvg: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m10 15 5-3-5-3v6Z" />
      </svg>
    ),
    title: "Seizoenswissel aan Huis",
    tagline: "Zomer- naar winterbanden gewisseld aan uw deur",
    description:
      "Geen tijd om naar de werkplaats te komen voor de seizoenswissel? Wij wisselen uw complete wielenset om aan uw voordeur of op de parking van uw werk. Snel en correct aangedraaid.",
    features: [
      "Omwisselen van 4 complete wielen (band op velg)",
      "Controle profieldiepte en slijtagepatroon",
      "Banden op correcte spanning brengen",
      "Aandraaien met geijkte momentsleutel",
      "Optioneel: balanceren ter plaatse bijbestellen",
    ],
    price: "v.a. €50",
    priceNote: "complete set van 4 wielen + verplaatsing",
    time: "≈ 30–45 min",
  },
  {
    id: "vloot-service",
    badge: "Bedrijven",
    iconSvg: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Vloot- & Bedrijfsservice",
    tagline: "Onderhoud van meerdere voertuigen op uw terrein of depot",
    description:
      "Heeft u een wagenpark of bestelwagens die niet makkelijk naar een werkplaats rijden? Wij plannen een vaste dag in en servicen uw volledige vloot op uw eigen terrein, bedrijfsparking of depot.",
    features: [
      "Vaste interventieplanning voor uw volledige wagenpark",
      "Montage, wissel, herstelling en inspectie ter plaatse",
      "Prioriteit bij pechgevallen binnen de vloot",
      "Facturatie op bedrijfsnaam mogelijk",
      "Scherpe tarieven bij regelmatig contract",
    ],
    price: "op maat",
    priceNote: "vraag een vrijblijvende offerte aan",
    time: "Op afspraak",
  },
];

const serviceArea = [
  "Gent (centrum & alle deelgemeenten)",
  "Destelbergen & Heusden",
  "Melle & Merelbeke",
  "Wetteren & Laarne",
  "Lochristi & Wachtebeke",
  "Evergem & Zelzate",
  "Mariakerke & Drongen",
  "Sint-Martens-Latem & De Pinte",
  "Zwijnaarde & Gentbrugge",
  "Oostakker & Wondelgem",
];

const faqs = [
  {
    q: "In welke regio's bieden jullie mobiele service aan?",
    a: "Wij rijden naar alle deelgemeenten van Gent en de omliggende gemeenten binnen een straal van ±25 km: Destelbergen, Melle, Merelbeke, Wetteren, Lochristi, Evergem, Sint-Martens-Latem, Zwijnaarde en meer. Twijfelt u of uw locatie binnen het servicegebied valt? Bel ons gerust op 0467 87 12 05.",
  },
  {
    q: "Hoe snel kunnen jullie ter plaatse zijn bij een lekke band?",
    a: "Bij acute pech proberen wij zo snel mogelijk ter plaatse te zijn, doorgaans binnen 1 tot 2 uur afhankelijk van de drukte en uw locatie. Bel ons direct op 0467 87 12 05 voor een realistische inschatting. Voor geplande afspraken (montage aan huis, seizoenswissel) kiezen we samen een vast tijdstip.",
  },
  {
    q: "Kunnen jullie ook banden meebrengen of moet ik ze zelf voorzien?",
    a: "Dat kan! Wij hebben een rijdend depot met een selectie tweedehands en nieuwe banden. Als u ons vooraf uw bandenmaat doorgeeft (breedte/profiel/diameter, bv. 205/55R16), proberen wij de juiste maat mee te brengen. Heeft u banden besteld bij een andere leverancier, dan monteren we die uiteraard ook.",
  },
  {
    q: "Wat kost de verplaatsing?",
    a: "De verplaatsingskosten hangen af van uw afstand tot onze werkplaats in Gent. Voor adressen binnen Gent is dit doorgaans €15–€25. Vraag een offerte aan via WhatsApp of telefoon voor een exacte prijs op basis van uw locatie.",
  },
  {
    q: "Is de kwaliteit van mobiele service gelijk aan die in de werkplaats?",
    a: "Absoluut. Wij gebruiken exact dezelfde professionele apparatuur — inclusief mobiele monteermachine en draagbaar balanceertoestel — als in onze werkplaats. De kwaliteit van het vakmanschap en de garantie op het montagewerk zijn identiek.",
  },
  {
    q: "Kunnen jullie ook TPMS sensoren vervangen ter plaatse?",
    a: "In veel gevallen wel. Eenvoudige TPMS-diagnose en reset doen we ter plaatse. Voor sensor-vervanging en inleren via OBD-II zijn we uitgerust, maar complexe gevallen verwijzen we soms door naar onze werkplaats. Contacteer ons vooraf voor de specifieke situatie van uw voertuig.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["AutoRepair", "AutomotiveBusiness"],
      "@id": `${SITE_URL}/#autorepair`,
      "name": "Gent Bandenservice BV — Mobiele Bandenservice",
      "url": `${SITE_URL}/mobiele-service`,
      "logo": `${SITE_URL}/logo-icon.png`,
      "image": OG_IMAGE,
      "telephone": "+32467871205",
      "email": "info@gentbandenservice.be",
      "priceRange": "€€",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Dendermondsesteenweg 428",
        "addressLocality": "Sint-Amandsberg (Gent)",
        "postalCode": "9040",
        "addressRegion": "Oost-Vlaanderen",
        "addressCountry": "BE",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 51.0563,
        "longitude": 3.7554,
      },
      "areaServed": [
        { "@type": "City", "name": "Gent" },
        { "@type": "City", "name": "Destelbergen" },
        { "@type": "City", "name": "Heusden" },
        { "@type": "City", "name": "Melle" },
        { "@type": "City", "name": "Merelbeke" },
        { "@type": "City", "name": "Wetteren" },
        { "@type": "City", "name": "Lochristi" },
        { "@type": "City", "name": "Evergem" },
        { "@type": "City", "name": "Sint-Martens-Latem" },
        { "@type": "City", "name": "De Pinte" },
        { "@type": "City", "name": "Zwijnaarde" },
        { "@type": "City", "name": "Drongen" },
      ],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "18:00",
        },
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/mobiele-service#service`,
      "name": "Mobiele Bandenservice Gent",
      "serviceType": "Mobiele Bandenmontage & Bandenherstelling",
      "provider": {
        "@id": `${SITE_URL}/#autorepair`,
      },
      "description":
        "Mobiele bandenmontage, herstelling bij lekke band en seizoenswissel aan huis of op bedrijfslocatie in Gent en omstreken.",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Gent en omstreken (straal ±25 km)",
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Mobiele Bandendiensten",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Lekke Band Noodservice ter plaatse",
            },
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Bandenmontage aan Huis",
            },
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Seizoenswissel aan Huis",
            },
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Vloot- & Bedrijfsservice op locatie",
            },
          },
        ],
      },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": SITE_URL,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Mobiele Service",
          "item": `${SITE_URL}/mobiele-service`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.a,
        },
      })),
    },
  ],
};

export default function MobieleServicePage() {
  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Hero */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Mobiele Service</span>
          </div>
          <span className="ms-hero-badge">
            <span className="ms-badge-sparkle">★</span> Wij komen naar u toe — Gent &amp; Omstreken
          </span>
          <h1 className="h1 text-white" style={{ marginTop: 14 }}>
            Mobiele Bandenservice
          </h1>
          <p className="page-hero__sub">
            Lekke band, seizoenswissel of nieuwe banden monteren? Onze mobiele monteurs rijden naar
            uw locatie — aan huis, op de parking of bij uw bedrijf. Professioneel vakmanschap,
            rechtstreeks aan uw deur.
          </p>

          <div className="ms-hero-pills">
            <div className="ms-hero-pill">
              <span>🚐</span>
              <span>Wij komen naar u toe</span>
            </div>
            <div className="ms-hero-pill">
              <span>⚡</span>
              <span>Snelle interventie</span>
            </div>
            <div className="ms-hero-pill">
              <span>🛡️</span>
              <span>Zelfde garantie als werkplaats</span>
            </div>
            <div className="ms-hero-pill">
              <span>📍</span>
              <span>Gent &amp; ±25 km rondom</span>
            </div>
          </div>

          <div className="ms-hero-cta-row">
            <a href="tel:+32467871205" className="btn btn--primary btn--lg">
              <PhoneIcon size={20} />
              <span>Bel direct: 0467 87 12 05</span>
            </a>
            <a
              href="https://wa.me/32467871205?text=Hallo%20Gent%20Bandenservice,%20ik%20heb%20interesse%20in%20de%20mobiele%20service."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--lg"
            >
              <WhatsAppIcon size={20} />
              <span>WhatsApp ons</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Services Cards */}
      <section className="section bg-surface mobiele-main-section">
        <div className="container">
          <div className="mobiele-header-intro">
            <span className="label">Aan Huis &amp; Op Locatie</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Wat doet onze mobiele monteur?
            </h2>
            <p className="text-muted" style={{ maxWidth: 680, margin: "8px auto 0", fontSize: "0.98rem" }}>
              Van een acute pechsituatie tot een geplande seizoenswissel — onze volledig uitgeruste
              mobiele eenheid staat voor u klaar.
            </p>
          </div>

          <div className="mobiele-cards-grid">
            {mobileServices.map((s) => (
              <article key={s.id} id={s.id} className={`ms-card${s.popular ? " ms-card--popular" : ""}`}>
                {s.popular && <div className="ms-card-ribbon">Meest gevraagd</div>}

                <div className="ms-card__top">
                  <div className="ms-card__header-flex">
                    <div className="ms-card__icon-wrap">{s.iconSvg}</div>
                    <div className="ms-card__badge">{s.badge}</div>
                  </div>
                  <h3 className="ms-card__title">{s.title}</h3>
                  <p className="ms-card__tagline">{s.tagline}</p>
                  <p className="ms-card__desc">{s.description}</p>
                </div>

                <div className="ms-card__features-wrap">
                  <span className="ms-features-label">Inbegrepen in deze service:</span>
                  <ul className="ms-card__features">
                    {s.features.map((f, idx) => (
                      <li key={idx}>
                        <span className="ms-feat-check">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ms-card__bottom">
                  <div className="ms-card__price-box">
                    <div className="ms-card__price-val">{s.price}</div>
                    <div className="ms-card__price-sub">{s.priceNote}</div>
                    <div className="ms-card__time">
                      <span>🕒</span> {s.time}
                    </div>
                  </div>

                  <div className="ms-card__cta-group">
                    <a href="tel:+32467871205" className="btn btn--primary w-full ms-cta-primary">
                      <PhoneIcon size={16} />
                      <span>Bel ons direct</span>
                    </a>
                    <a
                      href="https://wa.me/32467871205?text=Hallo,%20ik%20heb%20interesse%20in%20de%20mobiele%20service."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--whatsapp-outline w-full ms-cta-secondary"
                    >
                      <WhatsAppIcon size={16} />
                      <span>WhatsApp advies</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-white how-it-works-section">
        <div className="container">
          <div className="how-it-works-header">
            <span className="label">Eenvoudig &amp; Snel</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Hoe werkt de mobiele service?
            </h2>
            <p className="text-muted" style={{ maxWidth: 620, margin: "8px auto 0", fontSize: "0.98rem" }}>
              In 3 stappen geholpen — van uw eerste bericht tot een vakkundig gemonteerde band.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="process-card">
              <div className="process-card__top">
                <span className="process-step-badge">Stap 01</span>
                <span className="process-time-tag">⏱️ 2 min</span>
              </div>
              <div className="process-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.4 5.4l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3 className="process-title">1. Contacteer Ons</h3>
              <p className="process-desc">
                Bel of stuur een WhatsApp-bericht met uw locatie, het probleem en uw bandenmaat. Wij
                bevestigen de afspraak en geven een realistische aankomsttijd.
              </p>
              <ul className="process-perks">
                <li><span className="perk-bullet">✓</span><span>Bereikbaar ma–za 09:00–18:00</span></li>
                <li><span className="perk-bullet">✓</span><span>Directe inschatting via telefoon of WhatsApp</span></li>
                <li><span className="perk-bullet">✓</span><span>Geen lange wachtrij of formulier</span></li>
              </ul>
            </div>

            <div className="process-connector" aria-hidden="true">
              <span className="connector-arrow">→</span>
            </div>

            {/* Step 2 */}
            <div className="process-card process-card--highlight">
              <div className="process-card__top">
                <span className="process-step-badge process-step-badge--active">Stap 02</span>
                <span className="process-time-tag">🚐 Wij komen</span>
              </div>
              <div className="process-icon-wrap process-icon-wrap--active">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3 className="process-title">2. Wij Rijden naar U Toe</h3>
              <p className="process-desc">
                Onze monteur rijdt met volledig uitgeruste bestelwagen naar uw adres. U hoeft nergens
                naartoe — wacht gewoon comfortabel thuis of op uw werkplaats.
              </p>
              <ul className="process-perks">
                <li><span className="perk-bullet">✓</span><span>Professionele mobiele apparatuur aan boord</span></li>
                <li><span className="perk-bullet">✓</span><span>Selectie banden in rijdend depot</span></li>
                <li><span className="perk-bullet">✓</span><span>Dezelfde kwaliteit als in onze werkplaats</span></li>
              </ul>
            </div>

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
              <h3 className="process-title">3. Klaar &amp; Veilig op Weg</h3>
              <p className="process-desc">
                Na de montage controleert onze monteur de aandraaiing en bandenspanning. U betaalt
                ter plaatse en kunt onmiddellijk veilig rijden.
              </p>
              <ul className="process-perks">
                <li><span className="perk-bullet">✓</span><span>Controle momentsleutel &amp; juiste spanning</span></li>
                <li><span className="perk-bullet">✓</span><span>Betalen ter plaatse: cash of Bancontact</span></li>
                <li><span className="perk-bullet">✓</span><span>Volledige garantie op het montagewerk</span></li>
              </ul>
            </div>
          </div>

          <div className="how-it-works-action-banner">
            <div className="action-banner-text">
              <span className="action-pill-icon">📍</span>
              <span>
                <strong>Lekke band of spoedgeval?</strong> Bel ons direct — wij proberen zo snel
                mogelijk ter plaatse te zijn.
              </span>
            </div>
            <a href="tel:+32467871205" className="btn btn--primary btn--sm action-banner-btn">
              <PhoneIcon size={15} />
              <span>0467 87 12 05</span>
            </a>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="section bg-dark mobiele-area-section">
        <div className="container">
          <div className="mobiele-area-grid">
            <div className="mobiele-area-text">
              <span className="label" style={{ color: "var(--primary-light)" }}>Servicegebied</span>
              <h2 className="h2 text-white" style={{ marginTop: 8 }}>
                Waar zijn wij actief?
              </h2>
              <p style={{ color: "#cbd5e1", marginTop: 14, lineHeight: 1.65 }}>
                Onze mobiele monteur rijdt door Gent en de omliggende gemeenten binnen een straal van
                ±25 km. Staat uw gemeente er niet bij? Contacteer ons — in overleg is meer mogelijk.
              </p>

              <div className="mobiele-area-list">
                {serviceArea.map((zone, i) => (
                  <div key={i} className="mobiele-area-item">
                    <span className="area-check">📍</span>
                    <span>{zone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mobiele-area-contact-box">
              <h3 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, marginBottom: 12 }}>
                Afspraak of Noodgeval?
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 20 }}>
                Bel ons of stuur een WhatsApp-bericht. We bevestigen de afspraak en geven u een
                verwachte aankomsttijd.
              </p>

              <a
                href="tel:+32467871205"
                className="btn btn--primary w-full"
                style={{ justifyContent: "center", marginBottom: 12 }}
              >
                <PhoneIcon size={18} />
                <span>0467 87 12 05</span>
              </a>

              <a
                href="https://wa.me/32467871205?text=Hallo,%20ik%20heb%20interesse%20in%20de%20mobiele%20bandenservice."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp w-full"
                style={{ justifyContent: "center" }}
              >
                <WhatsAppIcon size={18} />
                <span>WhatsApp sturen</span>
              </a>

              <div
                style={{
                  marginTop: 20,
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span>🕘</span>
                  <span style={{ color: "#cbd5e1", fontSize: "0.88rem", fontWeight: 600 }}>
                    Maandag t/m Zaterdag 09:00 – 18:00
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>📌</span>
                  <a
                    href="https://maps.google.com/?q=Dendermondsesteenweg+428,+9040+Gent"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#94a3b8", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    Dendermondsesteenweg 428, 9040 Gent
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="section bg-surface mobiele-usps-section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="label">Voordelen</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Waarom kiezen voor mobiele service?
            </h2>
            <p
              className="text-muted"
              style={{ maxWidth: 620, margin: "8px auto 0", fontSize: "0.98rem" }}
            >
              Tijdsbesparing, comfort en dezelfde professionele kwaliteit als in onze werkplaats.
            </p>
          </div>

          <div className="mobiele-usps-grid">
            {[
              { icon: "⏱️", title: "Tijdsbesparend", desc: "Geen verplaatsing, geen wachtrij. Uw auto wordt ter plaatse behandeld terwijl u thuis of op kantoor bent." },
              { icon: "🔧", title: "Professionele Apparatuur", desc: "Dezelfde kwaliteitsmachines als in onze werkplaats: mobiele monteermachine, balanceertoestel en geijkte momentsleutel." },
              { icon: "🛡️", title: "Garantie Inbegrepen", desc: "U geniet van dezelfde garantie op het montagewerk als bij een bezoek aan onze werkplaats. Geen compromissen." },
              { icon: "💼", title: "Ideaal voor Bedrijven", desc: "Wagenpark of bestelwagens? Wij plannen een vaste dag in voor uw volledige vloot op uw eigen terrein of depot." },
              { icon: "📍", title: "Flexibele Locatie", desc: "Thuis, in de garage, op de bedrijfsparking of bij een pechsituatie langs de weg — wij komen overal ter plaatse." },
              { icon: "💬", title: "Transparante Prijzen", desc: "Duidelijke prijsafspraak vóór de interventie. Geen verrassingen op de factuur. Betalen ter plaatse in cash of via Bancontact." },
            ].map((usp) => (
              <div key={usp.title} className="mobiele-usp-card">
                <div className="mobiele-usp-icon">{usp.icon}</div>
                <h3 className="mobiele-usp-title">{usp.title}</h3>
                <p className="mobiele-usp-desc">{usp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white mobiele-faq-section">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 36px" }}>
            <span className="label">Vragen &amp; Antwoorden</span>
            <h2 className="h2 text-dark" style={{ marginTop: 6 }}>
              Veelgestelde Vragen over Mobiele Service
            </h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Alles wat u wilt weten over onze service aan huis.
            </p>
          </div>

          <div className="mobiele-faq-list">
            {faqs.map((faq, idx) => (
              <details key={idx} className="mobiele-faq-item">
                <summary className="mobiele-faq-summary">
                  <span>{faq.q}</span>
                  <span className="mobiele-faq-chevron">▾</span>
                </summary>
                <div className="mobiele-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mobiele-cta-banner">
        <div className="container">
          <div className="mobiele-cta-content">
            <h2 className="h2 text-white">Lekke band of afspraak plannen?</h2>
            <p style={{ color: "#cbd5e1", marginTop: 8, fontSize: "1.05rem" }}>
              Bel ons direct of stuur een WhatsApp-bericht. Wij komen naar uw locatie in Gent en
              omstreken.
            </p>
            <div className="mobiele-cta-buttons">
              <a href="tel:+32467871205" className="btn btn--primary btn--lg">
                <PhoneIcon size={20} />
                <span>0467 87 12 05</span>
              </a>
              <a
                href="https://wa.me/32467871205?text=Hallo,%20ik%20heb%20interesse%20in%20de%20mobiele%20bandenservice."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp btn--lg"
              >
                <WhatsAppIcon size={20} />
                <span>WhatsApp ons</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.4 5.4l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 18.15c-1.52 0-3-.41-4.3-1.18l-.31-.18-3.19.84.85-3.11-.2-.32a8.214 8.214 0 01-1.26-4.29c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c.01 4.54-3.69 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
    </svg>
  );
}
