// GET /api/stats — métricas del laboratorio.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [obras, users, likes, saves] = await Promise.all([
      db.obra.count(),
      db.user.count(),
      db.like.count(),
      db.save.count(),
    ]);
    const recentEvents = await db.event
      .findMany({ orderBy: { createdAt: "desc" }, take: 8 })
      .catch(() => []);
    return NextResponse.json({
      obras,
      users,
      likes,
      saves,
      events: recentEvents.map((e) => ({
        id: e.id,
        kind: e.kind,
        user: e.user,
        target: e.target,
        ago: e.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ obras: 0, users: 0, likes: 0, saves: 0, events: [] });
  }
}
