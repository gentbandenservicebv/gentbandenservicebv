import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillStripeSession } from "@/lib/fulfillment";

/**
 * GET /api/checkout/session?session_id=...
 *
 * Fetches session details for the /bestelling/success page and fulfills
 * the order as a fallback in case the Stripe webhook hasn't fired yet
 * (e.g. local dev without a webhook tunnel, or webhook delivery delay).
 *
 * fulfillStripeSession() is fully idempotent — it checks for an existing
 * order keyed on `Stripe Session: <session_id>` before creating anything,
 * so calling it from both the webhook and here is safe and produces exactly
 * one order regardless of which path runs first.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    let fulfilledOrder = null;
    if (session.payment_status === "paid" || session.status === "complete") {
      try {
        fulfilledOrder = await fulfillStripeSession(session);
      } catch (err) {
        console.error("[Session Route] Fulfillment failed:", err);
      }
    }

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_details: session.customer_details,
      amount_total: session.amount_total,
      line_items: session.line_items?.data ?? [],
      metadata: session.metadata,
      orderId: fulfilledOrder?.id || null,
    });
  } catch (err) {
    console.error("[Session Retrieve Error]:", err);
    return NextResponse.json({ error: "Sessie niet gevonden" }, { status: 404 });
  }
}
