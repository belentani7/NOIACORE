"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { useNoiaStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "¿Qué es exactamente Noiacore?",
    a: "Es un laboratorio de arte generativo en el navegador. Cada obra es un fragment shader GLSL escrito a mano que se compila y ejecuta en tu GPU en tiempo real. No hay imágenes pre-renderizadas: todo es matemática y luz.",
  },
  {
    q: "¿Necesito una GPU potente?",
    a: "No. Los shaders están optimizados para funcionar a 60fps en GPUs integradas modernas. El motor pausa automáticamente los canvas que no están en el viewport para ahorrar recursos.",
  },
  {
    q: "¿Las obras se guardan en algún servidor?",
    a: "Tu identidad, likes y colección se guardan localmente en tu navegador (localStorage). Las obras publicadas se almacenan en una base de datos SQLite ligera. No hay cuentas con contraseña: es un lab, no un banco.",
  },
  {
    q: "¿Qué es el Enjambre Sónico?",
    a: "Un sintetizador generativo con Web Audio API: drones + arpegio pentatónico modulados por un filtro LFO. Las bandas de audio (bass/mid/high) pueden activarse para modular los shaders en tiempo real, creando una experiencia audiovisual reactiva.",
  },
  {
    q: "¿Puedo exportar las obras?",
    a: "Sí. Abre cualquier obra en el visor y pulsa el botón 'Exportar PNG'. Se descargará una captura del shader en su resolución nativa.",
  },
  {
    q: "¿Puedo remezclar una obra?",
    a: "Por supuesto. Pulsa 'Remezclar' en cualquier tarjeta de la galería y sus parámetros se cargarán en el estudio, donde puedes ajustarlos y publicar tu propia versión.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const setAuthOpen = useNoiaStore((s) => s.setAuthOpen);
  const user = useNoiaStore((s) => s.user);

  return (
    <section id="faq" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* Left: intro + CTA */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.78_0.025_250)]">
              preguntas frecuentes
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitas saber antes de crear
            </h2>
            <p className="mt-4 text-muted-foreground">
              Si tienes una duda que no aparece aquí, abrela en el terminal con el
              comando <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-[oklch(0.92_0.02_250)]">ayuda</code>.
            </p>

            {/* CTA card */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-[oklch(0.20_0.04_195_/_0.6)] to-card/50 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[oklch(0.78_0.025_250)]" />
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold">
                  ¿Listo para publicar tu primera obra?
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Entra al laboratorio, abre el estudio y escribe un título. El resto
                lo hace el shader.
              </p>
              <button
                onClick={() => (user ? document.getElementById("estudio")?.scrollIntoView({ behavior: "smooth" }) : setAuthOpen(true))}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[oklch(0.92_0.02_250)] px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-[oklch(0.78_0.14_195)] hover:shadow-[0_0_24px_oklch(0.92_0.02_250_/_0.45)]"
              >
                {user ? "Ir al estudio" : "Entrar y crear"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Right: accordion */}
          <div className="space-y-2.5">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-card/50 transition-colors",
                    isOpen ? "border-[oklch(0.92_0.02_250)]/40" : "border-border/60"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="font-[family-name:var(--font-display)] text-sm font-semibold sm:text-base">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180 text-[oklch(0.92_0.02_250)]"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
