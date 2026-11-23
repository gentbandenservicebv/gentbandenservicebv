import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CollectionDetail from "./CollectionDetail";
import CollectionDetailSkeleton from "./CollectionDetailSkeleton";

export const instant = false;

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

async function getCollection(slug: string) {
  await connection();
  try {
    return await prisma.tyreCollection.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        active: true,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            tyre: {
              include: {
                images: {
                  orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
                },
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) {
    return { title: "Collectie niet gevonden | Gent Bandenservice BV" };
  }

  const title = `${collection.name} — Bandenset ${collection.vehicleBrand || ""} ${collection.vehicleModel || ""}`.trim();
  const description =
    collection.description?.slice(0, 155) ||
    `Complete bandenset ${collection.name} voor ${collection.vehicleBrand || ""} ${collection.vehicleModel || ""}. Direct beschikbaar bij Gent Bandenservice BV in Gent.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/collecties/${collection.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/collecties/${collection.slug}`,
      images: [
        {
          url: collection.imageUrl || OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [collection.imageUrl || OG_IMAGE],
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const totalPrice = collection.items.reduce(
    (sum, item) => sum + (item.tyre?.price || 0) * (item.quantity || 1),
    0
  );

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: collection.name,
    description: collection.description || `Complete bandenset voor ${collection.vehicleBrand || "auto"}`,
    image: collection.imageUrl || OG_IMAGE,
    brand: collection.vehicleBrand ? { "@type": "Brand", name: collection.vehicleBrand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/collecties/${collection.slug}`,
      priceCurrency: "EUR",
      price: totalPrice,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Gent Bandenservice BV",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Collecties", item: `${SITE_URL}/collecties` },
      { "@type": "ListItem", position: 3, name: collection.name, item: `${SITE_URL}/collecties/${collection.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Suspense fallback={<CollectionDetailSkeleton />}>
        <CollectionDetail slug={slug} initialCollection={collection as any} />
      </Suspense>
    </>
  );
}
