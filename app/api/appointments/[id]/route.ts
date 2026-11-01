import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendAppointmentStatusChange, sendAppointmentRescheduled } from "@/lib/resend";

// Helper – verify admin
async function getAuthUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { session: null, user: null, isAdmin: false };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  return { session, user, isAdmin: user?.role === "ADMIN" };
}

// GET /api/appointments/[id] – get appointment details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get("email");

  const { session, user, isAdmin } = await getAuthUser();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Afspraak niet gevonden" }, { status: 404 });
  }

  // Authorization check: admin, user owner, or matching guest email
  const isOwner =
    (user && appointment.userId === user.id) ||
    (user?.email && appointment.guestEmail?.toLowerCase() === user.email.toLowerCase()) ||
    (session?.user?.email && appointment.guestEmail?.toLowerCase() === session.user.email.toLowerCase()) ||
    (emailParam && appointment.guestEmail?.toLowerCase() === emailParam.toLowerCase().trim());

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Geen toegang tot deze afspraak" }, { status: 403 });
  }

  return NextResponse.json(appointment);
}

// PATCH /api/appointments/[id] – update status / reschedule / edit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { session, user, isAdmin } = await getAuthUser();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Afspraak niet gevonden" }, { status: 404 });
  }

  // Check ownership
  const guestEmailInput = typeof body.guestEmail === "string" ? body.guestEmail.toLowerCase().trim() : null;
  const isOwner =
    (user && appointment.userId === user.id) ||
    (user?.email && appointment.guestEmail?.toLowerCase() === user.email.toLowerCase()) ||
    (session?.user?.email && appointment.guestEmail?.toLowerCase() === session.user.email.toLowerCase()) ||
    (guestEmailInput && appointment.guestEmail?.toLowerCase() === guestEmailInput);

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Geen toegang tot deze afspraak" }, { status: 403 });
  }

  const isExpired = new Date(appointment.dateTime).getTime() <= Date.now();

  // If customer is cancelling
  const isCancelRequest = body.action === "cancel" || body.status === "CANCELLED";
  if (isCancelRequest) {
    if (isExpired && !isAdmin) {
      return NextResponse.json({ error: "Deze afspraak is reeds verlopen en kan niet meer worden geannuleerd." }, { status: 400 });
    }
    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "Deze afspraak is al geannuleerd" }, { status: 400 });
    }
    if (appointment.status === "COMPLETED") {
      return NextResponse.json({ error: "Een voltooide afspraak kan niet meer worden geannuleerd" }, { status: 400 });
    }

    const cancellationReason = body.reason ? ` (${body.reason})` : "";
    const updatedNotes = appointment.notes
      ? `${appointment.notes}\n[Geannuleerd op ${new Date().toLocaleDateString("nl-BE")}${cancellationReason}]`
      : `[Geannuleerd op ${new Date().toLocaleDateString("nl-BE")}${cancellationReason}]`;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: updatedNotes,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Notify customer
    sendAppointmentStatusChange(
      {
        id: updated.id,
        guestName: updated.guestName,
        guestEmail: updated.guestEmail,
        guestPhone: updated.guestPhone,
        userName: updated.user?.name ?? null,
        userEmail: updated.user?.email ?? null,
        type: updated.type,
        dateTime: updated.dateTime,
        vehicleInfo: updated.vehicleInfo,
        notes: updated.notes,
      },
      "CANCELLED"
    ).catch(console.error);

    return NextResponse.json(updated);
  }

  // If customer or admin is rescheduling (dateTime provided)
  if (body.dateTime || body.action === "reschedule") {
    if (isExpired && !isAdmin) {
      return NextResponse.json({ error: "Deze afspraak is reeds verlopen en kan niet meer worden gewijzigd." }, { status: 400 });
    }

    if (!body.dateTime) {
      return NextResponse.json({ error: "Nieuwe datum en tijdstip zijn verplicht" }, { status: 400 });
    }

    const newDateTime = new Date(body.dateTime);
    if (isNaN(newDateTime.getTime())) {
      return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
    }

    // Require date to be at least 1 hour in the future
    const now = new Date();
    if (newDateTime.getTime() < now.getTime() + 60 * 60 * 1000) {
      return NextResponse.json({ error: "Kies een tijdstip in de toekomst (minstens 1 uur vooruit)." }, { status: 400 });
    }

    // Check Sunday
    if (newDateTime.getDay() === 0) {
      return NextResponse.json({ error: "Wij zijn op zondag gesloten. Kies een andere dag (maandag t/m zaterdag)." }, { status: 400 });
    }

    // Check garage opening hours (09:00 - 18:00)
    const hour = newDateTime.getHours();
    const mins = newDateTime.getMinutes();
    if (hour < 9 || (hour >= 18 && mins > 0)) {
      return NextResponse.json({ error: "Onze werkplaats is geopend van 09:00 tot 18:00." }, { status: 400 });
    }

    // Check collision (+/- 25 minutes) against other active appointments
    const slotStart = new Date(newDateTime.getTime() - 25 * 60 * 1000);
    const slotEnd = new Date(newDateTime.getTime() + 25 * 60 * 1000);
    const collision = await prisma.appointment.count({
      where: {
        id: { not: id },
        dateTime: { gte: slotStart, lte: slotEnd },
        status: { not: "CANCELLED" },
      },
    });

    if (collision >= 1) {
      return NextResponse.json(
        { error: "Dit tijdstip is helaas bezet. Kies een ander vrij tijdstip." },
        { status: 409 }
      );
    }

    const oldDateTime = appointment.dateTime;
    const rescheduleNote = `\n[Verzet van ${new Date(oldDateTime).toLocaleString("nl-BE")} naar ${newDateTime.toLocaleString("nl-BE")}]`;
    const updatedNotes = body.notes !== undefined
      ? body.notes
      : (appointment.notes || "") + rescheduleNote;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        dateTime: newDateTime,
        // If it was cancelled or pending, set to PENDING or CONFIRMED
        status: appointment.status === "CANCELLED" ? "PENDING" : appointment.status,
        notes: updatedNotes,
        ...(body.vehicleInfo ? { vehicleInfo: body.vehicleInfo } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Send reschedule email
    sendAppointmentRescheduled(
      {
        id: updated.id,
        guestName: updated.guestName,
        guestEmail: updated.guestEmail,
        guestPhone: updated.guestPhone,
        userName: updated.user?.name ?? null,
        userEmail: updated.user?.email ?? null,
        type: updated.type,
        dateTime: updated.dateTime,
        vehicleInfo: updated.vehicleInfo,
        notes: updated.notes,
      },
      oldDateTime,
      newDateTime
    ).catch(console.error);

    return NextResponse.json(updated);
  }

  // Admin general update (all fields supported)
  if (isAdmin) {
    const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (body.status && !allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const oldDateTime = appointment.dateTime;
    const newDateTime = body.dateTime ? new Date(body.dateTime) : null;
    const dateTimeChanged = newDateTime && !isNaN(newDateTime.getTime()) && newDateTime.getTime() !== new Date(oldDateTime).getTime();

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.guestName !== undefined ? { guestName: body.guestName } : {}),
        ...(body.guestPhone !== undefined ? { guestPhone: body.guestPhone } : {}),
        ...(body.guestEmail !== undefined ? { guestEmail: body.guestEmail } : {}),
        ...(dateTimeChanged ? { dateTime: newDateTime } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.vehicleInfo !== undefined ? { vehicleInfo: body.vehicleInfo } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // If date changed by admin, notify customer if confirmed
    if (dateTimeChanged && (body.status === "CONFIRMED" || appointment.status === "CONFIRMED")) {
      sendAppointmentRescheduled(
        {
          id: updated.id,
          guestName: updated.guestName,
          guestEmail: updated.guestEmail,
          guestPhone: updated.guestPhone,
          userName: updated.user?.name ?? null,
          userEmail: updated.user?.email ?? null,
          type: updated.type,
          dateTime: updated.dateTime,
          vehicleInfo: updated.vehicleInfo,
          notes: updated.notes,
        },
        oldDateTime,
        newDateTime
      ).catch(console.error);
    } else if (body.status && ["CONFIRMED", "CANCELLED", "COMPLETED"].includes(body.status) && body.status !== appointment.status) {
      sendAppointmentStatusChange(
        {
          id: updated.id,
          guestName: updated.guestName,
          guestEmail: updated.guestEmail,
          guestPhone: updated.guestPhone,
          userName: updated.user?.name ?? null,
          userEmail: updated.user?.email ?? null,
          type: updated.type,
          dateTime: updated.dateTime,
          vehicleInfo: updated.vehicleInfo,
          notes: updated.notes,
        },
        body.status
      ).catch(console.error);
    }

    return NextResponse.json(updated);
  }

  // Customer updating notes or details
  if (body.notes !== undefined || body.vehicleInfo !== undefined) {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.vehicleInfo !== undefined ? { vehicleInfo: body.vehicleInfo } : {}),
      },
      include: { user: { select: { name: true, email: true } } },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Geen geldige actie opgegeven" }, { status: 400 });
}

// DELETE /api/appointments/[id] – remove appointment (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAuthUser();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
