"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, alt, label }: { images: string[]; alt: string; label: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3" aria-label={label}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-[var(--radius-card)] bg-cream-200 ring-1 ring-line">
        <Image src={images[active]} alt={alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition ${i === active ? "ring-wood" : "ring-transparent opacity-80 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
