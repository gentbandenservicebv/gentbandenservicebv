import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import BandenCatalogContent from "./BandenCatalogContent";

export const instant = false;

const SITE_URL = "https://www.gentbandenservice.be";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

async function getInitialTyres() {
  await connection();
  try {
    const tyres = await prisma.tyre.findMany({
      where: { active: true },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return tyres;
  } catch (e) {
    console.error("Failed to fetch initial tyres:", e);
    return [];
  }
}

export default async function BandenPage() {
  const initialTyres = await getInitialTyres();

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
    numberOfItems: initialTyres.length,
    itemListElement: initialTyres.slice(0, 40).map((t, idx) => ({
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
      <Suspense fallback={<div className="container" style={{ minHeight: "80vh", paddingTop: 100 }} />}>
        <BandenCatalogContent initialTyres={initialTyres as any} />
      </Suspense>
    </>
  );
}
