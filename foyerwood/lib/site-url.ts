/**
 * Public base URL of the site (sitemap, robots.txt, canonical / Open Graph URLs).
 * Order: NEXT_PUBLIC_SITE_URL if set, otherwise the production domain Vercel
 * provides automatically (the custom domain once one is attached, the
 * *.vercel.app address before that), otherwise localhost for development.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}
