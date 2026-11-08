"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { emphasize } from "@/lib/emphasize";

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
  const arrow = "flex h-11 w-11 items-center justify-center rounded-[3px] text-forest ring-1 ring-inset ring-forest/20 transition hover:bg-forest hover:text-cream disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-forest";
  return (
    <div>
      <div className="mb-8 flex items-end gap-6 border-t border-forest/15 pt-6">
        <h2 className="flex-1 text-[2.2rem] leading-[1.02] text-forest sm:text-[2.9rem]">{emphasize(title)}</h2>
        {action}
        <div className="flex gap-1">
          <button type="button" className={arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label={prevLabel}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" className={arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label={nextLabel}>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div key={i} className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
