import type { Metadata } from "next";
import { PreorderClient } from "@/components/cart/PreorderClient";
import { Breadcrumbs } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listProducts, toPublicProduct } from "@/lib/data/products";
import { legalPath, productPath, routePath } from "@/lib/sites";
import { loc } from "@/lib/format";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t } = await loadSite((await params).site);
  return { title: t.preorder.title, robots: { index: false } };
}

const POSTAL = { fr: "75011", ca: "H2X 1Y4", us: "10001" } as const;
const PHONE = { fr: "+33 6 12 34 56 78", ca: "+1 514 555 0123", us: "+1 212 555 0123" } as const;

export default async function PreorderPage({ params }: SiteParams) {
  const { site, t, market, settings } = await loadSite((await params).site);
  const products = (await listProducts(site.market, site.lang)).map((p) => toPublicProduct(p, site.lang));
  return (
    <div className="container-page py-10 sm:py-14">
      <Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.preorder.title }]} />
      <div className="mb-10 mt-6 max-w-3xl">
        <h1 className="text-4xl text-forest sm:text-5xl">{t.preorder.title}</h1>
        <p className="mt-3 text-lg text-stone">{t.preorder.subtitle}</p>
      </div>
      <PreorderClient
        siteId={site.id}
        market={site.market}
        locale={site.locale}
        currency={market.currency}
        countryName={`${market.flag} ${market.names[site.lang]}`}
        products={products}
        t={t.preorder}
        common={t.common}
        availability={t.availability}
        productBase={productPath(site, "x").replace(/\/x$/, "")}
        shopHref={routePath(site, "shop")}
        calculatorHref={routePath(site, "calculator")}
        termsHref={legalPath(site, "terms")}
        privacyHref={legalPath(site, "privacy")}
        deliveryHref={routePath(site, "delivery")}
        taxNote={loc(settings.taxNote, site.lang)}
        postalPlaceholder={POSTAL[site.market]}
        phonePlaceholder={PHONE[site.market]}
        calculatorLabel={t.nav.calculator}
      />
    </div>
  );
}
