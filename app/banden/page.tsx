import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import BandenCatalogContent from "./BandenCatalogContent";

async function getInitialTyres() {
  "use cache";
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

  return (
    <Suspense fallback={<div className="container" style={{ minHeight: "80vh", paddingTop: 100 }} />}>
      <BandenCatalogContent initialTyres={initialTyres as any} />
    </Suspense>
  );
}
