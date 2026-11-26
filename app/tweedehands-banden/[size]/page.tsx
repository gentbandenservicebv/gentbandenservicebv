import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import TyreCard from "../TyreCard";
import "../tweedehands.css";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const instant = false;

interface PageProps {
  params: Promise<{ size: string }>;
}

export function parseSizeSlug(slug: string): { width: number; aspectRatio: number; diameter: number; formattedSize: string } | null {
  const m = slug.match(/^(\d{3})[-/ ]?(\d{2})[-/ ]?(?:r|r-)?(\d{2})$/i);
  if (m) {
    const width = parseInt(m[1], 10);
    const aspectRatio = parseInt(m[2], 10);
    const diameter = parseInt(m[3], 10);
    return {
      width,
      aspectRatio,
      diameter,
      formattedSize: `${width}/${aspectRatio} R${diameter}`,
    };
  }
  return null;
}

const POPULAR_SIZES = [
  { slug: "205-55-r16", label: "205/55 R16", popularFor: "VW Golf, Audi A3, Ford Focus" },
  { slug: "225-45-r17", label: "225/45 R17", popularFor: "BMW 3, Mercedes C-Klasse, Golf GTI" },
  { slug: "195-65-r15", label: "195/65 R15", popularFor: "Skoda Octavia, Peugeot 308" },
  { slug: "225-40-r18", label: "225/40 R18", popularFor: "Sportieve wagens & velgen" },
  { slug: "205-50-r17", label: "205/50 R17", popularFor: "Volvo V40, Renault Megane" },
  { slug: "215-55-r17", label: "215/55 R17", popularFor: "VW Passat, Nissan Qashqai" },
  { slug: "185-65-r15", label: "185/65 R15", popularFor: "Renault Clio, Opel Corsa" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { size } = await params;
  const parsed = parseSizeSlug(size);

  if (!parsed) {
    return {
      title: "Tweedehands banden in Gent | Gent Bandenservice",
      description: "Gekeurde tweedehands autobanden in Gent.",
    };
  }

  const { formattedSize } = parsed;
  const title = `Tweedehands banden ${formattedSize} kopen in Gent | Gent Bandenservice`;
  const description = `Op zoek naar tweedehands banden ${formattedSize}? Ontdek gekeurde gebruikte autobanden bij Gent Bandenservice. Bekijk merken, profieldiepte en prijzen. Professionele montage en balanceren in Gent.`;
  const canonicalUrl = `${SITE_URL}/tweedehands-banden/${size.toLowerCase()}`;

  return {
    title,
    description,
    keywords: [
      `tweedehands banden ${formattedSize}`,
      `tweedehands banden ${parsed.width} ${parsed.aspectRatio} r${parsed.diameter}`,
      `gebruikte banden ${formattedSize}`,
      `goedkope banden ${formattedSize} Gent`,
      `tweedehands banden kopen Gent`,
      `banden ${formattedSize} montage Gent`,
      `occasie banden ${formattedSize}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "nl_BE",
      url: canonicalUrl,
      siteName: "Gent Bandenservice BV",
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function TweedehandsBandenMaatPage({ params }: PageProps) {

  const { size } = await params;
  const parsed = parseSizeSlug(size);

  if (!parsed) {
    notFound();
  }

  const { width, aspectRatio, diameter, formattedSize } = parsed;

  // Fetch live matching used tyres from database
  let usedTyres = await prisma.tyre.findMany({
    where: {
      active: true,
      condition: "USED",
      width,
      aspectRatio,
      diameter,
    },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If used stock in this specific size is currently 0, fetch alternative available tyres in this size so visitors always get value
  let alternativeTyres: typeof usedTyres = [];
  if (usedTyres.length === 0) {
    alternativeTyres = await prisma.tyre.findMany({
      where: {
        active: true,
        width,
        aspectRatio,
        diameter,
      },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        },
      },
      take: 6,
      orderBy: { price: "asc" },
    });
  }

  const displayTyres = usedTyres.length > 0 ? usedTyres : alternativeTyres;

  // Structured Data (Schema.org)
  const canonicalUrl = `${SITE_URL}/tweedehands-banden/${size.toLowerCase()}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tweedehands Banden", item: `${SITE_URL}/tweedehands-banden` },
      { "@type": "ListItem", position: 3, name: formattedSize, item: canonicalUrl },
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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    areaServed: ["Gent", "Sint-Amandsberg", "Destelbergen", "Lochristi", "Oostakker", "Gentbrugge"],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Tweedehands banden ${formattedSize} in Gent`,
    description: `Aanbod van gecontroleerde tweedehands autobanden maat ${formattedSize} bij Gent Bandenservice`,
    url: canonicalUrl,
    numberOfItems: displayTyres.length,
    itemListElement: displayTyres.map((t, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${t.condition === "USED" ? "Tweedehands " : ""}${t.brand} ${t.model} ${t.size}`,
        url: `${SITE_URL}/banden/${t.slug || t.id}`,
        image: t.images?.[0]?.url || OG_IMAGE,
        description: t.description || `${t.brand} ${t.model} band maat ${t.size}`,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/banden/${t.slug || t.id}`,
          priceCurrency: "EUR",
          price: t.price,
          availability: t.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
          itemCondition: t.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
          seller: {
            "@type": "Organization",
            name: "Gent Bandenservice BV",
          },
        },
      },
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Zijn tweedehands banden in maat ${formattedSize} veilig?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja. Bij Gent Bandenservice wordt iedere tweedehands band grondig geïnspecteerd op profieldiepte, gelijkmatige slijtage, karkasintegriteit en droogtescheurtjes voordat deze gemonteerd wordt.",
        },
      },
      {
        "@type": "Question",
        name: `Hoeveel profiel hebben de tweedehands ${formattedSize} banden?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Onze gebruikte banden hebben een gemeten profieldiepte van minimaal 5 mm tot wel 7+ mm (nieuwe banden hebben ca. 8 mm). De exacte profieldiepte staat bij iedere band vermeld.",
        },
      },
      {
        "@type": "Question",
        name: `Kunnen de banden direct gemonteerd en gebalanceerd worden in Gent?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zeker! In onze werkplaats aan de Dendermondsesteenweg 428 te Sint-Amandsberg (Gent) monteren en balanceren wij uw banden vakkundig met professionele apparatuur.",
        },
      },
    ],
  };

  return (
    <div className="th-page">
      {/* Structured data injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Header */}
      <header className="th-hero">
        <div className="container">
          <nav className="th-breadcrumb" aria-label="Kruimelpad">
            <Link href="/">Home</Link>
            <span className="th-breadcrumb-sep">/</span>
            <Link href="/tweedehands-banden">Tweedehands Banden</Link>
            <span className="th-breadcrumb-sep">/</span>
            <span>{formattedSize}</span>
          </nav>

          <span className="th-badge">Gekeurde Occasies • Direct Leverbaar</span>

          <h1 className="th-title">Tweedehands banden {formattedSize} in Gent</h1>

          <p className="th-subtitle">
            Ontdek gekeurde tweedehands autobanden in maat <strong>{formattedSize}</strong> bij Gent Bandenservice.
            Eerlijke prijzen, gecontroleerde profieldiepte en vakkundige montage in onze werkplaats te Sint-Amandsberg.
          </p>

          <div className="th-stats-row">
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Grondig gekeurd op 6+ controlepunten</span>
            </div>
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Minimaal 5 tot 7+ mm profieldiepte</span>
            </div>
            <div className="th-stat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Montage &amp; balancering ter plaatse</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content & Stock */}
      <main className="section th-section">
        <div className="container">
          <div className="th-layout">
            {/* Left Column: Stock & Rich SEO Content */}
            <div>
              {/* Live Inventory Section */}
              <div className="th-stock-header">
                <div>
                  <h2 className="th-stock-title">
                    {usedTyres.length > 0
                      ? `Beschikbare tweedehands banden (${formattedSize})`
                      : `Actuele voorraad banden maat ${formattedSize}`}
                  </h2>
                </div>
                <span className="th-stock-count">
                  {displayTyres.length} {displayTyres.length === 1 ? "optie" : "opties"} in voorraad
                </span>
              </div>

              {displayTyres.length > 0 ? (
                <div className="th-stock-grid">
                  {displayTyres.map((t) => (
                    <TyreCard key={t.id} tyre={t} />
                  ))}
                </div>
              ) : (
                <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "32px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 12px", color: "#475569" }}>
                    Momenteel is onze voorraad tweedehands {formattedSize} in snelle wissel. Neem direct contact op met onze werkplaats voor dagelijks binnenkomende sets!
                  </p>
                  <a href="tel:+32467871205" className="th-btn-detail" style={{ display: "inline-block" }}>
                    📞 Bel werkplaats: 0467 87 12 05
                  </a>
                </div>
              )}

              {/* Comprehensive SEO Content (Exact Dutch content requested) */}
              <section className="th-content-block">
                <h2>Tweedehands banden {formattedSize} kopen in Gent</h2>
                <p>
                  Bent u op zoek naar betaalbare tweedehands banden in de maat <strong>{formattedSize}</strong>? Bij Gent Bandenservice vindt u zorgvuldig gecontroleerde gebruikte autobanden van gerenommeerde merken zoals Michelin, Continental, Bridgestone, Goodyear, Pirelli en Hankook.
                </p>
                <p>
                  Onze tweedehands banden worden vóór montage grondig gecontroleerd op <strong>profieldiepte, gelijkmatige slijtage, beschadigingen aan de zijwanden en algemene karkasintegriteit</strong>. Zo weet u altijd exact wat u koopt en rijdt u met een gerust hart onze werkplaats uit.
                </p>

                <h3>Waarom tweedehands banden kopen bij Gent Bandenservice?</h3>
                <div className="th-usp-grid">
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Verschillende A-merken en scherpe prijsklassen vanaf €35</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Duidelijke en werkelijke informatie over de profieldiepte (in mm)</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Strenge veiligheidscontrole van iedere band vóór montage</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Professionele montage en computergestuurde balancering</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Gelegen aan de Dendermondsesteenweg 428 in Sint-Amandsberg, Gent</span>
                  </div>
                  <div className="th-usp-item">
                    <span className="th-usp-icon">✓</span>
                    <span className="th-usp-text">Vlot bereikbaar vanuit Destelbergen, Lochristi, Oostakker en Gentbrugge</span>
                  </div>
                </div>

                <h3>Welke auto&apos;s gebruiken bandenmaat {formattedSize}?</h3>
                <p>
                  De bandenmaat <strong>{formattedSize}</strong> is een van de meest gereden bandenmaten in België en Europa. Deze maat komt onder andere standaard voor bij verschillende uitvoeringen van:
                </p>
                <div className="th-car-chips">
                  <span className="th-car-chip">Volkswagen Golf (V, VI, VII, VIII)</span>
                  <span className="th-car-chip">Audi A3 &amp; A4</span>
                  <span className="th-car-chip">BMW 1 Reeks</span>
                  <span className="th-car-chip">Mercedes A-Klasse &amp; B-Klasse</span>
                  <span className="th-car-chip">Opel Astra</span>
                  <span className="th-car-chip">Ford Focus</span>
                  <span className="th-car-chip">Skoda Octavia</span>
                  <span className="th-car-chip">Seat Leon</span>
                  <span className="th-car-chip">Peugeot 308</span>
                  <span className="th-car-chip">Renault Megane</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "8px" }}>
                  <em>Tip: Controleer altijd het gelijkvormigheidsattest of het etiket in de deurstijl van uw auto om de toegestane maat en snelheidsindex voor uw voertuig te bevestigen.</em>
                </p>

                <h3>Lokale service in regio Gent en Oost-Vlaanderen</h3>
                <p>
                  Onze werkplaats is centraal gelegen in Sint-Amandsberg met directe aansluiting op de R4 en R40. Hierdoor zijn we eenvoudig en filevrij bereikbaar voor bestuurders uit:
                </p>
                <div className="th-regions-list">
                  <span className="th-region-tag">Gent Centrum (9000)</span>
                  <span className="th-region-tag">Sint-Amandsberg (9040)</span>
                  <span className="th-region-tag">Oostakker (9041)</span>
                  <span className="th-region-tag">Gentbrugge (9050)</span>
                  <span className="th-region-tag">Ledeberg (9050)</span>
                  <span className="th-region-tag">Destelbergen (9070)</span>
                  <span className="th-region-tag">Lochristi (9080)</span>
                  <span className="th-region-tag">Wondelgem (9032)</span>
                  <span className="th-region-tag">Evergem (9940)</span>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="th-faq-section">
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "16px", color: "var(--dark)" }}>
                  Veelgestelde vragen over tweedehands {formattedSize} banden
                </h2>

                <div className="th-faq-card">
                  <h3 className="th-faq-q">Zijn tweedehands banden in maat {formattedSize} veilig?</h3>
                  <p className="th-faq-a">
                    Ja, absoluut. Bij Gent Bandenservice keuren we elke binnenkomende tweedehands band op scheurtjes, bulten, afwijkende slijtage en karkasschade. Banden die niet aan onze strenge veiligheidsnorm voldoen, worden niet verkocht.
                  </p>
                </div>

                <div className="th-faq-card">
                  <h3 className="th-faq-q">Hoeveel millimeter profiel hebben jullie gebruikte banden?</h3>
                  <p className="th-faq-a">
                    Nieuwe banden hebben doorgaans ca. 8 mm profiel. Onze tweedehands banden hebben meestal tussen 5,0 mm en 7,5 mm profieldiepte (de wettelijke minimumgrens in België is 1,6 mm). Zo koopt u een band die nog vele duizenden kilometers meegaat tegen een fractie van de nieuwprijs.
                  </p>
                </div>

                <div className="th-faq-card">
                  <h3 className="th-faq-q">Kan ik mijn banden direct laten monteren bij Gent Bandenservice?</h3>
                  <p className="th-faq-a">
                    Zeker! In onze werkplaats aan de Dendermondsesteenweg 428 monteren en balanceren wij uw wielen vakkundig. U kunt via onze website direct een afspraak inplannen of bellen voor directe beschikbaarheid.
                  </p>
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Contact & Other Sizes */}
            <aside className="th-sidebar">
              {/* Quick Contact & Appointment Card */}
              <div className="th-card-cta">
                <h3>Tweedehands {formattedSize} nodig?</h3>
                <p>
                  Bekijk direct onze actuele voorraad of neem contact op. We helpen u graag bij het kiezen van de juiste set en monteren direct ter plaatse.
                </p>

                <a href="tel:+32467871205" className="th-phone-btn">
                  <span>📞 0467 87 12 05</span>
                </a>

                <Link
                  href={`/afspraak?service=fitting&size=${encodeURIComponent(formattedSize)}`}
                  className="th-appt-btn"
                >
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

              {/* Popular Sizes Cross-Links */}
              <div className="th-sizes-widget">
                <h4>Andere populaire bandenmaten</h4>
                <div className="th-sizes-list">
                  {POPULAR_SIZES.map((ps) => {
                    const isActive = ps.slug === size.toLowerCase();
                    return (
                      <Link
                        key={ps.slug}
                        href={`/tweedehands-banden/${ps.slug}`}
                        className={`th-size-link-item ${isActive ? "th-size-link-item--active" : ""}`}
                      >
                        <span>{ps.label}</span>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>→</span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/banden?type=tweedehands"
                    className="th-size-link-item"
                    style={{ background: "#f1f5f9", marginTop: "6px" }}
                  >
                    <span>Bekijk alle tweedehands banden</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
