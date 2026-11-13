// Volume discounts and free accessories. Pure functions shared by the cart,
// the pre-order page and the server (which always recomputes the amounts).
//
// - Tiers: from a firewood amount, a percentage off the firewood lines.
// - Gifts: from a firewood amount, an accessory is added free of charge
//   (every gift whose threshold is reached).
// "Firewood amount" = every line except accessories, at catalogue price.

export interface PromoTier {
  minCents: number;
  percent: number;
}

export interface PromoGiftRule {
  minCents: number;
  /** Product slug in the market's catalogue (stable across databases). */
  productSlug: string;
}

export interface MarketPromotions {
  enabled: boolean;
  tiers: PromoTier[];
  gifts: PromoGiftRule[];
}

export interface ResolvedGift {
  minCents: number;
  productId: string;
  name: string;
  image: string | null;
}

/** Promotions with gift products looked up in the catalogue (safe for the browser). */
export interface ResolvedPromotions {
  enabled: boolean;
  tiers: PromoTier[];
  gifts: ResolvedGift[];
}

export interface PromoLine {
  priceCents: number;
  qty: number;
  categoryId: string;
}

export interface PromoResult {
  /** Firewood amount the thresholds are measured on. */
  qualifyingCents: number;
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  gifts: ResolvedGift[];
  nextTier: { percent: number; missingCents: number } | null;
  nextGift: { gift: ResolvedGift; missingCents: number } | null;
}

export const PROMO_EXCLUDED_CATEGORIES = ["accessories"];

export function sanitizePromotions(p: Partial<MarketPromotions> | null | undefined): MarketPromotions {
  const tiers = (Array.isArray(p?.tiers) ? p!.tiers : [])
    .map((t) => ({ minCents: Math.round(Number(t?.minCents)), percent: Number(t?.percent) }))
    .filter((t) => Number.isFinite(t.minCents) && t.minCents > 0 && Number.isFinite(t.percent) && t.percent > 0 && t.percent <= 50)
    .sort((a, b) => a.minCents - b.minCents);
  const gifts = (Array.isArray(p?.gifts) ? p!.gifts : [])
    .map((g) => ({ minCents: Math.round(Number(g?.minCents)), productSlug: String(g?.productSlug ?? "").trim() }))
    .filter((g) => Number.isFinite(g.minCents) && g.minCents > 0 && g.productSlug)
    .sort((a, b) => a.minCents - b.minCents);
  return { enabled: p?.enabled !== false, tiers, gifts };
}

export function evaluatePromotions(promo: ResolvedPromotions | null | undefined, lines: PromoLine[]): PromoResult {
  const subtotalCents = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);
  const qualifyingCents = lines
    .filter((l) => !PROMO_EXCLUDED_CATEGORIES.includes(l.categoryId))
    .reduce((s, l) => s + l.priceCents * l.qty, 0);
  const empty: PromoResult = {
    qualifyingCents,
    subtotalCents,
    discountPercent: 0,
    discountCents: 0,
    totalCents: subtotalCents,
    gifts: [],
    nextTier: null,
    nextGift: null,
  };
  if (!promo || !promo.enabled) return empty;
  const tiers = [...promo.tiers].sort((a, b) => a.minCents - b.minCents);
  const reached = tiers.filter((t) => qualifyingCents >= t.minCents);
  const tier = reached.reduce<PromoTier | null>((best, t) => (!best || t.percent > best.percent ? t : best), null);
  const discountPercent = tier?.percent ?? 0;
  const discountCents = Math.round((qualifyingCents * discountPercent) / 100);
  const upcoming = tiers.find((t) => qualifyingCents < t.minCents && t.percent > discountPercent) ?? null;
  const giftsSorted = [...promo.gifts].sort((a, b) => a.minCents - b.minCents);
  const gifts = giftsSorted.filter((g) => qualifyingCents > 0 && qualifyingCents >= g.minCents);
  const nextGiftRule = giftsSorted.find((g) => qualifyingCents < g.minCents) ?? null;
  return {
    qualifyingCents,
    subtotalCents,
    discountPercent,
    discountCents,
    totalCents: subtotalCents - discountCents,
    gifts,
    nextTier: upcoming ? { percent: upcoming.percent, missingCents: upcoming.minCents - qualifyingCents } : null,
    nextGift: nextGiftRule ? { gift: nextGiftRule, missingCents: nextGiftRule.minCents - qualifyingCents } : null,
  };
}

/** Percentage saved by a crossed-out price, rounded down (never overstated). */
export function savingPercent(priceCents: number, compareAtCents: number | null | undefined): number {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.floor(((compareAtCents - priceCents) / compareAtCents) * 100);
}
