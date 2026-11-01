import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAppointmentConfirmation,
  sendAppointmentNotification,
} from "@/lib/resend";

const MAX_ATTEMPTS = 5;

// POST /api/appointments/confirm
// Body: { pendingId, otp }
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.pendingId || !body.otp) {
    return NextResponse.json({ error: "Ontbrekende gegevens" }, { status: 400 });
  }

  const pending = await prisma.pendingAppointmentOtp.findUnique({
    where: { id: body.pendingId },
  });

  if (!pending) {
    return NextResponse.json(
      { error: "Verificatiesessie niet gevonden. Start opnieuw." },
      { status: 404 }
    );
  }

  // Check expiry
  if (new Date() > pending.expiresAt) {
    await prisma.pendingAppointmentOtp.delete({ where: { id: pending.id } }).catch(() => {});
    return NextResponse.json(
      { error: "De verificatiecode is verlopen. Vraag een nieuwe code aan." },
      { status: 410 }
    );
  }

  // Check attempts
  if (pending.attempts >= MAX_ATTEMPTS) {
    await prisma.pendingAppointmentOtp.delete({ where: { id: pending.id } }).catch(() => {});
    return NextResponse.json(
      { error: "Te veel foutieve pogingen. Start het formulier opnieuw." },
      { status: 429 }
    );
  }

  // Verify OTP
  if (body.otp.trim() !== pending.otp) {
    await prisma.pendingAppointmentOtp.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - pending.attempts - 1;
    return NextResponse.json(
      { error: `Onjuiste code. ${remaining} poging${remaining === 1 ? "" : "en"} resterend.` },
      { status: 400 }
    );
  }

  // ── OTP correct: create the real appointment ─────────────────────────────────
  let apptData: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    type: string;
    dateTime: string;
    notes?: string | null;
    vehicleInfo?: string | null;
  };

  try {
    apptData = JSON.parse(pending.appointmentData);
  } catch {
    return NextResponse.json({ error: "Ongeldige afspraakgegevens" }, { status: 400 });
  }

  const dateTime = new Date(apptData.dateTime);

  // Check collision before final creation
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
      { error: "Dit tijdstip is inmiddels helaas door iemand anders gereserveerd. Neem contact op of kies een ander slot." },
      { status: 409 }
    );
  }

  // Link to user account if one exists with this email
  const existingUser = apptData.guestEmail
    ? await prisma.user.findFirst({
        where: { email: { equals: apptData.guestEmail, mode: "insensitive" } },
        select: { id: true },
      })
    : null;

  const appointment = await prisma.appointment.create({
    data: {
      userId: existingUser?.id ?? null,
      guestName: apptData.guestName,
      guestEmail: apptData.guestEmail,
      guestPhone: apptData.guestPhone,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (apptData.type ?? "FITTING") as any,
      dateTime,
      notes: apptData.notes ?? null,
      vehicleInfo: apptData.vehicleInfo ?? null,
    },
  });

  // Clean up the pending record
  await prisma.pendingAppointmentOtp.delete({ where: { id: pending.id } }).catch(() => {});

  // Fire-and-forget emails
  const emailData = {
    id: appointment.id,
    guestName: appointment.guestName,
    guestEmail: appointment.guestEmail,
    guestPhone: appointment.guestPhone,
    userName: null,
    userEmail: null,
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
