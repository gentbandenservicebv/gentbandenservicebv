import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tyres = await prisma.tyre.findMany({
      where: { active: true, stock: { gt: 0 } },
      select: {
        width: true,
        aspectRatio: true,
        diameter: true,
        season: true,
        stock: true,
      },
    });

    const validTyres = tyres.filter(
      (t) => typeof t.width === "number" && typeof t.aspectRatio === "number" && typeof t.diameter === "number"
    );

    const widths = [...new Set(validTyres.map((t) => t.width as number))].sort((a, b) => a - b);
    const profiles = [...new Set(validTyres.map((t) => t.aspectRatio as number))].sort((a, b) => a - b);
    const diameters = [...new Set(validTyres.map((t) => t.diameter as number))].sort((a, b) => a - b);

    const combinations = validTyres.map((t) => ({
      w: t.width as number,
      p: t.aspectRatio as number,
      d: t.diameter as number,
      s: t.season,
      stock: t.stock,
    }));

    const totalStock = tyres.reduce((sum, t) => sum + (t.stock || 0), 0);

    return NextResponse.json({
      totalInStock: totalStock,
      totalVariants: validTyres.length,
      widths,
      profiles,
      diameters,
      combinations,
    });
  } catch (error) {
    console.error("[Tyres Dimensions API Error]:", error);
    return NextResponse.json(
      { error: "Kon bandenmaten niet ophalen" },
      { status: 500 }
    );
  }
}
