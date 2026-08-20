// Fábrica Creativa Eterna — API de assets
// Persistencia en SQLite de los assets generados por la fábrica autónoma.
// Usa raw SQL para evitar el caché HMR del PrismaClient (mismo patrón que comments).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface FactoryAssetRow {
  id: string;
  assetType: string;
  title: string;
  producerId: number;
  producerName: string;
  shader: string;
  hue: number;
  complexity: number;
  intensity: number;
  narrative: string;
  tags: string;
  season: string;
  loreNode: string;
  version: number;
  status: string;
  qualityScore: number;
  briefId: string | null;
  relations: string;
  createdAt: string;
}

interface SeasonRow {
  id: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string | null;
  assetCount: number;
}

interface TrendRow {
  id: string;
  name: string;
  source: string;
  score: number;
  description: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Number(sp.get("limit")) || 50);
  const assetType = sp.get("type");

  try {
    const assets = assetType
      ? await db.$queryRaw<FactoryAssetRow[]>`
          SELECT * FROM FactoryAsset WHERE assetType = ${assetType}
          ORDER BY createdAt DESC LIMIT ${limit}
        `
      : await db.$queryRaw<FactoryAssetRow[]>`
          SELECT * FROM FactoryAsset
          ORDER BY createdAt DESC LIMIT ${limit}
        `;

    const seasons = await db.$queryRaw<SeasonRow[]>`
      SELECT * FROM FactorySeason ORDER BY createdAt DESC LIMIT 10
    `;

    const trends = await db.$queryRaw<TrendRow[]>`
      SELECT * FROM FactoryTrend ORDER BY score DESC LIMIT 10
    `;

    const totalRows = await db.$queryRaw<{count: number}[]>`SELECT COUNT(*) as count FROM FactoryAsset`;
    const activeRows = await db.$queryRaw<{count: number}[]>`SELECT COUNT(*) as count FROM FactoryAsset WHERE status = 'active'`;
    const legacyRows = await db.$queryRaw<{count: number}[]>`SELECT COUNT(*) as count FROM FactoryAsset WHERE status = 'legacy'`;

    const total = Number(totalRows[0]?.count ?? 0);
    const active = Number(activeRows[0]?.count ?? 0);
    const legacy = Number(legacyRows[0]?.count ?? 0);

    return NextResponse.json({
      ok: true,
      assets: assets.map((a) => ({
        ...a,
        tags: a.tags ? a.tags.split(",").filter(Boolean) : [],
        relations: a.relations ? JSON.parse(a.relations) : [],
      })),
      seasons: seasons.map((s) => ({ ...s, startDate: new Date(s.startDate).toISOString() })),
      trends: trends.map((t) => ({ ...t, createdAt: new Date(t.createdAt).toISOString() })),
      stats: { total, active, legacy },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "db error", assets: [] },
      { status: 200 }
    );
  }
}

interface PostBody {
  assetType: string;
  title: string;
  producerId: number;
  producerName: string;
  shader: string;
  hue: number;
  complexity: number;
  intensity: number;
  narrative: string;
  tags: string[];
  season: string;
  loreNode: string;
  qualityScore: number;
  briefId?: string;
  relations?: string[];
}

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const id = "fa_" + Math.random().toString(36).slice(2, 12);
  const now = new Date().toISOString();

  try {
    await db.$executeRaw`
      INSERT INTO FactoryAsset (id, assetType, title, producerId, producerName, shader, hue, complexity, intensity, narrative, tags, season, loreNode, version, status, qualityScore, briefId, relations, createdAt)
      VALUES (${id}, ${body.assetType}, ${body.title}, ${body.producerId}, ${body.producerName}, ${body.shader}, ${body.hue}, ${body.complexity}, ${body.intensity}, ${body.narrative}, ${(body.tags ?? []).join(",")}, ${body.season}, ${body.loreNode}, ${1}, ${"active"}, ${body.qualityScore ?? 0}, ${body.briefId ?? null}, ${JSON.stringify(body.relations ?? [])}, ${now})
    `;

    return NextResponse.json({
      ok: true,
      asset: { id, ...body, version: 1, status: "active", createdAt: now },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "db error" },
      { status: 200 }
    );
  }
}
