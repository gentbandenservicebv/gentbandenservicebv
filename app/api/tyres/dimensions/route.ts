import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDimensionsFromSize(sizeStr?: string | null) {
  if (!sizeStr) return null;
  const match = sizeStr.match(/(\d{3})\/(\d{2})\s*(?:R|r|ZR|zr|-)?\s*(\d{2})(C)?/i);
  if (match) {
    return {
      w: parseInt(match[1], 10),
      p: parseInt(match[2], 10),
      d: parseInt(match[3], 10),
      isC: Boolean(match[4]),
    };
  }
  return null;
}

export async function GET() {
  try {
    const tyres = await prisma.tyre.findMany({
      where: { active: true },
      select: {
        size: true,
        width: true,
        aspectRatio: true,
        diameter: true,
        season: true,
        stock: true,
        plyRating: true,
        tyreClass: true,
      },
    });

    const parsedTyres: Array<{
      w: number;
      p: number;
      d: number;
      rimKey: string;
      isC: boolean;
      s: string;
      stock: number;
    }> = [];

    for (const t of tyres) {
      let w = typeof t.width === "number" ? t.width : null;
      let p = typeof t.aspectRatio === "number" ? t.aspectRatio : null;
      let d = typeof t.diameter === "number" ? t.diameter : null;
      let isCFromSize = false;

      const fromSize = parseDimensionsFromSize(t.size);
      if (fromSize) {
        w = w ?? fromSize.w;
        p = p ?? fromSize.p;
        d = d ?? fromSize.d;
        isCFromSize = fromSize.isC;
      }

      const isC = Boolean(
        isCFromSize ||
        (t.size && /\b\d{2}C\b/i.test(t.size)) ||
        (t.size && /C$/i.test(t.size.trim())) ||
        (t.plyRating && /C|6PR|8PR|10PR|12PR/i.test(t.plyRating)) ||
        t.tyreClass === "C"
      );

      if (w && p && d) {
        parsedTyres.push({
          w,
          p,
          d,
          rimKey: isC ? `${d}C` : `${d}`,
          isC,
          s: t.season,
          stock: t.stock || 0,
        });
      }
    }

    const widths = [...new Set(parsedTyres.map((t) => t.w))].sort((a, b) => a - b);
    const profiles = [...new Set(parsedTyres.map((t) => t.p))].sort((a, b) => a - b);
    const diameters = [...new Set(parsedTyres.map((t) => t.rimKey))].sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const totalStock = tyres.reduce((sum, t) => sum + (t.stock || 0), 0);

    return NextResponse.json({
      totalInStock: totalStock,
      totalVariants: parsedTyres.length,
      widths,
      profiles,
      diameters,
      combinations: parsedTyres,
    });
  } catch (error) {
    console.error("[Tyres Dimensions API Error]:", error);
    return NextResponse.json(
      { error: "Kon bandenmaten niet ophalen" },
      { status: 500 }
    );
  }
}
