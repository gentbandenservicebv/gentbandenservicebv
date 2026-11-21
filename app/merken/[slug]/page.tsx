import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BRANDS, brandBySlug } from "../page";
import { SeasonIcon } from "@/app/components/SeasonIcons";
import "../brands.css";

const SITE_URL = "https://www.gentbandenservice.be";

/* ── Helpers ─────────────────────────────────────────────────────────── */
const SEASON_LABEL: Record<string, string> = {
  SUMMER: "Zomer",
  WINTER: "Winter",
  ALL_SEASON: "All-season",
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/* ── Static params for SSG ───────────────────────────────────────────── */
export const instant = false;

export async function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

/* ── Metadata ────────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = brandBySlug[slug];
  if (!brand) return { title: "Merk niet gevonden | Gent Bandenservice BV" };

  const title = `${brand.name} banden kopen in Gent | Gent Bandenservice BV`;
  const description = `Koop ${brand.name} banden in Gent. ${brand.tagline}. Zomer-, winter- en all-season banden rechtstreeks op stock. Professionele montage.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/merken/${slug}` },
    openGraph: {
      type: "website",
      locale: "nl_BE",
      url: `${SITE_URL}/merken/${slug}`,
      siteName: "Gent Bandenservice BV",
      title,
      description,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
  };
}

/* ── Rich static content per brand ──────────────────────────────────── */
const BRAND_CONTENT: Record<
  string,
  {
    about: string;
    ranges: string;
    faq: { q: string; a: string }[];
  }
> = {
  michelin: {
    about:
      "Michelin werd opgericht in 1889 in Clermont-Ferrand, Frankrijk, en is vandaag één van de meest iconische bandmerken ter wereld. Het bedrijf staat al meer dan 135 jaar synoniem voor innovatie, duurzaamheid en veiligheid. Michelin-banden staan gekend om hun uitzonderlijk lange levensduur, lage rolweerstand (wat brandstofverbruik reduceert) en uitstekende grip in natte omstandigheden.",
    ranges:
      "De populairste reeksen zijn de Michelin Primacy (comfort & veiligheid), Pilot Sport (sportieve rijders), CrossClimate (all-season) en de Alpin-reeks voor winteromstandigheden.",
    faq: [
      {
        q: "Zijn Michelin-banden de duurste op de markt?",
        a: "Michelin-banden zijn een premium aankoop, maar dankzij hun langere levensduur zijn de totale kosten per kilometer vaak vergelijkbaar of zelfs lager dan budgetmerken.",
      },
      {
        q: "Welke Michelin-band past bij mijn wagen?",
        a: "Dat hangt af van uw wagen, rijstijl en seizoen. Onze experts in Gent helpen u graag de juiste maat en het juiste model kiezen.",
      },
      {
        q: "Heeft Michelin all-season banden?",
        a: "Ja, de Michelin CrossClimate-reeks is bijzonder populair en scoort uitstekend in onafhankelijke testen voor zowel zomer- als winteromstandigheden.",
      },
    ],
  },
  continental: {
    about:
      "Continental is een Duits technologiebedrijf opgericht in 1871 in Hannover. Als één van de oudste en grootste bandenfabrikanten ter wereld combineert Continental meer dan 150 jaar ingenieursexpertise met geavanceerde veiligheidstechnologie. Continental-banden zijn OEM-standaard bij vele premium autoconstructeurs waaronder BMW, Mercedes en Volkswagen.",
    ranges:
      "Bekende modellen zijn de Continental PremiumContact (dagelijks gebruik), SportContact (sport & performance), WinterContact (winter) en AllSeasonContact (jaarrond).",
    faq: [
      {
        q: "Zijn Continental-banden geschikt voor sportieve rijders?",
        a: "Absoluut. De SportContact-reeks is speciaal ontwikkeld voor sportief rijgedrag en scoort top in onafhankelijke prestatie- en veiligheidstesten.",
      },
      {
        q: "Wat maakt Continental-banden bijzonder?",
        a: "Continental investeert sterk in natte remtechnologie. Veel modellen scoren een A-label voor natte grip op de EU-bandenlabel.",
      },
    ],
  },
  bridgestone: {
    about:
      "Bridgestone werd opgericht in 1931 door Shojiro Ishibashi in Japan en groeide uit tot de grootste bandenfabrikant ter wereld. Met activiteiten in meer dan 150 landen combineert Bridgestone Japanse precisie met mondiale innovatie. Het merk is originele uitrusting voor talloze automerken en leverancier aan de Formule 1.",
    ranges:
      "Populaire reeksen zijn de Bridgestone Turanza (comfort), Potenza (sport), Blizzak (winter) en Dueler (SUV & 4x4).",
    faq: [
      {
        q: "Zijn Bridgestone-banden geschikt voor SUV's?",
        a: "Ja, de Dueler-reeks is specifiek ontworpen voor SUV's en lichte bestelwagens, zowel voor weg- als off-roadgebruik.",
      },
      {
        q: "Wat is het beste Bridgestone-model voor de winter?",
        a: "De Blizzak-reeks is internationaal erkend als een van de beste winterbanden, met uitstekende prestaties op sneeuw en ijs.",
      },
    ],
  },
  goodyear: {
    about:
      "Goodyear werd in 1898 opgericht in Akron, Ohio (VS) en is vandaag een van de grootste bandenfabrikanten wereldwijd. Met meer dan 125 jaar ervaring biedt Goodyear een breed assortiment dat elk rijprofiel dekt: van zuinige stadsrijders tot avontuurlijke off-roaders. Het merk is ook nauw betrokken bij motorsport.",
    ranges:
      "Bekende lijnen zijn de Goodyear EfficientGrip (zuinig & veilig), Eagle F1 (sport), UltraGrip (winter) en Vector (all-season).",
    faq: [
      {
        q: "Is Goodyear EfficientGrip zuinig?",
        a: "Ja, de EfficientGrip-reeks is specifiek ontworpen om het brandstofverbruik te reduceren dankzij een lage rolweerstand, zonder in te boeten op veiligheid.",
      },
      {
        q: "Heeft Goodyear all-season banden?",
        a: "Ja, de Vector 4Seasons-reeks is een populaire all-season keuze die zowel in zomer- als winteromstandigheden goed presteert.",
      },
    ],
  },
  pirelli: {
    about:
      "Pirelli werd in 1872 opgericht in Milaan, Italië, en staat wereldwijd bekend als het sportieve prestige-bandenmerk. Als exclusieve leverancier aan de Formule 1 en favoriete keuze van sportwagenmerken zoals Ferrari en Lamborghini, belichaamt Pirelli de perfecte combinatie van Italiaanse stijl en hoogwaardige rijprestatie.",
    ranges:
      "De iconische P Zero-reeks is dé keuze voor sportieve en supersportwagens. De Cinturato-reeks richt zich op milieuvriendelijkheid en rijcomfort. Voor de winter is er de Winter Sottozero.",
    faq: [
      {
        q: "Zijn Pirelli-banden alleen voor sportwagens?",
        a: "Nee, Pirelli heeft ook uitstekende banden voor gezinswagens en SUV's via de Cinturato- en Scorpion-reeksen.",
      },
      {
        q: "Wat is het verschil tussen Pirelli P Zero en Cinturato?",
        a: "P Zero is gericht op maximale prestatie en sportwagens, terwijl Cinturato de nadruk legt op duurzaamheid, comfort en lage milieu-impact.",
      },
    ],
  },
  dunlop: {
    about:
      "Dunlop werd opgericht in 1888 door John Boyd Dunlop, uitvinder van de luchtband, en heeft daarmee letterlijk de moderne autoband uitgevonden. Vandaag maakt Dunlop deel uit van de Sumitomo Rubber Industries-groep en staat het merk bekend om een uitstekende prijs-prestatieverhouding met sportief karakter.",
    ranges:
      "De Sport Maxx-reeks is populair bij sportieve rijders. Voor dagelijks gebruik is er de Blueresponse en SP Sport. De Winter Sport-reeks dekt uw winterbehoeften.",
    faq: [
      {
        q: "Is Dunlop een budget- of premiummerk?",
        a: "Dunlop zit in het midden: het biedt prestaties dicht bij de absolute topmerken, maar aan een scherpere prijs. Ideaal voor wie kwaliteit zoekt zonder de hoogste prijs te betalen.",
      },
      {
        q: "Zijn Dunlop-banden goed in de regen?",
        a: "Ja, Dunlop scoort consequent goed op nat wegdek in onafhankelijke testen, dankzij hun geavanceerde loopvlakontwerpen.",
      },
    ],
  },
  hankook: {
    about:
      "Hankook Tire werd opgericht in 1941 in Seoul, Zuid-Korea, en groeide in enkele decennia uit tot een wereldspeler in de bandensector. Het merk combineert Koreaanse precisie met innovatieve technologie en levert banden als originele uitrusting aan merken als Audi, BMW, Mercedes en Porsche — een bewijs van de uitzonderlijke kwaliteitsstandaard.",
    ranges:
      "De Ventus-reeks (sportief), Kinergy (eco & comfort) en Winter i*cept (winter) zijn de meest gevraagde Hankook-modellen bij onze klanten.",
    faq: [
      {
        q: "Zijn Hankook-banden van goede kwaliteit?",
        a: "Absoluut. Hankook is een erkend OEM-leverancier voor premium autoconstructeurs en scoort uitstekend in onafhankelijke testen door o.a. ADAC en Auto Express.",
      },
      {
        q: "Is Hankook goedkoper dan Michelin of Continental?",
        a: "Ja, Hankook biedt premium kwaliteit aan een gemiddeld 15–25% lagere prijs dan de absolute topmerken. Uitstekende waarde voor uw geld.",
      },
    ],
  },
  falken: {
    about:
      "Falken Tyre werd opgericht in 1983 als sportief subbrand van Sumitomo Rubber Industries (ook moederbedrijf van Dunlop). Het merk richt zich op rijders die sportiever willen rijden zonder de premiumprijs te betalen. Falken is actief in de motorsport en sponsort diverse raceklassen in Europa.",
    ranges:
      "De Azenis FK520 (ultra-high performance), Ziex (sporty daily), Wildpeak (SUV & 4x4) en Eurowinter (winter) zijn de kernreeksen van het merk.",
    faq: [
      {
        q: "Is Falken een betrouwbaar merk?",
        a: "Ja, Falken maakt deel uit van de gerenommeerde Sumitomo-groep en scoort goed in onafhankelijke bandentesten, zeker voor sportievere profielen.",
      },
      {
        q: "Voor wie zijn Falken-banden geschikt?",
        a: "Falken-banden zijn ideaal voor rijders die een sportief profiel wensen aan een scherpere prijs dan absolute topmerken.",
      },
    ],
  },
  nokian: {
    about:
      "Nokian Tyres werd opgericht in 1932 in Nokia, Finland, en is onlosmakelijk verbonden met de ultieme winterervaring. Als het enige bandenmerk dat zijn producten test onder arctische omstandigheden op het Poolcircle, heeft Nokian zijn reputatie als 's werelds beste winterbandenfabrikant keer op keer bewezen. Het iconische Hakkapeliitta-model is dé referentie op ijs en sneeuw.",
    ranges:
      "De Hakkapeliitta-reeks (winterkampioen), WR (all-weather winter) en Seasonproof (all-season) zijn de bekendste modellen. De Tyres zomerreeks heet Powerproof en Wetproof.",
    faq: [
      {
        q: "Zijn Nokian-banden ook geschikt voor milde Belgische winters?",
        a: "Zeker. De WR-reeks is perfect voor West-Europese winters: uitstekend op nat en modderig wegdek, ook bij lichte vorst.",
      },
      {
        q: "Wat maakt Nokian-winterbanden zo speciaal?",
        a: "Nokian test exclusief in arctische omstandigheden in Rovaniemi, Finland. Die extreme testomstandigheden garanderen dat hun banden élke winterconditie aankunnen.",
      },
    ],
  },
  bfgoodrich: {
    about:
      "BFGoodrich werd opgericht in 1870 in Akron, Ohio, en is vandaag deel van de Michelin-groep. Het merk heeft een legendarische reputatie in off-road racing (Baja 1000, Paris-Dakar) en biedt banden die zowel op de weg als off-road uitblinken. BFGoodrich combineert de technologie van de Michelin-groep met een avontuurlijk karakter.",
    ranges:
      "De All-Terrain T/A KO2 is een iconische all-terrain band voor SUV's en pickups. De Mud-Terrain is voor echte off-road avonturen. Voor de weg zijn er de g-Force sport banden.",
    faq: [
      {
        q: "Zijn BFGoodrich-banden ook voor dagelijks gebruik op de weg?",
        a: "Ja, de All-Terrain T/A KO2 is zeer veelzijdig: comfortabel en stil genoeg voor dagelijks weggebruik, maar klaar voor off-road als het nodig is.",
      },
      {
        q: "Wat is het verschil tussen BFGoodrich en Michelin?",
        a: "Beide maken deel uit van dezelfde groep. Michelin richt zich op comfort, zuinigheid en wegprestaties. BFGoodrich focust op all-terrain en performance-rijders.",
      },
    ],
  },
  toyo: {
    about:
      "Toyo Tires werd opgericht in 1945 in Osaka, Japan, en heeft in de afgelopen decennia een solide internationale reputatie opgebouwd. Het merk staat bekend om zijn stille rijcomfort, uitstekende wegligging en duurzaamheid. De Open Country-reeks is een absolute favoriet bij SUV- en 4x4-rijders in heel Europa.",
    ranges:
      "De Proxes-reeks dekt de sportieve wegbanden. Open Country is de SUV/all-terrain lijn. Snowprox en Celsius zijn de winter- en all-season opties.",
    faq: [
      {
        q: "Is Toyo een goed merk voor SUV's?",
        a: "Absoluut. De Toyo Open Country-reeks behoort tot de beste keuzes voor SUV-rijders die ook af en toe van de weg gaan.",
      },
      {
        q: "Hoe verhoudt Toyo zich tot duurdere Japanse merken zoals Bridgestone?",
        a: "Toyo biedt vergelijkbare kwaliteit aan een vaak scherpere prijs. Zeker voor SUV en all-terrain gebruik is het verschil minimaal.",
      },
    ],
  },
  yokohama: {
    about:
      "Yokohama Rubber Company werd opgericht in 1917 in Japan (een joint venture met B.F. Goodrich) en heeft inmiddels meer dan een eeuw bandentechnologie achter de rug. Het merk staat bekend om zijn ADVAN-reeks voor sportieve rijders en de BluEarth-lijn die milieuvriendelijkheid en rijcomfort combineert. Yokohama is OEM-leverancier voor diverse autoconstructeurs.",
    ranges:
      "ADVAN Sport (ultieme wegprestatie), BluEarth (eco-vriendelijk), Geolandar (SUV & off-road) en iceGUARD (winter) zijn de hoofdreeksen.",
    faq: [
      {
        q: "Zijn Yokohama-banden geschikt voor eco-rijders?",
        a: "Ja, de BluEarth-reeks heeft een lage rolweerstand en reduceert het brandstofverbruik, zonder in te boeten op grip en veiligheid.",
      },
      {
        q: "Wat is Yokohama ADVAN?",
        a: "ADVAN is Yokohama's performance-subbrand, afgeleid van hun motorsportervaring. ADVAN-banden bieden uitstekende grip en rijprecisie voor sportieve wagens.",
      },
    ],
  },
};

/* ── Tyre placeholder icon ───────────────────────────────────────────── */
function TyreIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="30" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="12" fill="#cbd5e1" />
    </svg>
  );
}

/* ── Cached data fetcher ─────────────────────────────────────────────── */
async function fetchBrandTyres(brandName: string) {
  "use cache";
  let tyres: Array<{
    id: string;
    slug: string | null;
    model: string;
    size: string;
    price: number;
    season: string;
    images: Array<{ url: string; isPrimary: boolean }>;
  }> = [];
  let totalCount = 0;
  let minPrice: number | null = null;
  let seasonCounts: Record<string, number> = {};

  try {
    const [tyreFetch, aggregate, seasonGroup] = await Promise.all([
      prisma.tyre.findMany({
        where: { brand: brandName, active: true, stock: { gt: 0 } },
        select: {
          id: true,
          slug: true,
          model: true,
          size: true,
          price: true,
          season: true,
          images: {
            select: { url: true, isPrimary: true },
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
            take: 1,
          },
        },
        orderBy: [{ featured: "desc" }, { price: "asc" }],
        take: 6,
      }),
      prisma.tyre.aggregate({
        where: { brand: brandName, active: true, stock: { gt: 0 } },
        _count: { id: true },
        _min: { price: true },
      }),
      prisma.tyre.groupBy({
        by: ["season"],
        where: { brand: brandName, active: true, stock: { gt: 0 } },
        _count: { id: true },
      }),
    ]);

    tyres = tyreFetch;
    totalCount = aggregate._count.id;
    minPrice = aggregate._min.price;
    for (const row of seasonGroup) {
      seasonCounts[row.season] = row._count.id;
    }
  } catch {
    // DB unavailable — return empty
  }

  return { tyres, totalCount, minPrice, seasonCounts };
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = brandBySlug[slug];
  if (!brand) notFound();

  const content = BRAND_CONTENT[slug];
  const { tyres, totalCount, minPrice, seasonCounts } = await fetchBrandTyres(brand.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    url: `${SITE_URL}/merken/${slug}`,
    logo: `${SITE_URL}${brand.logo}`,
    description: content?.about ?? brand.tagline,
    foundingDate: brand.founded.toString(),
    sameAs: [],
  };

  const faqJsonLd = content?.faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Merken", item: `${SITE_URL}/merken` },
      { "@type": "ListItem", position: 3, name: brand.name, item: `${SITE_URL}/merken/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="brand-detail-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/merken">Merken</Link>
            <span>›</span>
            <span>{brand.name}</span>
          </nav>

          <div className="brand-detail-hero__inner">
            <div className="brand-detail-hero__logo-wrap">
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={120}
                height={60}
                unoptimized
                className="brand-detail-hero__logo"
              />
            </div>
            <div>
              <h1 className="brand-detail-hero__title">{brand.name} banden</h1>
              <p className="brand-detail-hero__subtitle">
                {brand.origin} · Opgericht in {brand.founded} · {brand.tagline}
              </p>
              <div className="brand-detail-hero__stats">
                {totalCount > 0 && (
                  <div className="brand-detail-hero__stat">
                    <div className="brand-detail-hero__stat-value">{totalCount}</div>
                    <div className="brand-detail-hero__stat-label">Op stock</div>
                  </div>
                )}
                {minPrice !== null && (
                  <div className="brand-detail-hero__stat">
                    <div className="brand-detail-hero__stat-value">
                      v.a. €{minPrice.toFixed(0)}
                    </div>
                    <div className="brand-detail-hero__stat-label">Prijs per stuk</div>
                  </div>
                )}
                <div className="brand-detail-hero__stat">
                  <div className="brand-detail-hero__stat-value">{brand.founded}</div>
                  <div className="brand-detail-hero__stat-label">Opgericht</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="brand-detail-body">
        <div className="container">
          <div className="brand-detail-layout">
            {/* Main column */}
            <div>
              {/* About */}
              {content && (
                <div className="brand-about">
                  <h2 className="brand-about__title">Over {brand.name}</h2>
                  <p className="brand-about__text">{content.about}</p>
                  {content.ranges && (
                    <p className="brand-about__text" style={{ marginBottom: 0 }}>
                      <strong>Populaire reeksen:</strong> {content.ranges}
                    </p>
                  )}
                  <div className="brand-about__highlights">
                    {brand.highlights.map((h) => (
                      <div className="brand-about__highlight" key={h}>
                        <div className="brand-about__highlight-icon">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live stock */}
              <div className="brand-tyres">
                <div className="brand-tyres__header">
                  <h2 className="brand-tyres__title">
                    {brand.name} banden op stock{totalCount > 0 ? ` (${totalCount})` : ""}
                  </h2>
                  <Link
                    href={`/banden?brand=${encodeURIComponent(brand.name)}`}
                    className="brand-tyres__view-all"
                  >
                    Alles bekijken
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {tyres.length > 0 ? (
                  <div className="brand-tyres__grid">
                    {tyres.map((tyre) => {
                      const img = tyre.images[0];
                      const seasonKey = tyre.season.toLowerCase().replace("_season", "");
                      const seasonClass =
                        tyre.season === "SUMMER"
                          ? "summer"
                          : tyre.season === "WINTER"
                          ? "winter"
                          : "all";
                      return (
                        <Link
                          key={tyre.id}
                          href={`/banden/${tyre.slug ?? tyre.id}`}
                          className="brand-tyre-card"
                        >
                          <div className="brand-tyre-card__img">
                            {img ? (
                              <img src={img.url} alt={`${brand.name} ${tyre.model}`} />
                            ) : (
                              <TyreIcon />
                            )}
                          </div>
                          <div className="brand-tyre-card__body">
                            <div className="brand-tyre-card__model">{tyre.model}</div>
                            <div className="brand-tyre-card__size">{tyre.size}</div>
                            <div className={`brand-tyre-card__season brand-tyre-card__season--${seasonClass}`}>
                              <SeasonIcon season={tyre.season} size={13} />
                              <span>{SEASON_LABEL[tyre.season]}</span>
                            </div>
                            <div className="brand-tyre-card__price">
                              €{tyre.price.toFixed(2)}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="brand-tyres__empty">
                    <p>
                      Op dit moment geen {brand.name}-banden op stock.{" "}
                      <Link href="/contact" style={{ color: "var(--primary)" }}>
                        Contacteer ons
                      </Link>{" "}
                      voor beschikbaarheid.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="brand-sidebar">
              {/* Season breakdown */}
              {Object.keys(seasonCounts).length > 0 && (
                <div className="brand-sidebar-box">
                  <div className="brand-sidebar-box__title">Seizoenen op stock</div>
                  <div className="brand-sidebar-box__seasons">
                    {["SUMMER", "WINTER", "ALL_SEASON"].map((s) =>
                      seasonCounts[s] ? (
                        <div className="brand-sidebar-season" key={s}>
                          <div
                            className={`brand-sidebar-season__dot brand-sidebar-season__dot--${
                              s === "SUMMER" ? "summer" : s === "WINTER" ? "winter" : "all"
                            }`}
                          />
                          <span className="brand-sidebar-season__label">
                            {SEASON_LABEL[s]}
                          </span>
                          <span className="brand-sidebar-season__count">
                            {seasonCounts[s]}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="brand-sidebar-box">
                <div className="brand-sidebar-box__title">Acties</div>
                <div className="brand-sidebar-box__links">
                  <Link
                    href={`/banden?brand=${encodeURIComponent(brand.name)}`}
                    className="brand-sidebar-box__link brand-sidebar-box__link--primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    Alle {brand.name} banden
                  </Link>
                  <Link
                    href="/afspraak"
                    className="brand-sidebar-box__link brand-sidebar-box__link--outline"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Montage plannen
                  </Link>
                  <Link
                    href="/contact"
                    className="brand-sidebar-box__link brand-sidebar-box__link--outline"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.55 5.55l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Advies vragen
                  </Link>
                </div>
              </div>

              {/* Other brands */}
              <div className="brand-sidebar-box">
                <div className="brand-sidebar-box__title">Andere merken</div>
                <div className="brand-sidebar-box__links">
                  {BRANDS.filter((b) => b.slug !== slug)
                    .slice(0, 5)
                    .map((b) => (
                      <Link
                        key={b.slug}
                        href={`/merken/${b.slug}`}
                        className="brand-sidebar-box__link brand-sidebar-box__link--outline"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {b.name}
                      </Link>
                    ))}
                  <Link
                    href="/merken"
                    className="brand-sidebar-box__link brand-sidebar-box__link--outline"
                    style={{ fontSize: "0.82rem", color: "var(--primary)" }}
                  >
                    Alle merken →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      {content?.faq && (
        <section className="brand-faq">
          <div className="container">
            <h2 className="brand-faq__title">Veelgestelde vragen over {brand.name}</h2>
            <div className="brand-faq__list">
              {content.faq.map((item, i) => (
                <details key={i} className="brand-faq__item">
                  <summary className="brand-faq__q">
                    {item.q}
                    <svg className="brand-faq__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="brand-faq__a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="brands-cta">
        <div className="container">
          <h2 className="brands-cta__title">
            Klaar om uw {brand.name} banden te bestellen?
          </h2>
          <p className="brands-cta__sub">
            Op stock, professioneel gemonteerd in Gent / Sint-Amandsberg.
          </p>
          <div className="brands-cta__actions">
            <Link
              href={`/banden?brand=${encodeURIComponent(brand.name)}`}
              className="btn btn--primary"
            >
              Bekijk alle {brand.name} banden
            </Link>
            <Link href="/afspraak" className="btn btn--outline">
              Montage plannen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
