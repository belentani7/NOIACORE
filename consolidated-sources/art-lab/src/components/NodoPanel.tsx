"use client";

import { useState } from "react";
import { useNodo } from "@/hooks/use-nodo";
import type { NodoRunResult } from "@/lib/nodo/core";
import { AGENT_DEFS, agentScoreValue, type AgentIdentity } from "@/lib/nodo/agents";
import { MEMORY_SECTIONS } from "@/lib/nodo/memory";
import type { AuditVerdict } from "@/lib/nodo/executor";
import {
  Cpu,
  Play,
  Bot,
  Shield,
  Database,
  GitBranch,
  Award,
  Activity,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VERDICT_CONFIG: Record<AuditVerdict, { icon: LucideIcon; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: "oklch(0.85 0.035 250)", label: "PASS" },
  fail: { icon: XCircle, color: "oklch(0.50 0.03 255)", label: "FAIL" },
  rework: { icon: AlertCircle, color: "oklch(0.78 0.025 250)", label: "REWORK" },
  escalate: { icon: AlertCircle, color: "oklch(0.50 0.045 255)", label: "ESCALATE" },
};

const PRESET_OBJECTIVES = [
  "Diseñar y construir una API REST para gestión de obras",
  "Investigar algoritmos de generación procedural de arte",
  "Optimizar el rendimiento del motor WebGL",
  "Construir un sistema de test para los shaders GLSL",
  "Diseñar la UI/UX del panel de control del laboratorio",
];

export function NodoPanel() {
  const { result, running, history, agents, memoryStats, logs, run } = useNodo();
  const [objective, setObjective] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["agents"]));
  const [activeTab, setActiveTab] = useState<"mission" | "agents" | "memory" | "logs">("mission");

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRun = () => {
    if (!objective.trim() || running) return;
    void run({ objective: objective.trim() });
  };

  return (
    <section id="nodo" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.85_0.035_250)]">
            <Cpu className="h-3 w-3" />
            sistema maestro · 3 capas + governance
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
            NODO{" "}
            <span className="text-grad-light">orquestación inteligente</span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Un sistema donde cada agente tiene función, evidencia de competencia,
            memoria, evaluación y límites. Misión → Plan → Agentes → Ejecución →
            Crítica → Corrección → Validación → Memoria.
          </p>
        </div>

        {/* Diagrama de capas */}
        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          {[
            { num: "01", title: "Orquestación", desc: "Entiende, clasifica, decide", icon: Cpu, tone: "oklch(0.92 0.02 250)" },
            { num: "02", title: "Formación", desc: "10 agentes con scoring", icon: Bot, tone: "oklch(0.85 0.035 250)" },
            { num: "03", title: "Ejecución", desc: "Build → Critic → Audit", icon: Play, tone: "oklch(0.78 0.025 250)" },
            { num: "∞", title: "Governance", desc: "Transversal: logging, versioning", icon: Shield, tone: "oklch(0.50 0.045 255)" },
          ].map((layer) => (
            <div
              key={layer.num}
              className="relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 card-lift"
            >
              <div
                className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-2xl"
                style={{ background: layer.tone }}
              />
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold" style={{ color: layer.tone }}>
                  {layer.num}
                </span>
                <layer.icon className="h-4 w-4" style={{ color: layer.tone }} />
              </div>
              <h3 className="mt-2 text-sm font-semibold">{layer.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{layer.desc}</p>
            </div>
          ))}
        </div>

        {/* Confirmación de tres nodos */}
        {result && (
          <div className="mb-6 rounded-2xl border border-border/70 bg-card/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">confirmación N3</div>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-base font-bold">Consenso independiente por capas</h3>
              </div>
              <div className={cn(
                "rounded-md px-3 py-1.5 font-mono text-xs font-bold",
                result.execution.confirmation.status === "confirmed"
                  ? "bg-[oklch(0.85_0.035_250)]/15 text-[oklch(0.85_0.035_250)]"
                  : "bg-[oklch(0.50_0.03_255)]/15 text-[oklch(0.78_0.025_250)]"
              )}>
                {result.execution.confirmation.status === "confirmed" ? "CONFIRMADO" : "RECHAZADO"}
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {result.execution.confirmation.nodes.map((node) => (
                <div key={node.nodeId} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{node.nodeId} · {node.layer}</span>
                    {node.accepted ? <CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.85_0.035_250)]" /> : <XCircle className="h-3.5 w-3.5 text-[oklch(0.50_0.03_255)]" />}
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-sm font-semibold">{node.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{node.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] text-muted-foreground">
              <span>quórum {result.execution.confirmation.quorum}/3 · mínimo 2</span>
              <span>media {result.execution.confirmation.averageScore}/100</span>
              <span>huella {result.execution.confirmation.fingerprint}</span>
            </div>
          </div>
        )}

        {/* Input de misión */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card/50 p-5">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-[oklch(0.85_0.035_250)]" />
            <h3 className="font-[family-name:var(--font-display)] text-base font-bold">
              Ejecutar misión
            </h3>
          </div>
          <div className="mt-4 flex gap-3">
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value.slice(0, 200))}
              onKeyDown={(e) => e.key === "Enter" && handleRun()}
              placeholder="Describe el objetivo de la misión…"
              className="flex-1 rounded-lg border border-border/60 bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.85_0.035_250)]/60"
              disabled={running}
            />
            <button
              onClick={handleRun}
              disabled={!objective.trim() || running}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                running || !objective.trim()
                  ? "cursor-not-allowed bg-secondary text-muted-foreground"
                  : "bg-[oklch(0.92_0.02_250)] text-background hover:bg-[oklch(0.85_0.035_250)]"
              )}
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ejecutando…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Ejecutar
                </>
              )}
            </button>
          </div>
          {/* Presets */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESET_OBJECTIVES.map((preset) => (
              <button
                key={preset}
                onClick={() => setObjective(preset)}
                disabled={running}
                className="rounded-md border border-border/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-[oklch(0.85_0.035_250)]/40 hover:text-foreground"
              >
                {preset.slice(0, 40)}…
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-1">
          {[
            { key: "mission" as const, label: "Misión", icon: Play },
            { key: "agents" as const, label: "Agentes", icon: Bot },
            { key: "memory" as const, label: "Memoria", icon: Database },
            { key: "logs" as const, label: "Logs", icon: Activity },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors",
                activeTab === tab.key
                  ? "bg-[oklch(0.85_0.035_250)]/15 text-[oklch(0.85_0.035_250)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[300px]">
          {activeTab === "mission" && (
            <MissionTab result={result} running={running} history={history} />
          )}
          {activeTab === "agents" && (
            <AgentsTab agents={agents} expanded={expandedSections} toggle={toggleSection} />
          )}
          {activeTab === "memory" && <MemoryTab stats={memoryStats} />}
          {activeTab === "logs" && <LogsTab logs={logs} />}
        </div>
      </div>
    </section>
  );
}

// === Sub-componentes ===

function MissionTab({
  result,
  running,
  history,
}: {
  result: NodoRunResult | null;
  running: boolean;
  history: NodoRunResult[];
}) {
  if (running) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.85_0.035_250)]" />
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Pipeline: EXECUTE → CRITIC → AUDIT…
        </p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <Play className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          Sin misiones ejecutadas. Escribe un objetivo y pulsa Ejecutar.
        </p>
      </div>
    );
  }
  const verdictCfg = VERDICT_CONFIG[result.execution.auditVerdict];
  return (
    <div className="space-y-4">
      {/* Result card */}
      <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {result.mission.id} · prioridad {result.mission.priority}
            </div>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold">
              {result.mission.objective}
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: `${verdictCfg.color}15` }}>
            <verdictCfg.icon aria-hidden="true" className="h-4 w-4" style={{ color: verdictCfg.color }} />
            <span className="font-mono text-xs font-bold" style={{ color: verdictCfg.color }}>
              {verdictCfg.label}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{result.execution.auditNotes}</p>

        {/* Subtareas */}
        <div className="mt-4 space-y-1.5">
          {result.execution.subtaskResults.map((st) => (
            <div key={st.subtaskId} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="font-mono text-[10px] text-muted-foreground">{st.subtaskId}</span>
              <span className="flex-1 text-sm">{st.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">@{st.agent}</span>
              <span className="font-mono text-[10px]" style={{ color: st.status === "done" ? "oklch(0.85 0.035 250)" : "oklch(0.50 0.03 255)" }}>
                Q{st.qualityScore}
              </span>
              {st.status === "done" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.85_0.035_250)]" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-[oklch(0.50_0.03_255)]" />
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-2 font-mono text-[10px]">
          <Stat label="iteraciones" value={String(result.execution.iterations)} />
          <Stat label="tiempo" value={`${(result.execution.totalTimeMs / 1000).toFixed(1)}s`} />
          <Stat label="coste" value={String(result.execution.memory.cost)} />
          <Stat label="memoria" value={String(result.memoryStats.totalEntries)} />
        </div>
      </div>

      {/* Historial */}
      {history.length > 1 && (
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            historial de misiones
          </h4>
          <div className="mt-2 space-y-1">
            {history.slice(0, 5).map((h) => {
              const vc = VERDICT_CONFIG[h.execution.auditVerdict];
              return (
                <div key={h.mission.id} className="flex items-center gap-2 rounded-md border border-border/30 px-3 py-1.5 font-mono text-[10px]">
                  <vc.icon className="h-3 w-3" style={{ color: vc.color }} />
                  <span className="flex-1 truncate text-foreground/80">{h.mission.objective}</span>
                  <span style={{ color: vc.color }}>{vc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

function AgentsTab({
  agents,
  expanded,
  toggle,
}: {
  agents: AgentIdentity[];
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const allRoles = Object.keys(AGENT_DEFS) as AgentIdentity["role"][];
  return (
    <div className="space-y-2">
      {allRoles.map((role) => {
        const def = AGENT_DEFS[role];
        const agent = agents.find((a) => a.role === role);
        const score = agent ? agentScoreValue(agent) : null;
        const cert = agent?.certification ?? "none";
        const id = "agent-" + role;
        const isOpen = expanded.has(id);
        return (
          <div key={role} className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
            <button
              onClick={() => toggle(id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/60">
                <Bot className="h-4 w-4 text-[oklch(0.85_0.035_250)]" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{def.name}</div>
                <div className="text-[10px] text-muted-foreground">{def.description}</div>
              </div>
              {agent && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold" style={{ color: score && score >= 75 ? "oklch(0.85 0.035 250)" : "oklch(0.62 0.02 250)" }}>
                      {score}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground">score</div>
                  </div>
                  <CertBadge cert={cert} />
                </div>
              )}
            </button>
            {isOpen && (
              <div className="border-t border-border/40 p-4">
                {agent ? (
                  <div className="space-y-3">
                    {/* Scores */}
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(agent.score).map(([key, val]) => (
                        <div key={key} className="rounded-md border border-border/30 bg-background/40 px-2 py-1.5">
                          <div className="font-mono text-[9px] text-muted-foreground">{key}</div>
                          <div className="font-mono text-xs text-foreground">{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Skills */}
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">skills</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {agent.skills.map((s) => (
                          <span key={s} className="rounded-md border border-border/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Agente no activado todavía. Ejecuta una misión que requiera este rol.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CertBadge({ cert }: { cert: AgentIdentity["certification"] }) {
  const cfg = {
    none: { color: "oklch(0.50 0.02 250)", label: "—" },
    provisional: { color: "oklch(0.78 0.025 250)", label: "PROV" },
    certified: { color: "oklch(0.85 0.035 250)", label: "CERT" },
    master: { color: "oklch(0.92 0.02 250)", label: "MASTER" },
  }[cert];
  return (
    <span className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ background: `${cfg.color}15`, color: cfg.color }}>
      <Award className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function MemoryTab({ stats }: { stats: { totalEntries: number; sectionCounts: Record<string, number> } }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-4 w-4 text-[oklch(0.85_0.035_250)]" />
        <span className="font-mono text-sm">{stats.totalEntries} entradas totales</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {MEMORY_SECTIONS.map((section) => {
          const count = stats.sectionCounts[section.num + " " + section.label] ?? 0;
          return (
            <div key={section.key} className="rounded-lg border border-border/40 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">{section.num}</span>
                <GitBranch className="h-3 w-3 text-muted-foreground/40" />
              </div>
              <div className="mt-1 text-sm font-semibold">{section.label}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{section.description}</div>
              <div className="mt-2 font-mono text-xs" style={{ color: count > 0 ? "oklch(0.85 0.035 250)" : "oklch(0.50 0.02 250)" }}>
                {count} entradas
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: { id: string; at: string; level: string; layer: string; message: string; missionId?: string }[] }) {
  if (logs.length === 0) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <Activity className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Sin logs todavía.</p>
      </div>
    );
  }
  const levelColor: Record<string, string> = {
    info: "oklch(0.62 0.02 250)",
    warn: "oklch(0.78 0.025 250)",
    error: "oklch(0.50 0.03 255)",
    audit: "oklch(0.85 0.035 250)",
  };
  return (
    <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border/60 bg-[oklch(0.04_0.005_255)] p-4">
      <div className="space-y-1 font-mono text-[11px]">
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="shrink-0 text-muted-foreground/50">
              {new Date(log.at).toLocaleTimeString("es-ES", { hour12: false })}
            </span>
            <span className="shrink-0 rounded px-1 font-bold" style={{ color: levelColor[log.level] ?? "oklch(0.62 0.02 250)" }}>
              {log.level.toUpperCase()}
            </span>
            <span className="shrink-0 text-muted-foreground/60">[{log.layer}]</span>
            <span className="text-foreground/80">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
