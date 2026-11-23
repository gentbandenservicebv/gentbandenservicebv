import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  sendAppointmentStatusChange,
  sendAppointmentRescheduled,
  sendReviewRequestEmail,
} from "@/lib/resend";
import { parseBrusselsDateTime } from "@/lib/appointments";

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

  // ── ADMIN PRIVILEGED UPDATES ────────────────────────────────────────────────
  if (isAdmin) {
    const allowedStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Ongeldige status opgegeven" }, { status: 400 });
    }

    const allowedTypes = ["FITTING", "REPAIR", "INSPECTION", "OTHER"];
    if (body.type && !allowedTypes.includes(body.type)) {
      return NextResponse.json({ error: "Ongeldig type service opgegeven" }, { status: 400 });
    }

    const oldDateTime = appointment.dateTime;
    let newDateTime: Date | null = null;
    let dateTimeChanged = false;

    if (body.dateTime) {
      newDateTime = parseBrusselsDateTime(body.dateTime);
      if (isNaN(newDateTime.getTime())) {
        return NextResponse.json({ error: "Ongeldige datum of tijd" }, { status: 400 });
      }
      dateTimeChanged = newDateTime.getTime() !== new Date(oldDateTime).getTime();
    }

    // Determine updated notes if any
    let updatedNotes = appointment.notes;
    if (body.notes !== undefined) {
      updatedNotes = body.notes ? String(body.notes).trim() : null;
    }

    // Status change
    const newStatus = body.status || appointment.status;
    const statusChanged = body.status && body.status !== appointment.status;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.guestName !== undefined ? { guestName: body.guestName ? String(body.guestName).trim() : null } : {}),
        ...(body.guestPhone !== undefined ? { guestPhone: body.guestPhone ? String(body.guestPhone).trim() : null } : {}),
        ...(body.guestEmail !== undefined ? { guestEmail: body.guestEmail ? String(body.guestEmail).trim() : null } : {}),
        ...(dateTimeChanged && newDateTime ? { dateTime: newDateTime, reminderSentAt: null } : {}),
        notes: updatedNotes,
        ...(body.vehicleInfo !== undefined ? { vehicleInfo: body.vehicleInfo ? String(body.vehicleInfo).trim() : null } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        tyre: { select: { id: true, brand: true, model: true, size: true } },
      },
    });

    const emailPayload = {
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
    };

    // If date changed by admin and appointment is confirmed, notify customer
    if (dateTimeChanged && newDateTime && (newStatus === "CONFIRMED" || appointment.status === "CONFIRMED")) {
      sendAppointmentRescheduled(emailPayload, oldDateTime, newDateTime).catch(console.error);
    } else if (statusChanged && ["CONFIRMED", "CANCELLED", "COMPLETED"].includes(newStatus)) {
      sendAppointmentStatusChange(emailPayload, newStatus).catch(console.error);

      // Along with completion email, send review request email
      if (newStatus === "COMPLETED") {
        const customerEmail = updated.user?.email || updated.guestEmail;
        if (customerEmail) {
          (async () => {
            let matchedTyre = updated.tyre;
            // Fallback match from notes or vehicleInfo if not linked by FK
            if (!matchedTyre && (updated.notes || updated.vehicleInfo)) {
              try {
                const combined = `${updated.notes || ""} ${updated.vehicleInfo || ""}`.toLowerCase();
                const sampleTyres = await prisma.tyre.findMany({
                  where: { active: true },
                  select: { id: true, brand: true, model: true, size: true },
                  take: 60,
                });
                for (const t of sampleTyres) {
                  if (combined.includes(t.brand.toLowerCase()) && combined.includes(t.model.toLowerCase())) {
                    matchedTyre = t;
                    break;
                  }
                }
              } catch (e) {
                console.error("[Match tyre error]:", e);
              }
            }

            await sendReviewRequestEmail({
              appointmentId: updated.id,
              customerName: updated.user?.name || updated.guestName,
              customerEmail,
              tyre: matchedTyre,
            });
          })().catch((err) => console.error("[Review Request Email failed]:", err));
        }
      }
    }

    return NextResponse.json(updated);
  }

  // ── CUSTOMER / GUEST SELF-SERVICE ACTIONS ───────────────────────────────────
  const isExpired = new Date(appointment.dateTime).getTime() <= Date.now();

  // 1. Customer cancellation
  const isCancelRequest = body.action === "cancel" || body.status === "CANCELLED";
  if (isCancelRequest) {
    if (isExpired) {
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

  // 2. Customer rescheduling
  if (body.dateTime || body.action === "reschedule") {
    if (isExpired) {
      return NextResponse.json({ error: "Deze afspraak is reeds verlopen en kan niet meer worden gewijzigd." }, { status: 400 });
    }

    if (!body.dateTime) {
      return NextResponse.json({ error: "Nieuwe datum en tijdstip zijn verplicht" }, { status: 400 });
    }

    const newDateTime = parseBrusselsDateTime(body.dateTime);
    if (isNaN(newDateTime.getTime())) {
      return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
    }

    // Require date to be at least 1 hour in the future
    const now = Date.now();
    if (newDateTime.getTime() < now + 60 * 60 * 1000) {
      return NextResponse.json({ error: "Kies een tijdstip in de toekomst (minstens 1 uur vooruit)." }, { status: 400 });
    }

    // Check Sunday
    if (newDateTime.getDay() === 0) {
      return NextResponse.json({ error: "Wij zijn op zondag gesloten. Kies een andere dag (maandag t/m zaterdag)." }, { status: 400 });
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
        reminderSentAt: null,
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

  // 3. Customer updating notes or details
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
