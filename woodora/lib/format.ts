import type { Currency, Lang } from "./markets";
import type { Site } from "./sites";

export type LText = Partial<Record<Lang, string>>;

/** Localized text with sensible fallback (fr ↔ en). */
export function loc(text: LText | null | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang] || text[lang === "fr" ? "en" : "fr"] || "";
}

export function formatMoney(cents: number, currency: Currency | string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function money(site: Site, cents: number, currency: Currency | string): string {
  return formatMoney(cents, currency, site.locale);
}

export function formatNumber(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: string,
  timeZone?: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined, locale: string, timeZone?: string): string {
  return formatDate(date, locale, timeZone, { dateStyle: "medium", timeStyle: "short" });
}

/** "{n} items" style interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function plural(n: number, one: string, many: string): string {
  return Math.abs(n) >= 2 ? many : one;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
