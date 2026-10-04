import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";

const execAsync = promisify(exec);

interface SubTask {
  description: string;
  agent: "opencode" | "claude" | "mimo" | "architect";
  priority?: number;
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

export class CEO {
  private taskId: string = "";
  private totalCost: number = 0;
  private totalTokens: number = 0;

  async executeTask(prompt: string, userId: string): Promise<ExecutionResult> {
    this.taskId = this.generateId();
    this.totalCost = 0;
    this.totalTokens = 0;

    try {
      const subtasks = await this.decompose(prompt);
      const results = [];
      let totalDuration = 0;

      for (const subtask of subtasks.sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
        const startTime = Date.now();
        const result = await this.executeSubtask(subtask, userId);
        const duration = Date.now() - startTime;

        results.push({
          subtask: subtask.description,
          agent: subtask.agent,
          result: result.output,
          tokensUsed: result.tokens,
          cost: result.cost,
          duration
        });

        this.totalCost += result.cost;
        this.totalTokens += result.tokens;
        totalDuration += duration;

        if (result.error) {
          throw new Error(`${subtask.agent} failed: ${result.error}`);
        }
      }

      return {
        taskId: this.taskId,
        status: "completed",
        subtasks,
        results,
        totalCost: Math.round(this.totalCost * 10000) / 10000,
        totalTokens: this.totalTokens,
        totalDuration
      };
    } catch (error) {
      return {
        taskId: this.taskId,
        status: "failed",
        subtasks: [],
        results: [],
        totalCost: this.totalCost,
        totalTokens: this.totalTokens,
        totalDuration: 0,
        error: String(error)
      };
    }
  }

  private async decompose(prompt: string): Promise<SubTask[]> {
    const decomposePrompt = `Descompón SOLO en JSON válido (sin markdown):
[
  {"description": "subtarea 1", "agent": "opencode|claude|mimo|architect", "priority": 1},
  ...
]
Tarea: ${prompt}`;

    try {
      const { stdout } = await execAsync(
        `echo '${decomposePrompt.replace(/'/g, "'\\''")}' | timeout 30 ocx opencode --prompt -`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const jsonMatch = stdout.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Decompose error:", e);
    }

    return [{ description: prompt, agent: "claude", priority: 1 }];
  }

  private async executeSubtask(
    task: SubTask,
    userId: string
  ): Promise<{ output: string; tokens: number; cost: number; error?: string }> {
    const command = AGENT_MAPPING[task.agent] || "ocx opencode";

    try {
      const { stdout, stderr } = await execAsync(
        `timeout 600 ${command} --prompt "${task.description.replace(/"/g, '\\"')}"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const output = stdout || stderr;
      const estimatedTokens = Math.ceil(output.length / 4);
      const provider = this.inferProvider(task.agent);
      const cost = (estimatedTokens * TOKEN_COSTS[provider]) / 1000;

      return {
        output: output.slice(0, 5000),
        tokens: estimatedTokens,
        cost
      };
    } catch (error) {
      return {
        output: "",
        tokens: 0,
        cost: 0,
        error: String(error)
      };
    }
  }

  private inferProvider(agent: string): string {
    if (agent === "claude") return "anthropic";
    if (agent === "mimo") return "deepseek";
    if (agent === "architect") return "groq";
    return "groq";
  }

  private generateId(): string {
    return `TASK-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }
}

export const ceo = new CEO();
