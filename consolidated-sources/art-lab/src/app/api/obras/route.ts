// GET /api/obras — lista obras (seed + DB). POST /api/obras — publica una obra.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SEED_OBRAS } from "@/lib/obras";
import type { ShaderId } from "@/lib/shaders";

const VALID_SHADERS: ShaderId[] = [
  "silk",
  "plasma",
  "gridwarp",
  "noiseflow",
  "vortex",
  "aurora",
];

export async function GET() {
  try {
    const dbObras = await db.obra.findMany({
      orderBy: { createdAt: "desc" },
      take: 48,
      include: { author: true },
    });
    const mapped = dbObras.map((o) => ({
      id: o.id,
      title: o.title,
      author: o.author?.handle ?? "anónimo",
      shader: o.shader as ShaderId,
      hue: o.hue,
      complexity: o.complexity,
      intensity: o.intensity,
      excerpt: o.excerpt,
      tags: o.tags ? o.tags.split(",").filter(Boolean) : [],
      likes: o.likes,
      views: o.views,
      collected: o.collected,
      createdAt: o.createdAt.toISOString(),
    }));
    // Combinamos seed + DB (las de DB aparecen primero)
    return NextResponse.json({ obras: [...mapped, ...SEED_OBRAS] });
  } catch {
    // Si la DB no está disponible, devolvemos solo el seed
    return NextResponse.json({ obras: SEED_OBRAS });
  }
}

interface PublishBody {
  title: string;
  shader: string;
  hue: number;
  complexity: number;
  intensity: number;
  excerpt?: string;
  tags?: string[];
  author?: string;
}

export async function POST(req: NextRequest) {
  let body: PublishBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const title = (body.title ?? "").trim().slice(0, 60);
  if (!title) {
    return NextResponse.json({ ok: false, error: "Falta título" }, { status: 400 });
  }
  if (!VALID_SHADERS.includes(body.shader as ShaderId)) {
    return NextResponse.json(
      { ok: false, error: "Shader no válido" },
      { status: 400 }
    );
  }

  const handle = (body.author ?? "anon").replace(/^@/, "").slice(0, 24) || "anon";
  const hue = clamp(body.hue, 0, 1, 0.5);
  const complexity = clamp(body.complexity, 0, 1, 0.5);
  const intensity = clamp(body.intensity, 0, 1, 0.4);
  const excerpt = (body.excerpt ?? "Obra generada en Noiacore.").slice(0, 160);
  const tags = (body.tags ?? []).slice(0, 5).join(",");

  try {
    // upsert user by handle
    const user = await db.user.upsert({
      where: { handle },
      update: {},
      create: { handle, name: handle },
    });
    const obra = await db.obra.create({
      data: {
        title,
        authorId: user.id,
        shader: body.shader,
        hue,
        complexity,
        intensity,
        excerpt,
        tags,
      },
    });
    // registramos evento
    await db.event.create({
      data: { kind: "publish", user: handle, target: title },
    }).catch(() => null);
    return NextResponse.json({ ok: true, id: obra.id, obra });
  } catch (e) {
    // Fallback: modo sin DB (devuelve id simulado)
    const id = "local-" + Date.now();
    return NextResponse.json(
      { ok: true, id, fallback: true, error: e instanceof Error ? e.message : "db error" },
      { status: 200 }
    );
  }
}

function clamp(v: unknown, min: number, max: number, dflt: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}
