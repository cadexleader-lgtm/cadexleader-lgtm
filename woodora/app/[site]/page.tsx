import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calculator, Check, Handshake, MessageCircle, PackageCheck, ShieldCheck, Star, Truck, Trees } from "lucide-react";
import { HeroScene } from "@/components/art/HeroScene";
import { ProductArt } from "@/components/art/ProductArt";
import { ProductCard } from "@/components/site/ProductCard";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listProducts, toPublicProduct } from "@/lib/data/products";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
import { listPublishedArticles } from "@/lib/data/blog";
import { blogPath, categoryPath, routePath, SITES } from "@/lib/sites";
import { fmt, formatNumber, loc } from "@/lib/format";
import { formatLabel } from "@/lib/product-format";
import { CATEGORY_ART } from "@/lib/category-art";
import { estimateHeatingNeeds } from "@/lib/calculator";
import { ProductVisual } from "@/components/site/ProductVisual";

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

export default async function HomePage({ params }: SiteParams) {
  const { site: id } = await params;
  const ctx = await loadSite(id);
  const { site, t, market, categories } = ctx;
  const [products, reviews, stats, articles] = await Promise.all([
    listProducts(site.market, site.lang),
    listApprovedReviews(site.market, 3),
    reviewStats(site.market),
    listPublishedArticles(site.lang, site.market, 3),
  ]);
  const featured = (products.filter((p) => p.featured).length >= 4 ? products.filter((p) => p.featured) : products).slice(0, 4);
  const countByCat = (c: string) => products.filter((p) => p.categoryId === c).length;

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
  const year = new Date().getFullYear();
  const season = new Date().getMonth() >= 6 ? `${year}–${year + 1}` : `${year - 1}–${year}`;
  const whyIcons = [Truck, Handshake, PackageCheck, MessageCircle];

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden bg-forest-950 text-cream">
        <HeroScene className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/70 to-forest-950/10" aria-hidden />
        <div className="container-page grid min-h-[560px] items-center gap-10 py-16 sm:py-24 lg:min-h-[640px] lg:grid-cols-[1.25fr_1fr]">
          <div className="max-w-2xl animate-fade-up">
            <p className="kicker text-wood-100">{t.home.hero.kicker}</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.3rem]">{t.home.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">{t.home.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={routePath(site, "shop")} variant="wood" size="lg">
                {t.home.hero.ctaShop} <ArrowRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href={routePath(site, "calculator")} variant="outline-light" size="lg">
                <Calculator className="h-5 w-5" /> {t.home.hero.ctaCalc}
              </ButtonLink>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-cream/75">
              {t.home.hero.trust.map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  {i > 0 && <span className="text-wood" aria-hidden>•</span>}
                  {item}
                </span>
              ))}
            </p>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="w-[340px] animate-fade-up rounded-2xl bg-cream/[0.08] p-6 ring-1 ring-cream/15 backdrop-blur-md [animation-delay:150ms]">
              <p className="kicker text-wood-100">{market.flag} {market.names[site.lang]} · {market.currency}</p>
              <p className="mt-3 font-display text-2xl">{fmt(t.home.hero.card.title, { year: season })}</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/75">{t.home.hero.card.text}</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {t.preorder.reassurance.map((r) => (
                  <li key={r} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-wood/90">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Categories */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          kicker={t.home.categories.kicker}
          title={t.home.categories.title}
          subtitle={t.home.categories.subtitle}
          action={
            <Link href={routePath(site, "shop")} className="inline-flex items-center gap-2 font-medium text-pine hover:text-forest">
              {t.nav.allProducts} <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories
            .filter((c) => c.active)
            .map((c, i, all) => {
              const n = countByCat(c.id);
              const art = CATEGORY_ART[c.id];
              return (
                <Link
                  key={c.id}
                  href={categoryPath(site, c.id)}
                  className={`group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-forest p-6 text-cream shadow-[var(--shadow-soft)] ${
                    i === 0 || (i === all.length - 1 && all.length % 2 === 0) ? "lg:col-span-2" : ""
                  }`}
                >
                  <ProductVisual
                    image={c.imageUrl}
                    art={art.art}
                    species={art.species}
                    seed={`cat-${c.id}`}
                    alt={loc(c.name, site.lang)}
                    className="!absolute inset-0 transition duration-700 group-hover:scale-[1.04]"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/35 to-transparent" aria-hidden />
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-wood-100/90">
                      {n === 0 ? t.home.categories.count0 : n === 1 ? t.home.categories.count1 : fmt(t.home.categories.count, { n })}
                    </p>
                    <h3 className="mt-1.5 text-[1.9rem] leading-tight">{loc(c.name, site.lang)}</h3>
                    <p className="mt-1.5 max-w-sm text-[0.92rem] leading-relaxed text-cream/80">{loc(c.description, site.lang)}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cream">
                      {t.common.discover}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      {/* ------------------------------------------------------------ Best sellers */}
      {featured.length > 0 && (
        <section className="border-y border-line bg-cream-200/60 py-20 sm:py-24">
          <div className="container-page">
            <SectionHeading
              kicker={t.home.bestsellers.kicker}
              title={fmt(t.home.bestsellers.title, { country: market.names[site.lang] })}
              subtitle={fmt(t.home.bestsellers.subtitle, { currency: market.currency })}
              action={
                <ButtonLink href={routePath(site, "shop")} variant="secondary">
                  {t.common.seeAll} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              }
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} p={toPublicProduct(p, site.lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(p, t, site.lang)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Calculator */}
      <section className="container-page py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-[28px] bg-forest text-cream">
          <div className="grain absolute inset-0" aria-hidden />
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
              <ButtonLink href={routePath(site, "calculator")} variant="wood" size="lg" className="mt-9 uppercase tracking-wide">
                <Calculator className="h-5 w-5" /> {t.home.calculator.cta}
              </ButtonLink>
            </div>
            <div className="self-center rounded-2xl bg-cream p-6 text-charcoal shadow-2xl sm:p-7">
              <p className="kicker">{t.home.calculator.sample}</p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{sampleText}</p>
              <div className="mt-5 rounded-xl bg-white p-5 ring-1 ring-line">
                <p className="text-sm text-stone">{t.calculator.result.need}</p>
                <p className="mt-1 font-display text-4xl text-forest">
                  {fmt(t.calculator.result.range, {
                    low: formatNumber(sampleResult.low, site.locale),
                    high: formatNumber(sampleResult.high, site.locale),
                  })}
                </p>
                <p className="mt-1 text-[0.95rem] font-medium text-wood-600">{sampleUnit[1]}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-200">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sage via-pine to-wood" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Why us */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading kicker={t.home.why.kicker} title={t.home.why.title} align="center" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.items.map((item, i) => {
              const Icon = whyIcons[i];
              return (
                <div key={item.title} className="rounded-[var(--radius-card)] bg-cream p-6 ring-1 ring-line/70">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-wood-100">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl text-forest">{item.title}</h3>
                  <p className="mt-2 text-[0.94rem] leading-relaxed text-stone">{item.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-sage-100/70 px-6 py-5 text-[0.94rem] text-pine sm:flex-row sm:items-center">
            <Trees className="h-5 w-5 shrink-0" />
            <p>
              <strong className="font-semibold">{t.home.transparency.title}.</strong> {t.home.transparency.text}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ How to order */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading kicker={t.home.how.kicker} title={t.home.how.title} subtitle={t.common.noPayment} />
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.home.how.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-line/70">
              <span className="font-display text-5xl leading-none text-wood/35">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-stone">{s.text}</p>
              {i < 3 && <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-cream p-1 text-wood lg:block" />}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href={routePath(site, "shop")}>{t.home.hero.ctaShop}</ButtonLink>
          <ButtonLink href={routePath(site, "faq")} variant="ghost">
            {t.nav.faq} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* ------------------------------------------------------------ Reviews */}
      <section className="border-y border-line bg-cream-200/60 py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading
            kicker={t.home.reviews.kicker}
            title={t.home.reviews.title}
            subtitle={
              stats.count > 0 && stats.average
                ? fmt(t.home.reviews.average, { avg: formatNumber(stats.average, site.locale), n: stats.count })
                : t.home.reviews.subtitle
            }
            action={
              <ButtonLink href={routePath(site, "reviews")} variant="secondary">
                <Star className="h-4 w-4" /> {t.home.reviews.cta}
              </ButtonLink>
            }
          />
          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="card flex flex-col p-6">
                  <div className="flex gap-0.5 text-wood" aria-label={fmt(t.reviews.stars, { n: r.rating })}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-25"}`} />
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
              ))}
            </div>
          ) : (
            <div className="grid items-center gap-8 rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-soft)] ring-1 ring-line/70 md:grid-cols-[auto_1fr_auto]">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wood-100 text-wood-600">
                <ShieldCheck className="h-8 w-8" />
              </span>
              <div>
                <p className="font-display text-2xl text-forest">{t.home.reviews.emptyTitle}</p>
                <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-stone">{t.home.reviews.emptyText}</p>
              </div>
              <ButtonLink href={routePath(site, "reviews")}>{t.home.reviews.cta}</ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ Advice */}
      {articles.length > 0 && (
        <section className="container-page py-20 sm:py-24">
          <SectionHeading
            kicker={t.blog.kicker}
            title={t.blog.title}
            action={
              <Link href={blogPath(site)} className="inline-flex items-center gap-2 font-medium text-pine hover:text-forest">
                {t.blog.back} <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={blogPath(site, a.slug)} className="group card overflow-hidden">
                <div className="aspect-[16/9] overflow-hidden">
                  {a.coverImage ? (
                    <ProductVisual image={a.coverImage} art={null} species={null} seed={a.slug} alt={a.title} className="h-full w-full" />
                  ) : (
                    <ProductArt art={a.coverArt} seed={a.slug} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
                  )}
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wider text-wood">{fmt(t.common.minutes, { n: a.readingMinutes })}</p>
                  <h3 className="mt-2 text-xl leading-snug text-forest group-hover:text-pine">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[0.92rem] text-stone">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
