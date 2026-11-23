import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Niet ingelogd", status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Geen administrator rechten", status: 403 };

  return { session, user };
}

// PATCH /api/reviews/[id] - Toggle active or update review (admin)
export async function PATCH(req: NextRequest, { params }: Params) {
  const authCheck = await checkAdmin();
  if ("error" in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { active, verifiedPurchase } = body;

    const dataToUpdate: { active?: boolean; verifiedPurchase?: boolean } = {};
    if (typeof active === "boolean") dataToUpdate.active = active;
    if (typeof verifiedPurchase === "boolean") dataToUpdate.verifiedPurchase = verifiedPurchase;

    const updated = await prisma.review.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    console.error("[PATCH /api/reviews/[id] error]:", error);
    return NextResponse.json({ error: "Fout bij bijwerken review" }, { status: 500 });
  }
}

// DELETE /api/reviews/[id] - Delete review (admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const authCheck = await checkAdmin();
  if ("error" in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = await params;
  try {
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Review succesvol verwijderd" });
  } catch (error: unknown) {
    console.error("[DELETE /api/reviews/[id] error]:", error);
    return NextResponse.json({ error: "Fout bij verwijderen review" }, { status: 500 });
  }
}
