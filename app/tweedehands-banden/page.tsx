import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import TyreCard from "./TyreCard";
import "./tweedehands.css";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const instant = false;

export const metadata: Metadata = {
  title: "Tweedehands banden kopen in Gent | Gent Bandenservice BV",
  description:
    "Kwalitatieve, gekeurde tweedehands autobanden in Gent. Bekijk actuele voorraad en prijzen per bandenmaat zoals 205/55 R16, 225/45 R17 en 195/65 R15. Vakkundige montage in Sint-Amandsberg.",
  keywords: [
    "tweedehands banden Gent",
    "gebruikte autobanden Gent",
    "goedkope banden Gent",
    "tweedehands banden 205 55 r16",
    "tweedehands banden 225 45 r17",
    "tweedehands banden 195 65 r15",
    "bandencentrale Gent tweedehands",
    "occasie banden Gent",
  ],
  alternates: {
    canonical: `${SITE_URL}/tweedehands-banden`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/tweedehands-banden`,
    siteName: "Gent Bandenservice BV",
    title: "Tweedehands banden kopen in Gent | Gent Bandenservice BV",
    description:
      "Kwalitatieve, gekeurde tweedehands autobanden in Gent. Bekijk actuele voorraad en prijzen per bandenmaat. Montage ter plaatse.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Tweedehands banden Gent" }],
  },
};

const POPULAR_SIZES = [
  { slug: "205-55-r16", label: "205/55 R16", popularFor: "VW Golf, Audi A3, Ford Focus, Opel Astra" },
  { slug: "225-45-r17", label: "225/45 R17", popularFor: "BMW 3, Mercedes C-Klasse, Golf GTI" },
  { slug: "195-65-r15", label: "195/65 R15", popularFor: "Skoda Octavia, Peugeot 308, VW Golf 4/5" },
  { slug: "225-40-r18", label: "225/40 R18", popularFor: "Sportieve hatchbacks en berlines" },
  { slug: "205-50-r17", label: "205/50 R17", popularFor: "Volvo V40, Renault Megane, Ford Focus" },
  { slug: "215-55-r17", label: "215/55 R17", popularFor: "VW Passat, Nissan Qashqai, Toyota Camry" },
  { slug: "185-65-r15", label: "185/65 R15", popularFor: "Renault Clio, Opel Corsa, Hyundai i20" },
  { slug: "225-50-r17", label: "225/50 R17", popularFor: "Audi A4, BMW 3 & 4 Reeks" },
];

export default async function TweedehandsBandenHubPage() {
  await connection();

  const usedTyres = await prisma.tyre.findMany({
    where: {
      active: true,
      condition: "USED",
    },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
    take: 24,
    orderBy: { createdAt: "desc" },
  });

  const canonicalUrl = `${SITE_URL}/tweedehands-banden`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tweedehands Banden", item: canonicalUrl },
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: "Gent Bandenservice BV",
    image: OG_IMAGE,
    telephone: "+32467871205",
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dendermondsesteenweg 428",
      addressLocality: "Sint-Amandsberg",
      addressRegion: "Gent",
      postalCode: "9040",
      addressCountry: "BE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 51.0536418,
      longitude: 3.7533817,
    },
    priceRange: "€€",
    areaServed: ["Gent", "Sint-Amandsberg", "Destelbergen", "Lochristi", "Oostakker", "Gentbrugge"],
  };

  return (
    <div className="th-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Hero Header */}
      <header className="th-hero">
        <div className="container">
          <nav className="th-breadcrumb" aria-label="Kruimelpad">
            <Link href="/">Home</Link>
            <span className="th-breadcrumb-sep">/</span>
            <span>Tweedehands Banden</span>
          </nav>

          <span className="th-badge">Gekeurde Kwaliteitsbanden in Gent</span>

          <h1 className="th-title">Tweedehands autobanden kopen in Gent</h1>

          <p className="th-subtitle">
            Ruim assortiment gekeurde tweedehands banden van A-merken (Michelin, Continental, Goodyear, Bridgestone en meer).
            Iedere band is gecontroleerd op profieldiepte en karkasveiligheid. Vakkundige montage en balanceren in onze werkplaats te Sint-Amandsberg.
          </p>

          <div className="th-stats-row">
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Vanaf €35 per band</span>
            </div>
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Minimaal 5 tot 7+ mm profiel</span>
            </div>
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Directe montage ter plaatse</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="section th-section">
        <div className="container">
          {/* Popular Sizes Quick Links Banner */}
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "18px", border: "1.5px solid #e5e7eb", marginBottom: "40px", boxShadow: "0 4px 14px rgba(15,17,23,0.03)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 8px", color: "var(--dark)" }}>
              Kies direct uw bandenmaat
            </h2>
            <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: "0.92rem" }}>
              Klik op uw maat voor gerichte voorraad, compatibele wagens en prijzen:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {POPULAR_SIZES.map((ps) => (
                <Link
                  key={ps.slug}
                  href={`/tweedehands-banden/${ps.slug}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "14px 16px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    textDecoration: "none",
                    transition: "all 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#016eb9" }}>{ps.label}</span>
                    <span style={{ color: "#016eb9", fontWeight: 700 }}>→</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{ps.popularFor}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="th-layout">
            <div>
              {/* Live stock */}
              <div className="th-stock-header">
                <h2 className="th-stock-title">Actuele voorraad tweedehands banden</h2>
                <span className="th-stock-count">
                  {usedTyres.length} banden beschikbaar
                </span>
              </div>

              {usedTyres.length > 0 ? (
                <div className="th-stock-grid">
                  {usedTyres.map((t) => (
                    <TyreCard key={t.id} tyre={t} />
                  ))}
                </div>
              ) : (
                <div style={{ background: "#ffffff", padding: "40px", borderRadius: "14px", border: "1px solid #e5e7eb", textAlign: "center", marginBottom: "32px" }}>
                  <p style={{ margin: "0 0 16px", color: "#475569" }}>
                    Momenteel zijn onze tweedehands banden in snelle doorloop. Bekijk onze volledige catalogus of bel direct voor actuele binnenkomende sets!
                  </p>
                  <Link href="/banden" className="btn btn--primary">
                    Bekijk alle banden
                  </Link>
                </div>
              )}

              {/* Information section */}
              <section className="th-content-block">
                <h2>Waarom kiezen voor gekeurde tweedehands banden bij Gent Bandenservice?</h2>
                <p>
                  Tweedehands banden zijn de ideale oplossing voor automobilisten die op zoek zijn naar veilige, betrouwbare A-merk banden (zoals Michelin, Continental en Bridgestone) tegen een fractie van de nieuwprijs.
                </p>
                <p>
                  Bij Gent Bandenservice selecteren we uitsluitend gebruikte banden van hoge kwaliteit. Iedere band ondergaat een inspectie op meer dan 6 controlepunten: profieldiepte, loopvlakslijtage, zijwandschade, droogtescheurtjes, nagels of herstellingen en hielbeschadigingen.
                </p>

                <h3>Onze garanties bij tweedehands banden:</h3>
                <div className="th-usp-grid">
                  <div className="th-usp-item">
                    <span className="th-usp-icon">🛡️</span>
                    <span className="th-usp-text">Geen beschadigde of gevaarlijke banden: enkel gekeurde topkwaliteit</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">📏</span>
                    <span className="th-usp-text">Transparante vermelding van de werkelijke profieldiepte in mm</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">🔧</span>
                    <span className="th-usp-text">Montage, nieuwe ventielen en elektronische balancering in onze werkplaats</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">⚡</span>
                    <span className="th-usp-text">Snelle service zonder lange wachttijden in Sint-Amandsberg</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="th-sidebar">
              <div className="th-card-cta">
                <h3>Direct een afspraak of advies?</h3>
                <p>
                  Weet u niet zeker welke bandenmaat op uw wagen past of zoekt u een specifieke set? Bel ons direct of maak online een afspraak.
                </p>

                <a href="tel:+32467871205" className="th-phone-btn">
                  <span>📞 0467 87 12 05</span>
                </a>

                <Link href="/afspraak?service=fitting" className="th-appt-btn">
                  <span>📅 Afspraak voor montage</span>
                </Link>

                <div className="th-address-box">
                  <strong style={{ color: "#fff", display: "block", marginBottom: "4px" }}>
                    Gent Bandenservice BV
                  </strong>
                  Dendermondsesteenweg 428<br />
                  9040 Sint-Amandsberg (Gent)<br />
                  <span style={{ color: "#38bdf8", marginTop: "4px", display: "inline-block" }}>
                    Ma – Za: 09:00 – 18:00
                  </span>
                </div>
              </div>

              <div className="th-sizes-widget">
                <h4>Populaire bandenmaten</h4>
                <div className="th-sizes-list">
                  {POPULAR_SIZES.map((ps) => (
                    <Link
                      key={ps.slug}
                      href={`/tweedehands-banden/${ps.slug}`}
                      className="th-size-link-item"
                    >
                      <span>{ps.label}</span>
                      <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
