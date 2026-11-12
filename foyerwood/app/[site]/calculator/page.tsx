import type { Metadata } from "next";
import { BookOpen, Gauge, ShieldCheck } from "lucide-react";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { Breadcrumbs } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath, SITES, productPath } from "@/lib/sites";
import { MARKETS } from "@/lib/markets";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { AMBIANCE } from "@/lib/illustrations";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.calculator.title, description: t.calculator.subtitle, alternates: { canonical: routePath(site, "calculator") } };
}

const PLACEHOLDER = { fr: "75011", ca: "H2X 1Y4", us: "05401" } as const;

export default async function CalculatorPage({ params }: SiteParams) {
  const { site, t, market } = await loadSite((await params).site);
  const others = (["ca", "us", "fr"] as const)
    .filter((m) => m !== site.market)
    .map((m) => {
      const target = m === "ca" ? (site.lang === "en" ? SITES["ca-en"] : SITES.ca) : SITES[m];
      return { href: routePath(target, "calculator"), label: `${MARKETS[m].flag} ${MARKETS[m].names[site.lang]}` };
    });
  const icons = [Gauge, ShieldCheck, BookOpen];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-forest-950 text-cream">
        <HeroBackdrop src={AMBIANCE.stoveLivingRoom} position="50% 82%" />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_340px]">
          <div>
            <Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.nav.calculator }]} tone="light" />
            <p className="kicker mt-6 text-wood-100">{t.home.calculator.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] sm:text-[3.4rem]">{t.calculator.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/75">{t.calculator.subtitle}</p>
            <ul className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
              {t.home.calculator.points.map((pt, i) => {
                const Icon = icons[i];
                return (
                  <li key={pt} className="flex items-start gap-3 rounded-xl bg-cream/[0.06] p-4 text-sm text-cream/85 ring-1 ring-cream/10">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-wood-100" /> {pt}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/warm.svg" alt={t.home.seasons.afterAlt} className="hidden w-full rounded-[var(--radius-card)] shadow-[0_24px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-cream/15 lg:block" />
        </div>
      </section>
      <div className="container-page -mt-6 pb-20 sm:-mt-8">
        <div className="relative mx-auto max-w-5xl">
          <CalculatorWizard
            siteId={site.id}
            market={site.market}
            locale={site.locale}
            currency={market.currency}
            t={t.calculator}
            common={{ quantity: t.common.quantity, perUnit: t.common.perUnit, added: t.common.added, viewPreorder: t.common.viewPreorder, addToPreorder: t.common.addToPreorder }}
            productBase={productPath(site, "x").replace(/\/x$/, "")}
            preorderHref={routePath(site, "preorder")}
            postalPlaceholder={PLACEHOLDER[site.market]}
            otherCountries={others}
          />
        </div>
      </div>
    </>
  );
}
