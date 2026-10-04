"use client";

import { useState } from "react";
import { useNoiaStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Terminal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const open = useNoiaStore((s) => s.authOpen);
  const setOpen = useNoiaStore((s) => s.setAuthOpen);
  const signIn = useNoiaStore((s) => s.signIn);
  const pushNotification = useNoiaStore((s) => s.pushNotification);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = handle.trim().replace(/^@/, "");
    if (!h) return;
    setBusy(true);
    // Simula una llamada de auth
    setTimeout(() => {
      signIn(h, name.trim() || h);
      setBusy(false);
      pushNotification({
        title: mode === "in" ? "Sesión iniciada" : "Cuenta creada",
        body: `Bienvenida al laboratorio, @${h}`,
        tone: "teal",
      });
      setHandle("");
      setName("");
    }, 650);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong max-w-md overflow-hidden rounded-2xl border-border/70 p-0">
        {/* header banner with mini shader feel */}
        <div className="relative h-24 overflow-hidden border-b border-border/70 bg-[oklch(0.16_0.02_230)]">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(120% 120% at 20% 0%, oklch(0.92 0.02 250 / 0.4), transparent 50%), radial-gradient(120% 120% at 100% 100%, oklch(0.50 0.045 255 / 0.35), transparent 50%)",
            }}
          />
          <div className="scanlines absolute inset-0" />
          <div className="absolute bottom-3 left-5 flex items-center gap-2">
            <span className="relative grid h-8 w-8 place-items-center">
              <span className="absolute inset-0 rotate-45 rounded-[6px] bg-gradient-to-br from-[oklch(0.92_0.02_250)] to-[oklch(0.50_0.045_255)]" />
              <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
            </span>
            <div>
              <div className="font-[family-name:var(--font-display)] text-sm font-extrabold">
                noia<span className="text-[oklch(0.92_0.02_250)]">core</span>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                acceso al laboratorio
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              {mode === "in" ? "Entrar al laboratorio" : "Crear tu cuenta"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {mode === "in"
                ? "Tu colección y tus likes se sincronizan con tu identidad."
                : "Solo necesitamos un identificador. Sin contraseñas, sin fricción."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="handle" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                identificador
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/\s/g, "").slice(0, 24))}
                  placeholder="lumen"
                  required
                  autoFocus
                  className="bg-background/60 pl-7 font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                nombre visible <span className="text-muted-foreground/60">(opcional)</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Lumen Vera"
                className="bg-background/60"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !handle.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg bg-[oklch(0.92_0.02_250)] px-4 py-2.5 text-sm font-semibold text-background transition-all",
                busy ? "opacity-70" : "hover:bg-[oklch(0.78_0.14_195)] hover:shadow-[0_0_24px_oklch(0.92_0.02_250_/_0.45)]",
                !handle.trim() && "cursor-not-allowed opacity-50"
              )}
            >
              {busy ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/40 border-t-background" />
                  conectando…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {mode === "in" ? "Entrar" : "Crear cuenta"}
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between font-mono text-[11px]">
            <button
              onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
              className="text-[oklch(0.92_0.02_250)] hover:underline"
            >
              {mode === "in" ? "¿Sin cuenta? créala" : "¿Ya tienes cuenta? entra"}
            </button>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Shield className="h-3 w-3" /> sesión local
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-border/50 bg-background/40 p-3 font-mono text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[oklch(0.92_0.02_250)]">
              <Terminal className="h-3 w-3" /> demo
            </div>
            <p className="mt-1 leading-relaxed">
              No se envían datos a ningún servidor. La identidad se guarda en tu
              navegador (localStorage). Ideal para probar el flujo completo del
              laboratorio.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
