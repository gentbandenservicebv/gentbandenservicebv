import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import CollectiesClient from "./CollectiesClient";

export const instant = false;

async function getInitialCollections() {
  await connection();
  try {
    const collections = await prisma.tyreCollection.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            tyre: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    return collections;
  } catch (err) {
    console.error("Failed to load initial collections:", err);
    return [];
  }
}

export default async function CollectiesPage() {
  const collections = await getInitialCollections();

  return (
    <Suspense fallback={<div className="container" style={{ minHeight: "80vh", paddingTop: 100 }} />}>
      <CollectiesClient initialCollections={collections as any} />
    </Suspense>
  );
}
