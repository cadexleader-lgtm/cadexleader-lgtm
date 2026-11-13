import type { Lang, MarketId } from "../markets";
import { loc } from "../format";
import { sanitizePromotions, type MarketPromotions, type ResolvedPromotions } from "../promotions";
import { getSetting, setSetting } from "./settings";
import { getProductBySlug } from "./products";

export async function getMarketPromotions(market: MarketId): Promise<MarketPromotions> {
  const all = await getSetting("promotions");
  return sanitizePromotions(all[market]);
}

export async function saveMarketPromotions(market: MarketId, value: MarketPromotions) {
  const all = await getSetting("promotions");
  await setSetting("promotions", { ...all, [market]: sanitizePromotions(value) });
}

/** Promotions with each gift looked up in the catalogue (inactive or missing gifts are skipped). */
export async function resolvePromotions(market: MarketId, lang: Lang): Promise<ResolvedPromotions> {
  const p = await getMarketPromotions(market);
  const gifts = [];
  for (const g of p.gifts) {
    const product = await getProductBySlug(market, g.productSlug);
    if (!product) continue;
    gifts.push({ minCents: g.minCents, productId: product.id, name: loc(product.name, lang), image: product.images[0] ?? null });
  }
  return { enabled: p.enabled, tiers: p.tiers, gifts };
}
