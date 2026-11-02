import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  sanitizeString,
  sanitizeOptionalString,
  isValidEmail,
  sanitizePhone,
  checkRateLimit,
} from "@/lib/security";
import {
  sendReturnRequestCustomerEmail,
  sendReturnRequestShopEmail,
} from "@/lib/resend";

// POST /api/returns — submit a return request
export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  const rateLimitResult = checkRateLimit(`return:${clientIp}`, 5, 10 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: `Te veel verzoeken. Probeer het over ${Math.ceil(
          rateLimitResult.retryAfterSec / 60
        )} minuten opnieuw.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitResult.retryAfterSec) },
      }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const { orderId, email, name, phone, reason, reasonDetails, itemsInfo } = body;

  const cleanOrderId = sanitizeString(orderId, 60);
  if (!cleanOrderId) {
    return NextResponse.json({ error: "Bestelnummer is verplicht." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Voer een geldig e-mailadres in." }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase().slice(0, 150);

  const cleanName = sanitizeString(name, 100);
  if (!cleanName) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
  }

  const cleanPhone = sanitizePhone(phone);

  const validReasons = [
    "WRONG_SIZE",
    "WITHDRAWAL",
    "NOT_NEEDED",
    "INCORRECT_DELIVERY",
    "DAMAGED",
    "OTHER",
  ] as const;

  const cleanReason =
    typeof reason === "string" && validReasons.includes(reason.toUpperCase() as (typeof validReasons)[number])
      ? reason.toUpperCase()
      : "WITHDRAWAL";

  const cleanDetails = sanitizeOptionalString(reasonDetails, 1500);
  const cleanItemsInfo = sanitizeOptionalString(itemsInfo, 500);

  // 1. Look up order
  // Support both full cuid and 8-character uppercase/lowercase suffix
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: cleanOrderId },
        { id: { endsWith: cleanOrderId.toLowerCase() } },
        { id: { endsWith: cleanOrderId.toUpperCase() } },
      ],
    },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { tyre: true } },
      returnRequests: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      {
        error:
          "Geen bestelling gevonden met dit bestelnummer. Controleer uw orderbevestiging of factuur.",
      },
      { status: 404 }
    );
  }

  // 2. Validate email matches order
  const orderEmail = (order.guestEmail || order.user?.email || "").toLowerCase().trim();
  if (orderEmail && orderEmail !== cleanEmail) {
    return NextResponse.json(
      {
        error:
          "Het opgegeven e-mailadres komt niet overeen met het e-mailadres van deze bestelling.",
      },
      { status: 403 }
    );
  }

  // 3. Format items if not explicitly provided
  const resolvedItemsInfo =
    cleanItemsInfo ||
    order.items
      .map((it) => `${it.quantity}× ${it.tyre.brand} ${it.tyre.model} (${it.tyre.size})`)
      .join(", ");

  // 4. Create return request record
  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone || order.guestPhone || null,
      reason: cleanReason,
      reasonDetails: cleanDetails,
      itemsInfo: resolvedItemsInfo,
      status: "PENDING",
    },
  });

  // 5. Send fire-and-forget notification emails
  const emailPayload = {
    id: returnRequest.id,
    orderId: order.id,
    customerName: cleanName,
    customerEmail: cleanEmail,
    customerPhone: cleanPhone || order.guestPhone,
    reason: cleanReason,
    reasonDetails: cleanDetails,
    itemsInfo: resolvedItemsInfo,
  };

  Promise.all([
    sendReturnRequestCustomerEmail(emailPayload),
    sendReturnRequestShopEmail(emailPayload),
  ]).catch((err) => console.error("[Returns API] Email error:", err));

  return NextResponse.json(
    {
      success: true,
      message:
        "Uw retourverzoek is succesvol ingediend. Wij hebben een bevestiging gestuurd naar uw e-mailadres.",
      returnRequest: {
        id: returnRequest.id,
        orderId: order.id,
        status: returnRequest.status,
        createdAt: returnRequest.createdAt,
      },
    },
    { status: 201 }
  );
}

// GET /api/returns — fetch returns (admin: all, customer: own)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  const isAdmin = user?.role === "ADMIN";

  const returnRequests = await prisma.returnRequest.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { customerEmail: { equals: session.user.email, mode: "insensitive" } },
            { order: { userId: session.user.id } },
          ],
        },
    include: {
      order: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          serviceType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(returnRequests);
}
