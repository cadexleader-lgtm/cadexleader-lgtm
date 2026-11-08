"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Horizontal, snap-scrolling carousel with arrow controls (touch friendly). */
export function Carousel({ title, children, prevLabel, nextLabel, action }: { title: string; children: ReactNode[]; prevLabel: string; nextLabel: string; action?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  const arrow = "flex h-9 w-9 items-center justify-center rounded-md bg-white text-charcoal ring-1 ring-line transition hover:bg-wood hover:text-ink hover:ring-wood disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-charcoal disabled:hover:ring-line";
  return (
    <div>
      <div className="mb-7 flex items-center gap-5">
        <h2 className="shrink-0 text-[1.75rem] text-forest sm:text-[2.1rem]">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" aria-hidden />
        {action}
        <div className="flex gap-1.5">
          <button type="button" className={arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label={prevLabel}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className={arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label={nextLabel}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 pt-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div key={i} className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
