import type { Metadata } from "next";
import { Catalog, type CatalogSearch } from "@/components/site/Catalog";
import { Breadcrumbs } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath } from "@/lib/sites";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.shop.title, description: t.shop.subtitle, alternates: { canonical: routePath(site, "shop") } };
}

export default async function ShopPage({ params, searchParams }: SiteParams & { searchParams: Promise<CatalogSearch> }) {
  const ctx = await loadSite((await params).site);
  const { t, site } = ctx;
  return (
    <div className="container-page py-10 sm:py-14">
      <Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.shop.title }]} />
      <div className="mb-8 mt-6">
        <h1 className="text-4xl text-forest sm:text-5xl">{t.shop.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-stone">{t.shop.subtitle}</p>
      </div>
      <Catalog ctx={ctx} search={await searchParams} />
    </div>
  );
}
