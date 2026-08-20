// Noiacore — Generador procedural de obras
// Crea variaciones automáticas de shaders con paletas y params aleatorios
// pero armónicos. El laboratorio se autogenera contenido de forma continua.

import { SHADERS, type ShaderId } from "./shaders";

export interface GeneratedObra {
  id: string;
  title: string;
  author: string;
  shader: ShaderId;
  hue: number;
  complexity: number;
  intensity: number;
  excerpt: string;
  tags: string[];
  likes: number;
  views: number;
  collected: number;
  createdAt: string;
  procedural: true;
}

// Poetas/títulos generativos — fragmentos que se combinan
const TITLE_FRAGMENTS_A = [
  "Sedimento",
  "Cristal",
  "Vértigo",
  "Memoria",
  "Pulso",
  "Eco",
  "Abismo",
  "Cielo",
  "Raíz",
  "Marea",
  "Véspero",
  "Néctar",
  "Umbra",
  "Limen",
  "Quimera",
];

const TITLE_FRAGMENTS_B = [
  "de neón",
  "magnético",
  "lento",
  "roto",
  "sin nombre",
  "boreal",
  "líquido",
  "estelar",
  "profundo",
  "silente",
  "invertido",
  "cromado",
  "puro",
  "fractal",
  "oculto",
];

const EXCERPTS = [
  "Una variación procedural generada por el núcleo del laboratorio.",
  "El algoritmo exploró el espacio cromático y encontró esta pausa.",
  "Un fragmento de tiempo plegado sobre sí mismo por la máquina.",
  "La primera iteración de una serie infinita de posibilidades.",
  "Compuesto por el generador a partir de una semilla armónica.",
  "Un estudio automático sobre la relación entre matiz y movimiento.",
  "El laboratorio respiró y esta obra emergió de su exhalación.",
  "Una pieza generada sin intención humana, solo matemática y luz.",
];

const TAGS_POOL = [
  "procedural",
  "generativo",
  "auto",
  "variación",
  "estudio",
  "cromático",
  "flujo",
  "textura",
  "ritmo",
  "luz",
  "sombra",
  "resonancia",
];

const AUTHORS = [
  { handle: "n0va", name: "Nova Drift" },
  { handle: "ostinato", name: "Ostinato" },
  { handle: "mira.luz", name: "Mira Luz" },
  { handle: "k4el", name: "Kael Brun" },
  { handle: "drift.7", name: "Drift Seven" },
  { handle: "iris", name: "Iris Solano" },
  { handle: "sven", name: "Sven Aalto" },
  { handle: "aria", name: "Aria Mendoza" },
];

let seedCounter = 0;

/**
 * Genera una obra procedural con params armónicos.
 * Usa una semilla temporal para variación continua pero sutil.
 */
export function generateProceduralObra(): GeneratedObra {
  const now = Date.now();
  seedCounter++;
  // Semilla basada en tiempo + contador para variación continua
  const seed = (now + seedCounter * 7919) % 2147483647;
  const rng = mulberry32(seed);

  const shader = SHADERS[Math.floor(rng() * SHADERS.length)];
  // Hue armónico: elige de una rueda de 12 tonos (círculo cromático)
  const hueSteps = 12;
  const baseHue = Math.floor(rng() * hueSteps) / hueSteps;
  // Variación sutil dentro del tono (±0.02)
  const hue = baseHue + (rng() - 0.5) * 0.04;
  const complexity = 0.3 + rng() * 0.5;
  const intensity = 0.25 + rng() * 0.45;

  const titleA = TITLE_FRAGMENTS_A[Math.floor(rng() * TITLE_FRAGMENTS_A.length)];
  const titleB = TITLE_FRAGMENTS_B[Math.floor(rng() * TITLE_FRAGMENTS_B.length)];
  const title = `${titleA} ${titleB}`;

  const author = AUTHORS[Math.floor(rng() * AUTHORS.length)];
  const excerpt = EXCERPTS[Math.floor(rng() * EXCERPTS.length)];

  // 2-3 tags aleatorios
  const tagCount = 2 + Math.floor(rng() * 2);
  const tags = [...TAGS_POOL]
    .sort(() => rng() - 0.5)
    .slice(0, tagCount);

  // Métricas simuladas (crecen con el tiempo para parecer orgánicas)
  const ageMin = Math.floor(rng() * 1440); // hasta 24h
  const likes = Math.floor(rng() * 200) + Math.floor(ageMin / 10);
  const views = likes * (8 + Math.floor(rng() * 20));
  const collected = Math.floor(likes * (0.1 + rng() * 0.2));

  return {
    id: `gen-${now}-${seedCounter}`,
    title,
    author: author.name,
    shader: shader.id,
    hue,
    complexity,
    intensity,
    excerpt,
    tags,
    likes,
    views,
    collected,
    createdAt: new Date(now - ageMin * 60000).toISOString(),
    procedural: true,
  };
}

/**
 * Genera N obras procedurales de una vez.
 */
export function generateBatch(count: number): GeneratedObra[] {
  return Array.from({ length: count }, () => generateProceduralObra());
}

/**
 * PRNG determinístico (mulberry32) para variación reproducible.
 */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
