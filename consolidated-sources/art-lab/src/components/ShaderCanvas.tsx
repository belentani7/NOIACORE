"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { ShaderRenderer, type ShaderParams } from "@/lib/webgl-engine";
import type { ShaderId } from "@/lib/shaders";
import { useNoiaStore } from "@/lib/store";

interface ShaderCanvasProps {
  shader: ShaderId;
  hue?: number;
  complexity?: number;
  intensity?: number;
  className?: string;
  interactive?: boolean;
  showFps?: boolean;
  rounded?: string;
}

export interface ShaderCanvasHandle {
  /** Captura el canvas como data URL PNG (o null si falla). */
  capture: () => string | null;
  /** Graba un video WebM del canvas durante `duration` ms. */
  captureWebM: (duration?: number) => Promise<Blob | null>;
}

/**
 * Canvas WebGL reutilizable. Se pausa (no destruye) cuando no es visible
 * (IntersectionObserver). El hover acelera el tiempo y sube la intensidad.
 * Respeta prefers-reduced-motion.
 */
export const ShaderCanvas = forwardRef<ShaderCanvasHandle, ShaderCanvasProps>(
  function ShaderCanvas(
    {
      shader,
      hue = 0.5,
      complexity = 0.5,
      intensity = 0.4,
      className = "",
      interactive = true,
      showFps = false,
      rounded = "rounded-lg",
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<ShaderRenderer | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [fps, setFps] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const animationsEnabled = useNoiaStore((s) => s.animationsEnabled);
    const animRef = useRef(animationsEnabled);
    useEffect(() => { animRef.current = animationsEnabled; }, [animationsEnabled]);
    const audioBands = useNoiaStore((s) => s.audioBands);
    const audioReactive = useNoiaStore((s) => s.audioReactive);

    useImperativeHandle(ref, () => ({
      capture: () => rendererRef.current?.capturePNG() ?? null,
      captureWebM: (duration?: number) =>
        rendererRef.current?.captureWebM(duration) ?? Promise.resolve(null),
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      let renderer: ShaderRenderer;
      try {
        renderer = new ShaderRenderer(canvas, showFps ? setFps : undefined);
      } catch (e) {
        // Error de init WebGL (sistema externo); registrar es legítimo.
        setError(e instanceof Error ? e.message : "WebGL no disponible");
        return;
      }
      rendererRef.current = renderer;
      try {
        renderer.setShader(shader);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de shader");
        return;
      }
      const params: ShaderParams = {
        time: Math.random() * 50,
        intensity,
        hue,
        complexity,
        mouseX: 0.5,
        mouseY: 0.5,
        audioBass: 0,
        audioMid: 0,
        audioHigh: 0,
      };
      renderer.setParams(params);
      renderer.start();

      // Visibilidad → pausa/reanuda el loop (mantiene el contexto)
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            renderer.setVisible(e.isIntersecting && animRef.current);
          }
        },
        { threshold: 0.05, rootMargin: "120px" }
      );
      io.observe(wrap);

      return () => {
        io.disconnect();
        renderer.dispose();
        rendererRef.current = null;
      };
    }, [shader]);

    // Reactivo a parámetros
    useEffect(() => {
      rendererRef.current?.setParams({ hue, complexity, intensity });
    }, [hue, complexity, intensity]);

    // Reactivo a bandas de audio (Enjambre Sónico)
    useEffect(() => {
      if (!audioReactive) {
        rendererRef.current?.setParams({ audioBass: 0, audioMid: 0, audioHigh: 0 });
        return;
      }
      rendererRef.current?.setParams({
        audioBass: audioBands.bass,
        audioMid: audioBands.mid,
        audioHigh: audioBands.high,
      });
    }, [audioBands, audioReactive]);

    // Reactivo a animaciones globales
    useEffect(() => {
      const r = rendererRef.current;
      if (!r) return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (animationsEnabled) {
        const rect = wrap.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;
        r.setVisible(visible);
      } else {
        r.setVisible(false);
      }
    }, [animationsEnabled]);

    const handleMove = (e: React.MouseEvent) => {
      if (!interactive) return;
      const r = rendererRef.current;
      if (!r) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      r.setMouse(x, y);
    };
    const handleEnter = () => {
      if (!interactive) return;
      rendererRef.current?.setHover(true);
    };
    const handleLeave = () => {
      if (!interactive) return;
      rendererRef.current?.setHover(false);
      rendererRef.current?.setMouse(0.5, 0.5);
    };

    return (
      <div
        ref={wrapRef}
        className={`relative overflow-hidden ${rounded} ${className}`}
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {error ? (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[oklch(0.24_0.04_230)] to-[oklch(0.16_0.02_230)]">
            <div className="text-center px-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                fallback
              </p>
              <p className="mt-1 text-xs text-foreground/70">shader no disponible</p>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="block h-full w-full" />
        )}
        {showFps && fps !== null && (
          <div className="pointer-events-none absolute right-2 top-2 rounded bg-background/70 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            {fps} fps
          </div>
        )}
      </div>
    );
  }
);
