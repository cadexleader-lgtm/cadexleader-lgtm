import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Calculator, Check, Flame, Handshake, MessageCircle, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Carousel } from "@/components/site/Carousel";
import { HeroSlider, type Slide } from "@/components/site/HeroSlider";
import { SpeciesDisc } from "@/components/site/SpeciesDisc";
import { ButtonLink } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/motion/Marquee";
import { Embers } from "@/components/motion/Embers";
import { CountUp } from "@/components/motion/CountUp";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listProducts, toPublicProduct, type Product } from "@/lib/data/products";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
import { blogPath, categoryPath, routePath, SITES } from "@/lib/sites";
import { fmt, formatNumber, money } from "@/lib/format";
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

const SPECIES_SCORES: Record<(typeof CATALOG_SPECIES)[number], { heat: number; lighting: number; coals: number }> = {
  oak: { heat: 95, lighting: 45, coals: 100 },
  beech: { heat: 90, lighting: 60, coals: 80 },
  birch: { heat: 72, lighting: 100, coals: 55 },
  maple: { heat: 88, lighting: 60, coals: 80 },
  ash: { heat: 82, lighting: 78, coals: 75 },
  pine: { heat: 55, lighting: 100, coals: 35 },
};

export default async function HomePage({ params }: SiteParams) {
  const { site: id } = await params;
  const ctx = await loadSite(id);
  const { site, t, market, freeThresholdCents } = ctx;
  const [products, reviews, stats] = await Promise.all([listProducts(site.market, site.lang), listApprovedReviews(site.market, 3), reviewStats(site.market)]);

  const featuredRaw = products.filter((p) => p.featured);
  const featured = [...featuredRaw, ...products.filter((p) => !p.featured && p.categoryId === "firewood")].slice(0, 8);
  const kiln = products.filter((p) => p.categoryId === "kiln-dried" || p.categoryId === "pellets" || p.categoryId === "briquettes").slice(0, 10);
  const speciesList = CATALOG_SPECIES.filter((s) => products.some((p) => p.species === s));
  const card = (p: Product, priority = false) => (
    <ProductCard key={p.id} p={toPublicProduct(p, site.lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(p, t, site.lang)} priority={priority} />
  );

  const sample = SAMPLE[site.market];
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
  const sampleText = fmt(t.home.calculator.sampleText, {
    area: `${formatNumber(sample.area, site.locale, 0)} ${site.market === "fr" ? "m²" : site.lang === "fr" ? "pi²" : "sq ft"}`,
    place: sample.place,
  });
  const freeLabel = freeThresholdCents ? fmt(t.topbar.freeDeliveryFrom, { amount: money(site, freeThresholdCents, market.currency) }) : t.topbar.freeDelivery;
  const marqueeItems = [freeLabel, ...t.preorder.reassurance, ...t.home.marquee];
  const whyIcons = [Truck, Handshake, PackageCheck, MessageCircle];

  const slides: Slide[] = [
    { image: "/images/ambiance/cabin-stove.webp", position: "50% 40%", href: routePath(site, "shop"), ...t.home.slides[0] },
    { image: "/images/ambiance/living-room-fireplace.webp", position: "50% 56%", href: routePath(site, "calculator"), ...t.home.slides[1] },
    { image: "/images/photos/delivery-trailer.webp", position: "50% 55%", href: routePath(site, "delivery"), ...t.home.slides[2] },
  ];

  const tiles = [
    { href: routePath(site, "calculator"), image: "/images/ambiance/texture-log-ends.webp", ...t.home.tiles[0] },
    { href: routePath(site, "shop"), image: "/images/photos/kiln-dried-crates.webp", ...t.home.tiles[1] },
    { href: categoryPath(site, "firewood"), image: "/images/ambiance/texture-rings.webp", ...t.home.tiles[2] },
    { href: blogPath(site), image: "/images/ambiance/texture-split-logs.webp", ...t.home.tiles[3] },
    { href: routePath(site, "about"), image: "/images/ambiance/texture-cracked.webp", ...t.home.tiles[4] },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ Hero slider */}
      <HeroSlider slides={slides} labels={{ prev: t.common.previous, next: t.common.next, slide: t.common.slide }}>
        <Embers count={22} className="z-10" />
      </HeroSlider>

      {/* ------------------------------------------------------------ Trust marquee */}
      <div className="bg-forest text-cream">
        <Marquee duration={40} itemClassName="items-center gap-10 pr-10 py-3">
          {marqueeItems.map((m) => (
            <span key={m} className="flex items-center gap-10 whitespace-nowrap text-[0.8rem] font-medium uppercase tracking-[0.16em]">
              {m}
              <Flame className="h-3.5 w-3.5 text-wood" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ------------------------------------------------------------ Promo banners */}
      <section className="container-page grid gap-5 pt-14 md:grid-cols-2">
        {[
          { href: routePath(site, "delivery"), image: "/images/photos/firewood-crates-yard.webp", position: "50% 60%", ...t.home.banners.delivery, Icon: Truck },
          { href: blogPath(site), image: "/images/ambiance/modern-fireplace.webp", position: "50% 62%", ...t.home.banners.advice, Icon: Flame },
        ].map((b, i) => (
          <Reveal key={b.href} delay={i * 100} variant="scale">
            <Link href={b.href} className="group relative flex h-56 items-center overflow-hidden rounded-xl bg-forest-950 p-7 text-cream ring-4 ring-white shadow-[0_18px_40px_-24px_rgb(22_21_21/0.6)] sm:h-60 sm:p-9">
              <Image src={b.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.07]" style={{ objectPosition: b.position }} />
              <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/45 to-transparent" />
              <div className="relative max-w-xs">
                <b.Icon className="h-6 w-6 text-wood" />
                <h2 className="mt-2 text-4xl sm:text-[2.6rem]">{b.title}</h2>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-cream/80">{b.text}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-wood-100">
                  {b.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------------------ Featured products */}
      {featured.length > 0 && (
        <section className="container-page pt-16">
          <Reveal>
            <Carousel title={t.home.featured} prevLabel={t.common.previous} nextLabel={t.common.next}>
              {featured.map((p, i) => card(p, i < 4))}
            </Carousel>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------------ Species */}
      {speciesList.length > 0 && (
        <section className="mt-10 border-y border-line bg-cream-200/60 py-16">
          <div className="container-page">
            <Reveal>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="kicker mb-2">{t.home.species.kicker}</p>
                  <h2 className="text-[1.75rem] text-forest sm:text-[2.1rem]">{t.home.species.title}</h2>
                  <p className="mt-1.5 max-w-2xl text-stone">{t.home.species.subtitle}</p>
                </div>
                <Link href={routePath(site, "shop")} className="inline-flex items-center gap-2 font-semibold text-wood-600 hover:text-forest">
                  {t.nav.allProducts} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {speciesList.map((sp, i) => {
                const n = products.filter((p) => p.species === sp).length;
                const scores = SPECIES_SCORES[sp];
                return (
                  <Reveal key={sp} delay={i * 70}>
                    <Link
                      href={`${routePath(site, "shop")}?species=${sp}`}
                      className="group flex h-full items-center gap-5 rounded-xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                    >
                      <SpeciesDisc species={sp} className="h-24 w-24 shrink-0 drop-shadow-md transition duration-700 group-hover:rotate-[30deg]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-2xl text-forest">{SPECIES[sp].names[site.lang]}</h3>
                          <span className="text-xs text-stone">{fmt(t.home.species.count, { n })}</span>
                        </div>
                        <p className="text-sm text-wood-600">{t.home.species.taglines[sp]}</p>
                        <dl className="mt-3 space-y-1.5">
                          {(["heat", "lighting", "coals"] as const).map((k) => (
                            <div key={k} className="grid grid-cols-[70px_1fr] items-center gap-2 text-[0.72rem] text-stone">
                              <dt>{t.home.species.bars[k]}</dt>
                              <dd className="h-1.5 overflow-hidden rounded-full bg-cream-200">
                                <span className="bar-fill block h-full rounded-full bg-gradient-to-r from-pine to-wood" style={{ width: `${scores[k]}%` }} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <ArrowUpRight className="h-5 w-5 shrink-0 self-start text-stone transition group-hover:text-wood" />
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Kiln-dried & densified */}
      {kiln.length > 0 && (
        <section className="container-page pt-16">
          <Reveal>
            <Carousel
              title={t.home.kiln}
              prevLabel={t.common.previous}
              nextLabel={t.common.next}
              action={
                <Link href={categoryPath(site, "kiln-dried")} className="hidden shrink-0 text-sm font-semibold text-wood-600 hover:text-forest sm:inline">
                  {t.common.seeAll} →
                </Link>
              }
            >
              {kiln.map((p) => card(p))}
            </Carousel>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------------ Promo tiles */}
      <section className="container-page grid gap-5 pt-10 md:grid-cols-6">
        {tiles.map((tile, i) => (
          <Reveal key={tile.title} delay={i * 80} variant="scale" className={i < 2 ? (i === 0 ? "md:col-span-3" : "md:col-span-3") : "md:col-span-2"}>
            <Link href={tile.href} className="group relative flex h-48 items-end overflow-hidden rounded-xl bg-forest-950 p-6 text-cream ring-1 ring-line sm:h-56">
              <Image src={tile.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.08]" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/35 to-forest-950/5 transition duration-500 group-hover:from-forest-950/95" />
              <div className="relative">
                <h3 className="text-[1.9rem] leading-tight drop-shadow">{tile.title}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-cream/80">
                  {tile.text} <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------------------ Calculator */}
      <section className="container-page py-16 sm:py-20">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-[24px] bg-forest text-cream">
            <Image src="/images/ambiance/texture-stack.webp" alt="" fill sizes="100vw" className="object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/95 to-forest/70" aria-hidden />
            <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:gap-14 lg:p-16">
              <div>
                <p className="kicker text-wood-100">{t.home.calculator.kicker}</p>
                <h2 className="mt-4 text-3xl leading-[1.1] sm:text-[2.7rem]">{t.home.calculator.title}</h2>
                <p className="mt-4 text-lg text-cream/75">{t.home.calculator.subtitle}</p>
                <ul className="mt-7 space-y-3">
                  {t.home.calculator.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-cream/85">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/10 ring-1 ring-cream/20">
                        <Check className="h-3.5 w-3.5 text-wood-100" />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={routePath(site, "calculator")} variant="wood" size="lg" className="shine mt-9 uppercase tracking-wide">
                  <Calculator className="h-5 w-5" /> {t.home.calculator.cta}
                </ButtonLink>
              </div>
              <div className="self-center rounded-2xl bg-cream p-6 text-charcoal shadow-2xl sm:p-7">
                <p className="kicker">{t.home.calculator.sample}</p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{sampleText}</p>
                <div className="mt-5 rounded-xl bg-white p-5 ring-1 ring-line">
                  <p className="text-sm text-stone">{t.calculator.result.need}</p>
                  <p className="mt-1 font-display text-4xl text-forest">
                    {fmt(t.calculator.result.range, { low: formatNumber(sampleResult.low, site.locale), high: formatNumber(sampleResult.high, site.locale) })}
                  </p>
                  <p className="mt-1 text-[0.95rem] font-medium text-wood-600">{sampleUnit[1]}</p>
                  <Reveal>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-200">
                      <span className="bar-fill block h-full w-2/3 rounded-full bg-gradient-to-r from-sage via-pine to-wood" />
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ Why us + figures */}
      <section className="bg-forest-950 py-16 text-cream sm:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="kicker text-wood-100">{t.home.why.kicker}</p>
                <h2 className="mt-3 text-[1.9rem] leading-tight sm:text-[2.6rem]">{t.home.why.title}</h2>
              </div>
              <div className="flex gap-8">
                {[3, speciesList.length || 6, 0].map((v, i) => (
                  <div key={i}>
                    <p className="font-display text-5xl text-wood">
                      <CountUp to={v} locale={site.locale} />
                    </p>
                    <p className="text-xs uppercase tracking-wider text-cream/60">{t.home.ambiance.stats[i === 2 ? 3 : i]}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.items.map((item, i) => {
              const Icon = whyIcons[i];
              return (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="group h-full rounded-xl bg-cream/[0.04] p-6 ring-1 ring-cream/10 transition duration-300 hover:bg-cream/[0.08] hover:ring-wood/50">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-wood/15 text-wood transition group-hover:bg-wood group-hover:text-ink">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-xl">{item.title}</h3>
                    <p className="mt-2 text-[0.93rem] leading-relaxed text-cream/65">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ How to order */}
      <section className="container-page py-16 sm:py-20">
        <Reveal>
          <div className="mb-8 flex items-center gap-5">
            <h2 className="shrink-0 text-[1.75rem] text-forest sm:text-[2.1rem]">{t.home.how.title}</h2>
            <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" aria-hidden />
          </div>
        </Reveal>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.home.how.steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 110} className="relative rounded-xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-line/70">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-forest font-display text-2xl text-wood-100">{i + 1}</span>
              <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal text-charcoal">{s.title}</h3>
              <p className="mt-1.5 text-[0.92rem] leading-relaxed text-stone">{s.text}</p>
            </Reveal>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2 text-sm text-stone">
          <ShieldCheck className="h-4 w-4 text-wood" /> {t.common.noPayment}
        </p>
      </section>

      {/* ------------------------------------------------------------ Reviews */}
      <section className="border-t border-line bg-cream-200/60 py-16 sm:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-center gap-5">
              <h2 className="shrink-0 text-[1.75rem] text-forest sm:text-[2.1rem]">{t.home.reviews.title}</h2>
              <span className="hidden h-px flex-1 bg-gradient-to-r from-line to-transparent sm:block" aria-hidden />
              <ButtonLink href={routePath(site, "reviews")} variant="secondary" size="sm">
                <Star className="h-4 w-4" /> {t.home.reviews.cta}
              </ButtonLink>
            </div>
          </Reveal>
          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 90}>
                  <figure className="card flex h-full flex-col p-6">
                    <div className="flex gap-0.5 text-wood" aria-label={fmt(t.reviews.stars, { n: r.rating })}>
                      {Array.from({ length: 5 }, (_, k) => (
                        <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-current" : "opacity-25"}`} />
                      ))}
                    </div>
                    {r.title && <p className="mt-4 font-display text-xl text-forest">{r.title}</p>}
                    <blockquote className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-charcoal/85">“{r.body}”</blockquote>
                    <figcaption className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-medium text-charcoal">
                        {r.authorName}
                        {r.city ? <span className="font-normal text-stone"> · {r.city}</span> : null}
                      </span>
                      {r.verified && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <ShieldCheck className="h-3.5 w-3.5" /> {t.home.reviews.verified}
                        </span>
                      )}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="grid items-center gap-6 rounded-xl bg-white p-7 shadow-[var(--shadow-soft)] ring-1 ring-line/70 md:grid-cols-[auto_1fr]">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-wood-100 text-wood-600">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-display text-2xl text-forest">{t.home.reviews.emptyTitle}</p>
                  <p className="mt-1.5 max-w-3xl text-[0.95rem] leading-relaxed text-stone">{t.home.reviews.emptyText}</p>
                </div>
              </div>
            </Reveal>
          )}
          {stats.count > 0 && stats.average && (
            <p className="mt-6 text-sm text-stone">{fmt(t.home.reviews.average, { avg: formatNumber(stats.average, site.locale), n: stats.count })}</p>
          )}
        </div>
      </section>
    </>
  );
}
