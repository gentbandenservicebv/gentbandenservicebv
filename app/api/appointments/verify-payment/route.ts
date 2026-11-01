import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillStripeSession } from "@/lib/fulfillment";

/**
 * POST /api/appointments/verify-payment
 *
 * Called by the /afspraak page after Stripe redirects back with ?status=paid.
 * Fulfills the order and appointment via fulfillStripeSession() (which is
 * completely idempotent and protected by an in-flight session mutex against race
 * conditions with the Stripe webhook).
 *
 * Then returns the confirmed appointment to the frontend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Sessie ID ontbreekt" }, { status: 400 });
    }

    // Verify payment status directly with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "De betaling is nog niet voltooid of is geannuleerd." },
        { status: 400 }
      );
    }

    // Run fulfillment (creates Order & Appointment if not already done by webhook)
    try {
      await fulfillStripeSession(session as any);
    } catch (fulfillErr) {
      console.error("[Verify Payment] Fulfillment failed:", fulfillErr);
    }

    // Look up the appointment created for this session
    let appointment = await prisma.appointment.findFirst({
      where: {
        notes: { contains: `Stripe: ${session.id}` },
      },
    });

    // Direct fallback guarantee: if appointment not yet in DB, create it now
    if (!appointment) {
      const meta = session.metadata || {};
      let apptMeta: any = {};
      if (meta.appointmentData) {
        try {
          apptMeta = JSON.parse(meta.appointmentData);
        } catch {}
      }

      const rawDateTime = apptMeta.dateTime || meta.apptDateTime;
      const parsedDate = rawDateTime ? new Date(rawDateTime) : new Date();
      const validDateTime = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      const rawType = (apptMeta.type || meta.apptType || "FITTING").toUpperCase();
      const validApptType: "FITTING" | "REPAIR" | "INSPECTION" | "OTHER" =
        ["FITTING", "REPAIR", "INSPECTION", "OTHER"].includes(rawType) ? (rawType as any) : "FITTING";

      const orderTotal = session.amount_total ? session.amount_total / 100 : 0;
      const notes = `[Online betaald via Stripe: €${orderTotal.toFixed(2)} - Stripe: ${session.id}]\n${apptMeta.notes || meta.apptNotes || ""}`.trim();

      appointment = await prisma.appointment.create({
        data: {
          guestName: apptMeta.guestName || meta.guestName || session.customer_details?.name || "Klant",
          guestEmail: apptMeta.guestEmail || meta.guestEmail || session.customer_details?.email || "",
          guestPhone: apptMeta.guestPhone || meta.guestPhone || session.customer_details?.phone || "",
          type: validApptType,
          dateTime: validDateTime,
          status: "CONFIRMED",
          vehicleInfo: apptMeta.vehicleInfo || meta.apptVehicleInfo || null,
          notes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      appointment,
      orderTotal: session.amount_total ? session.amount_total / 100 : 0,
    });
  } catch (err: any) {
    console.error("[Verify Payment Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Fout bij verifiëren van betaling" },
      { status: 500 }
    );
  }
}
