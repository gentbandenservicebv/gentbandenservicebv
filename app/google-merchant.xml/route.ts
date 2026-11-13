import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.gentbandenservice.be";

// ─── helpers ──────────────────────────────────────────────────────────────────

type Season = "SUMMER" | "WINTER" | "ALL_SEASON";
type TyreCondition = "NEW" | "USED";

function seasonNl(s: Season): string {
  switch (s) {
    case "SUMMER":
      return "Zomerbanden";
    case "WINTER":
      return "Winterbanden";
    case "ALL_SEASON":
      return "4-seizoenenbanden";
  }
}

function gmCondition(c: TyreCondition): string {
  return c === "NEW" ? "new" : "used";
}

function gmAvailability(stock: number): string {
  return stock > 0 ? "in_stock" : "out_of_stock";
}

/** Escape characters that break XML text nodes. */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a Dutch product title.
 * Template: {brand} {model} {width}/{aspectRatio}R{diameter} {season}
 * Falls back gracefully when width/aspectRatio/diameter are null.
 */
function buildTitle(t: {
  brand: string;
  model: string;
  size: string;
  width: number | null;
  aspectRatio: number | null;
  diameter: number | null;
  season: Season;
  condition: TyreCondition;
}): string {
  const dim =
    t.width && t.aspectRatio && t.diameter
      ? `${t.width}/${t.aspectRatio}R${t.diameter}`
      : t.size;
  const conditionLabel = t.condition === "USED" ? "Tweedehands " : "";
  return `${conditionLabel}${t.brand} ${t.model} ${dim} ${seasonNl(t.season)}`;
}

/**
 * Build a Dutch product description (max ~5000 chars — Google ignores the rest).
 */
function buildDescription(t: {
  brand: string;
  model: string;
  size: string;
  width: number | null;
  aspectRatio: number | null;
  diameter: number | null;
  season: Season;
  condition: TyreCondition;
  speedIndex: string | null;
  loadIndex: string | null;
  treadDepth: number | null;
  dotYear: string | null;
  runflat: boolean;
  reinforced: boolean;
  description: string | null;
}): string {
  const conditionNl = t.condition === "NEW" ? "Nieuwe" : "Tweedehands";
  const dim =
    t.width && t.aspectRatio && t.diameter
      ? `${t.width}/${t.aspectRatio}R${t.diameter}`
      : t.size;

  const parts: string[] = [
    `${conditionNl} ${t.brand} ${t.model} band in maat ${dim}.`,
    `Seizoen: ${seasonNl(t.season)}.`,
  ];

  if (t.loadIndex) parts.push(`Draagvermogen: ${t.loadIndex}.`);
  if (t.speedIndex) parts.push(`Snelheidsindex: ${t.speedIndex}.`);
  if (t.runflat) parts.push("Runflat band.");
  if (t.reinforced) parts.push("Versterkt (XL / Extra Load).");
  if (t.condition === "USED") {
    if (t.treadDepth != null) parts.push(`Profieldiepte: ${t.treadDepth} mm.`);
    if (t.dotYear) parts.push(`DOT-jaar: ${t.dotYear}.`);
  }
  if (t.description) parts.push(t.description);
  parts.push("Professionele montage mogelijk in Gent. Prijs is per stuk incl. 21% BTW.");

  return parts.join(" ");
}

/** Google Merchant product type path */
function productType(season: Season, condition: TyreCondition): string {
  const condNl = condition === "NEW" ? "Nieuwe banden" : "Tweedehands banden";
  return `Auto > Banden > ${condNl} > ${seasonNl(season)}`;
}

/** Safe tyre URL — prefer slug, fall back to id */
function tyreUrl(slug: string | null, id: string): string {
  const path = encodeURIComponent(slug || id);
  return `${SITE_URL}/banden/${path}`;
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  // Signal to Next.js (cacheComponents mode) that this route runs at request time.
  await connection();

  const tyres = await prisma.tyre.findMany({
    where: { active: true },
    select: {
      id: true,
      slug: true,
      brand: true,
      model: true,
      size: true,
      width: true,
      aspectRatio: true,
      diameter: true,
      season: true,
      condition: true,
      price: true,
      stock: true,
      speedIndex: true,
      loadIndex: true,
      treadDepth: true,
      dotYear: true,
      runflat: true,
      reinforced: true,
      description: true,
      updatedAt: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date().toUTCString();

  const items = tyres
    .map((t) => {
      const title = xmlEscape(buildTitle(t as Parameters<typeof buildTitle>[0]));
      const desc = xmlEscape(buildDescription(t as Parameters<typeof buildDescription>[0]));
      const link = xmlEscape(tyreUrl(t.slug, t.id));
      const condition = gmCondition(t.condition as TyreCondition);
      const availability = gmAvailability(t.stock);
      // Price is already incl. 21% BTW (confirmed in product page: "Prijs per stuk (incl. BTW)")
      const priceStr = `${t.price.toFixed(2)} EUR`;
      const pType = xmlEscape(productType(t.season as Season, t.condition as TyreCondition));

      // Primary image — only emit g:image_link when we actually have one
      const primaryImage = t.images[0]?.url ?? null;

      // MPN = brand + model + size (deterministic, non-invented identifier)
      // We do NOT emit g:gtin since we have no barcode data in the schema
      const mpn = xmlEscape(`${t.brand}-${t.model}-${t.size}`.replace(/\s+/g, "-").toLowerCase());

      // Google custom labels (free-form, up to 5)
      const customLabel0 = xmlEscape(seasonNl(t.season as Season)); // season
      const customLabel1 = xmlEscape(condition === "new" ? "Nieuw" : "Tweedehands"); // condition

      return `    <item>
      <g:id>${xmlEscape(t.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>${primaryImage ? `\n      <g:image_link>${xmlEscape(primaryImage)}</g:image_link>` : ""}
      <g:condition>${condition}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceStr}</g:price>
      <g:brand>${xmlEscape(t.brand)}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      <g:product_type>${pType}</g:product_type>
      <g:google_product_category>916</g:google_product_category>
      <g:custom_label_0>${customLabel0}</g:custom_label_0>
      <g:custom_label_1>${customLabel1}</g:custom_label_1>
      <g:shipping>
        <g:country>BE</g:country>
        <g:service>Standaard levering</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Gent Bandenservice BV — Banden</title>
    <link>${SITE_URL}</link>
    <description>Nieuw en tweedehands banden van Gent Bandenservice BV. Zomer-, winter- en 4-seizoenenbanden.</description>
    <language>nl</language>
    <pubDate>${now}</pubDate>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Cache for 1 hour on CDN; revalidate in background
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

