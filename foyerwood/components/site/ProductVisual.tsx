import Image from "next/image";
import { Camera } from "lucide-react";

/** Shown while a product has no real photograph yet (no generated artwork). */
export function PhotoPending({ label, compact = false, className = "" }: { label?: string; compact?: boolean; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-cream-200 text-stone ${className}`} aria-hidden>
      {!compact && <span className="pointer-events-none absolute inset-3 border border-forest/[0.08]" />}
      <span className="flex flex-col items-center gap-2.5">
        <Camera className={compact ? "h-4 w-4 opacity-70" : "h-5 w-5"} strokeWidth={1.4} />
        {!compact && label && <span className="text-[0.62rem] font-semibold uppercase tracking-[0.2em]">{label}</span>}
      </span>
    </div>
  );
}

export function ProductVisual({
  image,
  alt,
  pendingLabel,
  compact = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw",
  priority = false,
  className = "",
}: {
  image: string | null;
  alt: string;
  pendingLabel?: string;
  compact?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) return <PhotoPending label={pendingLabel} compact={compact} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-cream-200 ${className}`}>
      <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
