import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Redis from "ioredis";
import os from "os";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Prometheus metrics
const metrics = {
  taskCounter: new Map<string, number>(),
  requestDuration: new Map<string, number[]>(),
  errors: new Map<string, number>()
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") || "json";

  try {
    if (format === "prometheus") {
      return getPrometheusMetrics();
    }

    return getJsonHealth();
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}

async function getJsonHealth() {
  const startTime = Date.now();

  try {
    // Check database
    const dbOk = await checkDatabase();

    // Check Redis
    const redisOk = await checkRedis();

    // Get queue stats
    const queueStats = await getQueueStats();

    // System info
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      loadAverage: os.loadavg()
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: dbOk && redisOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTime,
      checks: {
        database: dbOk ? "ok" : "failed",
        redis: redisOk ? "ok" : "failed",
        queue: queueStats
      },
      system: systemInfo
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}

async function getPrometheusMetrics() {
  const lines: string[] = [];

  try {
    // Database metrics
    const taskCounts = await db.task.groupBy({
      by: ["status"],
      _count: true
    });

    taskCounts.forEach((tc) => {
      lines.push(`agency_tasks_total{status="${tc.status}"} ${tc._count}`);
    });

    // API usage metrics
    const usage = await db.apiUsage.findMany({
      select: { provider: true, cost: true },
      where: { date: { gte: new Date(Date.now() - 86400000) } }
    });

    const costByProvider: Record<string, number> = {};
    usage.forEach((u) => {
      costByProvider[u.provider] = (costByProvider[u.provider] || 0) + u.cost;
    });

    Object.entries(costByProvider).forEach(([provider, cost]) => {
      lines.push(`agency_api_cost_total{provider="${provider}"} ${cost}`);
    });

    // System metrics
    const mem = process.memoryUsage();
    lines.push(`process_resident_memory_bytes ${mem.rss}`);
    lines.push(`process_heap_used_bytes ${mem.heapUsed}`);
    lines.push(`process_uptime_seconds ${process.uptime()}`);

    // Queue metrics
    const queueStats = await getQueueStats();
    lines.push(`agency_queue_active ${queueStats.active}`);
    lines.push(`agency_queue_pending ${queueStats.pending}`);
    lines.push(`agency_queue_completed ${queueStats.completed}`);
    lines.push(`agency_queue_failed ${queueStats.failed}`);

    return new NextResponse(lines.join("\n"), {
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    console.error("Prometheus metrics error:", error);
    return new NextResponse("# ERROR\n", { status: 500 });
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    await db.user.count({ take: 1 });
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

async function getQueueStats(): Promise<Record<string, number>> {
  try {
    const stats = await redis.hgetall("queue:stats");
    return {
      active: parseInt(stats.active) || 0,
      pending: parseInt(stats.pending) || 0,
      completed: parseInt(stats.completed) || 0,
      failed: parseInt(stats.failed) || 0
    };
  } catch {
    return { active: 0, pending: 0, completed: 0, failed: 0 };
  }
}

export function recordMetric(metric: string, value: number, tags?: Record<string, string>) {
  if (!metrics.requestDuration.has(metric)) {
    metrics.requestDuration.set(metric, []);
  }
  metrics.requestDuration.get(metric)?.push(value);
}

export function recordError(error: string) {
  const count = metrics.errors.get(error) || 0;
  metrics.errors.set(error, count + 1);
}
