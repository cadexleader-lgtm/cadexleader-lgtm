// Countries open to visitors. Launch: Canada only. To reopen the United States
// and France later, set ACTIVE_MARKETS=ca,us,fr in Vercel (Settings →
// Environment Variables) and redeploy — no code change needed.
// Closed countries: their pages redirect to Canada and leave the sitemap,
// the country menu and hreflang tags. The administration keeps every country.
import type { MarketId } from "./markets";
import { SITES, SITE_IDS, type Site, type SiteId } from "./sites";

const ALL: MarketId[] = ["ca", "us", "fr"];

function parse(v: string | undefined): MarketId[] {
  const list = (v ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is MarketId => (ALL as string[]).includes(s));
  return list.length ? Array.from(new Set(list)) : ["ca"];
}

export const ACTIVE_MARKETS: MarketId[] = parse(process.env.ACTIVE_MARKETS);

export function isMarketActive(m: MarketId): boolean {
  return ACTIVE_MARKETS.includes(m);
}

export const ACTIVE_SITE_IDS: SiteId[] = SITE_IDS.filter((id) => isMarketActive(SITES[id].market));

export function isSiteActive(site: Site): boolean {
  return isMarketActive(site.market);
}

/** Where a visitor of a closed country is sent: the same language when possible. */
export function fallbackSite(lang: "fr" | "en"): Site {
  const sites = ACTIVE_SITE_IDS.map((id) => SITES[id]);
  return sites.find((s) => s.lang === lang) ?? sites[0] ?? SITES.ca;
}
