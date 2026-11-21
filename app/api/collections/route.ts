import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { slugify } from "@/lib/slug";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");
    const brand = searchParams.get("brand");
    const featured = searchParams.get("featured");
    const includeInactive = searchParams.get("all") === "1";

    const where: any = {};
    if (!includeInactive) {
      where.active = true;
    }
    if (season && season !== "ALL") {
      where.season = season;
    }
    if (brand && brand !== "ALL") {
      where.vehicleBrand = { equals: brand, mode: "insensitive" };
    }
    if (featured === "true" || featured === "1") {
      where.featured = true;
    }

    const collections = await prisma.tyreCollection.findMany({
      where,
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

    return NextResponse.json(collections);
  } catch (err: any) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json({ error: "Fout bij ophalen collecties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug: customSlug,
      description,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      season = "ALL_SEASON",
      featured = false,
      active = true,
      imageUrl,
      items = [], // [{ tyreId, axle: "FRONT" | "REAR" | "ALL", quantity: 2 }]
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
    }

    let finalSlug = customSlug?.trim() ? slugify(customSlug.trim()) : slugify(name.trim());
    if (!finalSlug) finalSlug = "collectie-" + Date.now();

    // Check slug collision
    const existing = await prisma.tyreCollection.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    const collection = await prisma.tyreCollection.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        vehicleBrand: vehicleBrand?.trim() || null,
        vehicleModel: vehicleModel?.trim() || null,
        vehicleYear: vehicleYear?.trim() || null,
        season,
        featured: Boolean(featured),
        active: Boolean(active),
        imageUrl: imageUrl?.trim() || null,
        items: {
          create: items.map((it: any, index: number) => ({
            tyreId: it.tyreId,
            axle: it.axle || "ALL",
            quantity: Number(it.quantity) || 2,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: {
          include: {
            tyre: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json({ error: err.message || "Fout bij aanmaken collectie" }, { status: 500 });
  }
}
