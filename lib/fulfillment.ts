import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import {
  sendOrderConfirmationEmail,
  sendAppointmentConfirmation,
  sendAppointmentNotification,
} from "@/lib/resend";

// Process-level in-flight mutex keyed by Stripe session ID to prevent race condition
// duplicates when Stripe webhook and user redirect hit the server simultaneously.
const inFlightFulfillments = new Map<string, Promise<any>>();

export async function fulfillStripeSession(session: Stripe.Checkout.Session) {
  if (!session?.id) return null;

  // If another request is currently fulfilling this session in this process, await it
  const active = inFlightFulfillments.get(session.id);
  if (active) {
    return active;
  }

  const fulfillmentPromise = doFulfillStripeSession(session);
  inFlightFulfillments.set(session.id, fulfillmentPromise);

  try {
    return await fulfillmentPromise;
  } finally {
    inFlightFulfillments.delete(session.id);
  }
}

async function doFulfillStripeSession(session: Stripe.Checkout.Session) {
  // Only fulfill if payment is received or completed
  if (session.payment_status === "unpaid") {
    return null;
  }

  const meta = session.metadata || {};
  const isAppointment = meta.isAppointment === "true";

  // Check if this session was already fulfilled (idempotency check)
  const existingOrder = await prisma.order.findFirst({
    where: {
      notes: {
        contains: `Stripe Session: ${session.id}`,
      },
    },
    include: {
      items: {
        include: {
          tyre: true,
        },
      },
    },
  });

  const existingAppt = isAppointment
    ? await prisma.appointment.findFirst({
        where: {
          notes: { contains: `Stripe: ${session.id}` },
        },
      })
    : null;

  // If already completely fulfilled, return early
  if (existingOrder && (!isAppointment || existingAppt)) {
    return existingOrder;
  }

  // Parse items
  let itemsToFulfill: Array<{ tyreId: string; quantity: number; price?: number }> = [];

  if (meta.itemsJson) {
    try {
      itemsToFulfill = JSON.parse(meta.itemsJson);
    } catch (e) {
      console.error("[Fulfillment] Failed to parse itemsJson:", e);
    }
  }

  if (itemsToFulfill.length === 0 && meta.tyreId) {
    itemsToFulfill = [{ tyreId: meta.tyreId, quantity: parseInt(meta.quantity || "1", 10) }];
  }

  // If it's a regular cart checkout with no items, we can't fulfill
  if (itemsToFulfill.length === 0 && !isAppointment) {
    console.error("[Fulfillment] No items found on cart session:", session.id);
    return null;
  }

  const withMontage = meta.withMontage === "true" || isAppointment;
  const guestName = meta.guestName || session.customer_details?.name || "Klant";
  const guestEmail = meta.guestEmail || session.customer_details?.email || "";
  const guestPhone = meta.guestPhone || session.customer_details?.phone || "";

  // Resolve and strictly validate user account to prevent FK constraint failures
  let userIdToLink: string | null = meta.userId && meta.userId.trim() !== "" ? meta.userId.trim() : null;
  if (userIdToLink) {
    const userExists = await prisma.user.findUnique({
      where: { id: userIdToLink },
      select: { id: true },
    });
    if (!userExists) {
      userIdToLink = null;
    }
  }

  if (!userIdToLink && guestEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: guestEmail.trim().toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      userIdToLink = existingUser.id;
    }
  }

  // Address fields extraction
  const shippingAddr = (session as any).shipping_details?.address;
  const deliveryStreet = meta.deliveryStreet || shippingAddr?.line1 || null;
  const deliveryPostalCode = meta.deliveryPostalCode || shippingAddr?.postal_code || null;
  const deliveryCity = meta.deliveryCity || shippingAddr?.city || null;
  const deliveryCountry = meta.deliveryCountry || shippingAddr?.country || "België";
  const deliveryAddressStr = deliveryStreet
    ? [deliveryStreet, `${deliveryPostalCode || ""} ${deliveryCity || ""}`.trim(), deliveryCountry].filter(Boolean).join(", ")
    : meta.deliveryAddress || "";

  let tyreTotal = 0;
  let totalTyreCount = 0;
  const orderItemsData: Array<{ tyreId: string; quantity: number; price: number; brand: string; model: string; size: string }> = [];

  for (const it of itemsToFulfill) {
    const tyre = await prisma.tyre.findUnique({ where: { id: it.tyreId } });
    if (!tyre) {
      console.warn("[Fulfillment] Tyre not found:", it.tyreId);
      continue;
    }

    const itemPrice = it.price ?? tyre.price;
    tyreTotal += itemPrice * it.quantity;
    totalTyreCount += it.quantity;

    orderItemsData.push({
      tyreId: tyre.id,
      quantity: it.quantity,
      price: itemPrice,
      brand: tyre.brand,
      model: tyre.model,
      size: tyre.size,
    });
  }

  const requestedQty = parseInt(meta.totalTyres || "4", 10) || (totalTyreCount > 0 ? totalTyreCount : 4);
  const montageTotal = withMontage ? 19.99 * (totalTyreCount > 0 ? totalTyreCount : requestedQty) : 0;
  const calculatedTotal = tyreTotal + montageTotal;
  const finalTotal = session.amount_total ? session.amount_total / 100 : calculatedTotal;

  // Build notes
  let serviceDescription = "Montage in werkplaats";
  if (isAppointment) {
    serviceDescription = `Afspraak Werkplaats Gent (Montage/Service)`;
  } else if (withMontage) {
    serviceDescription = `Montage & balancering (${totalTyreCount} banden)`;
  } else {
    serviceDescription = deliveryAddressStr ? `Levering: ${deliveryAddressStr}` : "Verzending";
  }

  const notesText = [
    meta.notes || meta.apptNotes || "",
    `📍 ${serviceDescription}`,
    `Stripe Session: ${session.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  // 1. Create or retrieve Order in DB
  let orderToReturn = existingOrder;

  if (!orderToReturn) {
    orderToReturn = await prisma.$transaction(async (tx) => {
      // If registered user exists, update their profile with phone and address if missing
      if (userIdToLink) {
        await tx.user.update({
          where: { id: userIdToLink },
          data: {
            ...(guestPhone ? { phone: guestPhone } : {}),
            ...(deliveryStreet ? { street: deliveryStreet } : {}),
            ...(deliveryPostalCode ? { postalCode: deliveryPostalCode } : {}),
            ...(deliveryCity ? { city: deliveryCity } : {}),
            ...(deliveryCountry ? { country: deliveryCountry } : {}),
          },
        }).catch((err) => {
          console.warn("[Fulfillment] Could not update user profile:", err);
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId: userIdToLink,
          guestName,
          guestEmail,
          guestPhone,
          serviceType: withMontage ? "MONTAGE" : "DELIVERY",
          deliveryStreet: withMontage ? null : deliveryStreet,
          deliveryPostalCode: withMontage ? null : deliveryPostalCode,
          deliveryCity: withMontage ? null : deliveryCity,
          deliveryCountry: withMontage ? "België" : deliveryCountry,
          deliveryAddress: withMontage
            ? "Werkplaats Gent (Dendermondsesteenweg 428, 9040 Gent)"
            : (deliveryAddressStr || null),
          totalAmount: finalTotal,
          notes: notesText,
          status: "CONFIRMED",
          ...(orderItemsData.length > 0
            ? {
                items: {
                  create: orderItemsData.map((d) => ({
                    tyreId: d.tyreId,
                    quantity: d.quantity,
                    price: d.price,
                  })),
                },
              }
            : {}),
        },
        include: {
          items: {
            include: {
              tyre: true,
            },
          },
        },
      });

      // Decrement stock if stock tyres were ordered
      for (const item of orderItemsData) {
        await tx.tyre.update({
          where: { id: item.tyreId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    // Send Order Confirmation & Invoice Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const orderNumber = `GBV-${new Date().getFullYear()}-${orderToReturn.id.slice(-6).toUpperCase()}`;
    const invoiceUrl = `${appUrl}/bestelling/factuur/${orderToReturn.id}`;

    if (guestEmail) {
      sendOrderConfirmationEmail({
        id: orderToReturn.id,
        orderNumber,
        customerName: guestName,
        customerEmail: guestEmail,
        customerPhone: guestPhone,
        totalAmount: finalTotal,
        withMontage,
        deliveryAddress: deliveryAddressStr || "Werkplaats Gent",
        notes: meta.notes || meta.apptNotes,
        items: orderItemsData.length > 0
          ? orderItemsData.map((i) => ({
              brand: i.brand,
              model: i.model,
              size: i.size,
              quantity: i.quantity,
              price: i.price,
            }))
          : [
              {
                brand: "Gent Bandenservice",
                model: "Montage & Balancering (Werkplaats)",
                size: `${requestedQty} banden`,
                quantity: requestedQty,
                price: 19.99,
              },
            ],
        invoiceUrl,
      }).catch((err) => console.error("[Fulfillment] Email sending error:", err));
    }
  }

  // 2. If this checkout session was created from the online appointment flow, create Appointment
  if (isAppointment && !existingAppt) {
    try {
      let apptData: any = {};
      if (meta.appointmentData) {
        try {
          apptData = JSON.parse(meta.appointmentData);
        } catch (e) {
          console.warn("[Fulfillment] Could not parse appointmentData:", e);
        }
      }

      const rawDateTime = apptData.dateTime || meta.apptDateTime;
      const parsedDate = rawDateTime ? new Date(rawDateTime) : new Date();
      const validDateTime = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const rawType = (apptData.type || meta.apptType || "FITTING").toUpperCase();
      const validApptType: "FITTING" | "REPAIR" | "INSPECTION" | "OTHER" =
        ["FITTING", "REPAIR", "INSPECTION", "OTHER"].includes(rawType) ? (rawType as any) : "FITTING";

      const vehicleInfo = apptData.vehicleInfo || meta.apptVehicleInfo || null;
      const customNotes = apptData.notes || meta.apptNotes || "";

      const appointment = await prisma.appointment.create({
        data: {
          userId: userIdToLink,
          guestName: apptData.guestName || guestName,
          guestEmail: apptData.guestEmail || guestEmail,
          guestPhone: apptData.guestPhone || guestPhone,
          type: validApptType,
          dateTime: validDateTime,
          status: "CONFIRMED",
          vehicleInfo: vehicleInfo || null,
          notes: `[Online betaald via Stripe: €${finalTotal.toFixed(2)} - Stripe: ${session.id}]\n${customNotes}`.trim(),
        },
      });

      const emailPayload = {
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

      sendAppointmentConfirmation(emailPayload).catch((err) =>
        console.error("[Fulfillment] Appointment customer confirmation email error:", err)
      );
      sendAppointmentNotification(emailPayload).catch((err) =>
        console.error("[Fulfillment] Appointment shop notification email error:", err)
      );
    } catch (err) {
      console.error("[Fulfillment] Error creating appointment from Stripe session:", err);
    }
  }

  return orderToReturn;
}
