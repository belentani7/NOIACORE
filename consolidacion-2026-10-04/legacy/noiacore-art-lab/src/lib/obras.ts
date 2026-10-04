// Noiacore — Datos de obras (seed) + tipos compartidos.
import type { ShaderId } from "./shaders";

export interface Obra {
  id: string;
  title: string;
  author: string;
  shader: ShaderId;
  hue: number;
  complexity: number;
  intensity: number;
  likes: number;
  views: number;
  collected: number;
  tags: string[];
  createdAt: string; // ISO
  excerpt: string;
}

export const SEED_OBRAS: Obra[] = [
  {
    id: "obra-001",
    title: "Sedimento de marea",
    author: "Lumen Vera",
    shader: "silk",
    hue: 0.48,
    complexity: 0.55,
    intensity: 0.4,
    likes: 1248,
    views: 9821,
    collected: 312,
    tags: ["sedas", "oceano", "flujo"],
    createdAt: "2025-07-12T09:14:00Z",
    excerpt:
      "Una pieza que respira con la cadencia del oleaje: el seno se pliega sobre sí mismo en capas translúcidas.",
  },
  {
    id: "obra-002",
    title: "Cromatismo de plasma",
    author: "Nox Drift",
    shader: "plasma",
    hue: 0.82,
    complexity: 0.7,
    intensity: 0.55,
    likes: 2041,
    views: 15032,
    collected: 489,
    tags: ["plasma", "demoscene", "clásico"],
    createdAt: "2025-07-18T18:02:00Z",
    excerpt:
      "Cuatro senos que se persiguen eternamente. Un homenaje a la demoscene de los noventa.",
  },
  {
    id: "obra-003",
    title: "Rejilla que sueña",
    author: "Aria Mendoza",
    shader: "gridwarp",
    hue: 0.12,
    complexity: 0.8,
    intensity: 0.45,
    likes: 873,
    views: 6210,
    collected: 201,
    tags: ["estructura", "fBm", "warp"],
    createdAt: "2025-07-22T11:40:00Z",
    excerpt:
      "Una rejilla que se tuerce bajo el peso de un sueño. Dominios anidados de ruido fractal.",
  },
  {
    id: "obra-004",
    title: "Campo sin nombre",
    author: "Kael Brun",
    shader: "noiseflow",
    hue: 0.3,
    complexity: 0.65,
    intensity: 0.5,
    likes: 1597,
    views: 11408,
    collected: 378,
    tags: ["flujo", "vectorial", "orgánico"],
    createdAt: "2025-07-26T22:15:00Z",
    excerpt:
      "Partículas virtuales recorren un campo fBm. La estela dibuja un río sin orillas.",
  },
  {
    id: "obra-005",
    title: "Ojo del vórtice",
    author: "Iris Solano",
    shader: "vortex",
    hue: 0.05,
    complexity: 0.6,
    intensity: 0.6,
    likes: 3120,
    views: 22940,
    collected: 712,
    tags: ["polar", "espiral", "núcleo"],
    createdAt: "2025-07-30T07:50:00Z",
    excerpt:
      "Un ojo que gira sobre sí mismo. Brazos en espiral convergen hacia un núcleo incandescente.",
  },
  {
    id: "obra-006",
    title: "Aurora boreal #7",
    author: "Sven Aalto",
    shader: "aurora",
    hue: 0.42,
    complexity: 0.5,
    intensity: 0.35,
    likes: 2684,
    views: 18763,
    collected: 590,
    tags: ["atmósfera", "cielo", "luz"],
    createdAt: "2025-08-02T03:22:00Z",
    excerpt:
      "Cortinas de luz sobre un cielo estrellado. La pieza más silenciosa de la colección.",
  },
  {
    id: "obra-007",
    title: "Seda magnética",
    author: "Lumen Vera",
    shader: "silk",
    hue: 0.92,
    complexity: 0.45,
    intensity: 0.5,
    likes: 942,
    views: 7104,
    collected: 224,
    tags: ["sedas", "magenta", "flujo"],
    createdAt: "2025-08-05T14:10:00Z",
    excerpt:
      "La misma seda, ahora teñida de magenta. Un estudio sobre la rotación del matiz.",
  },
  {
    id: "obra-008",
    title: "Plasma ámbar",
    author: "Nox Drift",
    shader: "plasma",
    hue: 0.08,
    complexity: 0.9,
    intensity: 0.7,
    likes: 1356,
    views: 9921,
    collected: 301,
    tags: ["plasma", "ámbar", "denso"],
    createdAt: "2025-08-08T19:35:00Z",
    excerpt:
      "Plasma comprimido a alta frecuencia. El calor del ámbar contra el negro del lienzo.",
  },
  {
    id: "obra-009",
    title: "Caleidoscopio roto",
    author: "Aria Mendoza",
    shader: "kaleidoscope",
    hue: 0.55,
    complexity: 0.75,
    intensity: 0.55,
    likes: 1872,
    views: 13420,
    collected: 412,
    tags: ["simetría", "geometría", "hipnótico"],
    createdAt: "2025-08-10T10:05:00Z",
    excerpt:
      "Doce pliegues simétricos girando sobre un eje invisible. La geometría se rompe y se recompone.",
  },
  {
    id: "obra-010",
    title: "Mercurio lento",
    author: "Kael Brun",
    shader: "liquidmetal",
    hue: 0.1,
    complexity: 0.7,
    intensity: 0.45,
    likes: 2241,
    views: 16018,
    collected: 533,
    tags: ["cromado", "specular", "metal"],
    createdAt: "2025-08-12T16:48:00Z",
    excerpt:
      "Una superficie cromada que fluye como mercurio. Los reflejos especulares dibujan relámpagos.",
  },
  {
    id: "obra-011",
    title: "Polvo de nebulosa",
    author: "Iris Solano",
    shader: "cosmos",
    hue: 0.78,
    complexity: 0.65,
    intensity: 0.4,
    likes: 3487,
    views: 25104,
    collected: 801,
    tags: ["cosmos", "nebulosa", "estrellas"],
    createdAt: "2025-08-14T02:15:00Z",
    excerpt:
      "Una nebulosa estelar generada por capas de fBm. Lo más profundo y silencioso del laboratorio.",
  },
];

export interface EcosystemEvent {
  id: string;
  kind: "publish" | "like" | "collect" | "comment" | "fork" | "join";
  user: string;
  target: string;
  ago: string;
}

export const SEED_EVENTS: EcosystemEvent[] = [
  { id: "e1", kind: "publish", user: "Iris Solano", target: "Ojo del vórtice", ago: "hace 2 min" },
  { id: "e2", kind: "like", user: "k4el", target: "Campo sin nombre", ago: "hace 4 min" },
  { id: "e3", kind: "collect", user: "n0va", target: "Aurora boreal #7", ago: "hace 6 min" },
  { id: "e4", kind: "fork", user: "mira.luz", target: "Sedimento de marea", ago: "hace 9 min" },
  { id: "e5", kind: "comment", user: "Sven Aalto", target: "Plasma ámbar", ago: "hace 12 min" },
  { id: "e6", kind: "join", user: "ostinato", target: "al laboratorio", ago: "hace 15 min" },
  { id: "e7", kind: "publish", user: "Aria Mendoza", target: "Rejilla que sueña", ago: "hace 22 min" },
  { id: "e8", kind: "like", user: "drift.7", target: "Ojo del vórtice", ago: "hace 28 min" },
];

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "Noiacore me devolvió las ganas de escribir shaders a mano. El estudio se siente como un cuaderno vivo.",
    author: "Iris Solano",
    role: "Artista generativa",
  },
  {
    id: "t2",
    quote:
      "Publiqué mi primer fragment en una tarde. Al día siguiente ya tenía tres coleccionistas.",
    author: "Nox Drift",
    role: "Creative coder",
  },
  {
    id: "t3",
    quote:
      "El generador de paletas por sí solo ya vale todo el laboratorio. Lo uso antes de cada pieza.",
    author: "Sven Aalto",
    role: "Director visual",
  },
];
