// Real photographs used to illustrate pages (never generated artwork).
// Product photos are handled separately (lib/product-photos.ts and the
// "Photos du catalogue" admin page): these images only set the scene.
import type { CategoryKey } from "./sites";

export const AMBIANCE = {
  livingRoom: "/images/ambiance/living-room-fireplace.webp",
  cabinStove: "/images/ambiance/cabin-stove.webp",
  modernFireplace: "/images/ambiance/modern-fireplace.webp",
  splitLogs: "/images/ambiance/texture-split-logs.webp",
  logEnds: "/images/ambiance/texture-log-ends.webp",
  rings: "/images/ambiance/texture-rings.webp",
  stack: "/images/ambiance/texture-stack.webp",
  cracked: "/images/ambiance/texture-cracked.webp",
  crates: "/images/photos/kiln-dried-crates.webp",
  yard: "/images/photos/firewood-crates-yard.webp",
  trailer: "/images/photos/delivery-trailer.webp",
} as const;

/** Category banners, used when no image is set in Administration → Réglages. */
export const CATEGORY_BANNERS: Record<CategoryKey, string> = {
  firewood: "/images/photos/firewood-crates-yard.webp",
  "kiln-dried": "/images/photos/kiln-dried-crate-covered.webp",
  briquettes: "/images/photos/compressed-logs-cages.webp",
  pellets: AMBIANCE.modernFireplace,
  kindling: AMBIANCE.splitLogs,
  accessories: AMBIANCE.cabinStove,
};

const ARTICLE_COVERS: Record<string, string> = {
  "quel-bois-choisir-pour-chauffer-sa-maison": AMBIANCE.livingRoom,
  "which-firewood-to-heat-your-home": AMBIANCE.livingRoom,
  "chene-ou-bouleau-quelles-differences": AMBIANCE.logEnds,
  "oak-vs-birch-firewood": AMBIANCE.logEnds,
  "comment-conserver-son-bois-de-chauffage": AMBIANCE.stack,
  "how-to-store-firewood": AMBIANCE.stack,
  "quelle-quantite-de-bois-prevoir-pour-l-hiver": AMBIANCE.splitLogs,
  "how-much-firewood-for-winter": AMBIANCE.splitLogs,
  "pourquoi-utiliser-du-bois-seche": AMBIANCE.crates,
  "why-choose-kiln-dried-firewood": AMBIANCE.crates,
  "comment-choisir-ses-granules-de-chauffage": AMBIANCE.modernFireplace,
  "how-to-choose-wood-pellets": AMBIANCE.modernFireplace,
};

const COVER_POOL = [AMBIANCE.cabinStove, AMBIANCE.rings, AMBIANCE.cracked, AMBIANCE.livingRoom, AMBIANCE.logEnds, AMBIANCE.stack];

/** Cover of a blog article: its own image, else a real ambiance photo. */
export function articleCover(a: { slug: string; coverImage: string | null }): string {
  if (a.coverImage) return a.coverImage;
  const mapped = ARTICLE_COVERS[a.slug];
  if (mapped) return mapped;
  let h = 0;
  for (const ch of a.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_POOL[h % COVER_POOL.length];
}
