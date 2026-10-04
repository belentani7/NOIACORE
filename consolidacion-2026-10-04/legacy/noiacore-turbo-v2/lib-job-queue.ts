import Queue from "bull";
import Redis from "ioredis";
import { db } from "@/lib/db";
import { ceoGodMode } from "@/lib/backend/ceo-god-mode";
import { publishTaskUpdate } from "@/lib/websocket-server";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const taskQueue = new Queue("tasks", {
  redis: { url: process.env.REDIS_URL || "redis://localhost:6379" }
});

interface TaskJob {
  taskId: string;
  userId: string;
  prompt: string;
  webhookUrl?: string;
}

// Process tasks with concurrency limit
taskQueue.process(5, async (job) => {
  const { taskId, userId, prompt, webhookUrl } = job.data as TaskJob;

  try {
    // Update status to running
    await db.task.update({
      where: { id: taskId },
      data: { status: "running" }
    });

    // Publish WebSocket update
    await publishTaskUpdate(userId, taskId, { status: "running" });

    // Execute task
    const result = await ceoGodMode.executeTask(prompt, userId);

    // Save result
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
      data: { apiUsed: { increment: result.totalTokens } }
    });

    // Publish WebSocket update
    await publishTaskUpdate(userId, taskId, {
      status: result.status,
      cost: result.totalCost,
      result: result.results
    });

    // Webhook callback
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: result.status,
            cost: result.totalCost,
            timestamp: new Date().toISOString()
          }),
          signal: AbortSignal.timeout(10000)
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    }

    return { success: true, result };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await db.task.update({
      where: { id: taskId },
      data: { status: "failed", error: errorMsg }
    });

    await publishTaskUpdate(userId, taskId, { status: "failed", error: errorMsg });

    throw error;
  }
});

// Queue events
taskQueue.on("error", (err) => console.error("Queue error:", err));
taskQueue.on("failed", (job, err) => console.error(`Job ${job.id} failed:`, err.message));
taskQueue.on("completed", (job) => console.log(`Job ${job.id} completed`));

// Enqueue task
export async function enqueueTask(taskId: string, userId: string, prompt: string, webhookUrl?: string) {
  return taskQueue.add(
    { taskId, userId, prompt, webhookUrl } as TaskJob,
    {
      priority: 1,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 259200 }
    }
  );
}

// Get job status
export async function getJobStatus(taskId: string) {
  const job = await taskQueue.getJob(taskId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress();

  return { state, progress, attempts: job.attemptsMade, maxAttempts: job.opts.attempts };
}

// Pause/resume queue
export async function pauseQueue() {
  return taskQueue.pause();
}

export async function resumeQueue() {
  return taskQueue.resume();
}

// Queue stats
export async function getQueueStats() {
  const counts = await taskQueue.getJobCounts();
  return {
    active: counts.active,
    pending: counts.waiting,
    completed: counts.completed,
    failed: counts.failed
  };
}
