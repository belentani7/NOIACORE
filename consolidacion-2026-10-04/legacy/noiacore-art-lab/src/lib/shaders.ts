// Noiacore — Librería de shaders GLSL
// Vertex shader compartido (full-screen quad) + 6 fragment shaders.
// Cada fragment reutiliza una base común (tiempo, ruido, hue) y añade su propia complejidad.

export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment base común: precisión, uniforms, helpers de ruido y rotación de hue.
const FRAG_BASE = `
precision highp float;
uniform float u_time;       // tiempo global (segundos)
uniform vec2  u_resolution; // tamaño del canvas en pixels
uniform vec2  u_mouse;      // posición del cursor normalizada (0..1)
uniform float u_intensity;  // 0..1 intensidad / velocidad (hover acelera)
uniform float u_hue;        // matiz base 0..1
uniform float u_complexity; // 0..1 frecuencia / detalle
uniform vec3 u_audio;       // bandas de audio: bass, mid, high (0..1)

// hash y ruido value noise 2D
float hash(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// ruido fractal (fBm)
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}
// rotación 2D
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// HSV -> RGB
vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
// paleta armónica del laboratorio (azul profundo -> blanco-azulado -> azul suave)
// Universo NOIACORE: solo azules fríos desaturados + blancos espectrales
vec3 noiaPalette(float t){
  vec3 deepBlue  = vec3(0.20, 0.32, 0.55);   // azul profundo
  vec3 lightBlue = vec3(0.70, 0.80, 0.95);   // blanco-azulado
  vec3 softBlue  = vec3(0.85, 0.90, 1.00);   // blanco espectral
  vec3 a = mix(deepBlue, lightBlue, smoothstep(0.0, 0.5, t));
  return mix(a, softBlue, smoothstep(0.5, 1.0, t));
}
`;

const FRAG_MAIN_FOOTER = `
void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;
  vec3 col = shade(uv);
  // Color grading NOIACORE: shift to cold blue palette
  // Suppress warm channels, boost blue — cinematic cold tint
  col.r *= 0.82;
  col.g *= 0.90;
  col.b *= 1.08;
  // Slight desaturation for spectral feel
  float gray = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(gray), col, 0.85);
  // viñeta sutil
  float vig = smoothstep(1.25, 0.35, length((uv - vec2(0.5 * u_resolution.x / u_resolution.y, 0.5))));
  col *= 0.78 + 0.22 * vig;
  // grano cinematográfico
  float g = hash(uv * u_resolution.xy + u_time) - 0.5;
  col += g * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type ShaderId =
  | "silk"
  | "plasma"
  | "gridwarp"
  | "noiseflow"
  | "vortex"
  | "aurora"
  | "kaleidoscope"
  | "liquidmetal"
  | "cosmos";

export interface ShaderDef {
  id: ShaderId;
  name: string;
  nameEs: string;
  tag: string;
  precision: string;
  fps: number;
  compat: string;
  description: string;
  source: string;
}

// 1. SILK — seda fluida con ondas sinusoidales entrelazadas
const SILK_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  vec2 p = uv;
  float t = u_time * (0.35 + u_intensity * 0.9);
  // dominios ondulantes
  p += 0.18 * vec2(sin(p.y * 3.0 + t), cos(p.x * 2.4 - t * 0.8));
  float d = 0.0;
  for(int i = 0; i < 4; i++){
    float fi = float(i) + 1.0;
    d += sin(p.x * fi * (2.0 + u_complexity * 3.0) + t * fi) * 0.5 / fi;
    p = rot2(t * 0.12 + fi) * p;
  }
  float v = 0.5 + 0.5 * d;
  float hue = u_hue + v * 0.25 + u_audio.x * 0.15;
  vec3 c = hsv2rgb(vec3(fract(hue), 0.62, 0.92));
  c = mix(c, noiaPalette(v), 0.35);
  // brillo sedoso + pulso de bass
  c += pow(v, 6.0) * (0.4 + u_audio.x * 1.2);
  // sparkle de highs
  c += vec3(1.0, 0.95, 0.85) * u_audio.z * 0.3 * smoothstep(0.6, 1.0, v);
  return c;
}
` + FRAG_MAIN_FOOTER;

// 2. PLASMA — plasma clásico con capas sinusoidales
const PLASMA_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.6 + u_intensity * 1.1);
  vec2 p = uv * (3.0 + u_complexity * 4.0);
  float v = 0.0;
  v += sin(p.x * 1.2 + t);
  v += sin(p.y * 1.6 + t * 0.9);
  v += sin((p.x + p.y) * 1.1 + t * 1.3);
  vec2 c = p + 0.5 * vec2(sin(t * 0.7), cos(t * 0.5));
  v += sin(length(c) * 2.0 - t * 1.4);
  v *= 0.25;
  float hue = u_hue + v * 0.4 + 0.5 + u_audio.x * 0.1;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.7, 0.55 + 0.45 * (0.5 + 0.5 * v) + u_audio.x * 0.2));
  col += noiaPalette(0.5 + 0.5 * sin(v * 3.0)) * (0.25 + u_audio.y * 0.3);
  // sparkle de highs
  col += vec3(1.0, 0.9, 0.7) * u_audio.z * 0.25 * smoothstep(0.4, 1.0, abs(v));
  return col;
}
` + FRAG_MAIN_FOOTER;

// 3. GRID-WARP — rejilla deformada por ruido
const GRIDWARP_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.3 + u_intensity * 0.7);
  vec2 p = uv * (6.0 + u_complexity * 8.0);
  // deformación con fBm
  vec2 q = vec2(fbm(p + t), fbm(p - t * 0.8 + 5.2));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.6));
  float f = fbm(p + 4.0 * r);
  // rejilla — bass engrosa las líneas
  vec2 g = fract(p + 2.0 * r) - 0.5;
  float line = smoothstep(0.46 - u_audio.x * 0.08, 0.5, max(abs(g.x), abs(g.y)));
  float hue = u_hue + f * 0.3 + 0.1 * t + u_audio.y * 0.12;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.55, 0.18 + 0.15 * line + u_audio.x * 0.15));
  col += noiaPalette(f) * (0.6 * line);
  col += vec3(0.15, 0.25, 0.3) * pow(line, 3.0);
  // high añade destellos en las intersecciones
  col += vec3(1.0, 0.9, 0.8) * u_audio.z * 0.3 * pow(line, 4.0);
  return col;
}
` + FRAG_MAIN_FOOTER;

// 4. NOISE-FLOW — campo de flujo orgánico
const NOISEFLOW_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.25 + u_intensity * 0.6);
  vec2 p = uv * (2.5 + u_complexity * 3.5);
  // líneas de flujo
  float acc = 0.0;
  vec2 q = p;
  for(int i = 0; i < 6; i++){
    float fi = float(i);
    float n = fbm(q + t * 0.15);
    float a = n * 6.2831 + t * (0.3 + 0.05 * fi);
    q += vec2(cos(a), sin(a)) * 0.18;
    acc += 0.16 * fbm(q + fi);
  }
  acc /= 6.0;
  // bass acelera el flujo visual, mid rota el hue
  float hue = u_hue + acc * 0.45 + u_audio.y * 0.15;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.6, 0.85 + u_audio.x * 0.15));
  col = mix(col, noiaPalette(acc), 0.5);
  // streaks — high intensifica las estelas
  float streak = pow(abs(sin(q.x * 3.0 + q.y * 2.0 + t)), 18.0);
  col += vec3(0.9, 0.95, 1.0) * streak * (0.4 + u_audio.z * 0.8);
  return col;
}
` + FRAG_MAIN_FOOTER;

// 5. VORTEX — vórtice giratorio
const VORTEX_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.5 + u_intensity * 1.0);
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / u_resolution.y;
  float r = length(p);
  float a = atan(p.y, p.x);
  // espiral
  float spiral = sin(a * (3.0 + u_complexity * 6.0) + log(r + 0.05) * 6.0 - t * 2.0);
  float arms = sin(a * 5.0 - t * 1.5);
  float v = 0.5 + 0.5 * spiral * arms;
  float hue = u_hue + a / 6.2831 + t * 0.05 + u_audio.y * 0.2;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.7, 0.5 + 0.5 * v));
  col *= smoothstep(0.0, 0.18, r);
  col += noiaPalette(v) * (0.3 * smoothstep(0.5, 0.0, r));
  // núcleo brillante + pulso de bass expande el núcleo
  col += vec3(1.0, 0.95, 0.85) * smoothstep(0.12 + u_audio.x * 0.15, 0.0, r) * (1.2 + u_audio.x * 0.8);
  return col;
}
` + FRAG_MAIN_FOOTER;

// 6. AURORA — aurora borealis con cortinas de luz
const AURORA_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.2 + u_intensity * 0.6);
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;
  float y = p.y;
  // cortinas
  float c1 = fbm(vec2(p.x * 2.0 + t * 0.4, t * 0.15));
  float c2 = fbm(vec2(p.x * 3.5 - t * 0.3, t * 0.2 + 5.0));
  float band = smoothstep(0.55, 0.0, abs(y - (0.55 + 0.15 * c1)));
  band *= 0.6 + 0.4 * c2;
  // bass intensifica las cortinas
  band *= 1.0 + u_audio.x * 0.8;
  float band2 = smoothstep(0.5, 0.0, abs(y - (0.4 + 0.12 * c2))) * (0.5 + 0.5 * c1);
  float hue = u_hue + c1 * 0.25 + 0.55 + u_audio.y * 0.1;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.65, 0.4 * band + 0.2 * band2));
  col += noiaPalette(c1) * band * 0.6;
  // estrellas — high hace brillar más
  vec2 sid = floor(uv * u_resolution.xy * 0.5);
  float star = step(0.995, hash(sid)) * (0.6 + 0.4 * sin(t * 3.0 + sid.x));
  col += vec3(0.9, 0.95, 1.0) * star * smoothstep(0.5, 1.0, y) * (1.0 + u_audio.z * 1.5);
  // suelo oscuro
  col *= mix(0.25, 1.0, smoothstep(0.0, 0.45, y));
  return col;
}
` + FRAG_MAIN_FOOTER;

// 7. KALEIDOSCOPE — simetría kaleidoscópica con rotación
const KALEIDOSCOPE_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.25 + u_intensity * 0.7);
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / u_resolution.y;
  // coordenadas polares
  float r = length(p);
  float a = atan(p.y, p.x);
  // pliegue kaleidoscópico (N segmentos)
  float n = 4.0 + floor(u_complexity * 8.0);
  float seg = 6.2831 / n;
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  // reintroducir como cartesianas
  vec2 q = vec2(cos(a), sin(a)) * r;
  // patrón sobre q
  float pat = sin(q.x * 8.0 + t * 1.5) * cos(q.y * 8.0 - t);
  pat += 0.5 * sin(r * 14.0 - t * 2.0);
  float v = 0.5 + 0.5 * pat;
  float hue = u_hue + v * 0.3 + r * 0.4 + u_audio.y * 0.15;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.7, 0.85));
  col = mix(col, noiaPalette(v), 0.45);
  // anillos — bass pulsa el espesor
  col *= 0.6 + 0.4 * smoothstep(0.02 + u_audio.x * 0.04, 0.0, abs(fract(r * 6.0 - t * 0.3) - 0.5));
  // brillo central con high
  col += vec3(1.0, 0.85, 0.7) * u_audio.z * 0.3 * smoothstep(0.3, 0.0, r);
  return col;
}
` + FRAG_MAIN_FOOTER;

// 8. LIQUIDMETAL — metal líquido con reflejos cromados
const LIQUIDMETAL_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.2 + u_intensity * 0.5);
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;
  // dominio warping fuerte
  vec2 q = vec2(fbm(p * (2.0 + u_complexity * 3.0) + t), fbm(p * (2.0 + u_complexity * 3.0) + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.4), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.3));
  float f = fbm(p + 4.0 * r);
  // patrón de bandas cromadas — bass modula la frecuencia de bandas
  float bands = sin(f * (12.0 + u_audio.x * 8.0) + t * 1.2);
  float spec = pow(max(bands, 0.0), 16.0);
  float hue = u_hue + f * 0.2 + u_audio.y * 0.1;
  vec3 base = hsv2rgb(vec3(fract(hue), 0.08, 0.35 + 0.5 * f));
  // reflejo metálico (plateado/ámbar)
  vec3 metal = mix(vec3(0.85, 0.87, 0.9), noiaPalette(f), 0.3);
  vec3 col = mix(base, metal, smoothstep(0.4, 0.8, f));
  // spec + high amplifica el brillo especular
  col += vec3(1.0, 0.95, 0.85) * spec * (0.9 + u_audio.z * 1.2);
  // bordes oscuros
  col *= 0.7 + 0.3 * smoothstep(0.2, 0.6, f);
  return col;
}
` + FRAG_MAIN_FOOTER;

// 9. COSMOS — nebulosa estelar con polvo y estrellas
const COSMOS_FRAG = FRAG_BASE + `
vec3 shade(vec2 uv){
  float t = u_time * (0.15 + u_intensity * 0.4);
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;
  // nebulosa: fBm en capas
  vec2 q = p * (1.5 + u_complexity * 2.5);
  float n1 = fbm(q + t * 0.1);
  float n2 = fbm(q * 2.0 - t * 0.08 + vec2(3.1, 1.7));
  float n3 = fbm(q * 0.5 + t * 0.05);
  float nebula = n1 * n2;
  nebula = pow(nebula, 1.6);
  // bass expande la nebulosa
  nebula *= 1.0 + u_audio.x * 0.6;
  // color de la nebulosa
  float hue = u_hue + n3 * 0.4 + t * 0.02 + u_audio.y * 0.12;
  vec3 col = hsv2rgb(vec3(fract(hue), 0.8, nebula * 0.9));
  col = mix(col, noiaPalette(n1), 0.35 * nebula);
  // estrellas (multi-resolución) — high hace brillar más
  for(int s = 1; s < 4; s++){
    float sf = float(s);
    vec2 sid = floor(uv * u_resolution.xy * 0.15 * sf);
    float h = hash(sid + sf * 17.3);
    if(h > 0.985){
      vec2 sc = (sid + 0.5) / (u_resolution.xy * 0.15 * sf);
      float d = length((uv - sc) * u_resolution.xy);
      float star = smoothstep(2.5, 0.0, d) * (0.6 + 0.4 * sin(t * 4.0 + h * 50.0));
      col += vec3(1.0, 0.95, 0.9) * star * (1.0 + u_audio.z * 2.0);
    }
  }
  // fondo profundo
  col += vec3(0.02, 0.03, 0.06);
  return col;
}
` + FRAG_MAIN_FOOTER;

export const SHADERS: ShaderDef[] = [
  {
    id: "silk",
    name: "Silk",
    nameEs: "Seda",
    tag: "Ondulación",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Capas sinusoidales entrelazadas que fluyen como seda líquida. La base más usada del laboratorio.",
    source: SILK_FRAG,
  },
  {
    id: "plasma",
    name: "Plasma",
    nameEs: "Plasma",
    tag: "Clásico",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Cuatro senos superpuestos que producen el plasma clásico de la demoscene, con paleta rotatoria.",
    source: PLASMA_FRAG,
  },
  {
    id: "gridwarp",
    name: "Grid-Warp",
    nameEs: "Rejilla warping",
    tag: "Estructura",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Una rejilla deformada por ruido fractal fBm. La estructura se tuerce en dominios anidados.",
    source: GRIDWARP_FRAG,
  },
  {
    id: "noiseflow",
    name: "Noise-Flow",
    nameEs: "Flujo orgánico",
    tag: "Campo vectorial",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Campo de flujo donde partículas virtuales recorren un fBm. Estela orgánica de movimiento.",
    source: NOISEFLOW_FRAG,
  },
  {
    id: "vortex",
    name: "Vortex",
    nameEs: "Vórtice",
    tag: "Polar",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Espiral polar con brazos giratorios y un núcleo brillante. Responde al ángulo y al radio.",
    source: VORTEX_FRAG,
  },
  {
    id: "aurora",
    name: "Aurora",
    nameEs: "Aurora",
    tag: "Atmósfera",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Cortinas de luz sobre un cielo estrellado. La pieza más atmosférica de la colección.",
    source: AURORA_FRAG,
  },
  {
    id: "kaleidoscope",
    name: "Kaleidoscope",
    nameEs: "Caleidoscopio",
    tag: "Simetría",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Pliegue kaleidoscópico con N segmentos y anillos giratorios. Geometría hipnótica.",
    source: KALEIDOSCOPE_FRAG,
  },
  {
    id: "liquidmetal",
    name: "Liquid-Metal",
    nameEs: "Metal líquido",
    tag: "Cromado",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Dominio warping con reflejos especulares. Superficie cromada que fluye y brilla.",
    source: LIQUIDMETAL_FRAG,
  },
  {
    id: "cosmos",
    name: "Cosmos",
    nameEs: "Cosmos",
    tag: "Nebulosa",
    precision: "highp",
    fps: 60,
    compat: "WebGL 1.0+",
    description:
      "Nebulosa estelar con polvo de fBm y estrellas a varias resoluciones. Lo más profundo del lab.",
    source: COSMOS_FRAG,
  },
];

export function getShader(id: ShaderId): ShaderDef {
  return SHADERS.find((s) => s.id === id) ?? SHADERS[0];
}
