"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShaderCanvas } from "@/components/ShaderCanvas";
import type { ShaderId } from "@/lib/shaders";

const emptySub = () => () => {};
const useMounted = () =>
  useSyncExternalStore(emptySub, () => true, () => false);

export function EmbedClient({ shaderId }: { shaderId: ShaderId }) {
  const mounted = useMounted();
  const [params, setParams] = useState({
    hue: 0.5,
    complexity: 0.5,
    intensity: 0.4,
  });

  useEffect(() => {
    if (!mounted) return;
    const sp = new URLSearchParams(window.location.search);
    const hue = Number(sp.get("hue"));
    const comp = Number(sp.get("complexity"));
    const int = Number(sp.get("intensity"));
    // usar microtask para evitar setState síncrono en effect
    const id = setTimeout(() => {
      setParams({
        hue: Number.isFinite(hue) ? hue / 360 : 0.5,
        complexity: Number.isFinite(comp) ? comp / 100 : 0.5,
        intensity: Number.isFinite(int) ? int / 100 : 0.4,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [mounted]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <ShaderCanvas
        shader={shaderId}
        hue={params.hue}
        complexity={params.complexity}
        intensity={params.intensity}
        interactive
        rounded="rounded-none"
        className="h-full w-full"
        showFps
      />
      {/* watermark minimalista */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-10 font-mono text-[10px] text-white/30">
        noiacore · {shaderId}
      </div>
    </div>
  );
}
