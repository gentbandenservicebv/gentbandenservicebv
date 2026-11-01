import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendOrderStatusUpdateEmail } from "@/lib/resend";

// Helper – verify admin
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? session.user : null;
}

// GET /api/orders/[id] – get single order (admin or order owner)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          tyre: {
            include: {
              images: { where: { isPrimary: true } },
            },
          },
        },
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
  });

  if (!order) {
    return NextResponse.json({ error: "Bestelling niet gevonden" }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const authDbUser = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, email: true },
      })
    : null;

  const isAdmin = authDbUser?.role === "ADMIN";
  const isOwner =
    !!session?.user &&
    (order.userId === session.user.id ||
      (!!order.guestEmail && order.guestEmail.toLowerCase() === session.user.email.toLowerCase()));

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

// PATCH /api/orders/[id] – update status (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Toegang geweigerd" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const allowedStatuses = ["PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"];
  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  }

  // Fetch current order to check previous status
  const existingOrder = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existingOrder) {
    return NextResponse.json({ error: "Bestelling niet gevonden" }, { status: 404 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include: {
      items: {
        include: {
          tyre: true,
        },
      },
      user: true,
    },
  });

  // If status has changed, notify customer via email
  if (body.status && body.status !== existingOrder.status) {
    const customerEmail = updatedOrder.user?.email || updatedOrder.guestEmail;
    const customerName = updatedOrder.user?.name || updatedOrder.guestName || "Klant";
    const withMontage = updatedOrder.serviceType === "MONTAGE" || (updatedOrder.notes?.includes("Montage ter plaatse") ?? false);
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

    if (customerEmail) {
      sendOrderStatusUpdateEmail({
        id: updatedOrder.id,
        orderNumber: updatedOrder.id.slice(-8).toUpperCase(),
        customerName,
        customerEmail,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        withMontage,
        deliveryAddress: updatedOrder.deliveryAddress || updatedOrder.notes?.match(/naar (.+)/)?.[1] || null,
        notes: updatedOrder.notes,
        items: updatedOrder.items.map((item) => ({
          brand: item.tyre.brand,
          model: item.tyre.model,
          size: item.tyre.size,
          quantity: item.quantity,
          price: item.price,
        })),
        invoiceUrl: `${baseUrl}/bestelling/factuur/${updatedOrder.id}`,
      }).catch((err) => {
        console.error("[Resend] Status update email error:", err);
      });
    }
  }

  return NextResponse.json(updatedOrder);
}

// DELETE /api/orders/[id] – delete order (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Toegang geweigerd" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.order.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
