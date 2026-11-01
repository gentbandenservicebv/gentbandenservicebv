import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  sendAppointmentConfirmation,
  sendAppointmentNotification,
} from "@/lib/resend";
import {
  sanitizeString,
  sanitizeOptionalString,
  isValidEmail,
  sanitizePhone,
  checkRateLimit,
} from "@/lib/security";

// POST /api/appointments - book an appointment
export async function POST(req: NextRequest) {
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "anonymous";

  const rateLimitResult = checkRateLimit(`appoint:${clientIp}`, 8, 10 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: `Te veel verzoeken. Probeer het over ${Math.ceil(
          rateLimitResult.retryAfterSec / 60
        )} minuten opnieuw.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitResult.retryAfterSec) },
      }
    );
  }

  const session = await auth.api.getSession({ headers: headerList });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  if (!body.dateTime) {
    return NextResponse.json({ error: "Datum en tijd zijn verplicht" }, { status: 400 });
  }

  const dateTime = new Date(String(body.dateTime));
  if (isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  }

  // Must have contact info (from session or guest fields)
  let targetUserId = session?.user?.id ?? null;
  if (session?.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role === "ADMIN" && typeof body.userId === "string") {
      targetUserId = body.userId;
    }
  }

  const cleanGuestName = sanitizeOptionalString(body.guestName, 100);
  const cleanGuestEmail =
    typeof body.guestEmail === "string" && isValidEmail(body.guestEmail)
      ? body.guestEmail.trim().toLowerCase().slice(0, 150)
      : null;
  const cleanGuestPhone = sanitizePhone(body.guestPhone);

  if (!targetUserId && (!cleanGuestName || !cleanGuestEmail || !cleanGuestPhone)) {
    return NextResponse.json(
      { error: "Naam, geldig e-mailadres en telefoonnummer zijn verplicht voor gasten" },
      { status: 400 }
    );
  }

  const allowedTypes = ["FITTING", "REPAIR", "INSPECTION", "OTHER"] as const;
  const cleanType = (
    typeof body.type === "string" && allowedTypes.includes(body.type as (typeof allowedTypes)[number])
      ? body.type
      : "FITTING"
  ) as "FITTING" | "REPAIR" | "INSPECTION" | "OTHER";

  const cleanNotes = sanitizeOptionalString(body.notes, 1000);
  const cleanVehicleInfo = sanitizeOptionalString(body.vehicleInfo, 100);

  const appointment = await prisma.appointment.create({
    data: {
      userId: targetUserId,
      guestName: cleanGuestName,
      guestEmail: cleanGuestEmail,
      guestPhone: cleanGuestPhone,
      type: cleanType,
      dateTime,
      status: "PENDING",
      notes: cleanNotes,
      vehicleInfo: cleanVehicleInfo,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  // Send emails in background (don't block response)
  const appWithUser = appointment as typeof appointment & { user?: { name: string | null; email: string } | null };
  const emailData = {
    id: appointment.id,
    guestName: appointment.guestName,
    guestEmail: appointment.guestEmail,
    guestPhone: appointment.guestPhone,
    userName: appWithUser.user?.name ?? null,
    userEmail: appWithUser.user?.email ?? null,
    type: appointment.type,
    dateTime: appointment.dateTime,
    vehicleInfo: appointment.vehicleInfo,
    notes: appointment.notes,
  };

  // Fire-and-forget – errors are logged server-side, never block the response
  Promise.all([
    sendAppointmentConfirmation(emailData),
    sendAppointmentNotification(emailData),
  ]).catch(console.error);

  return NextResponse.json(appointment, { status: 201 });
}

// GET /api/appointments - list (admin: all, user: own)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  const isAdmin = user?.role === "ADMIN";

  // Auto-link any previous guest appointments matching this user's email
  if (user?.email && !isAdmin) {
    await prisma.appointment.updateMany({
      where: {
        userId: null,
        guestEmail: { equals: user.email, mode: "insensitive" },
      },
      data: {
        userId: session.user.id,
      },
    }).catch(() => {});
  }

  const appointments = await prisma.appointment.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { userId: session.user.id },
            ...(user?.email
              ? [
                  {
                    guestEmail: {
                      equals: user.email,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { dateTime: "asc" },
  });

  return NextResponse.json(appointments);
}
