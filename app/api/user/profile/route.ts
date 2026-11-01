import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/user/profile - get current user profile
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/user/profile - update profile fields
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow updating safe fields
  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    allowed.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    allowed.phone = body.phone.trim() || null;
  }
  if (typeof body.street === "string") {
    allowed.street = body.street.trim() || null;
  }
  if (typeof body.postalCode === "string") {
    allowed.postalCode = body.postalCode.trim() || null;
  }
  if (typeof body.city === "string") {
    allowed.city = body.city.trim() || null;
  }
  if (typeof body.country === "string" && body.country.trim()) {
    allowed.country = body.country.trim();
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "Geen geldige velden" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: allowed,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
