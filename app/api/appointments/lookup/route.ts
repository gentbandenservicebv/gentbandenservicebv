import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/lookup
// Lookup appointments by email + optional reference ID / phone
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const referenceId = typeof body.referenceId === "string" ? body.referenceId.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Gelieve uw e-mailadres in te vullen" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Gelieve een geldig e-mailadres in te vullen" },
        { status: 400 }
      );
    }

    // Build search query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { guestEmail: { equals: email, mode: "insensitive" } },
        { user: { email: { equals: email, mode: "insensitive" } } },
      ],
    };

    if (referenceId) {
      where.id = referenceId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { dateTime: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json(
        {
          error: referenceId
            ? "Geen afspraak gevonden met dit referentienummer en e-mailadres."
            : "Geen afspraken gevonden voor dit e-mailadres.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[Appointment Lookup Error]:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het opzoeken van uw afspraak." },
      { status: 500 }
    );
  }
}
