import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Headset, Landmark, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { HeroSlider, type Slide } from "@/components/site/HeroSlider";
import { emphasize } from "@/lib/emphasize";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listProducts, toPublicProduct, type Product } from "@/lib/data/products";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
import { reviewSourceLabel } from "@/components/site/ReviewsProof";
import { categoryPath, routePath, SITES } from "@/lib/sites";
import { ACTIVE_SITE_IDS, fallbackSite } from "@/lib/launch";
import { fmt, formatMoney, formatNumber, loc } from "@/lib/format";
import { formatLabel } from "@/lib/product-format";
import { estimateHeatingNeeds } from "@/lib/calculator";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { site: id } = await params;
  const { t, site } = await loadSite(id);
  return {
    title: { absolute: t.meta.title },
    description: t.meta.description,
    alternates: {
      canonical: site.prefix,
      languages: {
        ...Object.fromEntries(ACTIVE_SITE_IDS.map((sid) => [SITES[sid].locale, SITES[sid].prefix])),
        "x-default": fallbackSite("fr").prefix,
      },
    },
  };
}

const SAMPLE = {
  fr: { postal: "37000", area: 120, place: "Tours" },
  ca: { postal: "H2X 1Y4", area: 1300, place: "Montréal" },
  us: { postal: "12207", area: 1300, place: "Albany, NY" },
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

export default async function HomePage({ params }: SiteParams) {
  const { site: id } = await params;
  const ctx = await loadSite(id);
  const { site, t, market } = ctx;
  const [products, reviews, stats] = await Promise.all([listProducts(site.market, site.lang), listApprovedReviews(site.market, 3), reviewStats(site.market)]);

  // Products that already have a real photo come first in the showcases.
  const photoFirst = (list: Product[]) => [...list.filter((p) => p.images.length > 0), ...list.filter((p) => p.images.length === 0)];
  const featured = photoFirst([...products.filter((p) => p.featured), ...products.filter((p) => !p.featured && p.categoryId === "firewood")]).slice(0, 8);
  const shopCategories = ctx.categories.filter((c) => products.some((p) => p.categoryId === c.id));
  const card = (p: Product, priority = false) => (
    <ProductCard key={p.id} p={toPublicProduct(p, site.lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(p, t, site.lang)} priority={priority} />
  );

  const sample = SAMPLE[site.market];
  const sampleArea = `${formatNumber(sample.area, site.locale, 0)} ${site.market === "fr" ? "m²" : site.lang === "fr" ? "pi²" : "sq ft"}`;
  const sampleResult = estimateHeatingNeeds({
    market: site.market,
    postalCode: sample.postal,
    area: sample.area,
    housing: "house",
    insulation: "average",
    appliance: "wood_stove",
    fuel: "hardwood",
    usage: "daily",
    months: 5,
  }).quantities[0];
  const sampleUnit = t.calculator.result.units[sampleResult.unit as keyof typeof t.calculator.result.units];
  const steps = t.calculator.steps;

  const slide = (i: number, image: string, position: string, href: string, secondaryHref: string): Slide => {
    const { secondary, ...rest } = t.home.slides[i];
    return { ...rest, image, position, href, secondary: { label: secondary, href: secondaryHref } };
  };
  const slides: Slide[] = [
    slide(0, "/images/ambiance/cabin-stove.webp", "50% 40%", routePath(site, "shop"), routePath(site, "calculator")),
    slide(1, "/images/ambiance/living-room-fireplace.webp", "50% 56%", routePath(site, "calculator"), routePath(site, "faq")),
    slide(2, "/images/ambiance/crate-driveway.webp", "55% 60%", routePath(site, "delivery"), routePath(site, "faq")),
  ];

  const underline = "text-sm font-semibold text-forest underline decoration-forest/25 underline-offset-[6px] transition hover:decoration-forest";

  return (
    <>
      <HeroSlider slides={slides} labels={{ prev: t.common.previous, next: t.common.next, slide: t.common.slide, pause: t.common.pause, play: t.common.play }} mascot={{ src: "/illustrations/foyo.svg", bubble: t.home.heroMascot }}
        assurances={[
          { icon: "check", text: t.marketing.zeroToday.replace("{zero}", formatMoney(0, market.currency, site.locale)) },
          { icon: "check", text: t.marketing.payAfter },
          ...(stats.count > 0 && stats.average != null
            ? [{ icon: "star" as const, text: fmt(stats.count === 1 ? t.marketing.reviewsOne : t.marketing.reviews, { avg: formatNumber(stats.average, site.locale, 1), n: stats.count }) }]
            : []),
        ]}
      />

      {/* ------------------------------------------------------------ Products first */}
      <section id="produits" className="container-page scroll-mt-24 pt-10 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="text-[2rem] leading-[1.05] text-forest sm:text-[2.6rem]">{emphasize(t.home.shopTitle)}</h2>
            <p className="mt-2 text-[0.95rem] text-stone">{t.home.shopSub}</p>
          </div>
          <Link href={routePath(site, "shop")} className={`hidden sm:inline ${underline}`}>
            {t.home.allProducts}
          </Link>
        </div>
        {shopCategories.length > 0 && (
          <nav aria-label={t.nav.categories} className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {shopCategories.map((c) => (
              <Link
                key={c.id}
                href={categoryPath(site, c.id)}
                className="shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium text-forest ring-1 ring-line transition hover:bg-forest hover:text-cream hover:ring-forest"
              >
                {loc(c.name, site.lang)}
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{featured.map((p, i) => card(p, i < 4))}</div>
        <div className="mt-6 flex justify-center">
          <ButtonLink href={routePath(site, "shop")} variant="wood">
            {t.home.allProducts} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ------------------------------------------------------------ Commitments (slim strip) */}
      <section className="container-page pt-10">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line ring-1 ring-line lg:grid-cols-4">
          {t.home.values.map((v, i) => {
            const Icon = [Truck, Landmark, BadgeCheck, Headset][i] ?? BadgeCheck;
            return (
              <li key={v.title} className="flex items-start gap-3 bg-white p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-wood-600" />
                <span>
                  <span className="block text-[0.9rem] font-semibold leading-snug text-charcoal">{v.title}</span>
                  <span className="mt-0.5 hidden text-[0.8rem] leading-snug text-stone sm:block">{v.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Calculator */}
      <section className="mt-20 bg-forest-950 text-cream">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <Reveal className="lg:col-span-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/55">{t.home.calculator.kicker}</p>
            <h2 className="mt-5 text-[2.6rem] leading-[1] sm:text-[3.6rem]">{emphasize(t.home.slides[1].title)}</h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/70">{t.home.calculator.subtitle}</p>
            <ol className="mt-10 grid gap-px bg-cream/10 sm:grid-cols-3">
              {t.home.calculator.points.map((pt, i) => (
                <li key={pt} className="bg-forest-950 py-5 sm:px-5 sm:first:pl-0">
                  <span className="text-[0.7rem] font-semibold tabular-nums tracking-[0.18em] text-wood">{pad(i + 1)}</span>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-cream/75">{pt}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <ButtonLink href={routePath(site, "calculator")} variant="wood" size="lg">
                {t.home.calculator.cta} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <div className="bg-cream text-charcoal">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-stone">{t.home.calculator.sample}</p>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-stone">{sample.place}</p>
              </div>
              <dl className="divide-y divide-line px-6 text-[0.9rem]">
                {[
                  [t.calculator.result.rows.area, sampleArea],
                  [t.calculator.result.rows.insulation, steps.insulation.options.average.label],
                  [t.calculator.result.rows.appliance, steps.appliance.options.wood_stove.label],
                  [t.calculator.result.rows.usage, steps.usage.options.daily.label],
                  [t.calculator.result.rows.duration, steps.duration.month.replace("{n}", "5")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3">
                    <dt className="text-stone">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 bg-white px-6 py-6 ring-1 ring-line">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-stone">{t.calculator.result.need}</p>
                <p className="mt-2 font-display text-[3.4rem] leading-none text-forest">
                  {formatNumber(sampleResult.low, site.locale)}–{formatNumber(sampleResult.high, site.locale)}
                </p>
                <p className="mt-2 text-[0.95rem] font-semibold text-wood-600">{sampleUnit[1]}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ How to order */}
      <section className="bg-white py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading kicker={t.home.how.kicker} title={t.home.how.title} subtitle={t.common.noPayment} />
          </Reveal>
          <div className="grid items-center gap-12 lg:grid-cols-12">
          <ol className="grid gap-10 sm:grid-cols-2 sm:gap-x-8 lg:col-span-7">
            {t.home.how.steps.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 90} className="relative">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold tabular-nums text-cream">{i + 1}</span>
                  <span className="hidden h-px flex-1 bg-forest/15 md:block" />
                </div>
                <h3 className="mt-5 text-[1.05rem] text-charcoal">{st.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-stone">{st.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="lg:col-span-5" delay={200}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/cosy-stove.svg" alt={t.home.cosyAlt} loading="lazy" className="mx-auto block w-full max-w-[560px]" />
          </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Before / after */}
      <section className="container-page pt-24">
        <Reveal>
          <SectionHeading kicker={t.home.seasons.kicker} title={emphasize(t.home.seasons.title)} />
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { src: "/illustrations/cold.svg", label: t.home.seasons.before, text: t.home.seasons.beforeText, alt: t.home.seasons.beforeAlt, tone: "bg-[#e9f0f5] text-[#41586b]" },
            { src: "/illustrations/warm.svg", label: t.home.seasons.after, text: t.home.seasons.afterText, alt: t.home.seasons.afterAlt, tone: "bg-wood-100 text-wood-600" },
          ].map((s, i) => (
            <Reveal as="figure" key={s.src} delay={i * 120} className="overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} loading="lazy" className="block w-full" />
              <figcaption className="flex items-start gap-4 p-6">
                <span className={`shrink-0 rounded-[2px] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${s.tone}`}>{s.label}</span>
                <span className="text-[0.95rem] leading-relaxed text-charcoal">{s.text}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <ButtonLink href={routePath(site, "calculator")} variant="wood" size="lg">
            {t.home.seasons.cta} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ------------------------------------------------------------ Reviews */}
      <section className="container-page py-20">
        <Reveal>
          <SectionHeading
            kicker={t.home.reviews.kicker}
            title={t.home.reviews.title}
            subtitle={stats.count > 0 && stats.average ? fmt(t.home.reviews.average, { avg: formatNumber(stats.average, site.locale), n: stats.count }) : t.home.reviews.subtitle}
            action={
              <ButtonLink href={routePath(site, "reviews")} variant="secondary" size="sm">
                {t.home.reviews.cta}
              </ButtonLink>
            }
          />
        </Reveal>
        {reviews.length > 0 ? (
          <div className="grid gap-px bg-line ring-1 ring-line md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="flex flex-col bg-white p-7">
                <div className="flex gap-0.5 text-wood" aria-label={fmt(t.reviews.stars, { n: r.rating })}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star key={k} className={`h-3.5 w-3.5 ${k < r.rating ? "fill-current" : "opacity-25"}`} />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 font-display text-[1.45rem] leading-snug text-forest">“{r.body}”</blockquote>
                <figcaption className="mt-6 text-sm text-stone">
                  <span className="font-semibold text-charcoal">{r.authorName}</span>
                  {r.city ? ` · ${r.city}` : ""} · {reviewSourceLabel(r, t)}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 bg-white p-8 ring-1 ring-line md:grid-cols-12">
            <p className="font-display text-[1.9rem] leading-tight text-forest md:col-span-5">{t.home.reviews.emptyTitle}</p>
            <p className="text-[0.95rem] leading-relaxed text-stone md:col-span-6 md:col-start-7">{t.home.reviews.emptyText}</p>
          </div>
        )}
      </section>
    </>
  );
}
