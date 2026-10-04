"use client";

import { useEffect } from "react";

/**
 * NoiacoreCursor — cursor luminoso con rastro frío (C04).
 * Solo en dispositivos con puntero fino (no táctil).
 * Punto pequeño luminoso + anillo con seguimiento suave.
 */
export function NoiacoreCursor() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.createElement("div");
    dot.className = "nc-cursor";
    const trail = document.createElement("div");
    trail.className = "nc-trail";
    document.body.append(trail, dot);

    document.body.style.cursor = "none";

    let tx = 0, ty = 0, x = 0, y = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px)`;
    };

    let rafId = 0;
    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      trail.style.transform = `translate(${x}px, ${y}px)`;
      rafId = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      dot.remove();
      trail.remove();
      document.body.style.cursor = "";
    };
  }, []);

  return null;
}
