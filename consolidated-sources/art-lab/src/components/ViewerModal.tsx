"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNoiaStore } from "@/lib/store";
import { SEED_OBRAS } from "@/lib/obras";
import { SHADERS, getShader, VERTEX_SHADER, type ShaderId } from "@/lib/shaders";
import { ShaderCanvas, type ShaderCanvasHandle } from "./ShaderCanvas";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  Bookmark,
  Share2,
  Cpu,
  Activity,
  Eye,
  X,
  Download,
  Maximize2,
  Minimize2,
  Code2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Video,
  Loader2,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SonicSwarmControl } from "./SonicSwarmControl";

export function ViewerModal() {
  const obraId = useNoiaStore((s) => s.viewerObraId);
  const setViewerObraId = useNoiaStore((s) => s.setViewerObraId);
  const liked = useNoiaStore((s) => s.liked);
  const collected = useNoiaStore((s) => s.collected);
  const toggleLike = useNoiaStore((s) => s.toggleLike);
  const toggleCollect = useNoiaStore((s) => s.toggleCollect);
  const draft = useNoiaStore((s) => s.draft);
  const setDraft = useNoiaStore((s) => s.setDraft);
  const setActiveShader = useNoiaStore((s) => s.setActiveShader);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const canvasHandle = useRef<ShaderCanvasHandle>(null);
  const [immersive, setImmersive] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const { isShader, obra } = useMemo(() => {
    if (!obraId) return { isShader: false, obra: null };
    if (obraId.startsWith("shader-")) {
      return { isShader: true, obra: null };
    }
    return {
      isShader: false,
      obra: SEED_OBRAS.find((o) => o.id === obraId) ?? null,
    };
  }, [obraId]);

  const open = obraId !== null;
  const id = obraId ?? "";
  const isLiked = liked.includes(id);
  const isCollected = collected.includes(id);

  const hue = obra ? obra.hue : draft.hue;
  const complexity = obra ? obra.complexity : draft.complexity;
  const intensity = obra ? obra.intensity : draft.intensity;
  const shaderId = obra ? obra.shader : draft.shader;
  // shaderDef derivado del shader activo (no del obraId) para que se actualice al navegar
  const shaderDef = getShader(shaderId);
  const title = obra ? obra.title : shaderDef.name;
  const author = obra ? obra.author : "Noiacore Lab";

  // índice del shader actual para navegación con flechas
  const currentIndex = SHADERS.findIndex((s) => s.id === shaderId);

  const navigateShader = useCallback(
    (dir: 1 | -1) => {
      if (!isShader && !obra) return;
      const next = (currentIndex + dir + SHADERS.length) % SHADERS.length;
      const target = SHADERS[next];
      if (isShader) {
        setDraft({ shader: target.id });
        setActiveShader(target.id);
      } else if (obra) {
        // para obras, cambiamos el shader del draft al navegar
        setViewerObraId("shader-" + target.id);
      }
    },
    [currentIndex, isShader, obra, setDraft, setActiveShader, setViewerObraId]
  );

  // Navegación por teclado
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (immersive) {
          e.preventDefault();
          setImmersive(false);
        } else if (showCode) {
          e.preventDefault();
          setShowCode(false);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateShader(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateShader(-1);
      } else if (e.key === "f" || e.key === "F") {
        if (!showCode) {
          e.preventDefault();
          setImmersive((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, immersive, showCode, navigateShader]);

  // Reset states al cerrar (en callback, no sincrónicamente en effect)
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setImmersive(false);
        setShowCode(false);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Leer params de URL al montar (shareable links) — una sola vez
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shaderParam = params.get("shader");
    if (!shaderParam) return;
    const valid = SHADERS.find((s) => s.id === shaderParam || s.name.toLowerCase() === shaderParam.toLowerCase());
    if (!valid) return;
    const hueParam = Number(params.get("hue"));
    const compParam = Number(params.get("complexity"));
    const intParam = Number(params.get("intensity"));
    setDraft({
      shader: valid.id,
      hue: Number.isFinite(hueParam) ? hueParam / 360 : 0.5,
      complexity: Number.isFinite(compParam) ? compParam / 100 : 0.5,
      intensity: Number.isFinite(intParam) ? intParam / 100 : 0.4,
    });
    setActiveShader(valid.id);
    // Abrir viewer tras un breve delay para que el draft se aplique
    const id = setTimeout(() => setViewerObraId("shader-" + valid.id), 600);
    return () => clearTimeout(id);
  }, []);

  const share = async () => {
    if (typeof window === "undefined") return;
    // Construir URL con parámetros del shader actual
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set("shader", shaderId);
    url.searchParams.set("hue", String(Math.round(hue * 360)));
    url.searchParams.set("complexity", String(Math.round(complexity * 100)));
    url.searchParams.set("intensity", String(Math.round(intensity * 100)));
    const shareUrl = url.toString();
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushNotification({
        title: "Enlace copiado",
        body: "URL con parámetros del shader lista para compartir.",
        tone: "teal",
      });
    } catch {
      pushNotification({
        title: "No se pudo copiar",
        body: "Copia manualmente desde la barra de direcciones.",
        tone: "red",
      });
    }
  };

  const exportPNG = () => {
    const url = canvasHandle.current?.capture();
    if (!url) {
      pushNotification({
        title: "No se pudo exportar",
        body: "El canvas no está disponible para captura.",
        tone: "red",
      });
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `noiacore-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    pushNotification({
      title: "PNG exportado",
      body: `Captura de '${title}' descargada.`,
      tone: "teal",
    });
  };

  const exportWebM = async () => {
    if (recording) return;
    setRecording(true);
    pushNotification({
      title: "Grabando video…",
      body: "Capturando 4 segundos del shader en WebM.",
      tone: "amber",
    });
    try {
      const blob = await canvasHandle.current?.captureWebM(4000);
      if (!blob) {
        pushNotification({
          title: "Video no soportado",
          body: "Tu navegador no soporta MediaRecorder WebM.",
          tone: "red",
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noiacore-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pushNotification({
        title: "WebM exportado",
        body: `Video de '${title}' descargado (${(blob.size / 1024).toFixed(0)} KB).`,
        tone: "teal",
      });
    } catch {
      pushNotification({
        title: "Error al grabar",
        body: "No se pudo capturar el video.",
        tone: "red",
      });
    } finally {
      setRecording(false);
    }
  };

  const fullCode = useMemo(() => {
    const def = shaderDef ?? getShader(shaderId);
    return `// Noiacore — ${def.name} (${def.nameEs})
// ${def.tag} · ${def.compat} · ${def.precision}
precision highp float;
${VERTEX_SHADER}\n${def.source}`;
  }, [shaderDef, shaderId, VERTEX_SHADER]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
      pushNotification({
        title: "Código GLSL copiado",
        body: `${fullCode.length} caracteres · shader ${shaderId}`,
        tone: "teal",
      });
    } catch {
      pushNotification({
        title: "No se pudo copiar",
        body: "El portapapeles no está disponible.",
        tone: "red",
      });
    }
  };

  const embedCode = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.pathname = `/embed/${shaderId}`;
    url.hash = "";
    url.search = "";
    url.searchParams.set("hue", String(Math.round(hue * 360)));
    url.searchParams.set("complexity", String(Math.round(complexity * 100)));
    url.searchParams.set("intensity", String(Math.round(intensity * 100)));
    return `<iframe src="${url.toString()}" width="640" height="360" frameborder="0" allow="autoplay" aria-label="Noiacore · ${title}" title="Noiacore · ${title}"></iframe>`;
  }, [shaderId, hue, complexity, intensity, title]);

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 1800);
      pushNotification({
        title: "Código embed copiado",
        body: "Pégalo en cualquier HTML para incrustar la obra.",
        tone: "teal",
      });
    } catch {
      pushNotification({
        title: "No se pudo copiar",
        body: "El portapapeles no está disponible.",
        tone: "red",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setViewerObraId(null)}>
      <DialogContent
        className={cn(
          "glass-strong overflow-hidden rounded-2xl border-border/70 p-0",
          immersive
            ? "max-w-none !m-0 h-screen w-screen rounded-none border-0"
            : "max-w-5xl sm:max-w-6xl"
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div
          className={cn(
            "grid",
            immersive ? "grid-cols-1" : "lg:grid-cols-[1.4fr_1fr]"
          )}
        >
          {/* Canvas */}
          <div
            className={cn(
              "relative",
              immersive ? "h-screen" : "aspect-square lg:aspect-auto lg:min-h-[520px]"
            )}
          >
            <ShaderCanvas
              ref={canvasHandle}
              shader={shaderId}
              hue={hue}
              complexity={complexity}
              intensity={intensity}
              className="h-full w-full"
              rounded="rounded-none"
              showFps
            />
            <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
            {/* top bar */}
            <div className="absolute right-3 top-3 flex gap-1.5">
              <button
                onClick={() => navigateShader(-1)}
                aria-label="Shader anterior (←)" title="Shader anterior (←)"
                className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateShader(1)}
                aria-label="Shader siguiente (→)" title="Shader siguiente (→)"
                className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowCode((v) => !v)}
                aria-label="Ver código GLSL" title="Ver código GLSL"
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md backdrop-blur transition-colors",
                  showCode
                    ? "bg-[oklch(0.92_0.02_250)] text-background"
                    : "bg-background/70 text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setImmersive((v) => !v)}
                aria-label="Modo inmersivo (F)" title="Modo inmersivo (F)"
                className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                {immersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setViewerObraId(null)}
                className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* overlay title (oculto en inmersivo) */}
            {!immersive && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[oklch(0.92_0.02_250)]">
                      {shaderDef ? shaderDef.tag : obra?.shader} · {String(currentIndex + 1).padStart(2, "0")}/{SHADERS.length}
                    </div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
                      {title}
                    </h2>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                      por {author}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleLike(id)}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-md backdrop-blur transition-colors",
                        isLiked ? "bg-[oklch(0.50_0.045_255)] text-background" : "bg-background/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    </button>
                    <button
                      onClick={() => toggleCollect(id)}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-md backdrop-blur transition-colors",
                        isCollected ? "bg-[oklch(0.78_0.025_250)] text-background" : "bg-background/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Bookmark className={cn("h-4 w-4", isCollected && "fill-current")} />
                    </button>
                    <button
                      onClick={share}
                      className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={exportPNG}
                      aria-label="Exportar PNG" title="Exportar PNG"
                      className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-[oklch(0.92_0.02_250)]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={exportWebM}
                      disabled={recording}
                      aria-label="Grabar video WebM (4s)" title="Grabar video WebM (4s)"
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-md backdrop-blur transition-colors",
                        recording
                          ? "bg-[oklch(0.50_0.03_255)]/30 text-[oklch(0.50_0.03_255)]"
                          : "bg-background/70 text-muted-foreground hover:text-[oklch(0.50_0.045_255)]"
                      )}
                    >
                      {recording ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel de código GLSL (overlay) */}
            {showCode && (
              <div className="absolute inset-x-0 bottom-0 top-16 z-20 glass-strong overflow-auto border-t border-border/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[oklch(0.92_0.02_250)]" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      fragment shader · {shaderId}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={copyCode}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                        copiedCode
                          ? "bg-[oklch(0.92_0.02_250)] text-background"
                          : "bg-secondary/60 text-foreground hover:bg-secondary"
                      )}
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCode ? "copiado" : "copiar"}
                    </button>
                    <button
                      onClick={() => setShowCode(false)}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-border/50 bg-[oklch(0.10_0.02_230)] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
                  <code>{fullCode}</code>
                </pre>
                <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
                  <span>{fullCode.split("\n").length} líneas</span>
                  <span>{fullCode.length} caracteres</span>
                  <span>precisión {shaderDef?.precision ?? "highp"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Side panel (oculto en inmersivo) */}
          {!immersive && (
            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  descripción
                </div>
                <p className="mt-1.5 text-sm text-foreground/85">
                  {obra ? obra.excerpt : shaderDef?.description}
                </p>
              </div>

              {/* Parámetros editables (solo para shaders / draft) */}
              {isShader && (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-[oklch(0.92_0.02_250)]" />
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      parámetros en vivo
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    <ParamSlider
                      label="matiz"
                      value={Math.round(draft.hue * 360)}
                      min={0}
                      max={360}
                      onChange={(v) => setDraft({ hue: v / 360 })}
                    />
                    <ParamSlider
                      label="complejidad"
                      value={Math.round(draft.complexity * 100)}
                      min={0}
                      max={100}
                      onChange={(v) => setDraft({ complexity: v / 100 })}
                    />
                    <ParamSlider
                      label="intensidad"
                      value={Math.round(draft.intensity * 100)}
                      min={0}
                      max={100}
                      onChange={(v) => setDraft({ intensity: v / 100 })}
                    />
                  </div>
                  {/* shader switch */}
                  <div className="mt-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      fragment shader
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {SHADERS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setDraft({ shader: s.id });
                            setActiveShader(s.id);
                          }}
                          className={cn(
                            "rounded-md border px-2 py-1.5 font-mono text-[10px] transition-colors",
                            draft.shader === s.id
                              ? "border-[oklch(0.92_0.02_250)]/60 bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                              : "border-border/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Enjambre sónico */}
              <SonicSwarmControl />

              {/* tech footer */}
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Cpu className="h-3 w-3" /> precisión
                  </div>
                  <div className="mt-1 text-foreground">
                    {shaderDef?.precision ?? "highp"}
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Activity className="h-3 w-3" /> fps
                  </div>
                  <div className="mt-1 text-foreground">60</div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" /> vistas
                  </div>
                  <div className="mt-1 text-foreground">
                    {obra ? obra.views.toLocaleString() : "—"}
                  </div>
                </div>
              </div>

              {/* atajos de teclado */}
              <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  atajos
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <span><kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground">←</kbd> anterior</span>
                  <span><kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground">→</kbd> siguiente</span>
                  <span><kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground">F</kbd> inmersivo</span>
                  <span><kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground">Esc</kbd> salir</span>
                </div>
              </div>

              {/* Embed */}
              <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    incrustar
                  </div>
                  <button
                    onClick={() => setShowEmbed((v) => !v)}
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] transition-colors",
                      showEmbed
                        ? "bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code className="h-3 w-3" />
                    {showEmbed ? "ocultar" : "ver código"}
                  </button>
                </div>
                {showEmbed && (
                  <div className="mt-2">
                    <pre className="overflow-x-auto rounded-md border border-border/40 bg-[oklch(0.10_0.02_230)] p-2 font-mono text-[10px] leading-relaxed text-foreground/70">
                      <code>{embedCode}</code>
                    </pre>
                    <button
                      onClick={copyEmbed}
                      className={cn(
                        "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                        copiedEmbed
                          ? "bg-[oklch(0.92_0.02_250)] text-background"
                          : "bg-secondary/60 text-foreground hover:bg-secondary"
                      )}
                    >
                      {copiedEmbed ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedEmbed ? "copiado" : "copiar iframe"}
                    </button>
                  </div>
                )}
              </div>

              {obra && (
                <div className="flex flex-wrap gap-1.5">
                  {obra.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[oklch(0.92_0.02_250)]"
        aria-label={label}
      />
    </div>
  );
}
