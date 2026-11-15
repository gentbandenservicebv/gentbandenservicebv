import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import "../merken/brands.css";

const SITE_URL = "https://www.gentbandenservice.be";

/* ── Static brand metadata ───────────────────────────────────────────── */
interface BrandInfo {
  slug: string;
  name: string;
  origin: string;
  founded: number;
  tagline: string;
  logo: string;
  premium: boolean;
  highlights: string[];
}

export const BRANDS: BrandInfo[] = [
  {
    slug: "michelin",
    name: "Michelin",
    origin: "🇫🇷 Frans",
    founded: 1889,
    tagline: "Leider in rijduurzaamheid en brandstofbesparing",
    logo: "/brands/michelin.svg",
    premium: true,
    highlights: ["Langste levensduur", "Lage rolweerstand", "Uitstekende natte grip"],
  },
  {
    slug: "continental",
    name: "Continental",
    origin: "🇩🇪 Duits",
    founded: 1871,
    tagline: "Duitse precisie voor veiligheid en rijprestatie",
    logo: "/brands/continental.svg",
    premium: true,
    highlights: ["Superieure natte remweg", "Hoge veiligheidscores", "OEM-toeleverancier"],
  },
  {
    slug: "bridgestone",
    name: "Bridgestone",
    origin: "🇯🇵 Japans",
    founded: 1931,
    tagline: "De grootste bandenfabrikant ter wereld",
    logo: "/brands/bridgestone.svg",
    premium: true,
    highlights: ["Wereldmarktleider", "Originele uitrusting topmerken", "Innovatieve technologie"],
  },
  {
    slug: "goodyear",
    name: "Goodyear",
    origin: "🇺🇸 Amerikaans",
    founded: 1898,
    tagline: "Breed assortiment voor elke rijstijl en elk seizoen",
    logo: "/brands/goodyear.svg",
    premium: true,
    highlights: ["Zomer, winter & all-season", "Bewezen duurzaamheid", "Ruim 125 jaar ervaring"],
  },
  {
    slug: "pirelli",
    name: "Pirelli",
    origin: "🇮🇹 Italiaans",
    founded: 1872,
    tagline: "Italiaanse passie voor sportieve rijprestatie",
    logo: "/brands/pirelli.svg",
    premium: true,
    highlights: ["Formule 1-technologie", "P Zero & Cinturato-reeksen", "Uitstekende wegligging"],
  },
  {
    slug: "dunlop",
    name: "Dunlop",
    origin: "🇬🇧 Brits",
    founded: 1888,
    tagline: "Uitstekende prijs-prestatieverhouding met sportief karakter",
    logo: "/brands/dunlop.svg",
    premium: false,
    highlights: ["Sport Maxx-reeks", "Sterk in nat weer", "Erg populair in Europa"],
  },
  {
    slug: "hankook",
    name: "Hankook",
    origin: "🇰🇷 Koreaans",
    founded: 1941,
    tagline: "Premium kwaliteit aan een scherpe prijs",
    logo: "/brands/hankook.svg",
    premium: false,
    highlights: ["Ventus & Kinergy-reeksen", "OEM-leverancier voor Audi, BMW", "Top prijs-kwaliteit"],
  },
  {
    slug: "falken",
    name: "Falken",
    origin: "🇯🇵 Japans",
    founded: 1983,
    tagline: "Sportief Japans design voor veeleisende rijders",
    logo: "/brands/falken.svg",
    premium: false,
    highlights: ["Sumitomo-groep", "Sportieve banden", "Sterk in droog en nat"],
  },
  {
    slug: "nokian",
    name: "Nokian",
    origin: "🇫🇮 Fins",
    founded: 1932,
    tagline: "Wereldleider in winterbanden uit het hoge noorden",
    logo: "/brands/nokian.svg",
    premium: false,
    highlights: ["Beste winterbanden ter wereld", "Fins klimaatexpertise", "Hakkapeliitta-reeks"],
  },
  {
    slug: "bfgoodrich",
    name: "BFGoodrich",
    origin: "🇺🇸 Amerikaans",
    founded: 1870,
    tagline: "All-terrain & performance, deel van de Michelin-groep",
    logo: "/brands/bfgoodrich.svg",
    premium: false,
    highlights: ["Michelin-groep", "All-terrain specialist", "Rallyervaring"],
  },
  {
    slug: "toyo",
    name: "Toyo",
    origin: "🇯🇵 Japans",
    founded: 1945,
    tagline: "Proxes performance en Open Country all-terrain",
    logo: "/brands/toyo.svg",
    premium: false,
    highlights: ["Proxes sportreeks", "Open Country SUV/4x4", "Stille rijcomfort"],
  },
  {
    slug: "yokohama",
    name: "Yokohama",
    origin: "🇯🇵 Japans",
    founded: 1917,
    tagline: "ADVAN sporttechnologie en BluEarth eco-reeks",
    logo: "/brands/yokohama.svg",
    premium: false,
    highlights: ["ADVAN sportreeks", "BluEarth milieuvriendelijk", "Formula 1-erfgoed"],
  },
];

export const brandBySlug = Object.fromEntries(BRANDS.map((b) => [b.slug, b]));

/* ── Metadata ────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Bandmerken — Michelin, Continental, Bridgestone & meer | Gent Bandenservice BV",
  description:
    "Ontdek ons volledige aanbod bandmerken: Michelin, Continental, Bridgestone, Goodyear, Pirelli, Dunlop, Hankook en meer. Altijd rechtstreeks beschikbaar in Gent.",
  alternates: { canonical: `${SITE_URL}/merken` },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/merken`,
    siteName: "Gent Bandenservice BV",
    title: "Bandmerken — Michelin, Continental, Bridgestone & meer | Gent Bandenservice BV",
    description:
      "Ontdek ons volledige aanbod bandmerken. Van premium Michelin tot sportief Falken — altijd kwaliteitsbanden in Gent.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 }],
  },
};

/* ── Cached data fetcher ─────────────────────────────────────────────── */
async function fetchBrandStats() {
  "use cache";
  let brandCounts: Record<string, number> = {};
  let totalStock = 0;
  let otherBrands: string[] = [];

  try {
    const counts = await prisma.tyre.groupBy({
      by: ["brand"],
      _count: { id: true },
      where: { active: true, stock: { gt: 0 } },
    });

    const knownSlugs = new Set(BRANDS.map((b) => b.name.toLowerCase()));

    for (const row of counts) {
      const key = row.brand;
      brandCounts[key] = row._count.id;
      totalStock += row._count.id;

      if (!knownSlugs.has(row.brand.toLowerCase())) {
        otherBrands.push(row.brand);
      }
    }

    otherBrands.sort();
  } catch {
    // DB unavailable — still return empty stats
  }

  return { brandCounts, totalStock, otherBrands };
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default async function BrandsPage() {
  const { brandCounts, totalStock, otherBrands } = await fetchBrandStats();

  const totalBrands = BRANDS.length + otherBrands.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bandmerken bij Gent Bandenservice BV",
    description: "Overzicht van alle bandmerken beschikbaar bij Gent Bandenservice BV",
    url: `${SITE_URL}/merken`,
    numberOfItems: BRANDS.length,
    itemListElement: BRANDS.map((brand, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: brand.name,
      url: `${SITE_URL}/merken/${brand.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Merken", item: `${SITE_URL}/merken` },
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

      {/* ── Page Hero ─────────────────────────────────────────────── */}
      <div className="page-hero bg-dark">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Merken</span>
          </div>
          <span className="hero-trust-badge">
            <span className="badge-sparkle">★</span> Officieel verdeler van topmerken in Gent
          </span>
          <h1 className="h1 text-white" style={{ marginTop: 14 }}>
            Alle Bandmerken bij Gent Bandenservice
          </h1>
          <p className="page-hero__sub">
            Van premium fabrikanten zoals Michelin, Continental en Bridgestone tot scherp geprijsde kwaliteitsmerken. Direct uit voorraad leverbaar en professioneel gemonteerd in Gent.
          </p>

          <div className="hero-pills-row">
            <div className="hero-pill">
              <span className="hero-pill-icon">🏆</span>
              <span>{totalBrands}+ Merken beschikbaar</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">📦</span>
              <span>{totalStock > 0 ? `${totalStock}+ Banden op voorraad` : "Grote stock in Gent"}</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">☀️❄️</span>
              <span>Zomer, winter &amp; all-season</span>
            </div>
            <div className="hero-pill">
              <span className="hero-pill-icon">⚡</span>
              <span>Klaar terwijl u wacht</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium brands grid ───────────────────────────────── */}
      <section className="brands-section">
        <div className="container">
          <div className="brands-section__header">
            <h2 className="brands-section__title">Premium & populaire merken</h2>
            <p className="brands-section__sub">
              Klik op een merk voor uitgebreide info, beschikbare maten en actuele prijzen.
            </p>
          </div>

          <div className="brands-grid">
            {BRANDS.map((brand) => {
              const count = brandCounts[brand.name] ?? 0;
              return (
                <Link
                  key={brand.slug}
                  href={`/merken/${brand.slug}`}
                  className={`brand-card${brand.premium ? " brand-card--premium" : ""}`}
                >
                  <div className="brand-card__logo-wrap">
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      width={120}
                      height={48}
                      className="brand-card__logo"
                    />
                  </div>
                  <div className="brand-card__name">{brand.name}</div>
                  <div className="brand-card__origin">{brand.origin} · sinds {brand.founded}</div>
                  <div className="brand-card__tagline">{brand.tagline}</div>
                  <div className="brand-card__meta">
                    {count > 0 && (
                      <span className="brand-card__pill brand-card__pill--stock">
                        {count} op stock
                      </span>
                    )}
                    <span className="brand-card__pill">Zomer</span>
                    <span className="brand-card__pill">Winter</span>
                  </div>
                  <div className="brand-card__cta">
                    Bekijk banden
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Other brands ─────────────────────────────────────── */}
      {otherBrands.length > 0 && (
        <section className="brands-other">
          <div className="container">
            <h2 className="brands-other__title">Overige merken op stock</h2>
            <div className="brands-other__grid">
              {otherBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/banden?brand=${encodeURIComponent(brand)}`}
                  className="brands-other__tag"
                >
                  {brand}
                  {brandCounts[brand] ? ` (${brandCounts[brand]})` : ""}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="brands-cta">
        <div className="container">
          <h2 className="brands-cta__title">Niet zeker welk merk past bij u?</h2>
          <p className="brands-cta__sub">
            Onze experts helpen u de beste keuze maken op basis van uw wagen, rijstijl en budget.
          </p>
          <div className="brands-cta__actions">
            <Link href="/banden" className="btn btn--primary">
              Alle banden bekijken
            </Link>
            <Link href="/contact" className="btn btn--outline">
              Vraag advies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
