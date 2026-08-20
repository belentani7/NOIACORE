"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useNoiaStore } from "@/lib/store";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySub = () => () => {};
const useMounted = () =>
  useSyncExternalStore(emptySub, () => true, () => false);

interface TourStep {
  target: string;
  title: string;
  body: string;
  placement: "center" | "bottom";
}

const STEPS: TourStep[] = [
  {
    target: "#top",
    title: "Bienvenida al laboratorio",
    body: "Noiacore es un estudio donde los shaders GLSL se vuelven obras que respiran. Te llevaremos por un recorrido rápido de 6 pasos.",
    placement: "center",
  },
  {
    target: "#shaders",
    title: "La paleta viva",
    body: "Nueve fragment shaders escritos a mano, compilados en tu navegador. Pasa el cursor por encima para acelerar el tiempo y mover el campo.",
    placement: "bottom",
  },
  {
    target: "#galeria",
    title: "Galería de obras",
    body: "Cada tarjeta ejecuta su shader en tiempo real. Dale like, guárdala, remezcla sus parámetros o abre el visor para ajustarla.",
    placement: "bottom",
  },
  {
    target: "#estudio",
    title: "El estudio",
    body: "Compón tu propia obra: elige un shader, mueve los parámetros en vivo y publícala al ecosistema. El terminal responde a comandos.",
    placement: "bottom",
  },
  {
    target: "#paletas",
    title: "Generador de paletas",
    body: "Selecciona un matiz y una armonía. Cada swatch copia su hex al instante. Aplica la paleta al estudio y verás el shader reaccionar.",
    placement: "bottom",
  },
  {
    target: "#ecosistema",
    title: "Ecosistema en vivo",
    body: "El feed muestra actividad en tiempo real. Activa el Enjambre Sónico desde la barra superior para una experiencia audiovisual.",
    placement: "bottom",
  },
];

export function OnboardingTour() {
  const tourActive = useNoiaStore((s) => s.tourActive);
  const tourStep = useNoiaStore((s) => s.tourStep);
  const nextTourStep = useNoiaStore((s) => s.nextTourStep);
  const prevTourStep = useNoiaStore((s) => s.prevTourStep);
  const endTour = useNoiaStore((s) => s.endTour);
  const mounted = useMounted();

  // Auto-start tour on first visit (no persisted tourSeen flag)
  useEffect(() => {
    if (!mounted) return;
    try {
      const seen = localStorage.getItem("noiacore-tour-seen");
      if (!seen && !tourActive) {
        const id = setTimeout(() => {
          useNoiaStore.getState().startTour();
        }, 1200);
        return () => clearTimeout(id);
      }
    } catch {
      /* noop */
    }
  }, [mounted, tourActive]);

  if (!tourActive || !mounted) return null;

  const step = STEPS[tourStep];
  if (!step) return null;
  const isLast = tourStep === STEPS.length - 1;
  const progress = ((tourStep + 1) / STEPS.length) * 100;

  // Scroll target into view
  if (typeof document !== "undefined") {
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const finish = () => {
    try {
      localStorage.setItem("noiacore-tour-seen", "1");
    } catch {
      /* noop */
    }
    endTour();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={finish}
      />
      {/* Tooltip card */}
      <div
        className={cn(
          "glass-strong relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-border/70 p-6 noia-rise",
          step.placement === "center" ? "shadow-2xl" : "shadow-2xl"
        )}
      >
        {/* progress bar */}
        <div className="absolute left-0 top-0 h-1 bg-gradient-to-r from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)]" style={{ width: `${progress}%` }} />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[oklch(0.92_0.02_250)]/15 text-[oklch(0.92_0.02_250)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              paso {tourStep + 1} / {STEPS.length}
            </span>
          </div>
          <button
            onClick={finish}
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tourStep === 0
                ? "cursor-not-allowed text-muted-foreground/40"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </button>

          {/* dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => useNoiaStore.getState().setTourStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === tourStep
                    ? "w-5 bg-[oklch(0.92_0.02_250)]"
                    : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                )}
                aria-label={`Ir al paso ${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={finish}
              className="flex items-center gap-1.5 rounded-md bg-[oklch(0.92_0.02_250)] px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-[oklch(0.78_0.14_195)]"
            >
              Empezar a crear
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={nextTourStep}
              className="flex items-center gap-1.5 rounded-md bg-[oklch(0.92_0.02_250)] px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-[oklch(0.78_0.14_195)]"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
