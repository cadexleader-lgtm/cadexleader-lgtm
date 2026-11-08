"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface Slide {
  image: string;
  position?: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
}

export function HeroSlider({ slides, labels, children }: { slides: Slide[]; labels: { prev: string; next: string; slide: string }; children?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), 6500);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  return (
    <section
      className="relative isolate h-[560px] overflow-hidden bg-forest-950 text-cream sm:h-[600px] lg:h-[640px]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.image}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${i === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={labels.slide.replace("{n}", String(i + 1)).replace("{total}", String(slides.length))}
        >
          <Image
            src={s.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-transform duration-[7000ms] ease-out ${i === index ? "scale-[1.08]" : "scale-100"}`}
            style={{ objectPosition: s.position ?? "50% 50%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/55 to-forest-950/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-forest-950/80 to-transparent" />
          <div className="container-page relative flex h-full items-center">
            <div className={`max-w-2xl ${i === index ? "" : "pointer-events-none"}`}>
              {i === index && (
                <>
                  <p className="kicker animate-fade-up text-wood-100">{s.kicker}</p>
                  <h1 className="mt-4 animate-fade-up text-[2.5rem] leading-[1.04] [animation-delay:120ms] sm:text-6xl lg:text-[4.2rem]">{s.title}</h1>
                  <p className="mt-5 max-w-xl animate-fade-up text-lg leading-relaxed text-cream/80 [animation-delay:240ms]">{s.text}</p>
                  <Link
                    href={s.href}
                    className="shine mt-8 inline-flex h-13 animate-fade-up items-center gap-2.5 rounded-lg bg-wood px-7 text-base font-semibold text-ink shadow-[0_12px_30px_-12px_rgb(243_154_30/0.8)] transition hover:bg-wood-600 [animation-delay:360ms]"
                  >
                    {s.cta} <ArrowRight className="h-5 w-5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {children}

      <div className="absolute inset-x-0 bottom-6 z-20">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => go(i)}
                aria-label={labels.slide.replace("{n}", String(i + 1)).replace("{total}", String(slides.length))}
                aria-current={i === index}
                className="group relative h-1.5 overflow-hidden rounded-full bg-cream/25 transition-all duration-500"
                style={{ width: i === index ? 56 : 18 }}
              >
                {i === index && <span key={`${index}-${paused}`} className={`absolute inset-y-0 left-0 rounded-full bg-wood ${paused ? "w-full" : "slide-progress"}`} />}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(index - 1)} aria-label={labels.prev} className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 ring-1 ring-cream/20 backdrop-blur transition hover:bg-wood">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 ring-1 ring-cream/20 backdrop-blur transition hover:bg-wood">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
