"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "./CartProvider";

const SEEN_KEY = "foyerwood-exit-shown";

/**
 * Reminder shown once per visit when a visitor with items in their pre-order
 * moves the mouse out of the page (desktop only). Truthful message: the
 * firewood is not reserved until the pre-order is sent.
 */
export function ExitIntent({
  hideOn,
  preorderHref,
  labels,
}: {
  hideOn: string[];
  preorderHref: string;
  labels: { title: string; text: string; cta: string; stay: string };
}) {
  const { count, ready, drawerOpen } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const since = useRef(Date.now());
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const blocked = !ready || count === 0 || drawerOpen || hideOn.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (blocked) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 0) return;
      if (Date.now() - since.current < 8000) return;
      try {
        if (sessionStorage.getItem(SEEN_KEY)) return;
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* private mode: show it anyway, once per page */
      }
      setOpen(true);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [blocked]);

  useEffect(() => {
    if (!open) return;
    ctaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/55 backdrop-blur-[2px] animate-fade-in" onClick={() => setOpen(false)} />
      <div role="dialog" aria-modal="true" aria-labelledby="exit-title" className="relative w-full max-w-md animate-pop-in rounded-[var(--radius-card)] bg-cream p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={labels.stay}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-[3px] text-forest hover:bg-cream-200"
        >
          <X className="h-5 w-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/foyo.svg" alt="" className="mx-auto h-32 w-auto" />
        <p id="exit-title" className="mt-4 font-display text-[1.9rem] leading-tight text-forest">{labels.title}</p>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{labels.text}</p>
        <Link
          ref={ctaRef}
          href={preorderHref}
          onClick={() => setOpen(false)}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-[3px] bg-wood text-[0.95rem] font-semibold text-ink transition-colors hover:bg-ember"
        >
          {labels.cta}
        </Link>
        <button type="button" onClick={() => setOpen(false)} className="mt-2 h-10 w-full text-sm font-medium text-forest underline-offset-4 hover:underline">
          {labels.stay}
        </button>
      </div>
    </div>
  );
}
