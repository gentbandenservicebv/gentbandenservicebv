import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  sendAppointmentConfirmation,
  sendAppointmentNotification,
  sendOtpEmail,
} from "@/lib/resend";
import { parseBrusselsDateTime, getBrusselsParts } from "@/lib/appointments";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/appointments/request
// - Guests: validate → send OTP → store pending → return { step: "verify" }
// - Logged-in users: create appointment directly → return { step: "done", appointment }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const body = await req.json();

  // Validate datetime
  if (!body.dateTime) {
    return NextResponse.json({ error: "Datum en tijd zijn verplicht" }, { status: 400 });
  }
  const dateTime = parseBrusselsDateTime(body.dateTime);
  if (isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  }

  // Must be in the future (at least 30 minutes in advance)
  const now = Date.now();
  if (dateTime.getTime() < now + 30 * 60 * 1000) {
    return NextResponse.json(
      { error: "Kies een tijdstip in de toekomst (minimaal 30 minuten van tevoren)." },
      { status: 400 }
    );
  }

  // Cannot book on Sunday (closed)
  const { dayOfWeek } = getBrusselsParts(dateTime);
  if (dayOfWeek === 0) {
    return NextResponse.json(
      { error: "Wij zijn gesloten op zondag. Kies een andere openingsdag." },
      { status: 400 }
    );
  }

  // Check for slot collision (+/- 25 minutes)
  const slotStart = new Date(dateTime.getTime() - 25 * 60 * 1000);
  const slotEnd = new Date(dateTime.getTime() + 25 * 60 * 1000);
  const collision = await prisma.appointment.count({
    where: {
      dateTime: { gte: slotStart, lte: slotEnd },
      status: { not: "CANCELLED" },
    },
  });
  if (collision >= 1) {
    return NextResponse.json(
      { error: "Dit tijdstip is helaas reeds bezet. Kies een ander vrij tijdstip." },
      { status: 409 }
    );
  }

  // ── Logged-in user: skip OTP, create appointment directly ───────────────────
  if (session?.user) {
    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        guestName: body.guestName || session.user.name,
        guestEmail: body.guestEmail || session.user.email,
        guestPhone: body.guestPhone ?? null,
        type: body.type ?? "FITTING",
        dateTime,
        notes: body.notes ?? null,
        vehicleInfo: body.vehicleInfo ?? null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    const emailData = {
      id: appointment.id,
      guestName: null,
      guestEmail: null,
      guestPhone: null,
      userName: appointment.user?.name ?? null,
      userEmail: appointment.user?.email ?? null,
      type: appointment.type,
      dateTime: appointment.dateTime,
      vehicleInfo: appointment.vehicleInfo,
      notes: appointment.notes,
    };

    Promise.all([
      sendAppointmentConfirmation(emailData),
      sendAppointmentNotification(emailData),
    ]).catch(console.error);

    return NextResponse.json({ step: "done", appointment }, { status: 201 });
  }

  // ── Guest: validate required fields ─────────────────────────────────────────
  if (!body.guestName || !body.guestEmail || !body.guestPhone) {
    return NextResponse.json(
      { error: "Naam, e-mail en telefoonnummer zijn verplicht" },
      { status: 400 }
    );
  }

  // Simple email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guestEmail)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  // Rate-limit: max 3 pending OTPs per email in last 15 minutes
  const recentCount = await prisma.pendingAppointmentOtp.count({
    where: {
      email: body.guestEmail,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Te veel aanvragen. Probeer het over 15 minuten opnieuw." },
      { status: 429 }
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store pending record
  const pending = await prisma.pendingAppointmentOtp.create({
    data: {
      email: body.guestEmail,
      otp,
      appointmentData: JSON.stringify({
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestPhone: body.guestPhone,
        type: body.type ?? "FITTING",
        dateTime: dateTime.toISOString(),
        notes: body.notes ?? null,
        vehicleInfo: body.vehicleInfo ?? null,
      }),
      expiresAt,
    },
  });

  // Send OTP email
  try {
    await sendOtpEmail(body.guestEmail, body.guestName, otp);
  } catch (err) {
    console.error("[Appointment Request] sendOtpEmail error:", err);
    // Clean up the pending record if email failed
    await prisma.pendingAppointmentOtp.delete({ where: { id: pending.id } }).catch(() => {});
    return NextResponse.json(
      { error: "Verificatie-e-mail kon niet worden verstuurd. Controleer uw e-mailadres." },
      { status: 500 }
    );
  }

  return NextResponse.json({ step: "verify", pendingId: pending.id }, { status: 200 });
}
