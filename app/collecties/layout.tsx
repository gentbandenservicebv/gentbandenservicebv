import type { Metadata } from "next";
import { ReactNode } from "react";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: "Banden Breedsets & Collecties — Perfecte Pasvorm per Automodel",
  description:
    "Ontdek complete bandensets en breedsets voor o.a. BMW, Mercedes-Benz, Audi, Porsche en meer. Voor- en achterbanden perfect op elkaar afgestemd bij Gent Bandenservice BV.",
  keywords: [
    "breedsets banden",
    "bandenset BMW",
    "bandenset Mercedes",
    "complete bandenset Gent",
    "breedset 19 inch",
    "breedset 20 inch",
    "verschillende maten voor achter banden",
    "bandenservice Gent",
  ],
  alternates: {
    canonical: `${SITE_URL}/collecties`,
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: `${SITE_URL}/collecties`,
    siteName: "Gent Bandenservice BV",
    title: "Banden Breedsets & Collecties | Gent Bandenservice BV",
    description:
      "Complete bandensets en breedsets per automodel. Direct beschikbaar in Gent.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Banden Breedsets & Collecties Gent Bandenservice BV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Banden Breedsets & Collecties | Gent Bandenservice BV",
    description:
      "Complete bandensets en breedsets per automodel.",
    images: [OG_IMAGE],
  },
};

export default function CollectiesLayout({ children }: { children: ReactNode }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Collecties", item: `${SITE_URL}/collecties` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
