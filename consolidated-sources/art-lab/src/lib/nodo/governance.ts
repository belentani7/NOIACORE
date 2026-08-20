// NODO — GOVERNANCE: Sistema nervioso transversal
// Atraviesa las 3 capas: security, cost control, permissions, versioning,
// observability, logging, quality, human approval, rollback.

export interface GovernanceConfig {
  securityLevel: "open" | "restricted" | "strict";
  costLimit: number; // máximo coste acumulado por misión
  requireHumanApproval: boolean;
  enableRollback: boolean;
  observability: boolean;
}

export interface LogEntry {
  id: string;
  at: string;
  level: "info" | "warn" | "error" | "audit";
  layer: "orchestration" | "formation" | "execution" | "governance";
  message: string;
  missionId?: string;
  agentId?: string;
}

export interface Version {
  id: string;
  at: string;
  missionId: string;
  tag: string;
  snapshot: string; // JSON serializado del estado
  parent?: string;
}

/**
 * Governance — control transversal del sistema NODO.
 */
export class Governance {
  private logs: LogEntry[] = [];
  private versions: Version[] = [];
  private config: GovernanceConfig;
  private costAccumulator: Map<string, number> = new Map(); // missionId → cost

  constructor(config: Partial<GovernanceConfig> = {}) {
    this.config = {
      securityLevel: "restricted",
      costLimit: 100,
      requireHumanApproval: false,
      enableRollback: true,
      observability: true,
      ...config,
    };
  }

  log(entry: Omit<LogEntry, "id" | "at">): void {
    if (!this.config.observability) return;
    this.logs.push({
      ...entry,
      id: "log-" + Math.random().toString(36).slice(2, 10),
      at: new Date().toISOString(),
    });
    if (this.logs.length > 500) this.logs.shift(); // cap
  }

  getLogs(missionId?: string): LogEntry[] {
    if (missionId) return this.logs.filter((l) => l.missionId === missionId);
    return this.logs;
  }

  /**
   * Versioning: crea un snapshot del estado de una misión.
   */
  createVersion(missionId: string, tag: string, snapshot: unknown): Version {
    const version: Version = {
      id: "ver-" + Math.random().toString(36).slice(2, 10),
      at: new Date().toISOString(),
      missionId,
      tag,
      snapshot: JSON.stringify(snapshot),
      parent: this.versions.findLast((v) => v.missionId === missionId)?.id,
    };
    this.versions.push(version);
    this.log({
      level: "info",
      layer: "governance",
      message: `Versión creada: ${tag} (${version.id})`,
      missionId,
    });
    return version;
  }

  getVersions(missionId: string): Version[] {
    return this.versions.filter((v) => v.missionId === missionId);
  }

  /**
   * Rollback: restaura el estado a una versión anterior.
   */
  rollback(versionId: string): unknown | null {
    if (!this.config.enableRollback) return null;
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return null;
    this.log({
      level: "warn",
      layer: "governance",
      message: `Rollback a versión ${version.tag} (${version.id})`,
      missionId: version.missionId,
    });
    return JSON.parse(version.snapshot);
  }

  /**
   * Cost control: acumula coste y verifica límite.
   */
  addCost(missionId: string, cost: number): boolean {
    const current = this.costAccumulator.get(missionId) ?? 0;
    const next = current + cost;
    if (next > this.config.costLimit) {
      this.log({
        level: "error",
        layer: "governance",
        message: `Límite de coste superado: ${next} > ${this.config.costLimit}`,
        missionId,
      });
      return false;
    }
    this.costAccumulator.set(missionId, next);
    return true;
  }

  getCost(missionId: string): number {
    return this.costAccumulator.get(missionId) ?? 0;
  }

  /**
   * Permissions: verifica si un agente puede ejecutar una acción.
   */
  checkPermission(agentRole: string, action: string): boolean {
    if (this.config.securityLevel === "open") return true;
    if (this.config.securityLevel === "restricted") {
      // Acciones destructivas requieren aprobación
      const destructive = ["delete", "deploy", "rollback", "overwrite"];
      if (destructive.includes(action) && this.config.requireHumanApproval) {
        return false;
      }
      return true;
    }
    // strict: solo lectura + acciones seguras
    const safe = ["read", "analyze", "report", "test"];
    return safe.includes(action);
  }

  getConfig(): GovernanceConfig {
    return { ...this.config };
  }
}
