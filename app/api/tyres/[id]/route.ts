import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateTyreSlug } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

// GET /api/tyres/[id] (can be slug or cuid)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);

  let tyre = await prisma.tyre.findFirst({
    where: {
      OR: [
        { slug: decoded },
        { id: decoded },
      ],
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

  if (!tyre) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tyre);
}

function parseSizeComponents(sizeStr?: string) {
  if (!sizeStr) return { width: null, aspectRatio: null, diameter: null };
  const match = sizeStr.match(/(\d{3})\/(\d{2})\s*(?:R|r|ZR|zr|-)?\s*(\d{2})/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      aspectRatio: parseInt(match[2], 10),
      diameter: parseInt(match[3], 10),
    };
  }
  return { width: null, aspectRatio: null, diameter: null };
}

// PATCH /api/tyres/[id] - admin update
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const decoded = decodeURIComponent(id);
  const target = await prisma.tyre.findFirst({
    where: { OR: [{ slug: decoded }, { id: decoded }] },
    select: { id: true, brand: true, model: true, size: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = body.size
    ? parseSizeComponents(body.size)
    : { width: null, aspectRatio: null, diameter: null };

  const newBrand = (body.brand !== undefined ? body.brand : target.brand) || "";
  const newModel = (body.model !== undefined ? body.model : target.model) || "";
  const newSize = (body.size !== undefined ? body.size : target.size) || "";
  const newSlug = generateTyreSlug(newBrand, newModel, newSize, target.id);

  const tyre = await prisma.tyre.update({
    where: { id: target.id },
    data: {
      slug: newSlug,
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.size !== undefined && {
        size: body.size,
        width: body.width ? parseInt(body.width, 10) : parsed.width,
        aspectRatio: body.aspectRatio ? parseInt(body.aspectRatio, 10) : parsed.aspectRatio,
        diameter: body.diameter ? parseInt(body.diameter, 10) : parsed.diameter,
      }),
      ...(body.season !== undefined && { season: body.season }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.price !== undefined && { price: parseFloat(body.price) }),
      ...(body.stock !== undefined && { stock: parseInt(body.stock, 10) }),
      ...(body.treadDepth !== undefined && {
        treadDepth: body.treadDepth ? parseFloat(body.treadDepth) : null,
      }),
      ...(body.speedIndex !== undefined && { speedIndex: body.speedIndex || null }),
      ...(body.loadIndex !== undefined && { loadIndex: body.loadIndex || null }),
      ...(body.dotYear !== undefined && { dotYear: body.dotYear || null }),
      ...(body.runflat !== undefined && { runflat: Boolean(body.runflat) }),
      ...(body.reinforced !== undefined && { reinforced: Boolean(body.reinforced) }),
      ...(body.threepmsfRated !== undefined && { threepmsfRated: Boolean(body.threepmsfRated) }),
      ...(body.msMarking !== undefined && { msMarking: Boolean(body.msMarking) }),
      ...(body.selfSealing !== undefined && { selfSealing: Boolean(body.selfSealing) }),
      ...(body.acoustic !== undefined && { acoustic: Boolean(body.acoustic) }),
      ...(body.electric !== undefined && { electric: Boolean(body.electric) }),
      ...(body.rimProtection !== undefined && { rimProtection: Boolean(body.rimProtection) }),
      ...(body.iceGrip !== undefined && { iceGrip: Boolean(body.iceGrip) }),
      ...(body.highLoad !== undefined && { highLoad: Boolean(body.highLoad) }),
      ...(body.demo !== undefined && { demo: Boolean(body.demo) }),
      ...(body.oeMarking !== undefined && { oeMarking: body.oeMarking || null }),
      ...(body.tyreClass !== undefined && { tyreClass: body.tyreClass || null }),
      ...(body.plyRating !== undefined && { plyRating: body.plyRating || null }),
      ...(body.loadRange !== undefined && { loadRange: body.loadRange || null }),
      ...(body.structureType !== undefined && { structureType: body.structureType || null }),
      ...(body.tubeless !== undefined && { tubeless: Boolean(body.tubeless) }),
      ...(body.fuelEfficiency !== undefined && { fuelEfficiency: body.fuelEfficiency || null }),
      ...(body.wetGrip !== undefined && { wetGrip: body.wetGrip || null }),
      ...(body.noiseLevel !== undefined && {
        noiseLevel: body.noiseLevel ? parseInt(body.noiseLevel, 10) : null,
      }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
      ...(body.active !== undefined && { active: Boolean(body.active) }),
    },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
  });
  return NextResponse.json(tyre);
}

// DELETE /api/tyres/[id] - admin soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const decoded = decodeURIComponent(id);
  const target = await prisma.tyre.findFirst({
    where: { OR: [{ slug: decoded }, { id: decoded }] },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tyre.update({ where: { id: target.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}

export const PUT = PATCH;
