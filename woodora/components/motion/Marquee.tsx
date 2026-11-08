import type { ReactNode } from "react";

/** Infinite CSS marquee (pauses on hover, stops for reduced motion). */
export function Marquee({
  children,
  direction = "left",
  duration = 40,
  className = "",
  itemClassName = "",
}: {
  children: ReactNode[];
  direction?: "left" | "right" | "up" | "down";
  duration?: number;
  className?: string;
  itemClassName?: string;
}) {
  const vertical = direction === "up" || direction === "down";
  const track = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className={`marquee-track flex shrink-0 ${vertical ? "flex-col" : "flex-row"} ${itemClassName}`}
      style={{ animationDuration: `${duration}s`, animationName: vertical ? "marquee-y" : "marquee-x", animationDirection: direction === "right" || direction === "down" ? "reverse" : "normal" }}
    >
      {children}
    </div>
  );
  return (
    <div className={`marquee group flex overflow-hidden ${vertical ? "flex-col" : "flex-row"} ${className}`}>
      {track(false)}
      {track(true)}
    </div>
  );
}
