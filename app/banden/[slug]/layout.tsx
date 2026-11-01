import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const SEASON_LABEL: Record<string, string> = {
  SUMMER: "Zomerbanden",
  WINTER: "Winterbanden",
  ALL_SEASON: "All-season banden",
};

async function fetchTyre(slugOrId: string) {
  try {
    const decoded = decodeURIComponent(slugOrId);
    let tyre = await prisma.tyre.findFirst({
      where: {
        OR: [{ slug: decoded }, { id: decoded }],
        active: true,
      },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        },
      },
    });

    if (!tyre) {
      tyre = await prisma.tyre.findFirst({
        where: {
          slug: { startsWith: decoded },
          active: true,
        },
        include: {
          images: {
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          },
        },
      });
    }

    return tyre;
  } catch {
    return null;
  }
}

async function buildMetadata(slug: string): Promise<Metadata> {
  "use cache";
  const tyre = await fetchTyre(slug);

  if (!tyre) {
    return {
      title: "Band niet gevonden | Gent Bandenservice BV",
      description:
        "Deze band bestaat niet of is niet meer beschikbaar bij Gent Bandenservice BV.",
    };
  }

  const seasonLabel = SEASON_LABEL[tyre.season] ?? tyre.season;
  const conditionLabel = tyre.condition === "NEW" ? "Nieuw" : "Tweedehands";
  const title = `${tyre.brand} ${tyre.model} ${tyre.size} — ${conditionLabel} ${seasonLabel}`;
  const description =
    tyre.description?.slice(0, 155) ??
    `${conditionLabel} ${tyre.brand} ${tyre.model} band, maat ${tyre.size}. ${seasonLabel}. Slechts €${tyre.price.toFixed(2)} bij Gent Bandenservice BV in Gent / Sint-Amandsberg.`;

  const primaryImg = tyre.images?.find((i) => i.isPrimary) ?? tyre.images?.[0];
  const ogImage = primaryImg?.url ?? OG_IMAGE;
  const canonicalUrl = `${SITE_URL}/banden/${tyre.slug ?? tyre.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "nl_BE",
      url: canonicalUrl,
      siteName: "Gent Bandenservice BV",
      title: `${title} | Gent Bandenservice BV`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Gent Bandenservice BV`,
      description,
      images: [ogImage],
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(slug);
}

async function TyreJsonLd({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  const tyre = await fetchTyre(slug);
  if (!tyre) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${tyre.brand} ${tyre.model} ${tyre.size}`,
    image: tyre.images?.map((img) => img.url) || [OG_IMAGE],
    description:
      tyre.description ||
      `${tyre.brand} ${tyre.model} band, maat ${tyre.size}. Beschikbaar bij Gent Bandenservice BV.`,
    brand: {
      "@type": "Brand",
      name: tyre.brand,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/banden/${tyre.slug || tyre.id}`,
      priceCurrency: "EUR",
      price: tyre.price,
      availability:
        tyre.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition:
        tyre.condition === "NEW"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: "Gent Bandenservice BV",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function TyreDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <TyreJsonLd params={params} />
      </Suspense>
      {children}
    </>
  );
}
