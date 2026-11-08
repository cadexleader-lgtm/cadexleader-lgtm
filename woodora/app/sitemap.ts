import type { MetadataRoute } from "next";
import { SITES, SITE_IDS, LEGAL_DOCS, CATEGORY_KEYS, blogPath, categoryPath, legalPath, productPath, routePath } from "@/lib/sites";
import { listProducts } from "@/lib/data/products";
import { listPublishedArticles } from "@/lib/data/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const out: MetadataRoute.Sitemap = [];
  const now = new Date();
  for (const id of SITE_IDS) {
    const site = SITES[id];
    const add = (path: string, priority: number, lastModified: Date = now) => out.push({ url: base + path, lastModified, priority });
    add(site.prefix, 1);
    for (const key of ["shop", "calculator", "about", "delivery", "faq", "contact", "reviews"] as const) add(routePath(site, key), key === "shop" || key === "calculator" ? 0.9 : 0.6);
    for (const c of CATEGORY_KEYS) add(categoryPath(site, c), 0.8);
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
