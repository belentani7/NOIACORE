import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, rateLimitCheck, auditLog } from "@/lib/auth";
import { enqueueTask, getJobStatus, getQueueStats } from "@/lib/job-queue";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const runtime = "nodejs";
export const maxDuration = 30;

interface TaskRequest {
  prompt: string;
  webhookUrl?: string;
  priority?: number;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Rate limit
    const limited = await rateLimitCheck(userId);
    if (limited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body: TaskRequest = await req.json();
    if (!body.prompt || body.prompt.length > 10000) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Check quota
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { tier: true, apiQuota: true, apiUsed: true }
    });

    if (!user || user.apiUsed >= user.apiQuota) {
      return NextResponse.json({ error: "Quota exceeded" }, { status: 403 });
    }

    // Create task
    const task = await db.task.create({
      data: { userId, prompt: body.prompt, status: "pending" }
    });

    // Enqueue job
    const job = await enqueueTask(task.id, userId, body.prompt, body.webhookUrl);

    // Log
    await auditLog(userId, "task.created", "Task", JSON.stringify({ taskId: task.id }));

    // Cache task info
    await redis.setex(`task:${task.id}:user`, 86400, userId);

    return NextResponse.json(
      { taskId: task.id, jobId: job.id, status: "queued" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.slice(7);
    const userId = token ? await verifyToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    const taskId = searchParams.get("id");

    if (action === "status" && taskId) {
      return getTaskStatus(taskId, userId);
    } else if (action === "list") {
      return listUserTasks(userId, searchParams);
    } else if (action === "queue") {
      return getQueueStatus();
    } else if (taskId) {
      return getTaskStatus(taskId, userId);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function getTaskStatus(taskId: string, userId: string) {
  // Check ownership
  const taskUser = await redis.get(`task:${taskId}:user`);
  if (taskUser !== userId) {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      prompt: true,
      status: true,
      result: true,
      error: true,
      cost: true,
      tokensUsed: true,
      createdAt: true,
      completedAt: true
    }
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

async function listUserTasks(userId: string, params: URLSearchParams) {
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");
  const status = params.get("status");

  const where: any = { userId };
  if (status) where.status = status;

  const tasks = await db.task.findMany({
    where,
    select: {
      id: true,
      prompt: true,
      status: true,
      cost: true,
      createdAt: true,
      completedAt: true
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset
  });

  const total = await db.task.count({ where });

  return NextResponse.json({ tasks, total, limit, offset });
}

async function getQueueStatus() {
  const stats = await getQueueStats();
  return NextResponse.json(stats);
}
