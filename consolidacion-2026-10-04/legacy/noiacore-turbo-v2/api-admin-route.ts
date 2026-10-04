import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.slice(7);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.tier !== "enterprise") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");

    if (action === "metrics") {
      return getMetrics(userId);
    } else if (action === "users") {
      return listUsers();
    } else if (action === "tasks") {
      return listTasks();
    } else if (action === "usage") {
      return getUsage(userId);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function getMetrics(userId: string) {
  const tasks = await db.task.findMany();
  const users = await db.user.findMany();
  const totalCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokensUsed || 0), 0);

  return NextResponse.json({
    totalUsers: users.length,
    totalTasks: tasks.length,
    totalCost: Math.round(totalCost * 10000) / 10000,
    totalTokens,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    failedTasks: tasks.filter((t) => t.status === "failed").length
  });
}

async function listUsers() {
  const users = await db.user.findMany({
    select: { id: true, email: true, tier: true, createdAt: true, apiUsed: true, apiQuota: true }
  });

  return NextResponse.json({ users });
}

async function listTasks() {
  const tasks = await db.task.findMany({
    select: { id: true, userId: true, prompt: true, status: true, cost: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({ tasks });
}

async function getUsage(userId: string) {
  const usage = await db.apiUsage.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 30
  });

  const byProvider = usage.reduce(
    (acc, u) => {
      acc[u.provider] = (acc[u.provider] || 0) + u.cost;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({ usage, byProvider });
}
