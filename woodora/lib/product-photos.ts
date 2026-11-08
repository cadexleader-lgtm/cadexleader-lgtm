// Product photos by species × packaging.
// Drop a file named "<species>-<packaging>.webp" (or .jpg / .png) into
// public/images/products/ — e.g. "oak-pallet.webp", "birch-big_bag.webp" — and
// every product of that species and packaging, in every market, uses it
// automatically. The list is built into lib/product-photos.manifest.json by
// scripts/photo-manifest.mjs before `dev` and `build` (no filesystem access at
// runtime). Photos uploaded from the administration take precedence.

import manifest from "./product-photos.manifest.json";

const PHOTOS = manifest as Record<string, string>;

export function productPhotoName(species: string, packaging: string): string {
  return `${species}-${packaging}`;
}

export function autoProductPhoto(species: string | null | undefined, packaging: string | null | undefined): string | null {
  if (!species || !packaging) return null;
  return PHOTOS[productPhotoName(species, packaging)] ?? null;
}
