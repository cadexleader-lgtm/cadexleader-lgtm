// Product photos by species × packaging.
// Drop a file named "<species>-<packaging>.webp" (or .jpg / .png) into
// public/images/products/ — e.g. "oak-pallet.webp", "birch-big_bag.webp" — and
// every product of that species and packaging, in every market, uses it
// automatically. Products without a species use "<category>-<packaging>"
// (e.g. "pellets-bag.webp", "briquettes-box.webp"). The list is built into lib/product-photos.manifest.json by
// scripts/photo-manifest.mjs before `dev` and `build` (no filesystem access at
// runtime). Photos uploaded from the administration take precedence.

import manifest from "./product-photos.manifest.json";

const PHOTOS = manifest as Record<string, string>;

export function productPhotoName(species: string, packaging: string): string {
  return `${species}-${packaging}`;
}

// Products sold without a species whose photo is chosen individually
// (product slug → photo file name in public/images/products/).
// Example: { "humidimetre-bois": "accessory-moisture-meter" } for a file
// public/images/products/accessory-moisture-meter.webp.
const SLUG_PHOTOS: Record<string, string> = {};

export function autoProductPhoto(
  species: string | null | undefined,
  packaging: string | null | undefined,
  category?: string | null,
  slug?: string | null,
): string | null {
  const bySlug = slug ? SLUG_PHOTOS[slug] : undefined;
  if (bySlug && PHOTOS[bySlug]) return PHOTOS[bySlug];
  if (!packaging) return null;
  // "<species>-<packaging>" (e.g. oak-pallet), then "<category>-<packaging>"
  // for products sold without a species (e.g. pellets-bag, briquettes-box).
  return (species && PHOTOS[productPhotoName(species, packaging)]) || (category && PHOTOS[`${category}-${packaging}`]) || null;
}
