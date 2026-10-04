// Noiacore — Motor WebGL ligero para fragment shaders a pantalla completa.
// Cada instancia mantiene su propio programa y buffer, y se recompila al cambiar el shader.
import { VERTEX_SHADER, type ShaderId } from "./shaders";
import { getShader } from "./shaders";

export interface ShaderParams {
  time: number;
  intensity: number;
  hue: number;
  complexity: number;
  mouseX: number;
  mouseY: number;
  audioBass: number;
  audioMid: number;
  audioHigh: number;
}

const DEFAULT_PARAMS: ShaderParams = {
  time: 0,
  intensity: 0.35,
  hue: 0.5,
  complexity: 0.5,
  mouseX: 0.5,
  mouseY: 0.5,
  audioBass: 0,
  audioMid: 0,
  audioHigh: 0,
};

/**
 * Renderer de un único shader a pantalla completa.
 * - Reutiliza el mismo buffer cuadrado (2 triángulos) en cada instancia.
 * - Recompila el programa cuando cambia el fragment shader.
 * - Respeta prefers-reduced-motion (velocidad reducida).
 */
export class ShaderRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private buffer: WebGLBuffer;
  private program: WebGLProgram | null = null;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private posLoc = 0;
  private shaderId: ShaderId | null = null;
  private params: ShaderParams = { ...DEFAULT_PARAMS };
  private running = false;
  private visible = true;
  private startTime = performance.now();
  private lastFrame = 0;
  private rafId = 0;
  private dpr = 1;
  private reducedMotion = false;
  private hoverBoost = 0;
  private onFps?: (fps: number) => void;
  private fpsAccum = 0;
  private fpsCount = 0;

  constructor(canvas: HTMLCanvasElement, onFps?: (fps: number) => void) {
    this.canvas = canvas;
    this.onFps = onFps;
    const gl =
      canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) throw new Error("WebGL no disponible");
    this.gl = gl;
    // geometría compartida: full-screen quad
    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    if (typeof window !== "undefined") {
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
  }

  setShader(id: ShaderId) {
    if (this.shaderId === id && this.program) return;
    this.shaderId = id;
    this.buildProgram(getShader(id).source);
  }

  private buildProgram(fragSrc: string) {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error("Error al enlazar programa WebGL: " + log);
    }
    if (this.program) gl.deleteProgram(this.program);
    this.program = prog;
    this.posLoc = gl.getAttribLocation(prog, "a_position");
    this.locations = {
      u_time: gl.getUniformLocation(prog, "u_time"),
      u_resolution: gl.getUniformLocation(prog, "u_resolution"),
      u_mouse: gl.getUniformLocation(prog, "u_mouse"),
      u_intensity: gl.getUniformLocation(prog, "u_intensity"),
      u_hue: gl.getUniformLocation(prog, "u_hue"),
      u_complexity: gl.getUniformLocation(prog, "u_complexity"),
      u_audio: gl.getUniformLocation(prog, "u_audio"),
    };
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error("Error al compilar shader: " + log);
    }
    return sh;
  }

  setParams(p: Partial<ShaderParams>) {
    Object.assign(this.params, p);
  }

  setHover(active: boolean) {
    this.hoverBoost = active ? 1 : 0;
  }

  setMouse(x: number, y: number) {
    this.params.mouseX = x;
    this.params.mouseY = y;
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (!v && this.running) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.running = false;
    } else if (v && !this.running && this.program) {
      this.start();
    }
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  start() {
    if (this.running || !this.program) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  private loop = () => {
    if (!this.running || !this.visible) {
      this.running = false;
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    // tiempo acumulado; hover acelera; reduced-motion ralentiza
    const speedMul = (this.reducedMotion ? 0.25 : 1) * (1 + this.hoverBoost * 0.8);
    this.params.time += dt * speedMul;
    // intensidad interpolada hacia el target de hover
    const target = 0.35 + this.hoverBoost * 0.6;
    this.params.intensity += (target - this.params.intensity) * Math.min(1, dt * 6);
    this.render();
    // fps
    this.fpsAccum += dt;
    this.fpsCount++;
    if (this.fpsAccum >= 0.75 && this.onFps) {
      this.onFps(Math.round(this.fpsCount / this.fpsAccum));
      this.fpsAccum = 0;
      this.fpsCount = 0;
    }
  };

  private render() {
    const gl = this.gl;
    if (!this.program) return;
    this.resize();
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);
    const u = this.locations;
    if (u.u_time) gl.uniform1f(u.u_time, this.params.time);
    if (u.u_resolution)
      gl.uniform2f(u.u_resolution, this.canvas.width, this.canvas.height);
    if (u.u_mouse)
      gl.uniform2f(u.u_mouse, this.params.mouseX, 1 - this.params.mouseY);
    if (u.u_intensity) gl.uniform1f(u.u_intensity, this.params.intensity);
    if (u.u_hue) gl.uniform1f(u.u_hue, this.params.hue);
    if (u.u_complexity) gl.uniform1f(u.u_complexity, this.params.complexity);
    if (u.u_audio)
      gl.uniform3f(u.u_audio, this.params.audioBass, this.params.audioMid, this.params.audioHigh);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Captura el canvas como PNG. Re-renderiza sincrónicamente justo antes
   * de leer el buffer para garantizar un frame válido (preserveDrawingBuffer=false).
   */
  capturePNG(): string | null {
    if (!this.program) return null;
    // render sincrónico para tener el buffer fresco
    const wasRunning = this.running;
    this.render();
    try {
      const url = this.canvas.toDataURL("image/png");
      // reanudar el loop si estaba corriendo
      if (wasRunning && !this.running) this.start();
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Graba un video WebM del canvas durante `duration` ms usando MediaRecorder.
   * Devuelve un Blob o null si no es soportado.
   */
  captureWebM(duration = 4000): Promise<Blob | null> {
    return new Promise((resolve) => {
      const canvas = this.canvas;
      const stream: MediaStream | null = typeof canvas.captureStream === "function"
        ? canvas.captureStream(30)
        : null;
      if (!stream) {
        resolve(null);
        return;
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      if (!mime) {
        resolve(null);
        return;
      }
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 4_000_000,
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: "video/webm" }));
      };
      recorder.onerror = () => resolve(null);
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, duration);
    });
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    const gl = this.gl;
    if (this.program) gl.deleteProgram(this.program);
    gl.deleteBuffer(this.buffer);
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
  }

  get elapsed() {
    return (performance.now() - this.startTime) / 1000;
  }
}
