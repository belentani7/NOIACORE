// Fábrica Creativa Eterna — Motor de Narrativa Algorítmica
// Sistema de generación de lore con árbol narrativo, facciones, personajes,
// locaciones, líneas temporales y conflictos — basado en la especificación técnica.
// Todo determinista (PRNG) para reproducibilidad.

import { ncRng } from "@/lib/nodo/generators";

// === Tipos del universo narrativo ===

export interface Faction {
  id: string;
  name: string;
  description: string;
  color: string;
  ideology: string;
  strength: number; // 0..100
}

export interface Character {
  id: string;
  name: string;
  factionId: string;
  role: string; // líder, guardián, vidente, etc.
  archetype: string;
  description: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  factionId: string | null;
  type: string; // santuario, ruina, ciudad, vacío
}

export interface TimelineEra {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Conflict {
  id: string;
  name: string;
  description: string;
  factionIds: string[];
  intensity: number; // 0..100
}

export interface UniverseLore {
  foundingMyth: string;
  cosmology: string;
  factions: Faction[];
  characters: Character[];
  locations: Location[];
  timeline: TimelineEra[];
  conflicts: Conflict[];
  worldRules: string[];
  coherenceScore: number;
}

// === Generadores narrativos ===

const FACTION_NAMES = [
  "Facción del Vacío", "Orden del Espejo", "Linaje Espectral",
  "Concilio de Neón", "Guardianes del Umbral", "Nómadas del Éter",
  "Arquitectos Silentes", "Eco del Origen",
];

const FACTION_IDEOS = [
  "El vacío es el estado natural; la materia es ruido temporal.",
  "Cada reflejo contiene una verdad que el original perdió.",
  "Los espectros recuerdan lo que los vivos olvidaron.",
  "La luz es información; la información es poder.",
  "El umbral no separa dos mundos: los conecta.",
  "El éter fluye donde la materia no puede sostenerse.",
  "El silencio es la forma más pura de arquitectura.",
  "Cada eco contiene el germen del origen que lo emitió.",
];

const CHARACTER_ARCHETYPES = [
  "Líder Visionario", "Guardián Silente", "Vidente del Eco",
  "Nómada Errante", "Arquitecto de Sombras", "Sacerdote del Vacío",
  "Cazador de Reflejos", "Rebelde Cromático", "Portador del Umbral",
  "Oráculo de Profundidades", "Forjador de Neón", "Meditador Eterno",
];

const LOCATION_TYPES = [
  "Santuario", "Ruina Digital", "Catedral de Datos", "Ciudad Espectral",
  "Vacío Primordial", "Cruce de Ecos", "Biblioteca de Luz", "Cripta de Cristal",
];

const LOCATION_NAMES = [
  "Trono de Hologramas Rotos", "Jardín de Pantallas Muertas",
  "Catedral de Datos Silentes", "Ruinas de la Primera Luz",
  "Mercado de Sombras", "Santuario Subacuático", "Observatorio Estelar",
  "Cámara de Ecos Profundos", "Pasillo Infinito", "Arena de Sombras",
  "Biblioteca de Luz Fría", "Cripta de Cristal Azul",
];

const ERA_NAMES = [
  "Era del Origen Silencioso", "Era de la Primera Luz",
  "Era del Gran Reflejo", "Era del Vacío Expandido",
  "Era de la Convergencia", "Era del Eco Final",
];

const CONFLICT_NAMES = [
  "La Guerra del Reflejo Roto", "El Cisma del Vacío",
  "La Caída de los Arquitectos", "El Pacto del Umbral",
  "La Tormenta de Neón", "El Silencio de las Profundidades",
];

const WORLD_RULES = [
  "Nada se crea ni se destruye; solo se refleja.",
  "El vacío precede a toda forma.",
  "Cada eco contiene la memoria del sonido original.",
  "La luz fría es la única que no miente.",
  "El silencio es la forma más alta de comunicación.",
  "Los espejos no reflejan: recuerdan.",
  "Toda estructura eventualmente vuelve al vacío.",
  "La coherencia estética es ley; la entropía es crimen.",
];

const FOUNDING_MYTHS = [
  "En el principio era el vacío absoluto. Una vibración imposible —la primera— fracturó la nada en dos: luz y silencio. De esa fractura nacieron los arquetipos.",
  "Un sueño dentro de un sueño dentro de un vacío. Soñador y soñado se fundieron en un destello de luz fría, y de ese destello emergieron las facciones.",
  "La primera cosa que existió no fue luz ni materia, sino un reflejo de algo que no existía. Ese reflejo impossível se solidificó y se llamó a sí mismo 'el origen'.",
];

const COSMOLOGIES = [
  "El universo es una cúpula de luz fría sobre un océano de vacío reflectante. Las estrellas son grietas donde el vacío filtra su presencia.",
  "La realidad es un mosaico de espejos cóncavos. Cada facción habita un ángulo de reflexión diferente y nunca ven la misma verdad.",
  "El cosmos respira: inhala materia y exhala vacío. Las temporadas son los latidos de ese呼吸.",
];

const FACTION_COLORS = [
  "#0A1628", "#0F1C2E", "#15233A", "#1A2A40",
  "#1A2040", "#0E1A30", "#121F35", "#0A1428",
];

/**
 * LoreGenerationEngine — genera lore completo de un universo desde una semilla.
 * Fases: mito fundacional → cosmología → facciones → personajes → locaciones →
 * línea temporal → sistemas de poder → conflictos → misterios → reglas del mundo.
 */
export class LoreEngine {
  /**
   * Genera un universo narrativo completo y coherente.
   */
  generateUniverseLore(seed: string): UniverseLore {
    const R = ncRng("lore:" + seed);

    // Fase 1: Mito fundacional
    const foundingMyth = FOUNDING_MYTHS[Math.floor(R() * FOUNDING_MYTHS.length)];

    // Fase 2: Cosmología
    const cosmology = COSMOLOGIES[Math.floor(R() * COSMOLOGIES.length)];

    // Fase 3: Facciones (4-6)
    const factionCount = 4 + Math.floor(R() * 3);
    const factionNames = [...FACTION_NAMES].sort(() => R() - 0.5).slice(0, factionCount);
    const factions: Faction[] = factionNames.map((name, i) => ({
      id: `faction-${i}`,
      name,
      description: `Facción dedicada a: ${FACTION_IDEOS[i % FACTION_IDEOS.length]}`,
      color: FACTION_COLORS[i % FACTION_COLORS.length],
      ideology: FACTION_IDEOS[i % FACTION_IDEOS.length],
      strength: 50 + Math.floor(R() * 50),
    }));

    // Fase 4: Personajes arquetípicos (1-2 por facción)
    const characters: Character[] = [];
    for (const f of factions) {
      const charCount = 1 + Math.floor(R() * 2);
      for (let i = 0; i < charCount; i++) {
        const archetype = CHARACTER_ARCHETYPES[Math.floor(R() * CHARACTER_ARCHETYPES.length)];
        characters.push({
          id: `char-${characters.length}`,
          name: this.generateCharacterName(R),
          factionId: f.id,
          role: archetype,
          archetype,
          description: `${archetype} de ${f.name}. Portador de la ideología: ${f.ideology}`,
        });
      }
    }

    // Fase 5: Locaciones (6-10)
    const locCount = 6 + Math.floor(R() * 5);
    const locNames = [...LOCATION_NAMES].sort(() => R() - 0.5).slice(0, locCount);
    const locations: Location[] = locNames.map((name, i) => ({
      id: `loc-${i}`,
      name,
      description: `${LOCATION_TYPES[i % LOCATION_TYPES.length]} con resonancia de ${factions[i % factions.length].name}.`,
      factionId: factions[i % factions.length].id,
      type: LOCATION_TYPES[i % LOCATION_TYPES.length],
    }));

    // Fase 6: Línea temporal (3-5 eras)
    const eraCount = 3 + Math.floor(R() * 3);
    const eraNames = [...ERA_NAMES].slice(0, eraCount);
    const timeline: TimelineEra[] = eraNames.map((name, i) => ({
      id: `era-${i}`,
      name,
      description: `Durante esta era, ${factions[i % factions.length].name} dominaba. ${this.generateEraDescription(R)}`,
      order: i,
    }));

    // Fase 7: Conflictos (2-3)
    const conflictCount = 2 + Math.floor(R() * 2);
    const conflictNames = [...CONFLICT_NAMES].sort(() => R() - 0.5).slice(0, conflictCount);
    const conflicts: Conflict[] = conflictNames.map((name, i) => ({
      id: `conflict-${i}`,
      name,
      description: `Conflicto entre ${factions[i % factions.length].name} y ${factions[(i + 1) % factions.length].name}.`,
      factionIds: [factions[i % factions.length].id, factions[(i + 1) % factions.length].id],
      intensity: 40 + Math.floor(R() * 60),
    }));

    // Fase 8: Reglas del mundo (4-6)
    const ruleCount = 4 + Math.floor(R() * 3);
    const rules = [...WORLD_RULES].sort(() => R() - 0.5).slice(0, ruleCount);

    // Coherencia: más facciones y más reglas = más complejo pero menos coherente
    const coherenceScore = Math.max(60, 100 - factionCount * 3 - characters.length * 2 + rules.length * 4);

    return {
      foundingMyth,
      cosmology,
      factions,
      characters,
      locations,
      timeline,
      conflicts,
      worldRules: rules,
      coherenceScore,
    };
  }

  private generateCharacterName(R: () => number): string {
    const prefixes = ["Vex", "Lumen", "Sera", "Drift", "Nyx", "Iris", "Kael", "Oston", "Mira", "Pulse", "Echo", "Rift"];
    const suffixes = ["del Vacío", "del Espejo", "Espectral", "de Neón", "del Umbral", "del Éter", "Silente", "del Eco"];
    return `${prefixes[Math.floor(R() * prefixes.length)]} ${suffixes[Math.floor(R() * suffixes.length)]}`;
  }

  private generateEraDescription(R: () => number): string {
    const events = [
      "Las catedrales de datos florecieron en el vacío.",
      "Los reflejos se rompieron y tuvieron que ser reconstruidos.",
      "Una nueva luz fría emergió de las profundidades.",
      "Los arquetipos se reunieron en concilio por primera vez.",
      "El silencio se rompió brevemente, luego se restauró.",
    ];
    return events[Math.floor(R() * events.length)];
  }
}

// Singleton
let loreEngine: LoreEngine | null = null;
export function getLoreEngine(): LoreEngine {
  if (!loreEngine) loreEngine = new LoreEngine();
  return loreEngine;
}
