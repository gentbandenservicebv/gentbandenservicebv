import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/orders - place an order (guest or authenticated)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
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

  // Build order items and check stock
  const orderItems = body.items.map((item: { tyreId: string; quantity: number }) => {
    const tyre = tyres.find((t) => t.id === item.tyreId)!;
    if (tyre.stock < item.quantity) {
      throw new Error(`Onvoldoende voorraad voor ${tyre.brand} ${tyre.model}`);
    }
    return {
      tyreId: item.tyreId,
      quantity: item.quantity,
      price: tyre.price,
    };
  });

  const totalAmount = orderItems.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0
  );

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
        serviceType: body.serviceType ?? (body.withMontage ? "MONTAGE" : "DELIVERY"),
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
    for (const item of body.items as { tyreId: string; quantity: number }[]) {
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
  const session = await auth.api.getSession({ headers: await headers() });
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
