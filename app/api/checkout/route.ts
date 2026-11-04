import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const MONTAGE_PRICE_CENTS = 1999; // €19.99 per tyre

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionAuth = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    const resolvedUserId = sessionAuth?.user?.id || body.userId || "";

    const {
      tyreId,
      quantity,
      items: rawItems,
      withMontage,
      guestName,
      guestEmail,
      guestPhone,
      address,
      notes,
    } = body;

    // Normalize items to array of { tyreId, quantity }
    let itemsToProcess: Array<{ tyreId: string; quantity: number }> = [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      itemsToProcess = rawItems.map((it: any) => ({
        tyreId: it.tyreId || it.id,
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      }));
    } else if (tyreId && quantity && quantity >= 1) {
      itemsToProcess = [{ tyreId, quantity: parseInt(quantity, 10) }];
    } else {
      return NextResponse.json({ error: "Geen geldige banden in bestelling" }, { status: 400 });
    }

    // Load tyres from database
    const tyreIds = itemsToProcess.map((i) => i.tyreId);
    const tyresFromDb = await prisma.tyre.findMany({
      where: { id: { in: tyreIds }, active: true },
    });

    if (tyresFromDb.length !== itemsToProcess.length) {
      return NextResponse.json({ error: "Eén of meerdere banden zijn niet langer beschikbaar." }, { status: 404 });
    }

    const tyresMap = new Map(tyresFromDb.map((t) => [t.id, t]));

    // Validate stock
    for (const item of itemsToProcess) {
      const dbTyre = tyresMap.get(item.tyreId);
      if (!dbTyre) continue;
      if (dbTyre.stock < item.quantity) {
        return NextResponse.json(
          { error: `Onvoldoende voorraad voor ${dbTyre.brand} ${dbTyre.model}. Slechts ${dbTyre.stock} beschikbaar.` },
          { status: 400 }
        );
      }
    }

    // Validate secondhand tires delivery restriction
    const hasSecondhand = itemsToProcess.some(
      (item) => tyresMap.get(item.tyreId)?.condition === "USED"
    );
    if (hasSecondhand && !withMontage) {
      return NextResponse.json(
        {
          error:
            "Tweedehands banden kunnen niet geleverd worden. Kies voor montage of afhaling in onze werkplaats.",
        },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Build line items for Stripe Checkout
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description: string; images?: string[] };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    let totalTyreCount = 0;
    const fulfillmentItems: Array<{ tyreId: string; quantity: number; price: number }> = [];

    for (const item of itemsToProcess) {
      const tyre = tyresMap.get(item.tyreId)!;
      totalTyreCount += item.quantity;
      fulfillmentItems.push({
        tyreId: tyre.id,
        quantity: item.quantity,
        price: tyre.price,
      });

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${tyre.brand} ${tyre.model} – ${tyre.size}`,
            description: [
              tyre.condition === "NEW" ? "Nieuw" : "2de hands",
              tyre.season === "SUMMER" ? "Zomerbanden" : tyre.season === "WINTER" ? "Winterbanden" : "All-season banden",
              tyre.dotYear ? `DOT ${tyre.dotYear}` : null,
            ].filter(Boolean).join(" · "),
          },
          unit_amount: Math.round(tyre.price * 100),
        },
        quantity: item.quantity,
      });
    }

    // Add montage & balancing line if requested (+€19.99 per tyre)
    if (withMontage) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Montage & Balancering",
            description: `Vakkundige montage en balancering ter plaatse in onze werkplaats (Dendermondsesteenweg 428, 9040 Gent) — ${totalTyreCount} band${totalTyreCount > 1 ? "en" : ""}`,
          },
          unit_amount: MONTAGE_PRICE_CENTS,
        },
        quantity: totalTyreCount,
      });
    }

    // Format address string if provided and montage is not selected
    const street = address?.street?.trim() || "";
    const postalCode = address?.postalCode?.trim() || "";
    const city = address?.city?.trim() || "";
    const country = address?.country?.trim() || "België";
    const addressStr = (!withMontage && address)
      ? [street, `${postalCode} ${city}`.trim(), country].filter(Boolean).join(", ")
      : "";

    // Create Stripe Checkout Session
    const sessionParams: any = {
      mode: "payment",
      line_items: lineItems,
      metadata: {
        userId: resolvedUserId,
        serviceType: withMontage ? "MONTAGE" : "DELIVERY",
        totalTyres: String(totalTyreCount),
        withMontage: withMontage ? "true" : "false",
        guestName: guestName || "",
        guestEmail: guestEmail || "",
        guestPhone: guestPhone || "",
        deliveryStreet: withMontage ? "" : street,
        deliveryPostalCode: withMontage ? "" : postalCode,
        deliveryCity: withMontage ? "" : city,
        deliveryCountry: withMontage ? "België" : country,
        deliveryAddress: addressStr,
        notes: notes || "",
        itemsJson: JSON.stringify(fulfillmentItems),
        // backward compatibility for single tyre
        tyreId: itemsToProcess[0]?.tyreId || "",
        quantity: String(itemsToProcess[0]?.quantity || 1),
      },
      customer_email: guestEmail || undefined,
      phone_number_collection: { enabled: true },
      success_url: `${origin}/bestelling/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bestelling/cancel`,
    };

    // If NO montage selected, request shipping address for delivery
    if (!withMontage) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ["BE", "NL", "FR", "DE"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Checkout Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Betaling kon niet worden gestart" },
      { status: 500 }
    );
  }
}
