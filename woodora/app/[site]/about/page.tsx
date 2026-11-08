import type { Metadata } from "next";
import { ArrowRight, Compass, Handshake, MessageCircle, ShieldCheck, Sprout, Scale } from "lucide-react";
import { PageHero, ButtonLink, SectionHeading } from "@/components/ui";
import Image from "next/image";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath } from "@/lib/sites";
import { MARKETS, MARKET_IDS } from "@/lib/markets";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.about.kicker, description: t.about.intro, alternates: { canonical: routePath(site, "about") } };
}

export default async function AboutPage({ params }: SiteParams) {
  const { site, t } = await loadSite((await params).site);
  const icons = [Handshake, Compass, MessageCircle];
  const valueIcons = [Scale, Compass, ShieldCheck, Sprout];
  return (
    <>
      <PageHero kicker={t.about.kicker} title={t.about.title} intro={t.about.intro} />
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {t.about.blocks.map((b, i) => {
            const Icon = icons[i];
            return (
              <div key={b.title} className="card p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-wood-100">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-2xl text-forest">{b.title}</h2>
                <p className="mt-3 leading-relaxed text-stone">{b.text}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
            <Image src="/images/photos/firewood-crates-yard.webp" alt={t.about.blocks[0].title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading title={t.about.values.title} />
            <div className="grid gap-6 sm:grid-cols-2">
              {t.about.values.items.map((v, i) => {
                const Icon = valueIcons[i];
                return (
                  <div key={v.title}>
                    <Icon className="h-6 w-6 text-wood" />
                    <h3 className="mt-3 text-xl text-forest">{v.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-stone">{v.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {MARKET_IDS.map((m) => (
            <div key={m} className="rounded-2xl bg-forest p-6 text-cream">
              <p className="text-3xl">{MARKETS[m].flag}</p>
              <p className="mt-3 font-display text-2xl">{MARKETS[m].names[site.lang]}</p>
              <p className="mt-1 text-sm text-cream/70">
                {MARKETS[m].currency} · {MARKETS[m].languages.map((l) => (l === "fr" ? "Français" : "English")).join(" / ")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={routePath(site, "shop")}>{t.home.hero.ctaShop} <ArrowRight className="h-4 w-4" /></ButtonLink>
          <ButtonLink href={routePath(site, "contact")} variant="secondary">{t.nav.contact}</ButtonLink>
        </div>
      </section>
    </>
  );
}
