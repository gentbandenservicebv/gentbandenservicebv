import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendSecondhandReviewResult } from "@/lib/resend";
import { sanitizeOptionalString } from "@/lib/security";

// PATCH /api/secondhand/[id] — admin: update status, offerPrice, adminNotes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, offerPrice, adminNotes } = body as {
    status?: string;
    offerPrice?: number | null;
    adminNotes?: string | null;
  };

  const allowedStatuses = ["PENDING", "ACCEPTED", "REJECTED"] as const;
  const cleanStatus =
    status && allowedStatuses.includes(status as (typeof allowedStatuses)[number])
      ? (status as (typeof allowedStatuses)[number])
      : undefined;

  let cleanOfferPrice: number | null | undefined = undefined;
  if (offerPrice !== undefined) {
    if (offerPrice === null || offerPrice === 0) {
      cleanOfferPrice = null;
    } else {
      const num = Number(offerPrice);
      cleanOfferPrice = Number.isFinite(num) && num >= 0 ? Math.min(100000, Math.round(num * 100) / 100) : null;
    }
  }

  const cleanAdminNotes =
    adminNotes !== undefined ? sanitizeOptionalString(adminNotes, 2000) : undefined;

  const updated = await prisma.secondhandSubmission.update({
    where: { id },
    data: {
      ...(cleanStatus && { status: cleanStatus }),
      ...(cleanOfferPrice !== undefined && { offerPrice: cleanOfferPrice }),
      ...(cleanAdminNotes !== undefined && { adminNotes: cleanAdminNotes }),
      ...(cleanStatus && cleanStatus !== "PENDING" && { reviewedAt: new Date() }),
    },
  });

  // Send email to customer if status changed to ACCEPTED or REJECTED
  if (cleanStatus === "ACCEPTED" || cleanStatus === "REJECTED") {
    sendSecondhandReviewResult({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      brand: updated.brand,
      size: updated.size,
      quantity: updated.quantity,
      status: cleanStatus,
      offerPrice: updated.offerPrice,
      adminNotes: updated.adminNotes,
    }).catch((err) => console.error("[Resend] secondhand review email failed:", err));
  }

  return NextResponse.json(updated);
}

// DELETE /api/secondhand/[id] — admin: remove a submission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.secondhandSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
