import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { slugify } from "@/lib/slug";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const collection = await prisma.tyreCollection.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            tyre: {
              include: {
                images: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collectie niet gevonden" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (err: any) {
    console.error("GET /api/collections/[id] error:", err);
    return NextResponse.json({ error: "Fout bij ophalen collectie" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      slug: customSlug,
      description,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      season,
      featured,
      active,
      imageUrl,
      items, // if provided, will replace items
    } = body;

    const existing = await prisma.tyreCollection.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Collectie niet gevonden" }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (vehicleBrand !== undefined) updateData.vehicleBrand = vehicleBrand?.trim() || null;
    if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel?.trim() || null;
    if (vehicleYear !== undefined) updateData.vehicleYear = vehicleYear?.trim() || null;
    if (season !== undefined) updateData.season = season;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (active !== undefined) updateData.active = Boolean(active);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;

    if (customSlug && customSlug.trim() !== existing.slug) {
      let finalSlug = slugify(customSlug.trim());
      const slugMatch = await prisma.tyreCollection.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (slugMatch) {
        finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
      }
      updateData.slug = finalSlug;
    }

    // If items are provided, replace them atomically
    if (Array.isArray(items)) {
      await prisma.tyreCollectionItem.deleteMany({
        where: { collectionId: id },
      });

      updateData.items = {
        create: items.map((it: any, index: number) => ({
          tyreId: it.tyreId,
          axle: it.axle || "ALL",
          quantity: Number(it.quantity) || 2,
          sortOrder: index,
        })),
      };
    }

    const updated = await prisma.tyreCollection.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/collections/[id] error:", err);
    return NextResponse.json({ error: err.message || "Fout bij bijwerken collectie" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.tyreCollection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/collections/[id] error:", err);
    return NextResponse.json({ error: "Fout bij verwijderen collectie" }, { status: 500 });
  }
}
