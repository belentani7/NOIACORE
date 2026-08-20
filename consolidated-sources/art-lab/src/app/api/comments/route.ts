// GET /api/comments?obraId=... — lista comentarios de una obra.
// POST /api/comments — crea un comentario.
// Usa raw SQL para evitar problemas de caché HMR con el modelo Comment.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CommentRow {
  id: string;
  obraId: string;
  handle: string;
  body: string;
  likes: number;
  createdAt: Date;
}

function genId(): string {
  return "cm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ ok: false, error: "Falta obraId" }, { status: 400 });
  }
  try {
    const rows = await db.$queryRaw<CommentRow[]>`
      SELECT id, obraId, handle, body, likes, createdAt
      FROM Comment
      WHERE obraId = ${obraId}
      ORDER BY createdAt DESC
      LIMIT 50
    `;
    return NextResponse.json({
      ok: true,
      comments: rows.map((r) => ({
        id: r.id,
        obraId: r.obraId,
        user: r.handle,
        body: r.body,
        likes: r.likes,
        at: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: true, comments: [], error: e instanceof Error ? e.message : "db error" },
      { status: 200 }
    );
  }
}

interface PostBody {
  obraId?: string;
  handle?: string;
  body?: string;
}

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const obraId = (body.obraId ?? "").trim();
  const handle = (body.handle ?? "anon").replace(/^@/, "").slice(0, 24) || "anon";
  const text = (body.body ?? "").trim().slice(0, 240);
  if (!obraId) {
    return NextResponse.json({ ok: false, error: "Falta obraId" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ ok: false, error: "Comentario vacío" }, { status: 400 });
  }
  const id = genId();
  const now = new Date().toISOString();
  try {
    // Asegurar que existe un usuario "seed" (por handle) y obtener su id real.
    let seedRow = await db.$queryRaw<{id: string}[]>`
      SELECT id FROM User WHERE handle = ${"seed"} LIMIT 1
    `;
    let seedUserId: string;
    if (seedRow.length > 0) {
      seedUserId = seedRow[0].id;
    } else {
      const newSeedId = "u_seed_" + Math.random().toString(36).slice(2, 10);
      await db.$executeRaw`
        INSERT INTO User (id, handle, name, createdAt)
        VALUES (${newSeedId}, ${"seed"}, ${"Seed"}, ${now})
      `;
      seedUserId = newSeedId;
    }
    // Asegurar que la obra existe (placeholder si es seed).
    const obraRow = await db.$queryRaw<{id: string}[]>`
      SELECT id FROM Obra WHERE id = ${obraId} LIMIT 1
    `;
    if (obraRow.length === 0) {
      await db.$executeRaw`
        INSERT INTO Obra (id, title, authorId, shader, hue, complexity, intensity, excerpt, tags, likes, views, collected, createdAt)
        VALUES (${obraId}, ${"Obra " + obraId}, ${seedUserId}, ${"silk"}, ${0.5}, ${0.5}, ${0.4}, ${"Obra seed"}, ${""}, ${0}, ${0}, ${0}, ${now})
      `;
    }
    // upsert user by handle si no es anon
    let userId: string | null = seedUserId;
    if (handle !== "anon") {
      const existing = await db.$queryRaw<{id: string}[]>`
        SELECT id FROM User WHERE handle = ${handle} LIMIT 1
      `;
      if (existing.length > 0) {
        userId = existing[0].id;
      } else {
        const newId = "u_" + Math.random().toString(36).slice(2, 12);
        await db.$executeRaw`
          INSERT INTO User (id, handle, name, createdAt)
          VALUES (${newId}, ${handle}, ${handle}, ${now})
        `;
        userId = newId;
      }
    }
    await db.$executeRaw`
      INSERT INTO Comment (id, obraId, userId, handle, body, likes, createdAt)
      VALUES (${id}, ${obraId}, ${userId}, ${handle}, ${text}, ${0}, ${now})
    `;
    return NextResponse.json({
      ok: true,
      comment: {
        id,
        obraId,
        user: handle,
        body: text,
        likes: 0,
        at: new Date().toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "db error" },
      { status: 200 }
    );
  }
}
