import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const MONTAGE_PRICE_CENTS = 1999; // €19.99 per tyre

export async function POST(req: NextRequest) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    const body = await req.json();

    const {
      appointmentData,
      tyreId,
      quantity = 4,
      payTires = true,
      withMontage = true,
    } = body;

    if (!appointmentData || !appointmentData.dateTime) {
      return NextResponse.json(
        { error: "Afspraakgegevens ontbreken" },
        { status: 400 }
      );
    }

    const guestName = appointmentData.guestName || sessionAuth?.user?.name || "Klant";
    const guestEmail = appointmentData.guestEmail || sessionAuth?.user?.email || "";
    const guestPhone = appointmentData.guestPhone || "";

    if (!guestEmail) {
      return NextResponse.json(
        { error: "E-mailadres is verplicht voor online betaling" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    const fulfillmentItems: Array<{ tyreId: string; quantity: number; price: number }> = [];
    const qtyNum = parseInt(String(quantity), 10) || 4;

    // 1. If customer is buying tyres from stock
    if (tyreId && payTires) {
      const dbTyre = await prisma.tyre.findUnique({
        where: { id: tyreId, active: true },
      });

      if (!dbTyre) {
        return NextResponse.json(
          { error: "Geselecteerde band is niet meer beschikbaar." },
          { status: 404 }
        );
      }

      if (dbTyre.stock < qtyNum) {
        return NextResponse.json(
          { error: `Onvoldoende voorraad voor ${dbTyre.brand} ${dbTyre.model}. Slechts ${dbTyre.stock} beschikbaar.` },
          { status: 400 }
        );
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${dbTyre.brand} ${dbTyre.model} – ${dbTyre.size}`,
            description: `${dbTyre.condition === "NEW" ? "Nieuwe band" : "2de hands band"} · ${
              dbTyre.season === "SUMMER" ? "Zomer" : dbTyre.season === "WINTER" ? "Winter" : "4-seizoenen"
            }`,
          },
          unit_amount: Math.round(dbTyre.price * 100),
        },
        quantity: qtyNum,
      });

      fulfillmentItems.push({
        tyreId: dbTyre.id,
        quantity: qtyNum,
        price: dbTyre.price,
      });
    }

    // 2. Montage & balancering service line item
    if (withMontage) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Montage & Balancering (Werkplaats Gent)",
            description: `Montage, balanceren en nieuwe ventielen voor ${qtyNum} banden bij Gent Bandenservice BV`,
          },
          unit_amount: MONTAGE_PRICE_CENTS,
        },
        quantity: qtyNum,
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: "Geen geldige artikelen of diensten om af te rekenen." },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session with full appointment metadata
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: guestEmail,
      metadata: {
        isAppointment: "true",
        userId: sessionAuth?.user?.id || "",
        guestName: guestName.slice(0, 100),
        guestEmail: guestEmail.slice(0, 100),
        guestPhone: guestPhone.slice(0, 50),
        withMontage: withMontage ? "true" : "false",
        totalTyres: String(qtyNum),
        itemsJson: JSON.stringify(fulfillmentItems),
        apptType: String(appointmentData.type || "FITTING"),
        apptDateTime: String(appointmentData.dateTime || ""),
        apptVehicleInfo: (appointmentData.vehicleInfo || "").slice(0, 300),
        apptNotes: (appointmentData.notes || "").slice(0, 300),
        appointmentData: JSON.stringify({
          userId: sessionAuth?.user?.id || null,
          guestName: guestName.slice(0, 80),
          guestEmail: guestEmail.slice(0, 80),
          guestPhone: guestPhone.slice(0, 40),
          type: appointmentData.type || "FITTING",
          dateTime: appointmentData.dateTime,
          vehicleInfo: (appointmentData.vehicleInfo || "").slice(0, 120),
          notes: (appointmentData.notes || "").slice(0, 120),
        }),
      },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/afspraak?status=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/afspraak?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Appointment Checkout Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Betalingssessie kon niet worden gestart" },
      { status: 500 }
    );
  }
}
