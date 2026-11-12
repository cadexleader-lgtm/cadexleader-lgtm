"use client";

import { useEffect, useState } from "react";
import { AddButton } from "./AddToCart";
import { ProductVisual } from "@/components/site/ProductVisual";

/**
 * Product page: once the main "add" box has scrolled out of view, a slim bar
 * keeps the price and the add button within reach.
 */
export function StickyBuyBar({
  targetId,
  productId,
  name,
  image,
  price,
  unit,
  minQty,
  note,
  labels,
}: {
  targetId: string;
  productId: string;
  name: string;
  image: string | null;
  price: string;
  unit: string;
  minQty: number;
  note: string;
  labels: { add: string; added: string };
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  // Lets the floating cart move up while the bar is shown.
  useEffect(() => {
    document.documentElement.dataset.stickyBar = show ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.stickyBar;
    };
  }, [show]);

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-12px_30px_-18px_rgb(22_21_21/0.45)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container-page flex items-center gap-3 py-3 sm:gap-4">
        <span className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line sm:block">
          <ProductVisual image={image} alt="" compact sizes="48px" className="h-full w-full" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-forest">{name}</p>
          <p className="truncate text-xs text-stone">
            <span className="font-semibold text-charcoal">{price}</span> {unit} · <span className="text-success">{note}</span>
          </p>
        </div>
        <div className="w-40 shrink-0 sm:w-56">
          <AddButton productId={productId} minQty={minQty} label={labels.add} addedLabel={labels.added} />
        </div>
      </div>
    </div>
  );
}
