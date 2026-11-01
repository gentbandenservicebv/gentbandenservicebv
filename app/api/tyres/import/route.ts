import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateTyreSlug } from "@/lib/slug";

interface RawImportRow {
  brand?: string;
  merk?: string;
  model?: string;
  size?: string;
  maat?: string;
  width?: string | number;
  breedte?: string | number;
  aspectRatio?: string | number;
  hoogte?: string | number;
  diameter?: string | number;
  inch?: string | number;
  velg?: string | number;
  velgmaat?: string | number;
  speedIndex?: string;
  snelheidsindex?: string;
  speed?: string;
  loadIndex?: string | number;
  draagvermogen?: string | number;
  load?: string | number;
  season?: string;
  seizoen?: string;
  condition?: string;
  conditie?: string;
  staat?: string;
  price?: string | number;
  prijs?: string | number;
  stock?: string | number;
  voorraad?: string | number;
  aantal?: string | number;
  treadDepth?: string | number;
  profieldiepte?: string | number;
  profiel?: string | number;
  dotYear?: string | number;
  dot?: string | number;
  dotjaar?: string | number;
  bouwjaar?: string | number;
  jaar?: string | number;
  runflat?: boolean | string | number;
  rft?: boolean | string | number;
  reinforced?: boolean | string | number;
  xl?: boolean | string | number;
  extraload?: boolean | string | number;
  fuelEfficiency?: string;
  brandstof?: string;
  brandstofverbruik?: string;
  wetGrip?: string;
  grip?: string;
  natgrip?: string;
  noiseLevel?: string | number;
  geluid?: string | number;
  db?: string | number;
  images?: string;
  image?: string;
  foto?: string;
  fotos?: string;
  fotoUrl?: string;
  afbeelding?: string;
  afbeeldingen?: string;
  description?: string;
  beschrijving?: string;
  omschrijving?: string;
  featured?: boolean | string;
  [key: string]: unknown;
}

function normalizeSeason(val?: string): "SUMMER" | "WINTER" | "ALL_SEASON" {
  if (!val) return "ALL_SEASON";
  const s = String(val).toLowerCase().trim();
  if (s.includes("zom") || s.includes("sum")) return "SUMMER";
  if (s.includes("win")) return "WINTER";
  return "ALL_SEASON";
}

function normalizeCondition(val?: string): "NEW" | "USED" {
  if (!val) return "NEW";
  const s = String(val).toLowerCase().trim();
  if (s.includes("tweede") || s.includes("use") || s.includes("gebruik") || s.includes("occ")) {
    return "USED";
  }
  return "NEW";
}

function parseNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const cleaned = String(val)
    .replace(/[€$\s]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

function parseBoolean(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "1" || s === "ja" || s === "yes" || s === "y" || s === "j";
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

function extractImageUrls(raw?: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;\n\r|]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const body = await req.json();
    const rows: RawImportRow[] = body.items ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Geen geldige rijen gevonden om te importeren." },
        { status: 400 }
      );
    }

    const validOperations: Array<{
      tyreData: {
        slug: string;
        brand: string;
        model: string;
        size: string;
        width: number | null;
        aspectRatio: number | null;
        diameter: number | null;
        speedIndex: string | null;
        loadIndex: string | null;
        season: "SUMMER" | "WINTER" | "ALL_SEASON";
        condition: "NEW" | "USED";
        price: number;
        stock: number;
        treadDepth: number | null;
        dotYear: string | null;
        runflat: boolean;
        reinforced: boolean;
        highLoad: boolean;
        rimProtection: boolean;
        threepmsfRated: boolean;
        msMarking: boolean;
        iceGrip: boolean;
        selfSealing: boolean;
        acoustic: boolean;
        electric: boolean;
        demo: boolean;
        oeMarking: string | null;
        tyreClass: string | null;
        fuelEfficiency: string | null;
        wetGrip: string | null;
        noiseLevel: number | null;
        description: string | null;
        featured: boolean;
        active: boolean;
      };
      imageUrls: string[];
    }> = [];

    const skippedRows: Array<{ row: number; reason: string }> = [];

    rows.forEach((r, idx) => {
      const brand = (r.brand ?? r.merk ?? "").trim();
      const model = (r.model ?? "").trim();
      const size = (r.size ?? r.maat ?? "").trim();

      if (!brand || !model || !size) {
        skippedRows.push({
          row: idx + 1,
          reason: `Ontbrekende verplichte velden (merk, model of maat): "${brand}" / "${model}" / "${size}"`,
        });
        return;
      }

      const parsed = parseSizeComponents(size);
      const widthVal = r.width ?? r.breedte;
      const aspectVal = r.aspectRatio ?? r.hoogte;
      const diamVal = r.diameter ?? r.inch ?? r.velg ?? r.velgmaat;

      const width = widthVal !== undefined && widthVal !== "" ? Math.round(parseNumber(widthVal, 0)) : parsed.width;
      const aspectRatio = aspectVal !== undefined && aspectVal !== "" ? Math.round(parseNumber(aspectVal, 0)) : parsed.aspectRatio;
      const diameter = diamVal !== undefined && diamVal !== "" ? Math.round(parseNumber(diamVal, 0)) : parsed.diameter;

      const rawSpeed = r.speedIndex ?? r.snelheidsindex ?? r.speed;
      const speedIndex = rawSpeed ? String(rawSpeed).trim().toUpperCase() : null;

      const rawLoad = r.loadIndex ?? r.draagvermogen ?? r.load;
      const loadIndex = rawLoad ? String(rawLoad).trim() : null;

      const price = parseNumber(r.price ?? r.prijs, 50);
      const stock = Math.max(0, Math.round(parseNumber(r.stock ?? r.voorraad ?? r.aantal, 4)));
      const rawTread = r.treadDepth ?? r.profieldiepte ?? r.profiel;
      const treadDepth = rawTread !== undefined && rawTread !== "" ? parseNumber(rawTread, 0) : null;
      const season = normalizeSeason(r.season ?? r.seizoen);
      const condition = normalizeCondition(r.condition ?? r.conditie ?? r.staat);

      const rawDot = r.dotYear ?? r.dot ?? r.dotjaar ?? r.bouwjaar ?? r.jaar;
      const dotYear = rawDot ? String(rawDot).trim() : null;

      const runflat = parseBoolean(r.runflat ?? r.rft);
      const reinforced = parseBoolean(r.reinforced ?? r.xl ?? r.extraload);
      const highLoad = parseBoolean(r.highLoad ?? r.hl);
      const rimProtection = parseBoolean(r.rimProtection ?? r.fsl ?? r.mfs ?? r.fr ?? r.rpb ?? r.fp ?? r.velgbescherming);
      const threepmsfRated = parseBoolean(r.threepmsfRated ?? r.threepmsf ?? r["3pmsf"] ?? r.alpine);
      const msMarking = parseBoolean(r.msMarking ?? r.ms ?? r["m+s"]);
      const iceGrip = parseBoolean(r.iceGrip ?? r.nordic ?? r.ijsgrip ?? r.noords);
      const selfSealing = parseBoolean(r.selfSealing ?? r.seal ?? r.sealguard ?? r.contiseal);
      const acoustic = parseBoolean(r.acoustic ?? r.noise ?? r.silent ?? r.pncs);
      const electric = parseBoolean(r.electric ?? r.ev ?? r.evr ?? r.evc ?? r.elect);
      const demo = parseBoolean(r.demo ?? r.demoband);
      const oeMarking = r.oeMarking ? String(r.oeMarking).trim() : null;
      const tyreClass = r.tyreClass ? String(r.tyreClass).trim() : null;

      const rawFuel = r.fuelEfficiency ?? r.brandstof ?? r.brandstofverbruik;
      const fuelEfficiency = rawFuel ? String(rawFuel).trim().toUpperCase() : null;

      const rawGrip = r.wetGrip ?? r.grip ?? r.natgrip;
      const wetGrip = rawGrip ? String(rawGrip).trim().toUpperCase() : null;

      const rawNoise = r.noiseLevel ?? r.geluid ?? r.db;
      const noiseLevel = rawNoise !== undefined && rawNoise !== "" ? Math.round(parseNumber(rawNoise, 0)) : null;

      const rawImgs = r.images ?? r.image ?? r.foto ?? r.fotos ?? r.fotoUrl ?? r.afbeelding ?? r.afbeeldingen;
      const imageUrls = extractImageUrls(rawImgs);

      const description = (r.description ?? r.beschrijving ?? r.omschrijving ?? "").trim() || null;
      const featured = parseBoolean(r.featured);
      const baseSlug = generateTyreSlug(brand, model, size);
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

      validOperations.push({
        tyreData: {
          slug,
          brand,
          model,
          size,
          width,
          aspectRatio,
          diameter,
          speedIndex,
          loadIndex,
          season,
          condition,
          price,
          stock,
          treadDepth,
          dotYear,
          runflat,
          reinforced,
          highLoad,
          rimProtection,
          threepmsfRated,
          msMarking,
          iceGrip,
          selfSealing,
          acoustic,
          electric,
          demo,
          oeMarking,
          tyreClass,
          fuelEfficiency,
          wetGrip,
          noiseLevel,
          description,
          featured,
          active: true,
        },
        imageUrls,
      });
    });

    if (validOperations.length === 0) {
      return NextResponse.json(
        {
          error: "Geen geldige bandenrijen gevonden in het bestand.",
          skipped: skippedRows,
        },
        { status: 400 }
      );
    }

    // Execute transaction to create tyres and attached images
    const createdTyres = await prisma.$transaction(
      validOperations.map((op) =>
        prisma.tyre.create({
          data: {
            ...op.tyreData,
            ...(op.imageUrls.length > 0 && {
              images: {
                create: op.imageUrls.map((url, imgIdx) => ({
                  url,
                  fileKey: `import_${Date.now()}_${imgIdx}`,
                  isPrimary: imgIdx === 0,
                  order: imgIdx,
                })),
              },
            }),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdTyres.length,
      totalSubmitted: rows.length,
      skipped: skippedRows,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het importeren van het bestand." },
      { status: 500 }
    );
  }
}
