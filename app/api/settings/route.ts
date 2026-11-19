import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/settings";

// GET /api/settings — public (delivery_time & store status) OR admin (all)
export async function GET(req: NextRequest) {
  const isPublic = req.nextUrl.searchParams.get("public") === "1";

  if (!isPublic) {
    // Admin-only: check auth
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await getSiteSettings();

  if (isPublic) {
    return NextResponse.json({
      delivery_time_min: settings.delivery_time_min,
      delivery_time_max: settings.delivery_time_max,
      delivery_time_unit: settings.delivery_time_unit,
      delivery_note: settings.delivery_note,
      in_stock_text: settings.in_stock_text,
      free_shipping_min_tyres: settings.free_shipping_min_tyres,
      free_shipping_threshold: settings.free_shipping_threshold,
      shipping_cost: settings.shipping_cost,
      shop_open: settings.shop_open,
      shop_banner_enabled: settings.shop_banner_enabled,
      shop_message: settings.shop_message,
      company_name: settings.company_name,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      contact_address: settings.contact_address,
      opening_hours: settings.opening_hours,
    });
  }

  return NextResponse.json(settings);
}

// PATCH /api/settings — admin only, upserts multiple settings
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, string>;

  // Filter to only known keys to prevent arbitrary writes
  const allowedKeys = new Set(Object.keys(DEFAULT_SITE_SETTINGS));
  const updates = Object.entries(body).filter(([k]) => allowedKeys.has(k));

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
