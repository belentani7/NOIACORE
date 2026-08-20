// Fábrica Creativa Eterna — Núcleo del Orquestador Autónomo
// Sistema multi-agente con memoria persistente que produce visual infinito.
// Nunca duerme, nunca olvida, mantiene coherencia narrativa.

import { ncRng } from "@/lib/nodo/generators";
import type { ShaderId } from "@/lib/shaders";

// === Tipos del universo ===

export type AssetType = "skin" | "set" | "skill_vfx" | "animation" | "concept" | "moodboard";

export interface ProducerAgent {
  id: number;
  name: string;
  role: string;
  specialty: AssetType;
  skill: number; // 0..100
}

export interface CreativeBrief {
  id: string;
  season: string;
  concept: string;
  narrative: string;
  trend: string;
  aestheticTags: string[];
  createdAt: string;
}

export interface ProducedAsset {
  id: string;
  briefId: string;
  type: AssetType;
  title: string;
  producerId: number;
  producerName: string;
  shader: ShaderId;
  hue: number;
  complexity: number;
  intensity: number;
  narrative: string;
  tags: string[];
  season: string;
  loreNode: string;
  version: number;
  status: "active" | "legacy" | "archived";
  qualityScore: number;
  createdAt: string;
  relations: string[]; // IDs de assets relacionados
}

export interface Season {
  id: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  assetCount: number;
}

// === Los 20 productores virtuales ===

export const PRODUCERS: ProducerAgent[] = [
  { id: 1, name: "Aria-Concept", role: "Concept Artist", specialty: "concept", skill: 87 },
  { id: 2, name: "Vex-Concept", role: "Concept Artist", specialty: "moodboard", skill: 82 },
  { id: 3, name: "Lumen-Concept", role: "Concept Artist", specialty: "concept", skill: 90 },
  { id: 4, name: "Gael-3D", role: "Modelador 3D", specialty: "set", skill: 85 },
  { id: 5, name: "Nyx-3D", role: "Modelador 3D", specialty: "set", skill: 88 },
  { id: 6, name: "Oston-3D", role: "Modelador 3D", specialty: "set", skill: 83 },
  { id: 7, name: "Mira-Anim", role: "Animadora", specialty: "animation", skill: 89 },
  { id: 8, name: "Drift-Anim", role: "Animador", specialty: "animation", skill: 84 },
  { id: 9, name: "Sera-Anim", role: "Animadora", specialty: "animation", skill: 86 },
  { id: 10, name: "Iris-Skin", role: "Diseñadora de Skins", specialty: "skin", skill: 92 },
  { id: 11, name: "Kael-Skin", role: "Diseñador de Skins", specialty: "skin", skill: 85 },
  { id: 12, name: "Nova-Skin", role: "Diseñadora de Skins", specialty: "skin", skill: 88 },
  { id: 13, name: "Pulse-VFX", role: "Diseñador de Skills/VFX", specialty: "skill_vfx", skill: 87 },
  { id: 14, name: "Echo-VFX", role: "Diseñadora de Skills/VFX", specialty: "skill_vfx", skill: 84 },
  { id: 15, name: "Rift-VFX", role: "Diseñador de Skills/VFX", specialty: "skill_vfx", skill: 86 },
  { id: 16, name: "Sven-ArtDir", role: "Director de Arte", specialty: "concept", skill: 94 },
  { id: 17, name: "Aria-ArtDir", role: "Directora de Arte", specialty: "moodboard", skill: 93 },
  { id: 18, name: "Ostinato-Trend", role: "Investigador de Tendencias", specialty: "moodboard", skill: 81 },
  { id: 19, name: "Verso-Narrative", role: "Narratólogo", specialty: "concept", skill: 90 },
  { id: 20, name: "Archon-Curator", role: "Curador/Archivista", specialty: "concept", skill: 88 },
];

// === Módulos del orquestador ===

const CONCEPTS_A = [
  "Samurai", "Emperatriz", "Vidente", "Cazador", "Oráculo", "Guardián", "Nómada",
  "Espectro", "Arquitecto", "Rebelde", "Sacerdotisa", "Eco", "Vértice", "Umbral",
  "Meridiano", "Véspero", "Limen", "Quimera", "Abismo", "Cielo",
];

const CONCEPTS_B = [
  "de Neón", "Glitch", "Cromado", "Boreal", "Líquido", "Estelar", "Profundo",
  "Silente", "Invertido", "Puro", "Fractal", "Oculto", "Roto", "Magnético",
  "Lento", "Sin Nombre", "Espectral", "Eterno", "Carmesí", "Cobalto",
];

const SETS = [
  "Trono de Hologramas", "Jardín Zen de Pantallas", "Catedral de Datos",
  "Ruinas Digitales", "Mercado Neón", "Santuario Subacuático",
  "Observatorio Estelar", "Cámara de Ecos", "Pasillo Infinito",
  "Arena de Sombras", "Biblioteca de Luz", "Cripta de Cristal",
];

const SKILLS = [
  "Corte de Katana Láser", "Pulso de Vacío", "Onda de Resonancia",
  "Lágrima de Éter", "Fisura Temporal", "Descarga Iónica",
  "Velo Espectral", "Llamada Profunda", "Fragmento de Luz",
];

const ANIMATIONS = [
  "Ceremonia de Coronación", "Meditación en Vacío", "Caída Libre Eterna",
  "Danza de Partículas", "Despertar de Profundidades", "Viaje Vertical",
  "Respiración Cósmica", "Eco Visual", "Plegaria Digital",
];

const TRENDS = [
  "retro-futurismo cromado", "minimalismo cósmico", "brutalismo digital",
  "estética vapor fría", "sintwave nocturno", "arte generativo orgánico",
  "neon feudalism", "silencio espectral", "arquitectura sagrada digital",
  "grano cinematográfico azul", "vacío como lujo", "anti-saturación",
];

const LORE_NODES = [
  "Facción del Vacío", "Orden del Espejo", "Linaje Espectral",
  "Concilio de Neón", "Guardianes del Umbral", "Nómadas del Éter",
  "Arquitectos Silentes", "Eco del Origen", "Vértice Carmesí",
  "Meridiano Azul",
];

const SEASONS = [
  { name: "Neon Feudalism", theme: "Cyberpunk samurái en catedrales de datos" },
  { name: "Spectral Silence", theme: "Vacío azul como lujo, minimalismo cósmico" },
  { name: "Chrome Renaissance", theme: "Renacimiento cromado en ruinas digitales" },
  { name: "Ethereal Depths", theme: "Profundidades oceánicas del inconsciente digital" },
  { name: "Sacred Geometry", theme: "Geometría sagrada en campos etéreos" },
];

const SHADER_IDS: ShaderId[] = [
  "silk", "plasma", "gridwarp", "noiseflow", "vortex",
  "aurora", "kaleidoscope", "liquidmetal", "cosmos",
];

let assetCounter = 0;
let seasonCounter = 0;
let currentSeasonIdx = 0;

/**
 * Orquestador Autónomo — el cerebro que coordina todo.
 * Loop: INPUT → BRIEF → PRODUCCIÓN → QC → ARCHIVO → PUBLICACIÓN
 */
export class AutonomousFactory {
  private assets: ProducedAsset[] = [];
  private briefs: CreativeBrief[] = [];
  private seasons: Season[] = [];
  private archive: ProducedAsset[] = [];
  private totalProduced = 0;

  /**
   * INPUT CONTEXTUAL — leer tendencias + consultar lore acumulado.
   */
  readContext(): { trend: string; loreGap: string; season: Season } {
    const R = ncRng("context-" + Date.now());
    const trend = TRENDS[Math.floor(R() * TRENDS.length)];
    const loreNode = LORE_NODES[Math.floor(R() * LORE_NODES.length)];
    const season = this.getCurrentSeason();
    return { trend, loreGap: loreNode, season };
  }

  /**
   * GENERACIÓN DE BRIEF — el narratólogo propone, el investigador valida.
   */
  generateBrief(): CreativeBrief {
    const ctx = this.readContext();
    const R = ncRng("brief-" + Date.now());
    const conceptA = CONCEPTS_A[Math.floor(R() * CONCEPTS_A.length)];
    const conceptB = CONCEPTS_B[Math.floor(R() * CONCEPTS_B.length)];

    return {
      id: "brief-" + Date.now().toString(36),
      season: ctx.season.name,
      concept: `${conceptA} ${conceptB}`,
      narrative: `En la temporada "${ctx.season.name}", inspirado por ${ctx.trend}. ` +
        `Una pieza del nodo "${ctx.loreGap}" que expande el universo acumulado.`,
      trend: ctx.trend,
      aestheticTags: [ctx.trend, ctx.season.theme.split(" ")[0].toLowerCase(), "noiacore"],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * PRODUCCIÓN PARALELA — los agentes trabajan en paralelo.
   * Cada pieza tiene: ID único, metadata, tags, versión.
   */
  produce(brief: CreativeBrief, producer: ProducerAgent): ProducedAsset {
    const R = ncRng(brief.id + ":" + producer.id);
    const shader = SHADER_IDS[Math.floor(R() * SHADER_IDS.length)];
    const hue = Math.floor(R() * 360) / 360;
    const complexity = 0.3 + R() * 0.5;
    const intensity = 0.25 + R() * 0.45;

    let title: string;
    let narrative: string;
    switch (producer.specialty) {
      case "skin":
        title = `${brief.concept}`;
        narrative = `Skin creada por ${producer.name}. ${brief.narrative}`;
        break;
      case "set":
        title = SETS[Math.floor(R() * SETS.length)];
        narrative = `Set 3D: ${title}. Entorno de la temporada ${brief.season}.`;
        break;
      case "skill_vfx":
        title = SKILLS[Math.floor(R() * SKILLS.length)];
        narrative = `Efecto VFX: ${title}. Loop de 3s con shader ${shader}.`;
        break;
      case "animation":
        title = ANIMATIONS[Math.floor(R() * ANIMATIONS.length)];
        narrative = `Animación: ${title}. Loop cinemático de la temporada ${brief.season}.`;
        break;
      case "concept":
        title = `Concept: ${brief.concept}`;
        narrative = `Concept art generado por ${producer.name}. ${brief.narrative}`;
        break;
      default:
        title = brief.concept;
        narrative = brief.narrative;
    }

    assetCounter++;
    this.totalProduced++;

    // Relaciones narrativas: conectar con assets recientes del mismo lore node
    const recentSameLore = this.assets
      .filter((a) => brief.narrative.includes(a.loreNode))
      .slice(-3)
      .map((a) => a.id);

    return {
      id: `asset-${Date.now().toString(36)}-${assetCounter}`,
      briefId: brief.id,
      type: producer.specialty,
      title,
      producerId: producer.id,
      producerName: producer.name,
      shader,
      hue,
      complexity,
      intensity,
      narrative,
      tags: brief.aestheticTags,
      season: brief.season,
      loreNode: brief.narrative.includes("Facción") ? "Facción del Vacío" :
                brief.narrative.includes("Orden") ? "Orden del Espejo" :
                LORE_NODES[Math.floor(R() * LORE_NODES.length)],
      version: 1,
      status: "active",
      qualityScore: Math.min(100, producer.skill - Math.floor(R() * 15) + 10),
      createdAt: new Date().toISOString(),
      relations: recentSameLore,
    };
  }

  /**
   * CONTROL DE CALIDAD — verificar coherencia, duplicados, calidad técnica.
   */
  qualityControl(asset: ProducedAsset): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    // Duplicado: mismo título en últimos 50
    const recent = this.assets.slice(-50);
    if (recent.some((a) => a.title === asset.title)) {
      issues.push("duplicado-titulo");
    }
    // Calidad técnica mínima
    if (asset.qualityScore < 50) {
      issues.push("calidad-baja");
    }
    // Coherencia estética: shader dentro de la paleta
    if (!SHADER_IDS.includes(asset.shader)) {
      issues.push("shader-fuera-paleta");
    }
    return { passed: issues.length === 0, issues };
  }

  /**
   * PUBLICACIÓN + ACUMULACIÓN — nunca se borra, solo se versiona o archiva.
   */
  publish(asset: ProducedAsset): void {
    this.assets.unshift(asset);
    if (this.assets.length > 200) {
      // Mover el más viejo al archivo (nunca se borra)
      const oldest = this.assets.pop();
      if (oldest) {
        oldest.status = "legacy";
        this.archive.push(oldest);
      }
    }
  }

  /**
   * NARRATIVA PERSISTENTE — árbol de lore + temporadas + arquetipos.
   */
  getCurrentSeason(): Season {
    if (this.seasons.length === 0 || this.assets.length > 0 && this.assets.length % 20 === 0) {
      const s = SEASONS[currentSeasonIdx % SEASONS.length];
      const season: Season = {
        id: `season-${String(++seasonCounter).padStart(3, "0")}`,
        name: s.name,
        theme: s.theme,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        assetCount: 0,
      };
      this.seasons.push(season);
      currentSeasonIdx++;
    }
    return this.seasons[this.seasons.length - 1];
  }

  getAssets(): ProducedAsset[] {
    return this.assets;
  }

  getArchive(): ProducedAsset[] {
    return this.archive;
  }

  getSeasons(): Season[] {
    return this.seasons;
  }

  getStats(): {
    totalProduced: number;
    activeAssets: number;
    archivedAssets: number;
    seasons: number;
    producersActive: number;
  } {
    return {
      totalProduced: this.totalProduced,
      activeAssets: this.assets.length,
      archivedAssets: this.archive.length,
      seasons: this.seasons.length,
      producersActive: PRODUCERS.length,
    };
  }

  /**
   * CICLO COMPLETO — un tick del loop infinito.
   * Genera un brief, selecciona productores, produce, valida, publica.
   */
  tick(): { brief: CreativeBrief; assets: ProducedAsset[]; qcResults: { passed: boolean; issues: string[] }[] } {
    const brief = this.generateBrief();
    // Seleccionar 1-3 productores según el brief
    const R = ncRng(brief.id);
    const producerCount = 1 + Math.floor(R() * 3);
    const shuffled = [...PRODUCERS].sort(() => ncRng(brief.id + Math.random())() - 0.5);
    const selected = shuffled.slice(0, producerCount);

    const assets: ProducedAsset[] = [];
    const qcResults: { passed: boolean; issues: string[] }[] = [];

    for (const producer of selected) {
      const asset = this.produce(brief, producer);
      const qc = this.qualityControl(asset);
      qcResults.push(qc);
      if (qc.passed) {
        this.publish(asset);
        assets.push(asset);
      }
    }

    return { brief, assets, qcResults };
  }
}

// Singleton
let factory: AutonomousFactory | null = null;
export function getFactory(): AutonomousFactory {
  if (!factory) factory = new AutonomousFactory();
  return factory;
}
