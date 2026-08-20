// Noiacore — Generador de paletas HSL con armonías clásicas.
export type Harmony =
  | "complementario"
  | "análogo"
  | "tríada"
  | "tetrada"
  | "monocromo"
  | "split";

export interface Swatch {
  hex: string;
  h: number;
  s: number;
  l: number;
}

export interface Palette {
  base: Swatch;
  harmony: Harmony;
  swatches: Swatch[];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function hexToHsl(hex: string): Swatch {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { hex, h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const HARMONY_OFFSETS: Record<Harmony, number[]> = {
  complementario: [0, 180],
  análogo: [0, 30, 60, 330],
  tríada: [0, 120, 240],
  tetrada: [0, 90, 180, 270],
  monocromo: [0, 0, 0, 0],
  split: [0, 150, 210],
};

export function generatePalette(
  baseHue?: number,
  harmony: Harmony = "tríada"
): Palette {
  const h = baseHue ?? Math.floor(Math.random() * 360);
  const base: Swatch = {
    h,
    s: 72,
    l: 55,
    hex: hslToHex(h, 72, 55),
  };
  const offsets = HARMONY_OFFSETS[harmony];
  const swatches: Swatch[] = offsets.map((off, i) => {
    const hh = (h + off + 360) % 360;
    let ss = 70;
    let ll = 55;
    if (harmony === "monocromo") {
      ll = 30 + i * 18;
      ss = 60 - i * 8;
    } else if (harmony === "análogo") {
      ll = 45 + (i % 2) * 18;
      ss = 68;
    } else {
      ll = i === 0 ? 55 : 50 + ((i * 7) % 20);
      ss = i === 0 ? 72 : 64 + ((i * 5) % 16);
    }
    return { h: hh, s: ss, l: ll, hex: hslToHex(hh, ss, ll) };
  });
  return { base, harmony, swatches };
}

export const HARMONIES: Harmony[] = [
  "tríada",
  "complementario",
  "análogo",
  "tetrada",
  "monocromo",
  "split",
];
