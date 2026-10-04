import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import Redis from "ioredis";
import pRetry from "p-retry";

const execAsync = promisify(exec);
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface SubTask {
  description: string;
  agent: "opencode" | "claude" | "mimo" | "architect";
  priority?: number;
  timeout?: number;
}

interface ExecutionResult {
  taskId: string;
  status: "completed" | "failed";
  subtasks: SubTask[];
  results: Array<{
    subtask: string;
    agent: string;
    result: string;
    tokensUsed: number;
    cost: number;
    duration: number;
    retries: number;
  }>;
  totalCost: number;
  totalTokens: number;
  totalDuration: number;
  error?: string;
}

const AGENT_MAPPING: Record<string, string> = {
  opencode: "ocx opencode",
  claude: "ocx claude",
  mimo: "mimo run",
  architect: "ocx opencode"
};

const TOKEN_COSTS: Record<string, number> = {
  groq: 0.0002,
  anthropic: 0.003,
  deepseek: 0.0001,
  qwen: 0
};

const PROVIDER_CASCADE = ["groq", "deepseek", "anthropic", "qwen"];
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;

export class CEOGodMode {
  private taskId: string = "";
  private totalCost: number = 0;
  private totalTokens: number = 0;
  private cache = new Map<string, any>();

  async executeTask(prompt: string, userId: string): Promise<ExecutionResult> {
    this.taskId = this.generateId();
    this.totalCost = 0;
    this.totalTokens = 0;

    try {
      // Check cache
      const cached = await redis.get(`task:${this.taskId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const subtasks = await this.decompose(prompt);
      const results = [];
      let totalDuration = 0;

      // Parallel execution with concurrency limit (5)
      const concurrencyLimit = 5;
      for (let i = 0; i < subtasks.length; i += concurrencyLimit) {
        const batch = subtasks.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(st => this.executeSubtaskWithRetry(st, userId))
        );

        for (const result of batchResults) {
          results.push(result.data);
          this.totalCost += result.data.cost;
          this.totalTokens += result.data.tokensUsed;
          totalDuration += result.data.duration;

          if (result.error) {
            throw new Error(`Task failed: ${result.error}`);
          }
        }
      }

      const execution: ExecutionResult = {
        taskId: this.taskId,
        status: "completed",
        subtasks,
        results,
        totalCost: Math.round(this.totalCost * 10000) / 10000,
        totalTokens: this.totalTokens,
        totalDuration
      };

      // Cache result for 24h
      await redis.setex(`task:${this.taskId}`, 86400, JSON.stringify(execution));
      await redis.lpush(`tasks:${userId}`, this.taskId);

      return execution;
    } catch (error) {
      const execution: ExecutionResult = {
        taskId: this.taskId,
        status: "failed",
        subtasks: [],
        results: [],
        totalCost: this.totalCost,
        totalTokens: this.totalTokens,
        totalDuration: 0,
        error: String(error)
      };

      await redis.setex(`task:${this.taskId}`, 3600, JSON.stringify(execution));
      return execution;
    }
  }

  private async executeSubtaskWithRetry(
    task: SubTask,
    userId: string
  ): Promise<{ data: any; error?: string }> {
    let retries = 0;

    return pRetry(
      async () => {
        retries++;
        return await this.executeSubtask(task, userId, retries);
      },
      {
        retries: MAX_RETRIES,
        onFailedAttempt: (error) => {
          console.log(`Attempt ${error.attemptNumber} failed. ${MAX_RETRIES - error.attemptNumber} retries left.`);
        }
      }
    ).then(data => ({ data })).catch(error => ({ data: null, error: String(error) }));
  }

  private async executeSubtask(
    task: SubTask,
    userId: string,
    retries: number
  ): Promise<{
    subtask: string;
    agent: string;
    result: string;
    tokensUsed: number;
    cost: number;
    duration: number;
    retries: number;
  }> {
    const startTime = Date.now();
    const command = AGENT_MAPPING[task.agent] || "ocx opencode";
    const timeout = task.timeout || 300000;

    for (const provider of PROVIDER_CASCADE) {
      try {
        const { stdout, stderr } = await execAsync(
          `timeout ${Math.floor(timeout / 1000)} ${command} --prompt "${task.description.replace(/"/g, '\\"')}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );

        const output = stdout || stderr;
        const estimatedTokens = Math.ceil(output.length / 4);
        const cost = (estimatedTokens * TOKEN_COSTS[provider]) / 1000;
        const duration = Date.now() - startTime;

        // Log to Redis for analytics
        await redis.lpush(
          `logs:${userId}`,
          JSON.stringify({
            taskId: this.taskId,
            provider,
            cost,
            tokens: estimatedTokens,
            duration,
            timestamp: new Date().toISOString()
          })
        );

        return {
          subtask: task.description,
          agent: task.agent,
          result: output.slice(0, 10000),
          tokensUsed: estimatedTokens,
          cost,
          duration,
          retries
        };
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        continue;
      }
    }

    throw new Error("All providers exhausted");
  }

  private async decompose(prompt: string): Promise<SubTask[]> {
    const cacheKey = `decompose:${crypto.createHash("md5").update(prompt).digest("hex")}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const decomposePrompt = `Descompón SOLO en JSON:
[{"description": "...", "agent": "opencode|claude|mimo|architect", "priority": 1, "timeout": 300000}, ...]
Tarea: ${prompt}`;

    try {
      const { stdout } = await execAsync(
        `echo '${decomposePrompt.replace(/'/g, "'\\''")}' | timeout 30 ocx opencode --prompt -`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const jsonMatch = stdout.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const subtasks = JSON.parse(jsonMatch[0]);
        await redis.setex(cacheKey, 604800, JSON.stringify(subtasks)); // 7 days
        return subtasks;
      }
    } catch (e) {
      console.error("Decompose error:", e);
    }

    return [{ description: prompt, agent: "claude", priority: 1 }];
  }

  private generateId(): string {
    return `TASK-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  }
}

export const ceoGodMode = new CEOGodMode();
