import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ceo } from "@/lib/backend/ceo-core";
import { verifyToken, rateLimitCheck, auditLog } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

interface TaskRequest {
  prompt: string;
  webhookUrl?: string;
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

    // Rate limit check
    const limited = await rateLimitCheck(userId);
    if (limited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Upgrade tier." },
        { status: 429 }
      );
    }

    const body: TaskRequest = await req.json();
    if (!body.prompt || body.prompt.length > 10000) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Create task
    const task = await db.task.create({
      data: {
        userId,
        prompt: body.prompt,
        status: "pending"
      }
    });

    // Log audit
    await auditLog(userId, "task.created", "Task", JSON.stringify({ taskId: task.id }));

    // Execute async
    executeTaskAsync(task.id, userId, body.prompt).catch(console.error);

    return NextResponse.json({ taskId: task.id, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
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

    const taskId = req.nextUrl.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const task = await db.task.findFirst({
      where: { id: taskId, userId },
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

async function executeTaskAsync(taskId: string, userId: string, prompt: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { tier: true, apiQuota: true, apiUsed: true }
    });

    if (!user || user.apiUsed >= user.apiQuota) {
      await db.task.update({
        where: { id: taskId },
        data: { status: "failed", error: "API quota exceeded" }
      });
      return;
    }

    await db.task.update({
      where: { id: taskId },
      data: { status: "running" }
    });

    const result = await ceo.executeTask(prompt, userId);

    await db.task.update({
      where: { id: taskId },
      data: {
        status: result.status,
        result: JSON.stringify(result),
        cost: result.totalCost,
        tokensUsed: result.totalTokens,
        completedAt: new Date()
      }
    });

    // Update usage
    await db.user.update({
      where: { id: userId },
      data: { apiUsed: user.apiUsed + result.totalTokens }
    });

    // Create logs
    if (result.results.length > 0) {
      await db.agentLog.createMany({
        data: result.results.map((r) => ({
          taskId,
          agentType: r.agent,
          prompt: prompt.slice(0, 500),
          output: r.result.slice(0, 1000),
          duration: r.duration,
          tokensUsed: r.tokensUsed,
          cost: r.cost,
          provider: inferProvider(r.agent),
          model: r.agent
        }))
      });
    }

    // Webhook callback
    const webhook = await db.webhook.findFirst({
      where: { userId, active: true, events: { contains: "task.completed" } }
    });

    if (webhook) {
      fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: result.status, cost: result.totalCost })
      }).catch(console.error);
    }
  } catch (error) {
    console.error("executeTaskAsync error:", error);
    await db.task.update({
      where: { id: taskId },
      data: { status: "failed", error: String(error) }
    });
  }
}

function inferProvider(agent: string): string {
  if (agent === "claude") return "anthropic";
  if (agent === "mimo") return "deepseek";
  if (agent === "architect") return "groq";
  return "groq";
}
