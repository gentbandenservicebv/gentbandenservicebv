import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendSecondhandSubmissionConfirmation } from "@/lib/resend";
import {
  sanitizeString,
  sanitizeOptionalString,
  isValidEmail,
  sanitizePhone,
  sanitizePhotosList,
  checkRateLimit,
} from "@/lib/security";

// GET /api/secondhand — admin only, returns all submissions
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.secondhandSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions, {
    headers: { "Cache-Control": "no-store" },
  });
}

// POST /api/secondhand — public, submit a secondhand tyre offer
export async function POST(req: NextRequest) {
  // 1. IP rate limiting (5 submissions per 10 minutes)
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "anonymous";

  const rateLimitResult = checkRateLimit(`secondhand:${clientIp}`, 5, 10 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: `Te veel aanvragen vanaf dit netwerk. Probeer het over ${Math.ceil(
          rateLimitResult.retryAfterSec / 60
        )} minuten opnieuw.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitResult.retryAfterSec) },
      }
    );
  }

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON payload." }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    brand,
    model,
    size,
    season,
    quantity,
    treadDepth,
    dotYear,
    condition,
    extraNotes,
    photos,
  } = body;

  // 3. Sanitize and validate required fields
  const cleanName = sanitizeString(name, 100);
  if (!cleanName) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Voer een geldig e-mailadres in." },
      { status: 400 }
    );
  }
  const cleanEmail = email.trim().toLowerCase().slice(0, 150);

  const cleanBrand = sanitizeString(brand, 60);
  if (!cleanBrand) {
    return NextResponse.json({ error: "Merk is verplicht." }, { status: 400 });
  }

  const cleanSize = sanitizeString(size, 40);
  if (!cleanSize) {
    return NextResponse.json({ error: "Bandenmaat is verplicht." }, { status: 400 });
  }

  // 4. Sanitize optional fields
  const cleanPhone = sanitizePhone(phone);
  const cleanModel = sanitizeOptionalString(model, 60);

  // Season whitelist
  const validSeasons = ["SUMMER", "WINTER", "ALL_SEASON"] as const;
  const cleanSeason =
    typeof season === "string" && validSeasons.includes(season.toUpperCase() as (typeof validSeasons)[number])
      ? season.toUpperCase()
      : null;

  // Quantity boundary clamp (1 to 24)
  const numQuantity = Number(quantity);
  const cleanQuantity = Number.isFinite(numQuantity)
    ? Math.max(1, Math.min(24, Math.round(numQuantity)))
    : 4;

  // Tread depth clamp (0.0 to 15.0 mm)
  let cleanTreadDepth: number | null = null;
  if (treadDepth !== undefined && treadDepth !== null && treadDepth !== "") {
    const numTread = Number(treadDepth);
    if (Number.isFinite(numTread) && numTread >= 0 && numTread <= 15) {
      cleanTreadDepth = Math.round(numTread * 10) / 10;
    }
  }

  const cleanDotYear = sanitizeOptionalString(dotYear, 10);
  const cleanCondition = sanitizeOptionalString(condition, 150);
  const cleanExtraNotes = sanitizeOptionalString(extraNotes, 2000);

  // Photos: enforce array of strictly verified https:// URLs, max 8
  const validatedPhotos = sanitizePhotosList(photos, 8);
  const cleanPhotosStr = validatedPhotos.length > 0 ? JSON.stringify(validatedPhotos) : null;

  // 5. Insert sanitized record
  const submission = await prisma.secondhandSubmission.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      brand: cleanBrand,
      model: cleanModel,
      size: cleanSize,
      season: cleanSeason,
      quantity: cleanQuantity,
      treadDepth: cleanTreadDepth,
      dotYear: cleanDotYear,
      condition: cleanCondition,
      extraNotes: cleanExtraNotes,
      photos: cleanPhotosStr,
    },
  });

  // 6. Send confirmation email to customer (non-blocking)
  sendSecondhandSubmissionConfirmation({
    id: submission.id,
    name: submission.name,
    email: submission.email,
    brand: submission.brand,
    model: submission.model,
    size: submission.size,
    season: submission.season,
    quantity: submission.quantity,
    treadDepth: submission.treadDepth,
    dotYear: submission.dotYear,
    condition: submission.condition,
    photosCount: validatedPhotos.length > 0 ? validatedPhotos.length : undefined,
  }).catch((err) =>
    console.error("[Resend] secondhand confirmation fire-and-forget failed:", err)
  );

  return NextResponse.json(submission, { status: 201 });
}

