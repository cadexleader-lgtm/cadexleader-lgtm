"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades and lifts its content into view when it enters the viewport.
 * Content stays visible without JavaScript and for reduced-motion users.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  variant = "up",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  variant?: "up" | "fade" | "scale" | "left" | "right";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.shown = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = "true";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-reveal={variant} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties} className={className}>
      {children}
    </Tag>
  );
}
