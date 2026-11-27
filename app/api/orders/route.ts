import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSiteSettings } from "@/lib/settings";
import { calculateCartMontage } from "@/lib/montage";

// POST /api/orders - manual order creation (admin only; customer orders go through Stripe /api/checkout)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { error: "Niet geautoriseerd. Klanten bestellen via de online kassa." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Alleen beheerders kunnen handmatig bestellingen invoeren. Klanten bestellen via de checkout." },
      { status: 403 }
    );
  }

  const body = await req.json();

  // Validate items
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Geen banden geselecteerd" }, { status: 400 });
  }

  // Verify tyres exist and have stock
  const tyreIds = body.items.map((i: { tyreId: string }) => i.tyreId);
  const tyres = await prisma.tyre.findMany({
    where: { id: { in: tyreIds }, active: true },
  });

  if (tyres.length !== tyreIds.length) {
    return NextResponse.json({ error: "Eén of meer banden niet beschikbaar" }, { status: 400 });
  }

  const tyresMap = new Map(tyres.map((t) => [t.id, t]));

  // Build order items and check stock authoritatively from DB
  let totalTyres = 0;
  const orderItems: Array<{ tyreId: string; quantity: number; price: number }> = [];

  for (const item of body.items as Array<{ tyreId: string; quantity: number }>) {
    const tyre = tyresMap.get(item.tyreId);
    if (!tyre) continue;
    const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
    if (tyre.stock < qty) {
      return NextResponse.json(
        { error: `Onvoldoende voorraad voor ${tyre.brand} ${tyre.model}. Slechts ${tyre.stock} beschikbaar.` },
        { status: 400 }
      );
    }
    totalTyres += qty;
    orderItems.push({
      tyreId: tyre.id,
      quantity: qty,
      price: tyre.price, // Always authoritative DB price
    });
  }

  const isMontage = body.serviceType === "MONTAGE" || !!body.withMontage;

  // Validate secondhand delivery restriction
  const hasSecondhand = orderItems.some((item) => tyresMap.get(item.tyreId)?.condition === "USED");
  if (hasSecondhand && !isMontage) {
    return NextResponse.json(
      { error: "Tweedehands banden kunnen niet verzonden worden. Kies voor montage of afhaling in de werkplaats." },
      { status: 400 }
    );
  }

  const tyresTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Dynamic montage total per tyre size from admin settings
  const siteSettings = await getSiteSettings();
  const montageResult = isMontage
    ? calculateCartMontage(
        orderItems.map((oi) => {
          const tyre = tyresMap.get(oi.tyreId);
          return {
            tyreId: oi.tyreId,
            size: tyre?.size ?? null,
            diameter: tyre?.diameter ?? null,
            runflat: tyre?.runflat ?? false,
            quantity: oi.quantity,
          };
        }),
        siteSettings
      )
    : { total: 0, totalTyres: 0 };
  const montageTotal = montageResult.total;
  const minTyresForFreeShipping = parseInt(siteSettings.free_shipping_min_tyres, 10) || 2;
  const singleTyreShippingCost = parseFloat(siteSettings.shipping_cost) || 9.95;
  const shippingTotal =
    !isMontage && totalTyres > 0 && totalTyres < minTyresForFreeShipping && singleTyreShippingCost > 0
      ? singleTyreShippingCost
      : 0;

  const totalAmount = tyresTotal + montageTotal + shippingTotal;

  // Create order + update stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const userId = session?.user?.id ?? null;
    if (userId) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(body.guestPhone ? { phone: body.guestPhone } : {}),
          ...(body.deliveryStreet ? { street: body.deliveryStreet } : {}),
          ...(body.deliveryPostalCode ? { postalCode: body.deliveryPostalCode } : {}),
          ...(body.deliveryCity ? { city: body.deliveryCity } : {}),
          ...(body.deliveryCountry ? { country: body.deliveryCountry } : {}),
        },
      }).catch(() => {});
    }

    const newOrder = await tx.order.create({
      data: {
        userId,
        guestName: body.guestName ?? null,
        guestEmail: body.guestEmail ?? null,
        guestPhone: body.guestPhone ?? null,
        serviceType: isMontage ? "MONTAGE" : "DELIVERY",
        deliveryStreet: body.deliveryStreet ?? null,
        deliveryPostalCode: body.deliveryPostalCode ?? null,
        deliveryCity: body.deliveryCity ?? null,
        deliveryCountry: body.deliveryCountry ?? "België",
        deliveryAddress: body.deliveryAddress ?? null,
        totalAmount,
        notes: body.notes ?? null,
        items: {
          create: orderItems,
        },
      },
      include: { items: { include: { tyre: true } } },
    });

    // Reduce stock
    for (const item of orderItems) {
      await tx.tyre.update({
        where: { id: item.tyreId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}

// GET /api/orders - list orders (admin or own orders)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const orders = await prisma.order.findMany({
    where: user?.role === "ADMIN" ? {} : { userId: session.user.id },
    include: {
      items: { include: { tyre: { include: { images: { where: { isPrimary: true } } } } } },
      returnRequests: {
        orderBy: { createdAt: "desc" },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          street: true,
          postalCode: true,
          city: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
