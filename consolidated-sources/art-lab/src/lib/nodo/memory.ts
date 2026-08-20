// NODO — Estructura universal de memoria
// 18 secciones que persisten el conocimiento acumulativo del sistema.
// No almacenar solo respuestas: qué se intentó, qué funcionó, qué falló, por qué, cómo se solucionó.

export interface NodoMemoryStore {
  identity: MemoryEntry[];        // 01 — Identidad del sistema
  objectives: MemoryEntry[];      // 02 — Objetivos históricos
  projects: MemoryEntry[];        // 03 — Proyectos completados
  knowledge: MemoryEntry[];       // 04 — Conocimiento general
  agents: MemoryEntry[];          // 05 — Perfiles de agentes
  skills: MemoryEntry[];          // 06 — Skills catalogadas
  tools: MemoryEntry[];           // 07 — Herramientas disponibles
  procedures: MemoryEntry[];      // 08 — Procedimientos probados
  experiments: MemoryEntry[];     // 09 — Experimentos
  failures: MemoryEntry[];        // 10 — Fallos documentados
  solutions: MemoryEntry[];       // 11 — Soluciones encontradas
  tests: MemoryEntry[];           // 12 — Tests y casos de prueba
  metrics: MemoryEntry[];         // 13 — Métricas históricas
  decisions: MemoryEntry[];       // 14 — Decisiones tomadas
  assets: MemoryEntry[];          // 15 — Assets reutilizables
  versions: MemoryEntry[];        // 16 — Versiones
  lessons: MemoryEntry[];         // 17 — Lecciones aprendidas
  certifications: MemoryEntry[];  // 18 — Certificaciones
}

export interface MemoryEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  missionId?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export const MEMORY_SECTIONS: { key: keyof NodoMemoryStore; num: string; label: string; description: string }[] = [
  { key: "identity", num: "01", label: "Identity", description: "Identidad del sistema NODO" },
  { key: "objectives", num: "02", label: "Objectives", description: "Objetivos históricos" },
  { key: "projects", num: "03", label: "Projects", description: "Proyectos completados" },
  { key: "knowledge", num: "04", label: "Knowledge", description: "Conocimiento general" },
  { key: "agents", num: "05", label: "Agents", description: "Perfiles de agentes" },
  { key: "skills", num: "06", label: "Skills", description: "Skills catalogadas" },
  { key: "tools", num: "07", label: "Tools", description: "Herramientas" },
  { key: "procedures", num: "08", label: "Procedures", description: "Procedimientos probados" },
  { key: "experiments", num: "09", label: "Experiments", description: "Experimentos" },
  { key: "failures", num: "10", label: "Failures", description: "Fallos documentados" },
  { key: "solutions", num: "11", label: "Solutions", description: "Soluciones" },
  { key: "tests", num: "12", label: "Tests", description: "Tests" },
  { key: "metrics", num: "13", label: "Metrics", description: "Métricas" },
  { key: "decisions", num: "14", label: "Decisions", description: "Decisiones" },
  { key: "assets", num: "15", label: "Assets", description: "Assets" },
  { key: "versions", num: "16", label: "Versions", description: "Versiones" },
  { key: "lessons", num: "17", label: "Lessons", description: "Lecciones" },
  { key: "certifications", num: "18", label: "Certifications", description: "Certificaciones" },
];

/**
 * NodoMemory — almacén acumulativo de conocimiento.
 * Convive en memoria del cliente (Zustand persist) para el demo.
 */
export class NodoMemory {
  private store: NodoMemoryStore;

  constructor() {
    this.store = this.emptyStore();
    this.seed();
  }

  private emptyStore(): NodoMemoryStore {
    const empty = {} as NodoMemoryStore;
    for (const section of MEMORY_SECTIONS) {
      empty[section.key] = [];
    }
    return empty;
  }

  private seed(): void {
    // Seed inicial con conocimiento base
    this.add("identity", {
      title: "NODO v1.0",
      body: "Sistema maestro de orquestación de agentes. 3 capas: orquestación, formación, ejecución + governance transversal.",
      tags: ["core", "system"],
    });
    this.add("agents", {
      title: "10 roles de agentes",
      body: "architect, researcher, builder, coder, designer, analyst, tester, auditor, optimizer, master. Cada uno con skills, procedures, score y certificación.",
      tags: ["agents", "roles"],
    });
    this.add("procedures", {
      title: "Protocolo NODO impecable",
      body: "DEFINE → DECOMPOSE → DELEGATE → EXECUTE → ATTACK → VERIFY → REPAIR → REPEAT → CERTIFY → REMEMBER",
      tags: ["protocol", "workflow"],
    });
    this.add("lessons", {
      title: "Regla de oro de memoria",
      body: "No almacenar solo respuestas. Almacenar qué se intentó, qué funcionó, qué falló, por qué, qué herramienta se usó, cuánto costó, cómo se solucionó, qué patrón es reutilizable.",
      tags: ["memory", "principle"],
    });
    this.add("decisions", {
      title: "Verificación independiente obligatoria",
      body: "Ningún resultado pasa a producción sin verificación independiente. Builder construye, Critic ataca, Fixer corrige, Auditor decide PASS/FAIL/REWORK/ESCALATE.",
      tags: ["governance", "quality"],
    });
  }

  add(section: keyof NodoMemoryStore, entry: Omit<MemoryEntry, "id" | "createdAt">): MemoryEntry {
    const full: MemoryEntry = {
      ...entry,
      id: "mem-" + Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
    };
    this.store[section].unshift(full);
    // Cap de 100 por sección
    if (this.store[section].length > 100) this.store[section].pop();
    return full;
  }

  get(section: keyof NodoMemoryStore): MemoryEntry[] {
    return this.store[section];
  }

  getAll(): NodoMemoryStore {
    return this.store;
  }

  search(query: string): MemoryEntry[] {
    const q = query.toLowerCase();
    const results: MemoryEntry[] = [];
    for (const section of MEMORY_SECTIONS) {
      for (const entry of this.store[section.key]) {
        if (
          entry.title.toLowerCase().includes(q) ||
          entry.body.toLowerCase().includes(q) ||
          entry.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          results.push(entry);
        }
      }
    }
    return results;
  }

  stats(): { totalEntries: number; sectionCounts: Record<string, number> } {
    const sectionCounts: Record<string, number> = {};
    let total = 0;
    for (const section of MEMORY_SECTIONS) {
      const count = this.store[section.key].length;
      sectionCounts[section.num + " " + section.label] = count;
      total += count;
    }
    return { totalEntries: total, sectionCounts };
  }
}
