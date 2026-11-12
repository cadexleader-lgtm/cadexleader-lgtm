import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Carousel } from "@/components/site/Carousel";
import { HeroSlider, type Slide } from "@/components/site/HeroSlider";
import { emphasize } from "@/lib/emphasize";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listProducts, toPublicProduct, type Product } from "@/lib/data/products";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
import { blogPath, categoryPath, routePath, SITES } from "@/lib/sites";
import { fmt, formatMoney, formatNumber } from "@/lib/format";
import { formatLabel } from "@/lib/product-format";
import { estimateHeatingNeeds } from "@/lib/calculator";
import { SPECIES } from "@/lib/energy";
import { CATALOG_SPECIES } from "@/lib/db/seed-species-catalog";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { site: id } = await params;
  const { t, site } = await loadSite(id);
  return {
    title: { absolute: t.meta.title },
    description: t.meta.description,
    alternates: {
      canonical: site.prefix,
      languages: { "fr-CA": SITES.ca.prefix, "en-CA": SITES["ca-en"].prefix, "en-US": SITES.us.prefix, "fr-FR": SITES.fr.prefix },
    },
  };
}

const SAMPLE = {
  fr: { postal: "37000", area: 120, place: "Tours" },
  ca: { postal: "H2X 1Y4", area: 1300, place: "Montréal" },
  us: { postal: "12207", area: 1300, place: "Albany, NY" },
} as const;

/** Relative characteristics on a 5-point scale (density, ease of lighting, coal life). */
const SPECIES_SCORES: Record<(typeof CATALOG_SPECIES)[number], { heat: number; lighting: number; coals: number }> = {
  oak: { heat: 5, lighting: 2, coals: 5 },
  beech: { heat: 4, lighting: 3, coals: 4 },
  birch: { heat: 3, lighting: 5, coals: 3 },
  maple: { heat: 4, lighting: 3, coals: 4 },
  ash: { heat: 4, lighting: 4, coals: 4 },
  pine: { heat: 2, lighting: 5, coals: 2 },
};

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${label} ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-[3px] w-4 ${i < value ? "bg-forest" : "bg-forest/15"}`} />
      ))}
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function HomePage({ params }: SiteParams) {
  const { site: id } = await params;
  const ctx = await loadSite(id);
  const { site, t, market } = ctx;
  const [products, reviews, stats] = await Promise.all([listProducts(site.market, site.lang), listApprovedReviews(site.market, 3), reviewStats(site.market)]);

  // Products that already have a real photo come first in the showcases.
  const photoFirst = (list: Product[]) => [...list.filter((p) => p.images.length > 0), ...list.filter((p) => p.images.length === 0)];
  const featured = photoFirst([...products.filter((p) => p.featured), ...products.filter((p) => !p.featured && p.categoryId === "firewood")]).slice(0, 8);
  const kiln = photoFirst(products.filter((p) => ["kiln-dried", "pellets", "briquettes"].includes(p.categoryId))).slice(0, 10);
  const speciesList = CATALOG_SPECIES.filter((s) => products.some((p) => p.species === s));
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

  const tiles = [
    { href: routePath(site, "calculator"), image: "/images/ambiance/texture-log-ends.webp", ...t.home.tiles[0] },
    { href: routePath(site, "shop"), image: "/images/photos/kiln-dried-crates.webp", ...t.home.tiles[1] },
    { href: categoryPath(site, "firewood"), image: "/images/ambiance/texture-rings.webp", ...t.home.tiles[2] },
    { href: blogPath(site), image: "/images/ambiance/texture-split-logs.webp", ...t.home.tiles[3] },
    { href: routePath(site, "about"), image: "/images/ambiance/texture-cracked.webp", ...t.home.tiles[4] },
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

      {/* ------------------------------------------------------------ Commitments */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-4">
          {t.home.values.map((v, i) => (
            <div
              key={v.title}
              className={`border-line py-8 sm:px-6 ${i > 0 ? "border-t sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l" : "sm:pl-0"} ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""}`}
            >
              <p className="text-[0.72rem] font-semibold tabular-nums tracking-[0.18em] text-wood-600">{pad(i + 1)}</p>
              <p className="mt-3 font-semibold text-charcoal">{v.title}</p>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-stone">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Cosy band (illustration visible early) */}
      <section className="overflow-hidden bg-cream-200/60">
        <div className="container-page grid items-center gap-8 py-14 md:grid-cols-12 md:py-16">
          <Reveal className="md:col-span-5">
            <p className="kicker">{t.home.cosyBand.kicker}</p>
            <h2 className="mt-4 text-[2.3rem] leading-[1.02] text-forest sm:text-[3rem]">{emphasize(t.home.cosyBand.title)}</h2>
            <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-stone">{t.home.cosyBand.text}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
              <ButtonLink href={routePath(site, "shop")} variant="wood">
                {t.home.cosyBand.cta} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <Link href={routePath(site, "calculator")} className={underline}>
                {t.home.cosyBand.secondary}
              </Link>
            </div>
          </Reveal>
          <Reveal className="md:col-span-7" delay={120}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/cosy-stove.svg" alt={t.home.cosyAlt} className="mx-auto block w-full max-w-[640px]" />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ Banners */}
      <section className="container-page grid gap-4 pt-16 md:grid-cols-12">
        {[
          { href: routePath(site, "delivery"), image: "/images/photos/firewood-crates-yard.webp", position: "50% 60%", span: "md:col-span-7", ...t.home.banners.delivery },
          { href: blogPath(site), image: "/images/ambiance/modern-fireplace.webp", position: "50% 62%", span: "md:col-span-5", ...t.home.banners.advice },
        ].map((b, i) => (
          <Reveal key={b.href} delay={i * 80} className={b.span}>
            <Link href={b.href} className="group relative flex h-72 items-end overflow-hidden bg-forest-950 text-cream sm:h-80">
              <Image
                src={b.image}
                alt=""
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: b.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/25 to-transparent" />
              <div className="relative flex w-full items-end justify-between gap-6 p-7 sm:p-8">
                <div className="max-w-sm">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream/60">{pad(i + 1)}</p>
                  <h2 className="mt-2 text-[2.4rem] leading-none sm:text-[2.8rem]">{b.title}</h2>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-cream/75">{b.text}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] bg-cream text-ink transition-colors group-hover:bg-wood">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------------------ Featured */}
      {featured.length > 0 && (
        <section className="container-page pt-20">
          <Reveal>
            <Carousel
              title={t.home.featured}
              prevLabel={t.common.previous}
              nextLabel={t.common.next}
              action={
                <Link href={routePath(site, "shop")} className={`hidden shrink-0 pb-1 sm:inline ${underline}`}>
                  {t.common.seeAll}
                </Link>
              }
            >
              {featured.map((p, i) => card(p, i < 4))}
            </Carousel>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------------ Species guide */}
      {speciesList.length > 0 && (
        <section className="mt-16 bg-cream-200/70 py-20">
          <div className="container-page">
            <Reveal>
              <SectionHeading kicker={t.home.speciesTable.kicker} title={emphasize(t.home.speciesTable.title)} subtitle={t.home.speciesTable.subtitle} />
            </Reveal>
            <Reveal>
              <div className="bg-white ring-1 ring-line">
                <div className="hidden grid-cols-[2.2fr_1fr_1fr_1fr_0.7fr_auto] gap-6 border-b border-line px-6 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-stone md:grid">
                  <span>{t.home.speciesTable.species}</span>
                  <span>{t.home.speciesTable.heat}</span>
                  <span>{t.home.speciesTable.lighting}</span>
                  <span>{t.home.speciesTable.coals}</span>
                  <span>{t.home.speciesTable.formats}</span>
                  <span className="w-10" />
                </div>
                {speciesList.map((sp) => {
                  const sc = SPECIES_SCORES[sp];
                  const n = products.filter((p) => p.species === sp).length;
                  const thumb = products.find((p) => p.species === sp && p.images.length > 0)?.images[0];
                  const name = SPECIES[sp].names[site.lang];
                  return (
                    <Link
                      key={sp}
                      href={`${routePath(site, "shop")}?species=${sp}`}
                      className="group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-4 border-b border-line px-6 py-5 transition-colors last:border-b-0 hover:bg-cream md:grid-cols-[2.2fr_1fr_1fr_1fr_0.7fr_auto] md:gap-6"
                    >
                      <span className="flex items-center gap-4">
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-cream-200 ring-1 ring-line" aria-hidden>
                          {thumb ? (
                            <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <span className="font-display text-2xl leading-none text-forest/70">{name.charAt(0)}</span>
                          )}
                        </span>
                        <span>
                          <span className="block font-display text-[1.7rem] leading-none text-forest">{name}</span>
                          <span className="mt-1 block text-[0.82rem] text-stone">{t.home.species.taglines[sp]}</span>
                        </span>
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-[3px] text-forest ring-1 ring-inset ring-forest/15 transition-colors group-hover:bg-forest group-hover:text-cream md:order-last">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      <span className="col-span-2 grid grid-cols-3 gap-4 md:contents">
                        {(["heat", "lighting", "coals"] as const).map((k) => (
                          <span key={k} className="flex flex-col gap-1.5 md:block">
                            <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-stone md:hidden">{t.home.speciesTable[k]}</span>
                            <Meter value={sc[k]} label={t.home.speciesTable[k]} />
                          </span>
                        ))}
                      </span>
                      <span className="hidden text-sm tabular-nums text-charcoal md:block">{n}</span>
                    </Link>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Kiln-dried */}
      {kiln.length > 0 && (
        <section className="container-page pt-20">
          <Reveal>
            <Carousel
              title={t.home.kiln}
              prevLabel={t.common.previous}
              nextLabel={t.common.next}
              action={
                <Link href={categoryPath(site, "kiln-dried")} className={`hidden shrink-0 pb-1 sm:inline ${underline}`}>
                  {t.common.seeAll}
                </Link>
              }
            >
              {kiln.map((p) => card(p))}
            </Carousel>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------------ Tiles */}
      <section className="container-page grid gap-x-4 gap-y-2 pt-16 md:grid-cols-6">
        {tiles.map((tile, i) => (
          <Reveal key={tile.title} delay={(i % 3) * 70} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
            <Link href={tile.href} className="group block">
              <div className={`relative overflow-hidden bg-forest-950 ${i < 2 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                <Image src={tile.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-line py-4">
                <div>
                  <p className="text-[0.68rem] font-semibold tabular-nums uppercase tracking-[0.18em] text-wood-600">{pad(i + 1)}</p>
                  <p className="mt-1.5 font-display text-[1.75rem] leading-tight text-forest">{tile.title}</p>
                  <p className="text-[0.88rem] text-stone">{tile.text}</p>
                </div>
                <ArrowUpRight className="mt-6 h-5 w-5 shrink-0 text-stone transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
              </div>
            </Link>
          </Reveal>
        ))}
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

      {/* ------------------------------------------------------------ Why us */}
      <section className="container-page py-20">
        <Reveal>
          <SectionHeading kicker={t.home.why.kicker} title={t.home.why.title} subtitle={t.home.transparency.text} />
        </Reveal>
        <div className="grid gap-px bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {t.home.why.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 60} className="bg-white p-7">
              <p className="font-display text-[3rem] leading-none text-wood">{pad(i + 1)}</p>
              <h3 className="mt-6 text-[1.05rem] text-charcoal">{item.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-stone">{item.text}</p>
            </Reveal>
          ))}
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
                  {r.city ? ` · ${r.city}` : ""} · {t.home.reviews.verified}
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
