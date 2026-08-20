// POST /api/auth — identidad simulada (crea/actualiza usuario por handle).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface AuthBody {
  handle: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  let body: AuthBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const handle = (body.handle ?? "").replace(/^@/, "").trim().slice(0, 24);
  if (!handle) {
    return NextResponse.json({ ok: false, error: "Falta handle" }, { status: 400 });
  }
  const name = (body.name ?? handle).slice(0, 40) || handle;
  try {
    const user = await db.user.upsert({
      where: { handle },
      update: { name },
      create: { handle, name },
    });
    await db.event
      .create({ data: { kind: "join", user: handle, target: "al laboratorio" } })
      .catch(() => null);
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        handle: user.handle,
        name: user.name,
        joinedAt: user.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: true,
        fallback: true,
        user: {
          id: "local-" + Date.now(),
          handle,
          name,
          joinedAt: new Date().toISOString(),
        },
        error: e instanceof Error ? e.message : "db error",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ users: count });
  } catch {
    return NextResponse.json({ users: 0 });
  }
}
