// Fábrica Creativa Eterna — Motor de Tendencias en Tiempo Real (simulado)
// Basado en la especificación técnica: 15+ plataformas de scraping,
// análisis de clusters, detección de anomalías, predicción, scoring y briefs.
// En este entorno no hay red → simulación determinista con PRNG.

import { ncRng } from "@/lib/nodo/generators";

export interface TrendData {
  id: string;
  name: string;
  source: string;
  score: number; // 0..100
  description: string;
  category: "visual" | "narrative" | "cultural" | "technical";
  isEmerging: boolean;
  predictedGrowth: number; // -100..100
}

export interface TrendReport {
  cycleId: string;
  timestamp: string;
  dataPoints: number;
  trends: TrendData[];
  topTrend: TrendData | null;
  visualAnalysis: { dominantColor: string; mood: string; saturation: number };
  narrativeAnalysis: { dominantTheme: string; sentimentScore: number };
  briefsGenerated: number;
}

const SOURCES = [
  "twitter", "tiktok", "instagram", "reddit", "pinterest",
  "behance", "artstation", "deviantart", "dribbble", "youtube",
  "twitch", "discord", "google_trends", "steam", "itch_io",
];

const TREND_NAMES = [
  "retro-futurismo cromado", "minimalismo cósmico", "brutalismo digital",
  "estética vapor fría", "sintwave nocturno", "arte generativo orgánico",
  "neon feudalism", "silencio espectral", "arquitectura sagrada digital",
  "grano cinematográfico azul", "vacío como lujo", "anti-saturación",
  "hologramas rotos", "agua negra reflectante", "geometría sagrada fría",
  "partículas escasas", "luz vertical direccional", "espejos infinitos",
  "profundidades oceánicas digitales", "abismo cromado",
];

const MOODS = [
  "contemplativo", "monumental", "silencioso", "profundo",
  "etéreo", "cinematográfico", "sagrado", "inevitable",
];

const THEMES = [
  "soledad en el vacío", "arquitectura del silencio", "reflejos impossíveis",
  "la luz como verdad", "el vacío como lujo", "espectros de memoria",
  "geometría del origen", "ecos de la primera luz",
];

const COLORS = [
  "#0A1628", "#0F1C2E", "#15233A", "#1A2A40",
  "#E8F0FF", "#F5F8FF", "#F0F4FF",
];

/**
 * TrendDetectionEngine — motor de detección de tendencias simulado.
 * Escanea 15+ plataformas, extrae features, detecta anomalías, predice.
 */
export class TrendEngine {
  /**
   * Ejecuta un ciclo completo de detección (simulado).
   */
  detect(): TrendReport {
    const seed = "trend-" + Date.now();
    const R = ncRng(seed);

    const trendCount = 5 + Math.floor(R() * 5);
    const trendNames = [...TREND_NAMES].sort(() => R() - 0.5).slice(0, trendCount);

    const trends: TrendData[] = trendNames.map((name, i) => ({
      id: `trend-${i}`,
      name,
      source: SOURCES[Math.floor(R() * SOURCES.length)],
      score: Math.round(30 + R() * 70),
      description: `Tendencia detectada en ${SOURCES[Math.floor(R() * SOURCES.length)]}: "${name}" está ganando tracción.`,
      category: (["visual", "narrative", "cultural", "technical"] as const)[Math.floor(R() * 4)],
      isEmerging: R() > 0.7,
      predictedGrowth: Math.round((R() - 0.3) * 100),
    }));

    const sorted = [...trends].sort((a, b) => b.score - a.score);
    const topTrend = sorted[0] ?? null;

    return {
      cycleId: `cycle-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      dataPoints: Math.floor(500 + R() * 2000),
      trends: sorted,
      topTrend,
      visualAnalysis: {
        dominantColor: COLORS[Math.floor(R() * COLORS.length)],
        mood: MOODS[Math.floor(R() * MOODS.length)],
        saturation: Math.round(R() * 30), // low saturation (NOIACORE)
      },
      narrativeAnalysis: {
        dominantTheme: THEMES[Math.floor(R() * THEMES.length)],
        sentimentScore: Math.round((R() - 0.5) * 40), // near neutral, slightly cold
      },
      briefsGenerated: 1 + Math.floor(R() * 3),
    };
  }
}

// Singleton
let trendEngine: TrendEngine | null = null;
export function getTrendEngine(): TrendEngine {
  if (!trendEngine) trendEngine = new TrendEngine();
  return trendEngine;
}
