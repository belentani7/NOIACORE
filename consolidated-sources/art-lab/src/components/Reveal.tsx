"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** dirección de entrada */
  direction?: "up" | "down" | "left" | "right" | "fade";
}

/**
 * Componente que revela su contenido con una animación suave
 * cuando entra en el viewport (IntersectionObserver).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hiddenClass = {
    up: "translate-y-8 opacity-0",
    down: "-translate-y-8 opacity-0",
    left: "translate-x-8 opacity-0",
    right: "-translate-x-8 opacity-0",
    fade: "opacity-0",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible ? "translate-x-0 translate-y-0 opacity-100" : hiddenClass,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
