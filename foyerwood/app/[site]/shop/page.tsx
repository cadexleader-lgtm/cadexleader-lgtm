import type { Metadata } from "next";
import { Catalog, type CatalogSearch } from "@/components/site/Catalog";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath } from "@/lib/sites";
import { AMBIANCE } from "@/lib/illustrations";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.shop.title, description: t.shop.subtitle, alternates: { canonical: routePath(site, "shop") } };
}

export default async function ShopPage({ params, searchParams }: SiteParams & { searchParams: Promise<CatalogSearch> }) {
  const ctx = await loadSite((await params).site);
  const { t, site } = ctx;
  return (
    <>
      <PageHero
        title={t.shop.title}
        intro={t.shop.subtitle}
        image={AMBIANCE.yard}
        breadcrumbs={<Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.shop.title }]} tone="light" />}
      />
      <div className="container-page py-10 sm:py-12">
        <Catalog ctx={ctx} search={await searchParams} />
      </div>
    </>
  );
}
