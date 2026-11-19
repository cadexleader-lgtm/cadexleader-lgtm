import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { SITES, LEGAL_DOCS, blogPath, categoryPath, legalPath, productPath, routePath } from "@/lib/sites";
import { ACTIVE_SITE_IDS } from "@/lib/launch";
import { listProducts } from "@/lib/data/products";
import { listPublishedArticles } from "@/lib/data/blog";
import { listCategories } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

// Only public, indexable pages of the open countries, on the official domain.
// Excluded on purpose: pre-order (cart), confirmation, order tracking,
// administration, pro forma documents and redirecting URLs ("/").
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const out: MetadataRoute.Sitemap = [];
  const now = new Date();
  const seen = new Set<string>();
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    categories = (await listCategories()).filter((c) => c.active);
  } catch {
    /* database unavailable */
  }
  for (const id of ACTIVE_SITE_IDS) {
    const site = SITES[id];
    const add = (path: string, priority: number, lastModified: Date = now) => {
      const url = base + path;
      if (seen.has(url)) return;
      seen.add(url);
      out.push({ url, lastModified, priority });
    };
    add(site.prefix, 1);
    for (const key of ["shop", "calculator", "about", "delivery", "faq", "contact", "reviews"] as const) add(routePath(site, key), key === "shop" || key === "calculator" ? 0.9 : 0.6);
    for (const c of categories) add(categoryPath(site, c.id), 0.8);
    for (const d of LEGAL_DOCS) add(legalPath(site, d), 0.2);
    add(blogPath(site), 0.6);
    try {
      for (const p of await listProducts(site.market, site.lang)) add(productPath(site, p.slug), 0.8, new Date(p.updatedAt));
      for (const a of await listPublishedArticles(site.lang, site.market)) add(blogPath(site, a.slug), 0.6, new Date(a.updatedAt));
    } catch {
      /* database unavailable: static pages only */
    }
  }
  return out;
}
