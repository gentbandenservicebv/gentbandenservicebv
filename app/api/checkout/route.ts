import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSiteSettings } from "@/lib/settings";
import { getMontagePriceForTyre } from "@/lib/montage";

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

    // Load site settings once (needed for montage pricing + shipping)
    const siteSettings = await getSiteSettings();

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

    // Add montage & balancing — dynamic per-tyre price based on rim diameter from settings
    if (withMontage) {
      // Group by per-tyre montage price to allow different line items if sizes differ
      const montageByPrice: Map<number, { count: number; label: string }> = new Map();

      for (const item of itemsToProcess) {
        const tyre = tyresMap.get(item.tyreId)!;
        const unitPriceCents = Math.round(
          getMontagePriceForTyre(
            { size: tyre.size, diameter: tyre.diameter ?? null, runflat: tyre.runflat },
            siteSettings
          ) * 100
        );

        const existing = montageByPrice.get(unitPriceCents);
        if (existing) {
          existing.count += item.quantity;
        } else {
          const inchLabel = tyre.diameter ? `${tyre.diameter}"` : tyre.size || "";
          montageByPrice.set(unitPriceCents, {
            count: item.quantity,
            label: `Montage & Balancering${inchLabel ? ` (${inchLabel})` : ""}`,
          });
        }
      }

      for (const [unitAmountCents, { count, label }] of montageByPrice.entries()) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: label,
              description: `Vakkundige montage en balancering ter plaatse in onze werkplaats (Dendermondsesteenweg 428, 9040 Gent)`,
            },
            unit_amount: unitAmountCents,
          },
          quantity: count,
        });
      }
    }

    // Shipping fee rule: Free shipping from N tyres; otherwise server setting cost
    const minTyresForFreeShipping = parseInt(siteSettings.free_shipping_min_tyres, 10) || 2;
    const singleTyreShippingCost = parseFloat(siteSettings.shipping_cost) || 9.95;
    const applyShippingFee = !withMontage && totalTyreCount > 0 && totalTyreCount < minTyresForFreeShipping && singleTyreShippingCost > 0;

    if (applyShippingFee) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Verzendkosten (1 losse band)",
            description: `Standaard bezorging aan huis voor ${totalTyreCount} band. Gratis bezorging vanaf ${minTyresForFreeShipping} banden.`,
          },
          unit_amount: Math.round(singleTyreShippingCost * 100),
        },
        quantity: 1,
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
        shippingFee: applyShippingFee ? String(singleTyreShippingCost) : "0",
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
