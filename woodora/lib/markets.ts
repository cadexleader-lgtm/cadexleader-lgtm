// Static configuration of the three commercial markets.
// Commercial settings that the administrator can change (WhatsApp number,
// contact e-mail, tax notes…) live in the `markets` table, not here.

export type MarketId = "ca" | "us" | "fr";
export type Lang = "fr" | "en";
export type Currency = "CAD" | "USD" | "EUR";

export interface MarketConfig {
  id: MarketId;
  currency: Currency;
  languages: Lang[];
  defaultLang: Lang;
  timeZone: string;
  areaUnit: "m2" | "sqft";
  /** Two-letter code used in pre-order references (WD-CA-2026-000125). */
  refCode: string;
  flag: string;
  names: Record<Lang, string>;
  /** Label of the administrative regions used for delivery zones. */
  regionLabel: Record<Lang, string>;
  phonePrefix: string;
}

export const MARKETS: Record<MarketId, MarketConfig> = {
  ca: {
    id: "ca",
    currency: "CAD",
    languages: ["fr", "en"],
    defaultLang: "fr",
    timeZone: "America/Toronto",
    areaUnit: "sqft",
    refCode: "CA",
    flag: "🇨🇦",
    names: { fr: "Canada", en: "Canada" },
    regionLabel: { fr: "Province", en: "Province" },
    phonePrefix: "+1",
  },
  us: {
    id: "us",
    currency: "USD",
    languages: ["en"],
    defaultLang: "en",
    timeZone: "America/New_York",
    areaUnit: "sqft",
    refCode: "US",
    flag: "🇺🇸",
    names: { fr: "États-Unis", en: "United States" },
    regionLabel: { fr: "État", en: "State" },
    phonePrefix: "+1",
  },
  fr: {
    id: "fr",
    currency: "EUR",
    languages: ["fr"],
    defaultLang: "fr",
    timeZone: "Europe/Paris",
    areaUnit: "m2",
    refCode: "FR",
    flag: "🇫🇷",
    names: { fr: "France", en: "France" },
    regionLabel: { fr: "Département", en: "Département" },
    phonePrefix: "+33",
  },
};

export const MARKET_IDS: MarketId[] = ["ca", "us", "fr"];

export function isMarketId(v: unknown): v is MarketId {
  return v === "ca" || v === "us" || v === "fr";
}

export const SQFT_PER_M2 = 10.7639;
