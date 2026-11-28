/** Official public address of the site: every canonical URL, the sitemap and robots.txt use it. */
export const CANONICAL_ORIGIN = "https://www.foyerwoods.com";

/** Hosts that always mean the official www address (current domain, and the earlier foyerwood.com). */
const OFFICIAL_HOSTS = new Set(["foyerwoods.com", "www.foyerwoods.com", "foyerwood.com", "www.foyerwood.com"]);

/**
 * Public base URL (sitemap, robots.txt, canonical / Open Graph URLs).
 * - NEXT_PUBLIC_SITE_URL if set to a real domain (a *.vercel.app address is
 *   ignored: it must never become the canonical address);
 * - otherwise the official domain in production builds;
 * - localhost during development.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (explicit && /^https?:\/\//.test(explicit)) {
    const host = new URL(explicit).hostname.toLowerCase();
    if (OFFICIAL_HOSTS.has(host)) return CANONICAL_ORIGIN;
    if (!host.endsWith(".vercel.app")) return explicit;
  }
  if (process.env.NODE_ENV === "production") return CANONICAL_ORIGIN;
  return "http://localhost:3000";
}
