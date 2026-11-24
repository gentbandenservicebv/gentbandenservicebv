import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/reviews?tyreId=...&includeAll=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tyreId = searchParams.get("tyreId");
  const includeAll = searchParams.get("includeAll") === "1" || searchParams.get("all") === "true";

  try {
    let showAll = false;
    if (includeAll) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        if (user?.role === "ADMIN") {
          showAll = true;
        }
      }
    }

    const whereClause: { active?: boolean; tyreId?: string } = {};
    if (!showAll) {
      whereClause.active = true;
    }
    if (tyreId) {
      whereClause.tyreId = tyreId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        tyreId: true,
        userName: true,
        userEmail: showAll,
        rating: true,
        title: true,
        comment: true,
        verifiedPurchase: true,
        active: true,
        createdAt: true,
        tyre: {
          select: {
            id: true,
            brand: true,
            model: true,
            size: true,
            slug: true,
          },
        },
      },
    });

    const activeReviews = reviews.filter((r) => r.active);
    const totalCount = activeReviews.length;
    const totalRatingSum = activeReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(1)) : 0;

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    activeReviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return NextResponse.json({
      reviews,
      totalCount,
      averageRating,
      distribution,
    });
  } catch (error: unknown) {
    console.error("[GET /api/reviews error]:", error);
    return NextResponse.json({ error: "Fout bij ophalen van reviews" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json();

    const { tyreId, rating, title, comment, userName, userEmail, appointmentId } = body;

    if (!tyreId) {
      return NextResponse.json({ error: "Geen band geselecteerd voor deze review" }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Score moet tussen 1 en 5 sterren liggen" }, { status: 400 });
    }

    const finalName = String(session?.user?.name || userName || "").trim();
    const finalEmail = String(session?.user?.email || userEmail || "").trim();
    const finalComment = String(comment || "").trim();
    const finalTitle = title ? String(title).trim() : null;

    if (!finalName || finalName.length < 2) {
      return NextResponse.json({ error: "Vul een geldige naam in (min. 2 tekens)" }, { status: 400 });
    }

    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres in" }, { status: 400 });
    }

    if (!finalComment || finalComment.length < 5) {
      return NextResponse.json({ error: "Uw review tekst moet minimaal 5 tekens bevatten" }, { status: 400 });
    }

    // Check if tyre exists
    const tyre = await prisma.tyre.findUnique({
      where: { id: tyreId },
      select: { id: true, brand: true, model: true },
    });

    if (!tyre) {
      return NextResponse.json({ error: "Band niet gevonden" }, { status: 404 });
    }

    // Determine verified purchase
    let verifiedPurchase = false;
    if (appointmentId) {
      const appt = await prisma.appointment.findFirst({
        where: { id: appointmentId },
        select: { id: true, status: true, guestEmail: true, user: { select: { email: true } } },
      });
      if (appt && appt.status === "COMPLETED") {
        const apptEmail = appt.user?.email || appt.guestEmail;
        if (apptEmail?.toLowerCase() === finalEmail.toLowerCase()) {
          verifiedPurchase = true;
        }
      }
    } else if (session?.user?.id) {
      // Check if user has completed orders containing this tyre
      const orderCount = await prisma.orderItem.count({
        where: {
          tyreId,
          order: {
            userId: session.user.id,
            status: { in: ["CONFIRMED", "READY", "COMPLETED"] },
          },
        },
      });
      if (orderCount > 0) {
        verifiedPurchase = true;
      }
    }

    const review = await prisma.review.create({
      data: {
        tyreId,
        userId: session?.user?.id ?? null,
        appointmentId: appointmentId ?? null,
        userName: finalName,
        userEmail: finalEmail,
        rating: Math.round(numRating),
        title: finalTitle,
        comment: finalComment,
        verifiedPurchase,
        active: true,
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/reviews error]:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het opslaan van uw review" }, { status: 500 });
  }
}
