// A "site" is a market + language pair. Public URLs:
//   /fr/...      France (fr)
//   /us/...      United States (en)
//   /ca/...      Canada (fr)
//   /ca/en/...   Canada (en)
// Internally every page lives under app/[site]/<internal-route>, and the
// proxy (proxy.ts) translates localized public slugs into internal routes.

import { MARKETS, type Lang, type MarketId } from "./markets";

export type SiteId = "fr" | "us" | "ca" | "ca-en";

export interface Site {
  id: SiteId;
  market: MarketId;
  lang: Lang;
  prefix: string;
  locale: string; // BCP 47, used for Intl formatting and hreflang
}

export const SITES: Record<SiteId, Site> = {
  fr: { id: "fr", market: "fr", lang: "fr", prefix: "/fr", locale: "fr-FR" },
  us: { id: "us", market: "us", lang: "en", prefix: "/us", locale: "en-US" },
  ca: { id: "ca", market: "ca", lang: "fr", prefix: "/ca", locale: "fr-CA" },
  "ca-en": { id: "ca-en", market: "ca", lang: "en", prefix: "/ca/en", locale: "en-CA" },
};

export const SITE_IDS = Object.keys(SITES) as SiteId[];

export function isSiteId(v: unknown): v is SiteId {
  return typeof v === "string" && v in SITES;
}

export function getSite(id: string): Site | null {
  return isSiteId(id) ? SITES[id] : null;
}

export function siteFor(market: MarketId, lang?: Lang): Site {
  const l = lang && MARKETS[market].languages.includes(lang) ? lang : MARKETS[market].defaultLang;
  if (market === "ca") return l === "en" ? SITES["ca-en"] : SITES.ca;
  return SITES[market];
}

/** Sites sharing the same market (Canada: fr + en). */
export function siblingSites(site: Site): Site[] {
  return SITE_IDS.map((id) => SITES[id]).filter((s) => s.market === site.market);
}

// ---------------------------------------------------------------------------
// Localized slugs

export type RouteKey =
  | "shop"
  | "product"
  | "category"
  | "calculator"
  | "about"
  | "delivery"
  | "faq"
  | "contact"
  | "preorder"
  | "track"
  | "blog"
  | "reviews"
  | "legal";

const ROUTE_SLUGS: Record<Exclude<RouteKey, "category">, Record<Lang, string>> = {
  shop: { fr: "boutique", en: "shop" },
  product: { fr: "produit", en: "product" },
  calculator: { fr: "calculateur", en: "calculator" },
  about: { fr: "a-propos", en: "about" },
  delivery: { fr: "livraison", en: "delivery" },
  faq: { fr: "faq", en: "faq" },
  contact: { fr: "contact", en: "contact" },
  preorder: { fr: "precommande", en: "preorder" },
  track: { fr: "suivi-commande", en: "order-tracking" },
  blog: { fr: "conseils", en: "advice" },
  reviews: { fr: "avis", en: "reviews" },
  legal: { fr: "informations", en: "legal" },
};

export type CategoryKey = "firewood" | "kiln-dried" | "pellets" | "briquettes" | "kindling" | "accessories";

export const CATEGORY_KEYS: CategoryKey[] = [
  "firewood",
  "kiln-dried",
  "pellets",
  "briquettes",
  "kindling",
  "accessories",
];

export const CATEGORY_SLUGS: Record<CategoryKey, Record<Lang, string>> = {
  firewood: { fr: "bois-de-chauffage", en: "firewood" },
  "kiln-dried": { fr: "bois-seche", en: "kiln-dried-firewood" },
  pellets: { fr: "granules", en: "wood-pellets" },
  briquettes: { fr: "briquettes", en: "compressed-logs" },
  kindling: { fr: "bois-allumage", en: "kindling" },
  accessories: { fr: "accessoires", en: "accessories" },
};

export type LegalDoc = "terms" | "privacy" | "shipping" | "cancellation" | "returns" | "notice" | "safety";

export const LEGAL_DOCS: LegalDoc[] = ["terms", "privacy", "shipping", "cancellation", "returns", "notice", "safety"];

export const LEGAL_SLUGS: Record<LegalDoc, Record<Lang, string>> = {
  terms: { fr: "conditions-generales-de-vente", en: "terms-of-sale" },
  privacy: { fr: "politique-de-confidentialite", en: "privacy-policy" },
  shipping: { fr: "politique-de-livraison", en: "delivery-policy" },
  cancellation: { fr: "politique-d-annulation", en: "cancellation-policy" },
  returns: { fr: "retours-et-reclamations", en: "returns-and-claims" },
  notice: { fr: "mentions-legales", en: "legal-notice" },
  safety: { fr: "securite-et-utilisation", en: "fuel-safety" },
};

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === "string" && (CATEGORY_KEYS as string[]).includes(v);
}

export function isLegalDoc(v: unknown): v is LegalDoc {
  return typeof v === "string" && (LEGAL_DOCS as string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Public URL builders

export function homePath(site: Site): string {
  return site.prefix;
}

export function routePath(site: Site, key: Exclude<RouteKey, "category" | "product" | "legal">, ...rest: string[]): string {
  const parts = [site.prefix, ROUTE_SLUGS[key][site.lang], ...rest.map(encodeURIComponent)];
  return parts.join("/");
}

export function productPath(site: Site, slug: string): string {
  return `${site.prefix}/${ROUTE_SLUGS.product[site.lang]}/${encodeURIComponent(slug)}`;
}

export function categoryPath(site: Site, key: CategoryKey): string {
  return `${site.prefix}/${CATEGORY_SLUGS[key][site.lang]}`;
}

export function legalPath(site: Site, doc: LegalDoc): string {
  return `${site.prefix}/${ROUTE_SLUGS.legal[site.lang]}/${LEGAL_SLUGS[doc][site.lang]}`;
}

export function blogPath(site: Site, slug?: string): string {
  const base = `${site.prefix}/${ROUTE_SLUGS.blog[site.lang]}`;
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}

// ---------------------------------------------------------------------------
// Public path parsing (used by the proxy and the language switcher)

export interface ParsedPath {
  site: Site;
  /** Internal path segments, e.g. ["category", "firewood"]. */
  internal: string[];
  /** False when the first segment is not a known localized slug. */
  known: boolean;
}

export function parsePublicPath(pathname: string): ParsedPath | null {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  let site: Site;
  let rest: string[];
  if (segs[0] === "ca" && segs[1] === "en") {
    site = SITES["ca-en"];
    rest = segs.slice(2);
  } else if (segs[0] === "ca" || segs[0] === "us" || segs[0] === "fr") {
    site = SITES[segs[0] as SiteId];
    rest = segs.slice(1);
  } else {
    return null;
  }
  if (rest.length === 0) return { site, internal: [], known: true };

  const [first, ...tail] = rest;
  const lang = site.lang;
  for (const [key, slugs] of Object.entries(ROUTE_SLUGS)) {
    if (slugs[lang] === first) {
      if (key === "legal") {
        const doc = LEGAL_DOCS.find((d) => LEGAL_SLUGS[d][lang] === tail[0]);
        if (!doc || tail.length > 1) return { site, internal: rest, known: false };
        return { site, internal: ["legal", doc], known: true };
      }
      return { site, internal: [key, ...tail], known: true };
    }
  }
  const cat = CATEGORY_KEYS.find((c) => CATEGORY_SLUGS[c][lang] === first);
  if (cat && tail.length === 0) return { site, internal: ["category", cat], known: true };
  return { site, internal: rest, known: false };
}

/** Build the public path of an internal route for a given site. */
export function publicPathFromInternal(site: Site, internal: string[]): string {
  if (internal.length === 0) return site.prefix;
  const [key, ...tail] = internal;
  if (key === "category" && isCategoryKey(tail[0])) return categoryPath(site, tail[0]);
  if (key === "legal" && isLegalDoc(tail[0])) return legalPath(site, tail[0]);
  if (key in ROUTE_SLUGS) {
    return [site.prefix, ROUTE_SLUGS[key as keyof typeof ROUTE_SLUGS][site.lang], ...tail].join("/");
  }
  return site.prefix;
}

/** Equivalent page in another language of the same market (Canada). */
export function switchLanguagePath(pathname: string, target: Site): string {
  const parsed = parsePublicPath(pathname);
  if (!parsed || !parsed.known) return target.prefix;
  // Blog articles are written per language: fall back to the blog index.
  if (parsed.internal[0] === "blog" && parsed.internal.length > 1) return blogPath(target);
  return publicPathFromInternal(target, parsed.internal);
}
