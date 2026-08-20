// GET /api/palette — genera una paleta HSL con armonía.
import { NextRequest, NextResponse } from "next/server";
import {
  generatePalette,
  HARMONIES,
  type Harmony,
} from "@/lib/palette";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const hueParam = sp.get("hue");
  const harmonyParam = sp.get("harmony") as Harmony | null;
  const hue =
    hueParam !== null
      ? Math.min(360, Math.max(0, Number(hueParam) || 0))
      : Math.floor(Math.random() * 360);
  const harmony =
    harmonyParam && HARMONIES.includes(harmonyParam) ? harmonyParam : "tríada";
  const palette = generatePalette(hue, harmony);
  return NextResponse.json({ ok: true, palette });
}
