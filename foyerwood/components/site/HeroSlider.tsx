"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Pause, Play, Star } from "lucide-react";
import { emphasize } from "@/lib/emphasize";

export interface Slide {
  image: string;
  position?: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  secondary?: { label: string; href: string };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function HeroSlider({
  slides,
  labels,
  mascot,
  assurances = [],
}: {
  slides: Slide[];
  labels: { prev: string; next: string; slide: string; pause: string; play: string };
  mascot?: { src: string; bubble: string };
  /** Short reassurances shown under the buttons (zero payment today, verified rating). */
  assurances?: Array<{ text: string; icon: "check" | "star" }>;
}) {
  const [index, setIndex] = useState(0);
  // The slideshow keeps running under the mouse; it only stops with the pause button
  // (or for visitors who ask their system to reduce motion).
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), 7000);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  return (
    <section
      className="relative isolate h-[620px] overflow-hidden bg-forest-950 text-cream lg:h-[min(82vh,760px)]"
      aria-roledescription="carousel"
    >
      {slides.map((s, i) => (
        <div
          key={s.image}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${i === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}
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
            className={`object-cover transition-transform duration-[9000ms] ease-out ${i === index ? "scale-[1.05]" : "scale-100"}`}
            style={{ objectPosition: s.position ?? "50% 50%" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(22_21_21/0.88)_0%,rgb(22_21_21/0.6)_45%,rgb(22_21_21/0.15)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-forest-950/85 to-transparent" />
        </div>
      ))}

      <div className="container-page relative z-20 flex h-full flex-col justify-end pb-24 pt-16 lg:pb-28">
        {slides.map((s, i) =>
          i === index ? (
            <div key={i} className="max-w-[46rem]">
              <p className="flex animate-fade-up items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-cream/70">
                <span className="tabular-nums text-wood">{pad(i + 1)}</span>
                <span className="h-px w-10 bg-cream/30" />
                {s.kicker}
              </p>
              <h1 className="mt-6 animate-fade-up text-[3rem] leading-[0.98] [animation-delay:100ms] sm:text-[4.6rem] lg:text-[5.6rem]">{emphasize(s.title)}</h1>
              <p className="mt-6 max-w-xl animate-fade-up text-[1.05rem] leading-relaxed text-cream/75 [animation-delay:200ms] sm:text-lg">{s.text}</p>
              <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-x-8 gap-y-4 [animation-delay:300ms]">
                <Link href={s.href} className="inline-flex h-13 items-center gap-3 rounded-[3px] bg-wood px-7 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-ember">
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </Link>
                {s.secondary && (
                  <Link href={s.secondary.href} className="text-[0.95rem] font-semibold text-cream underline decoration-cream/30 underline-offset-[7px] transition hover:decoration-cream">
                    {s.secondary.label}
                  </Link>
                )}
              </div>
              {assurances.length > 0 && (
                <ul className="mt-6 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-[0.85rem] text-cream/80 [animation-delay:400ms]">
                  {assurances.map((a) => (
                    <li key={a.text} className="flex items-center gap-2">
                      {a.icon === "star" ? <Star className="h-4 w-4 fill-wood text-wood" /> : <Check className="h-4 w-4 text-wood" />}
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null,
        )}
      </div>

      {mascot && (
        <>
          <div aria-hidden className="pointer-events-none absolute bottom-24 right-[5%] z-20 hidden animate-pop-in items-end gap-2 [animation-delay:800ms] lg:flex xl:right-[8%]">
            <p className="relative mb-36 max-w-[230px] rounded-2xl bg-cream px-4 py-3 text-[0.92rem] font-medium leading-snug text-charcoal shadow-[0_14px_30px_-12px_rgb(0_0_0/0.5)]">
              {mascot.bubble}
              <span className="absolute -bottom-1.5 right-5 h-3.5 w-3.5 rotate-45 bg-cream" />
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mascot.src} alt="" className="h-60 w-auto drop-shadow-[0_16px_24px_rgb(0_0_0/0.45)]" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img aria-hidden src={mascot.src} alt="" className="pointer-events-none absolute right-3 top-4 z-20 h-24 w-auto animate-pop-in drop-shadow-[0_10px_16px_rgb(0_0_0/0.45)] [animation-delay:800ms] lg:hidden" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-cream/10">
        <div className="container-page flex h-16 items-center gap-6">
          <span className="text-sm tabular-nums text-cream/60">
            <span className="text-cream">{pad(index + 1)}</span> / {pad(slides.length)}
          </span>
          <div className="flex flex-1 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => go(i)}
                aria-label={labels.slide.replace("{n}", String(i + 1)).replace("{total}", String(slides.length))}
                aria-current={i === index}
                className="group relative h-8 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cream/20 transition group-hover:bg-cream/40" />
                {i === index && <span key={`${index}-${paused}`} className={`absolute left-0 top-1/2 h-px -translate-y-1/2 bg-wood ${paused ? "w-full" : "slide-progress"}`} />}
                {i < index && <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cream/60" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 text-[0.8rem] font-semibold uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? labels.play : labels.pause}
              className="flex h-8 w-8 items-center justify-center text-cream/60 transition hover:text-cream"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => go(index - 1)} className="text-cream/60 transition hover:text-cream">
              {labels.prev}
            </button>
            <button type="button" onClick={() => go(index + 1)} className="text-cream transition hover:text-wood">
              {labels.next}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
