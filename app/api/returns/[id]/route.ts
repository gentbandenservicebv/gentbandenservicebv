import { NextRequest, NextResponse } from "next/server";
import { prisma, ReturnStatus } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitizeOptionalString } from "@/lib/security";

// PATCH /api/returns/[id] - update return request status & admin notes
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Alleen beheerders hebben toegang" }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const allowedStatuses: ReturnStatus[] = ["PENDING", "APPROVED", "REJECTED", "REFUNDED"];
    let newStatus: ReturnStatus | undefined;

    if (body.status && allowedStatuses.includes(body.status)) {
      newStatus = body.status as ReturnStatus;
    }

    const adminNotes = sanitizeOptionalString(body.adminNotes, 2000);

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: {
        ...(newStatus ? { status: newStatus } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[Returns API PATCH Error]:", error);
    return NextResponse.json({ error: "Bijwerken mislukt" }, { status: 500 });
  }
}

// DELETE /api/returns/[id] - delete return request (admin only)
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Alleen beheerders hebben toegang" }, { status: 403 });
    }

    const { id } = await props.params;

    await prisma.returnRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[Returns API DELETE Error]:", error);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
