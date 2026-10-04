"use client";

import { useEffect, useRef } from "react";

/**
 * NoiacoreAtmosphere — capa atmosférica completa del universo NOIACORE.
 * Incluye: partículas escasas (B01), grano cinematográfico (B05),
 * viñeta (B08), campo etéreo (B07), anillos concéntricos SVG (B03),
 * eje de luz vertical (B04).
 * Todo sin dependencias externas, puro CSS + canvas.
 */
export function NoiacoreAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let particles: { x: number; y: number; r: number; vy: number; o: number }[] = [];
    const N = 42;

    const size = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const seed = () => {
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.2,
        vy: -(Math.random() * 0.08 + 0.02),
        o: Math.random() * 0.3 + 0.05,
      }));
    };

    let rafId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,240,255,${p.o})`;
        ctx.fill();
        p.y += p.vy;
        if (p.y < -4) {
          p.y = H + 4;
          p.x = Math.random() * W;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    size();
    seed();
    tick();

    const onResize = () => {
      size();
      seed();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* B01 — Partículas escasas */}
      <canvas
        ref={canvasRef}
        className="nc-particles fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* B03 — Anillos concéntricos SVG con respiración */}
      <div
        className="fixed inset-0 z-0 grid place-items-center pointer-events-none"
        aria-hidden="true"
      >
        <svg
          className="nc-rings-svg"
          viewBox="0 0 600 600"
          aria-hidden="true"
          style={{
            width: "min(80vmin, 720px)",
            animation: "ncBreath 9s cubic-bezier(.22,.61,.21,1) infinite",
          }}
        >
          <g fill="none" stroke="#E8F0FF">
            <circle cx="300" cy="300" r="90" strokeOpacity=".10" />
            <circle cx="300" cy="300" r="160" strokeOpacity=".07" />
            <circle cx="300" cy="300" r="230" strokeOpacity=".05" />
            <circle cx="300" cy="300" r="290" strokeOpacity=".03" />
          </g>
        </svg>
      </div>

      {/* B04 — Eje de luz vertical */}
      <div
        className="nc-beam pointer-events-none"
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "1px",
          background:
            "linear-gradient(to bottom, transparent, rgba(232,240,255,.28) 35%, rgba(232,240,255,.28) 65%, transparent)",
          filter: "blur(.4px)",
          animation: "ncBeam 12s cubic-bezier(.22,.61,.21,1) infinite",
          zIndex: 1,
        }}
      />

      {/* B07 — Campo etéreo */}
      <div
        className="nc-ether pointer-events-none"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(60% 40% at 50% 30%, rgba(26,42,64,.30), transparent 70%), radial-gradient(40% 30% at 50% 70%, rgba(15,28,46,.40), transparent 70%)",
        }}
      />

      {/* B05 — Grano cinematográfico */}
      <div
        className="nc-grain pointer-events-none"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: "-50%",
          zIndex: 60,
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          animation: "ncGrain 8s steps(10) infinite",
        }}
      />

      {/* B08 — Viñeta cinematográfica */}
      <div
        className="nc-vignette pointer-events-none"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.7) 100%)",
        }}
      />
    </>
  );
}
