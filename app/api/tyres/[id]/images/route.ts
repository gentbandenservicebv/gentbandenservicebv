import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

// POST /api/tyres/[id]/images - save uploaded image metadata
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  // body: { images: [{ url, fileKey, isPrimary, order }] }

  const existing = await prisma.tyreImage.count({ where: { tyreId: id } });

  const images = await prisma.$transaction(
    body.images.map((img: { url: string; fileKey?: string; isPrimary?: boolean }, idx: number) =>
      prisma.tyreImage.create({
        data: {
          tyreId: id,
          url: img.url,
          fileKey: img.fileKey || `manual_${Date.now()}_${idx}`,
          isPrimary: img.isPrimary ?? (existing === 0 && idx === 0),
          order: existing + idx,
        },
      })
    )
  );

  return NextResponse.json(images, { status: 201 });
}

// PATCH /api/tyres/[id]/images - set primary photo or update order
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { primaryImageId } = body;

  if (primaryImageId) {
    await prisma.$transaction([
      prisma.tyreImage.updateMany({
        where: { tyreId: id },
        data: { isPrimary: false },
      }),
      prisma.tyreImage.update({
        where: { id: primaryImageId, tyreId: id },
        data: { isPrimary: true },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/tyres/[id]/images - delete a tyre image
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { imageId } = await req.json();
  const deleted = await prisma.tyreImage.delete({ where: { id: imageId, tyreId: id } });

  // If the deleted image was primary, set the first remaining image as primary
  if (deleted.isPrimary) {
    const nextFirst = await prisma.tyreImage.findFirst({
      where: { tyreId: id },
      orderBy: { order: "asc" },
    });
    if (nextFirst) {
      await prisma.tyreImage.update({
        where: { id: nextFirst.id },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
