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
// Files in public/images/products/ (without extension); the first one is the
// main photo, the others complete the product gallery.
const SLUG_PHOTOS: Record<string, string[]> = {
  // Moisture meter
  "humidimetre-bois-de-chauffage": ["accessory-moisture-meter"],
  "humidimetre-bois": ["accessory-moisture-meter"],
  "firewood-moisture-meter": ["accessory-moisture-meter"],
  // Natural wood-wool firelighters
  "allume-feu-laine-de-bois-100": ["accessory-firelighters", "accessory-firelighters-lit"],
  "allume-feu-laine-de-bois-50": ["accessory-firelighters", "accessory-firelighters-lit"],
  "natural-fire-starters-48": ["accessory-firelighters", "accessory-firelighters-lit"],
  // Felt log basket
  "panier-a-buches-feutre": ["accessory-log-basket"],
};

/** All automatic photos of a product (gallery), main photo first. */
export function autoProductPhotos(
  species: string | null | undefined,
  packaging: string | null | undefined,
  category?: string | null,
  slug?: string | null,
): string[] {
  const bySlug = (slug ? SLUG_PHOTOS[slug] ?? [] : []).map((n) => PHOTOS[n]).filter(Boolean);
  if (bySlug.length) return bySlug;
  const one = autoProductPhoto(species, packaging, category, null);
  return one ? [one] : [];
}

export function autoProductPhoto(
  species: string | null | undefined,
  packaging: string | null | undefined,
  category?: string | null,
  slug?: string | null,
): string | null {
  const bySlug = slug ? SLUG_PHOTOS[slug]?.[0] : undefined;
  if (bySlug && PHOTOS[bySlug]) return PHOTOS[bySlug];
  if (!packaging) return null;
  // "<species>-<packaging>" (e.g. oak-pallet), then "<category>-<packaging>"
  // for products sold without a species (e.g. pellets-bag, briquettes-box).
  return (species && PHOTOS[productPhotoName(species, packaging)]) || (category && PHOTOS[`${category}-${packaging}`]) || null;
}
