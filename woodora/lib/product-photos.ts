// Product photos by species × packaging.
// Drop a file named "<species>-<packaging>.webp" (or .jpg / .png) into
// public/images/products/ — e.g. "oak-pallet.webp", "birch-big_bag.webp" — and
// every product of that species and packaging, in every market, uses it
// automatically. Photos uploaded from the administration take precedence.

import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "images", "products");
const EXT = ["webp", "jpg", "jpeg", "png", "avif"];
const cache = new Map<string, string | null>();

export function productPhotoName(species: string, packaging: string): string {
  return `${species}-${packaging}`;
}

export function autoProductPhoto(species: string | null | undefined, packaging: string | null | undefined): string | null {
  if (!species || !packaging) return null;
  const key = productPhotoName(species, packaging);
  if (cache.has(key) && process.env.NODE_ENV === "production") return cache.get(key)!;
  let found: string | null = null;
  for (const ext of EXT) {
    if (fs.existsSync(path.join(DIR, `${key}.${ext}`))) {
      found = `/images/products/${key}.${ext}`;
      break;
    }
  }
  cache.set(key, found);
  return found;
}
