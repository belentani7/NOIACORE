// NODO — Generadores infinitos de assets sin API (E01-E07)
// Principio: seed → hash → PRNG determinista → parámetros constreñidos a paleta → render local
// Cero red, cero claves, infinito y reproducible. La marca no puede romperse.

// [E01] Hash de seed (xmur3)
export function ncHash(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// [E02] PRNG determinista (mulberry32)
export function ncRng(seed: string | number): () => number {
  let a = ncHash(String(seed))();
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NcSpec {
  seed: string;
  ringCount: number;
  ringGap: number;
  beamX: number;
  beamOpacity: number;
  particles: number;
  etherTop: string;
  etherBottom: string;
  glow: number;
  drift: number;
}

// [E03] Spec constreñido (la piel cambia, la identidad no)
const BLUES = ["#0A1628", "#0F1C2E", "#15233A", "#1A2A40"];

export function ncSpec(seed: string | number): NcSpec {
  const R = ncRng(seed);
  return {
    seed: String(seed),
    ringCount: 3 + Math.floor(R() * 5), // 3–7 anillos
    ringGap: 60 + R() * 80,
    beamX: 0.5 + (R() - 0.5) * 0.12, // simetría casi perfecta
    beamOpacity: 0.06 + R() * 0.16,
    particles: Math.floor(12 + R() * 40),
    etherTop: BLUES[Math.floor(R() * 4)],
    etherBottom: BLUES[Math.floor(R() * 4)],
    glow: 0.03 + R() * 0.05,
    drift: 8 + R() * 14,
  };
}

function hexToRgb(h: string): string {
  const n = parseInt(h.slice(1), 16);
  return `${((n >> 16) & 255) / 255}, ${((n >> 8) & 255) / 255}, ${(n & 255) / 255}`;
}

// [E04] SVG infinito → data-URI
export function ncSvgAsset(seed: string | number): string {
  const s = ncSpec(seed);
  const S = 1200;
  const c = S / 2;
  let rings = "";
  for (let i = 1; i <= s.ringCount; i++) {
    rings += `<circle cx="${c}" cy="${c}" r="${(i * s.ringGap).toFixed(0)}" fill="none" stroke="#E8F0FF" stroke-opacity="${(0.12 / i).toFixed(3)}"/>`;
  }
  const R = ncRng(String(seed) + ":pts");
  let dots = "";
  for (let i = 0; i < s.particles; i++) {
    dots += `<circle cx="${(R() * S) | 0}" cy="${(R() * S) | 0}" r="${(R() * 1.2 + 0.2).toFixed(2)}" fill="#E8F0FF" fill-opacity="${(R() * 0.3 + 0.05).toFixed(2)}"/>`;
  }
  const bx = (S * s.beamX) | 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><radialGradient id="g" cx="50%" cy="42%" r="75%"><stop offset="0%" stop-color="${s.etherTop}"/><stop offset="100%" stop-color="#000000"/></radialGradient></defs><rect width="${S}" height="${S}" fill="#000"/><rect width="${S}" height="${S}" fill="url(#g)" opacity=".55"/><line x1="${bx}" y1="0" x2="${bx}" y2="${S}" stroke="#E8F0FF" stroke-opacity="${s.beamOpacity.toFixed(3)}"/>${rings}${dots}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// [E05] Shader GLSL infinito
export function ncShaderAsset(seed: string | number): string {
  const s = ncSpec(seed);
  return `precision highp float;uniform float t;uniform vec2 r;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
            mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;float d=length(uv);
 vec3 col=mix(vec3(0.),vec3(${hexToRgb(s.etherTop)}),noise(uv*2.+t*.02)*.5);
 float ring=sin(d*${(18 + s.ringCount * 4).toFixed(1)}-t*.2)*.5+.5;
 col+=vec3(.91,.94,1.)*smoothstep(.98,1.,ring)*${s.glow.toFixed(3)}*smoothstep(.8,.1,d);
 col+=vec3(.91,.94,1.)*smoothstep(.003,.0,abs(uv.x-${(s.beamX - 0.5).toFixed(3)}))*${s.beamOpacity.toFixed(3)}*(1.-abs(uv.y));
 col*=smoothstep(1.2,.3,d);
 gl_FragColor=vec4(col,1.);
}`;
}

// [E06] Textura canvas → PNG
export function ncTexture(seed: string | number, size = 1024): string {
  if (typeof document === "undefined") return "";
  const R = ncRng(seed);
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const x = cv.getContext("2d");
  if (!x) return "";
  const s = ncSpec(seed);
  x.fillStyle = "#000";
  x.fillRect(0, 0, size, size);
  const g = x.createRadialGradient(size / 2, size * 0.42, 0, size / 2, size * 0.42, size * 0.75);
  g.addColorStop(0, s.etherTop + "88");
  g.addColorStop(1, "#000000");
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < s.particles * 8; i++) {
    x.fillStyle = `rgba(232,240,255,${(R() * 0.25 + 0.03).toFixed(2)})`;
    x.beginPath();
    x.arc(R() * size, R() * size, R() * 1.3 + 0.2, 0, Math.PI * 2);
    x.fill();
  }
  return cv.toDataURL("image/png");
}

// [E07] Cache determinista
const ncCache = {
  key: (s: string) => "nc:asset:" + s,
  get(s: string) {
    try {
      return localStorage.getItem(this.key(s));
    } catch {
      return null;
    }
  },
  set(s: string, v: string) {
    try {
      localStorage.setItem(this.key(s), v);
    } catch {
      /* noop */
    }
  },
};

export function ncAsset(seed: string | number): string {
  const k = String(seed);
  let u = ncCache.get(k);
  if (!u) {
    u = ncSvgAsset(k);
    ncCache.set(k, u);
  }
  return u;
}

export function ncApply(seed: string | number, el?: HTMLElement): void {
  const target = el ?? document.body;
  const s = ncSpec(seed);
  target.style.setProperty("--nc-drift", s.drift + "s");
  target.style.setProperty("--nc-glow", String(s.glow));
  target.style.backgroundImage = `url("${ncAsset(seed)}")`;
}
