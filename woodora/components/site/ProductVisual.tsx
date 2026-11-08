import Image from "next/image";
import { ProductArt } from "@/components/art/ProductArt";
import type { SpeciesKey } from "@/lib/energy";

export function ProductVisual({
  image,
  art,
  species,
  seed,
  alt,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw",
  priority = false,
  className = "",
}: {
  image: string | null;
  art: string | null;
  species: SpeciesKey | null;
  seed: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-cream-200 ${className}`}>
        <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <ProductArt art={art} species={species} seed={seed} label={alt} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
