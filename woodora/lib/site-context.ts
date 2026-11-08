import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getSite, type Site } from "./sites";
import { MARKETS, type MarketConfig } from "./markets";
import { getDict, type Dict } from "./i18n";
import { getMarketSettings, getSetting, listCategories, type Category, type CompanySettings, type MarketSettings, type SocialSettings } from "./data/settings";
import { freeDeliveryThreshold } from "./data/zones";

export interface SiteContext {
  site: Site;
  market: MarketConfig;
  t: Dict;
  settings: MarketSettings;
  company: CompanySettings;
  social: SocialSettings;
  freeThresholdCents: number | null;
  categories: Category[];
}

export const loadSite = cache(async (siteId: string): Promise<SiteContext> => {
  const site = getSite(siteId);
  if (!site) notFound();
  const [settings, company, social, freeThresholdCents, categories] = await Promise.all([
    getMarketSettings(site.market),
    getSetting("company"),
    getSetting("social"),
    freeDeliveryThreshold(site.market),
    listCategories(),
  ]);
  return { site, market: MARKETS[site.market], t: getDict(site.lang), settings, company, social, freeThresholdCents, categories };
});

export type SiteParams = { params: Promise<{ site: string }> };
