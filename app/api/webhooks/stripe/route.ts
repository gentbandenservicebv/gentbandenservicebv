import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillStripeSession } from "@/lib/fulfillment";

// Required: Verify webhook signature before processing any event
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Webhook Signature Verification Failed]:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle payment completion events
  // Fulfillment happens here, NOT on the success page (customers may not return)
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    // Only fulfill when payment is actually received (not for delayed payment methods still pending)
    if (session.payment_status === "unpaid") {
      return NextResponse.json({ received: true });
    }

    try {
      await fulfillStripeSession(session as any);
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("[Webhook] Fulfillment error:", err);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    console.warn("[Webhook] Payment failed for session:", session.id);
    // Could send a failure email here
  }

  return NextResponse.json({ received: true });
}
