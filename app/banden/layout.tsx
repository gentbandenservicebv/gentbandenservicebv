import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Nieuw & Tweedehands Banden Kopen in Gent — Alle Maten",
  description:
    "Koop nieuw of tweedehands banden in Gent aan scherpe prijzen. Zomer-, winter- en all-season banden van alle A-merken. Maten zoals 205/55R16, 195/65R15, 225/45R17 en meer. Direct afhaalbaar in Sint-Amandsberg.",
  keywords: [
    "banden kopen Gent",
    "nieuw banden Gent",
    "tweedehands banden Gent",
    "tweedehands banden 205 55r16",
    "tweedehands banden 195 65r15",
    "tweedehands banden 225 45r17",
    "goedkope banden Gent",
    "zomerbanden Gent",
    "winterbanden Gent",
    "all-season banden Gent",
    "A-merk banden Sint-Amandsberg",
    "banden webshop Gent",
    "205/55R16 tweedehands",
    "195/65R15 tweedehands",
  ],
  alternates: {
    canonical: `${SITE_URL}/banden`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/banden`,
    siteName: "Gent Bandenservice BV",
    title: "Nieuw & Tweedehands Banden Gent — Alle Maten | Gent Bandenservice BV",
    description:
      "Koop nieuw of tweedehands banden in Gent. Alle maten en merken, direct afhaalbaar of leverbaar.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Tweedehands en nieuwe banden Gent — Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nieuw & Tweedehands Banden Gent — Alle Maten | Gent Bandenservice BV",
    description:
      "Koop nieuw of tweedehands banden in Gent. Alle maten, direct afhaalbaar.",
    images: [OG_IMAGE],
  },
};

async function BandenJsonLd() {
  "use cache";
  try {
    const tyres = await prisma.tyre.findMany({
      where: { active: true },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 40,
      orderBy: { createdAt: "desc" },
    });

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Banden", item: `${SITE_URL}/banden` },
      ],
    };

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Bandenassortiment Gent Bandenservice BV",
      description: "Aanbod van nieuwe en tweedehands banden in Gent",
      url: `${SITE_URL}/banden`,
      numberOfItems: tyres.length,
      itemListElement: tyres.map((t, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          name: `${t.condition === "USED" ? "Tweedehands " : ""}${t.brand} ${t.model} ${t.size}`,
          url: `${SITE_URL}/banden/${t.slug || t.id}`,
          image: t.images?.[0]?.url || OG_IMAGE,
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

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      </>
    );
  } catch {
    return null;
  }
}

export default function BandenLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <BandenJsonLd />
      </Suspense>
      {children}
    </>
  );
}
