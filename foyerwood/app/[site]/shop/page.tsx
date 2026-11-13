import type { Metadata } from "next";
import { Catalog, type CatalogSearch } from "@/components/site/Catalog";
import { MascotTip } from "@/components/site/MascotTip";
import { ReviewsProof } from "@/components/site/ReviewsProof";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
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
  const [reviews, stats] = await Promise.all([listApprovedReviews(site.market, 2), reviewStats(site.market)]);
  return (
    <>
      <PageHero
        title={t.shop.title}
        intro={t.shop.subtitle}
        image={AMBIANCE.woodStack}
        breadcrumbs={<Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.shop.title }]} tone="light" />}
      />
      <div className="container-page py-10 sm:py-12">
        <div className="mb-8 grid items-center gap-6 lg:grid-cols-2">
          <MascotTip text={t.home.shopTip} href={routePath(site, "calculator")} cta={t.home.shopTipCta} />
          <ReviewsProof reviews={reviews} stats={stats} t={t} locale={site.locale} href={routePath(site, "reviews")} variant="aside" />
        </div>
        <Catalog ctx={ctx} search={await searchParams} />
      </div>
    </>
  );
}
