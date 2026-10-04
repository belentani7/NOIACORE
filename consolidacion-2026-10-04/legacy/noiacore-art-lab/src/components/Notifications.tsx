"use client";

import { useNoiaStore } from "@/lib/store";
import { X, Bell } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Patrón de hidratación seguro: false en servidor, true en cliente.
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

const TONE: Record<string, string> = {
  teal: "border-[oklch(0.92_0.02_250)]/50 text-[oklch(0.92_0.02_250)]",
  magenta: "border-[oklch(0.50_0.045_255)]/50 text-[oklch(0.50_0.045_255)]",
  amber: "border-[oklch(0.78_0.025_250)]/50 text-[oklch(0.78_0.025_250)]",
  red: "border-[oklch(0.50_0.03_255)]/50 text-[oklch(0.50_0.03_255)]",
};

export function Notifications() {
  const notifications = useNoiaStore((s) => s.notifications);
  const dismiss = useNoiaStore((s) => s.dismissNotification);
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "noia-rise pointer-events-auto flex items-start gap-3 rounded-xl border bg-[oklch(0.16_0.02_230_/_0.95)] p-3 shadow-[0_8px_32px_-8px_oklch(0_0_0_/_0.6)] backdrop-blur",
            TONE[n.tone]
          )}
        >
          <Bell className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">{n.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
