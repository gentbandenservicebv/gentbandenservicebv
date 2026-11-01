import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateTyreSlug, slugify } from "@/lib/slug";

// GET /api/tyres - public list of tyres
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season     = searchParams.get("season");
  const condition  = searchParams.get("condition");
  const brand      = searchParams.get("brand");
  const search     = searchParams.get("search");
  const speedIndex     = searchParams.get("speedIndex");
  const fuelEfficiency = searchParams.get("fuelEfficiency");
  const wetGrip        = searchParams.get("wetGrip");
  const dotYear        = searchParams.get("dotYear");
  const runflat        = searchParams.get("runflat");
  const reinforced     = searchParams.get("reinforced");
  const threepmsfRated = searchParams.get("threepmsfRated") || searchParams.get("threepmsf");
  const msMarking      = searchParams.get("msMarking") || searchParams.get("ms");
  const rimProtection  = searchParams.get("rimProtection") || searchParams.get("fsl");
  const iceGrip        = searchParams.get("iceGrip");
  const highLoad       = searchParams.get("highLoad") || searchParams.get("hl");
  const electric       = searchParams.get("electric") || searchParams.get("ev");
  const selfSealing    = searchParams.get("selfSealing") || searchParams.get("seal");
  const acoustic       = searchParams.get("acoustic");
  const demo           = searchParams.get("demo");
  const oeMarking      = searchParams.get("oeMarking") || searchParams.get("oe");
  const tyreClass      = searchParams.get("tyreClass");
  const plyRating      = searchParams.get("plyRating") || searchParams.get("pr");
  const loadRange      = searchParams.get("loadRange");
  const structureType  = searchParams.get("structureType") || searchParams.get("structure");
  const tubeless       = searchParams.get("tubeless");
  const priceMin       = searchParams.get("priceMin");
  const priceMax       = searchParams.get("priceMax");
  const inStock        = searchParams.get("inStock");
  const featuredOnly   = searchParams.get("featured");

  const widthStr       = searchParams.get("width");
  const profileStr     = searchParams.get("profile") || searchParams.get("aspectRatio");
  const rimStr         = searchParams.get("rim") || searchParams.get("diameter");

  const widthNum       = widthStr   ? parseInt(widthStr, 10)   : null;
  const aspectRatioNum = profileStr ? parseInt(profileStr, 10) : null;
  const diameterNum    = rimStr     ? parseInt(rimStr, 10)     : null;

  let seasonEnum: "SUMMER" | "WINTER" | "ALL_SEASON" | undefined;
  if (season) {
    const s = season.toUpperCase().trim();
    if (s === "SUMMER" || s === "ZOMER") seasonEnum = "SUMMER";
    else if (s === "WINTER") seasonEnum = "WINTER";
    else if (s === "ALL_SEASON" || s === "ALL-SEASON" || s === "ALLSEASON") seasonEnum = "ALL_SEASON";
  }

  const tyres = await prisma.tyre.findMany({
    where: {
      active: true,
      ...(seasonEnum && { season: seasonEnum }),
      ...(condition  && { condition: condition as "NEW" | "USED" }),
      ...(brand      && { brand: { equals: brand, mode: "insensitive" } }),
      ...(widthNum       && !isNaN(widthNum)       && { width: widthNum }),
      ...(aspectRatioNum && !isNaN(aspectRatioNum) && { aspectRatio: aspectRatioNum }),
      ...(diameterNum    && !isNaN(diameterNum)    && { diameter: diameterNum }),
      ...(speedIndex     && { speedIndex:     { equals: speedIndex,     mode: "insensitive" } }),
      ...(fuelEfficiency && { fuelEfficiency: { equals: fuelEfficiency, mode: "insensitive" } }),
      ...(wetGrip        && { wetGrip:        { equals: wetGrip,        mode: "insensitive" } }),
      ...(dotYear        && { dotYear:        { equals: dotYear } }),
      ...(runflat        === "true" && { runflat:        true }),
      ...(reinforced     === "true" && { reinforced:     true }),
      ...(threepmsfRated === "true" && { threepmsfRated: true }),
      ...(msMarking      === "true" && { msMarking:      true }),
      ...(rimProtection  === "true" && { rimProtection:  true }),
      ...(iceGrip        === "true" && { iceGrip:        true }),
      ...(highLoad       === "true" && { highLoad:       true }),
      ...(electric       === "true" && { electric:       true }),
      ...(selfSealing    === "true" && { selfSealing:    true }),
      ...(acoustic       === "true" && { acoustic:       true }),
      ...(demo           === "true" && { demo:           true }),
      ...(oeMarking      && { oeMarking: { equals: oeMarking, mode: "insensitive" } }),
      ...(tyreClass      && { tyreClass: { equals: tyreClass, mode: "insensitive" } }),
      ...(plyRating      && { plyRating: { equals: plyRating, mode: "insensitive" } }),
      ...(loadRange      && { loadRange: { equals: loadRange, mode: "insensitive" } }),
      ...(structureType  && { structureType: { equals: structureType, mode: "insensitive" } }),
      ...(tubeless !== null && { tubeless: tubeless === "true" }),
      ...((priceMin || priceMax) && {
        price: {
          ...(priceMin && { gte: parseFloat(priceMin) }),
          ...(priceMax && { lte: parseFloat(priceMax) }),
        },
      }),
      ...(inStock === "true" && { stock: { gt: 0 } }),
      ...(featuredOnly === "true" && { featured: true }),
      ...(search && {
        OR: [
          { brand: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { size:  { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Auto-backfill & sync slug for any tyres where slug does not match brand/model
  for (const t of tyres) {
    const modelSlug = slugify(`${t.brand} ${t.model}`);
    if (!t.slug || !t.slug.startsWith(modelSlug)) {
      const slug = generateTyreSlug(t.brand, t.model, t.size, t.id);
      t.slug = slug;
      await prisma.tyre.update({ where: { id: t.id }, data: { slug } }).catch(() => {});
    }
  }

  return NextResponse.json(tyres, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}


function parseSizeComponents(sizeStr?: string) {
  if (!sizeStr) return { width: null, aspectRatio: null, diameter: null };
  const match = sizeStr.match(/(\d{3})\/(\d{2})\s*(?:R|r|ZR|zr|-)?\s*(\d{2})/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      aspectRatio: parseInt(match[2], 10),
      diameter: parseInt(match[3], 10),
    };
  }
  return { width: null, aspectRatio: null, diameter: null };
}

// POST /api/tyres - create tyre (admin only)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseSizeComponents(body.size);
  const baseSlug = generateTyreSlug(body.brand, body.model, body.size);
  const existingWithSlug = await prisma.tyre.findFirst({ where: { slug: baseSlug } });
  const slug = existingWithSlug ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const tyre = await prisma.tyre.create({
    data: {
      slug,
      brand: body.brand,
      model: body.model,
      size: body.size,
      width: body.width ? parseInt(body.width, 10) : parsed.width,
      aspectRatio: body.aspectRatio ? parseInt(body.aspectRatio, 10) : parsed.aspectRatio,
      diameter: body.diameter ? parseInt(body.diameter, 10) : parsed.diameter,
      speedIndex: body.speedIndex ?? null,
      loadIndex: body.loadIndex ?? null,
      season: body.season,
      condition: body.condition,
      price: body.price,
      stock: body.stock ?? 0,
      treadDepth: body.treadDepth ?? null,
      dotYear: body.dotYear ?? null,
      runflat: Boolean(body.runflat),
      reinforced: Boolean(body.reinforced),
      threepmsfRated: Boolean(body.threepmsfRated),
      msMarking: Boolean(body.msMarking),
      selfSealing: Boolean(body.selfSealing),
      acoustic: Boolean(body.acoustic),
      electric: Boolean(body.electric),
      rimProtection: Boolean(body.rimProtection),
      iceGrip: Boolean(body.iceGrip),
      highLoad: Boolean(body.highLoad),
      demo: Boolean(body.demo),
      oeMarking: body.oeMarking || null,
      tyreClass: body.tyreClass || null,
      plyRating: body.plyRating || null,
      loadRange: body.loadRange || null,
      structureType: body.structureType || null,
      tubeless: body.tubeless !== undefined ? Boolean(body.tubeless) : true,
      fuelEfficiency: body.fuelEfficiency ?? null,
      wetGrip: body.wetGrip ?? null,
      noiseLevel: body.noiseLevel ? parseInt(body.noiseLevel, 10) : null,
      description: body.description ?? null,
      featured: body.featured ?? false,
      ...(Array.isArray(body.images) && body.images.length > 0 && {
        images: {
          create: body.images.map(
            (img: { url: string; fileKey?: string; isPrimary?: boolean }, idx: number) => ({
              url: img.url,
              fileKey: img.fileKey || `manual_${Date.now()}_${idx}`,
              isPrimary: img.isPrimary ?? idx === 0,
              order: idx,
            })
          ),
        },
      }),
    },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
  });

  return NextResponse.json(tyre, { status: 201 });
}
