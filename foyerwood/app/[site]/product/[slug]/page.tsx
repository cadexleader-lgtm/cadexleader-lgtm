import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Calculator, Droplet, Flame, Info, Landmark, Ruler, ShieldCheck, Snowflake, Star, Truck, Handshake, type LucideIcon } from "lucide-react";
import { Breadcrumbs, Badge } from "@/components/ui";
import { Gallery } from "@/components/site/Gallery";
import { PhotoPending } from "@/components/site/ProductVisual";
import { ProductCard } from "@/components/site/ProductCard";
import { AddToCart } from "@/components/cart/AddToCart";
import { loadSite } from "@/lib/site-context";
import { availabilityOf, canOrder, getProductBySlug, listProducts, productEnergyKwh, toPublicProduct } from "@/lib/data/products";
import { categoryPath, productPath, routePath, SITES } from "@/lib/sites";
import { fmt, formatMoney, formatNumber, loc, money } from "@/lib/format";
import { SPECIES, unitContentSummary, unitDefinition, unitLabel } from "@/lib/energy";
import { formatLabel } from "@/lib/product-format";
import { reviewStats } from "@/lib/data/reviews";
import { seasonMessage } from "@/lib/season";
import { StickyBuyBar } from "@/components/cart/StickyBuyBar";

type Props = { params: Promise<{ site: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: id, slug } = await params;
  const { site } = await loadSite(id);
  const p = await getProductBySlug(site.market, decodeURIComponent(slug));
  if (!p) return {};
  const alt = site.market === "ca" ? { "fr-CA": productPath(SITES.ca, p.slug), "en-CA": productPath(SITES["ca-en"], p.slug) } : undefined;
  return {
    title: loc(p.name, site.lang),
    description: loc(p.shortDescription, site.lang),
    alternates: { canonical: productPath(site, p.slug), languages: alt },
    openGraph: { images: p.images[0] ? [p.images[0]] : undefined },
  };
}

const AVAIL_TONE = { available: "success", limited: "warning", out_of_stock: "danger", unavailable: "neutral" } as const;

export default async function ProductPage({ params }: Props) {
  const { site: id, slug } = await params;
  const ctx = await loadSite(id);
  const { site, t, market, categories, settings } = ctx;
  const p = await getProductBySlug(site.market, decodeURIComponent(slug));
  if (!p) notFound();

  const lang = site.lang;
  const name = loc(p.name, lang);
  const cat = categories.find((c) => c.id === p.categoryId);
  const availability = availabilityOf(p);
  const orderable = canOrder(availability);
  const unitOne = unitLabel(p.unit, lang, 1);
  const unitMany = unitLabel(p.unit, lang, 2);
  const content = unitContentSummary(
    {
      category: p.categoryId,
      unit: p.unit,
      species: p.species,
      moisture: p.moisturePct != null ? p.moisturePct / 100 : null,
      lengthCm: p.lengthCm,
      unitVolumeM3: p.unitVolumeM3,
      unitWeightKg: p.unitWeightKg,
      packing: p.packing,
    },
    lang,
    site.market,
  );
  const energy = productEnergyKwh(p);
  const all = await listProducts(site.market, lang);
  const sameSpecies = p.species ? all.filter((x) => x.id !== p.id && x.species === p.species) : [];
  const samePackaging = p.species ? all.filter((x) => x.id !== p.id && x.packaging === p.packaging && x.species && x.species !== p.species && x.categoryId === p.categoryId) : [];
  const related = sameSpecies.length || samePackaging.length ? [] : all.filter((x) => x.id !== p.id && x.categoryId === p.categoryId).slice(0, 4);
  const lengthText =
    p.lengthCm != null && p.lengthCm >= 5
      ? site.market === "fr"
        ? `${formatNumber(p.lengthCm, site.locale, 0)} cm`
        : `${formatNumber(p.lengthCm / 2.54, site.locale, 0)} ${lang === "fr" ? "po" : "in"} (${formatNumber(p.lengthCm, site.locale, 0)} cm)`
      : null;

  // Conversion cues, all from real data: verified reviews, real stock, real season, price per kWh.
  const stats = await reviewStats(site.market);
  const proof =
    stats.count > 0 && stats.average != null
      ? fmt(stats.count === 1 ? t.marketing.reviewsOne : t.marketing.reviews, { avg: formatNumber(stats.average, site.locale, 1), n: stats.count })
      : null;
  const perKwh =
    energy && energy > 0
      ? fmt(t.marketing.perKwh, {
          price: new Intl.NumberFormat(site.locale, { style: "currency", currency: market.currency, minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(p.priceCents / 100 / energy),
        })
      : null;
  const stockLeft =
    p.trackStock && availability === "limited" && p.stockQuantity > 0
      ? fmt(t.marketing.stockLeft, { n: p.stockQuantity, unit: p.stockQuantity > 1 ? unitMany : unitOne })
      : null;
  const zeroToday = t.marketing.zeroToday.replace("{zero}", formatMoney(0, market.currency, site.locale));

  // Benefits strip: only facts we can state for this product.
  const perksT = t.product.perks;
  const perks: Array<{ Icon: LucideIcon; title: string; text: string }> = [{ Icon: Truck, ...perksT.delivery }];
  if (p.moisturePct != null && p.categoryId !== "accessories") {
    perks.push({
      Icon: Droplet,
      title: fmt(perksT.moisture.title, { n: formatNumber(p.moisturePct, site.locale, 0) }),
      text: p.moisturePct <= 20 && ["firewood", "kiln-dried", "kindling"].includes(p.categoryId) ? perksT.moisture.dry : perksT.moisture.text,
    });
  }
  if (lengthText) perks.push({ Icon: Ruler, title: fmt(perksT.length.title, { len: lengthText }), text: perksT.length.text });
  if (energy) perks.push({ Icon: Flame, title: fmt(perksT.energy.title, { n: formatNumber(energy, site.locale, 0), unit: unitOne }), text: perksT.energy.text });
  perks.push({ Icon: Landmark, ...perksT.payment });

  const specs: Array<[string, string]> = [];
  if (p.species) specs.push([t.product.species, SPECIES[p.species].names[lang]]);
  if (p.moisturePct != null && p.categoryId !== "accessories") specs.push([t.product.moisture, fmt(t.product.moistureValue, { n: formatNumber(p.moisturePct, site.locale, 0) })]);
  if (lengthText && p.categoryId !== "pellets") specs.push([t.product.length, lengthText]);
  specs.push([t.product.packaging, t.packaging[p.packaging]]);
  specs.push([t.product.unit, unitOne.charAt(0).toUpperCase() + unitOne.slice(1)]);
  if (content) specs.push([t.product.content, content]);
  specs.push([t.product.minOrder, `${p.minQty} ${p.minQty > 1 ? unitMany : unitOne}`]);
  if (p.sku) specs.push([t.product.sku, p.sku]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: loc(p.description, lang) || loc(p.shortDescription, lang),
    sku: p.sku ?? undefined,
    image: p.images.length ? p.images : undefined,
    brand: { "@type": "Brand", name: "Foyerwood" },
    offers: {
      "@type": "Offer",
      priceCurrency: market.currency,
      price: (p.priceCents / 100).toFixed(2),
      availability: orderable ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock",
      url: productPath(site, p.slug),
      eligibleQuantity: { "@type": "QuantitativeValue", minValue: p.minQty },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: t.common.home, href: site.prefix },
            { label: t.shop.title, href: routePath(site, "shop") },
            ...(cat ? [{ label: loc(cat.name, lang), href: categoryPath(site, cat.id) }] : []),
            { label: name },
          ]}
        />
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            {p.images.length > 0 ? (
              <Gallery images={p.images} alt={name} label={t.product.gallery} />
            ) : (
              <PhotoPending label={t.common.photoPending} className="aspect-[5/4] w-full rounded-[var(--radius-card)] ring-1 ring-line" />
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-wood-600">{formatLabel(p, t, lang)}</p>
            <h1 className="mt-2 text-[2.2rem] leading-tight text-forest sm:text-5xl">{name}</h1>
            {proof && (
              <Link href={routePath(site, "reviews")} className="mt-3 inline-flex items-center gap-2 text-sm text-charcoal hover:underline">
                <span className="flex" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor((stats.average ?? 0) + 0.25) ? "fill-wood text-wood" : "text-line"}`} />
                  ))}
                </span>
                {proof}
              </Link>
            )}
            <p className="mt-3 text-lg text-stone">{loc(p.shortDescription, lang)}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-semibold tracking-tight text-charcoal tabular-nums">
                {money(site, p.priceCents, market.currency)}
                <span className="ml-1.5 text-base font-normal text-stone">{fmt(t.common.perUnit, { unit: unitOne })}</span>
              </p>
              <Badge tone={AVAIL_TONE[availability]}>{t.availability[availability]}</Badge>
            </div>
            {perKwh && <p className="mt-1 text-sm font-medium text-wood-600">{perKwh}</p>}
            <p className="mt-2 text-sm text-stone">
              {loc(settings.taxNote, lang)} {t.product.priceNote}
            </p>

            <div id="buy-box" className="mt-7 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-line/80">
              {stockLeft && (
                <p className="mb-4 flex items-center gap-2 rounded-[3px] bg-wood-100 px-3 py-2 text-sm font-semibold text-wood-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {stockLeft}
                </p>
              )}
              {orderable ? (
                <AddToCart
                  productId={p.id}
                  minQty={p.minQty}
                  maxQty={p.maxQty}
                  preorderHref={routePath(site, "preorder")}
                  labels={{
                    add: t.common.addToPreorder,
                    added: t.common.added,
                    view: t.common.viewPreorder,
                    decrease: t.common.decrease,
                    increase: t.common.increase,
                    quantity: t.common.quantity,
                    min: fmt(t.common.minQty, { n: p.minQty, unit: p.minQty > 1 ? unitMany : unitOne }),
                  }}
                />
              ) : (
                <p className="text-sm text-stone">{t.product.notOrderable}</p>
              )}
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-success">
                <ShieldCheck className="h-4 w-4" /> {zeroToday} — {t.marketing.payAfter}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-stone">
                <Snowflake className="h-4 w-4 text-wood" /> {seasonMessage(t.marketing.season).replace(/^❄\s*/, "")}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-stone">
                <Landmark className="h-4 w-4 text-wood" /> {t.common.noPayment}
              </p>
            </div>

            <div className="mt-6 rounded-[var(--radius-card)] bg-wood-100/60 p-5 ring-1 ring-wood/20">
              <p className="flex items-center gap-2 font-semibold text-wood-600">
                <Info className="h-4 w-4" /> {t.product.unitExplained}
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-charcoal/85">{unitDefinition(p.unit, lang, p.lengthCm)}</p>
              {content && <p className="mt-2 text-[0.95rem] font-medium text-charcoal">{content}</p>}
            </div>

            <dl className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line/80">
              <div className="bg-cream-200/60 px-5 py-3 text-sm font-semibold text-forest">{t.product.specs}</div>
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3 text-[0.93rem]">
                  <dt className="text-stone">{k}</dt>
                  <dd className="font-medium text-charcoal">{v}</dd>
                </div>
              ))}
              {energy && (
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3 text-[0.93rem]">
                  <dt className="text-stone">{t.product.energy}</dt>
                  <dd className="font-medium text-charcoal">≈ {formatNumber(energy, site.locale, 0)} kWh</dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              <h2 className="text-2xl text-forest">{t.product.description}</h2>
              <p className="prose-wood mt-3 whitespace-pre-line">{loc(p.description, lang)}</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 ring-1 ring-line/80">
                <p className="flex items-center gap-2 text-sm font-semibold text-forest">
                  <Truck className="h-4 w-4 text-wood" /> {t.product.delivery}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-stone">{loc(p.deliveryInfo, lang)}</p>
                <Link href={routePath(site, "delivery")} className="mt-2 inline-block text-sm font-medium text-pine underline underline-offset-2">
                  {t.preorder.delivery.seeZones}
                </Link>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-line/80">
                <p className="flex items-center gap-2 text-sm font-semibold text-forest">
                  <Handshake className="h-4 w-4 text-wood" /> {t.home.why.items[1].title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-stone">{fmt(t.product.shippedBy, { country: market.names[lang] })}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t.preorder.reassurance[1]}
                </p>
              </div>
            </div>

            {p.categoryId !== "accessories" && (
              <Link href={routePath(site, "calculator")} className="mt-6 flex items-center gap-4 rounded-xl bg-forest p-4 text-cream transition hover:bg-pine">
                <Calculator className="h-8 w-8 shrink-0 text-wood-100" />
                <span>
                  <span className="block font-medium">{t.product.calcPrompt}</span>
                  <span className="text-sm text-cream/75">{t.product.calcPromptCta} →</span>
                </span>
              </Link>
            )}
          </div>
        </div>

        <ul
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line ring-1 ring-line md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          style={{ ["--n" as string]: perks.length }}
        >
          {perks.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col items-start gap-3 bg-white p-5 last:odd:col-span-2 md:last:odd:col-span-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wood-100 text-wood-600">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-[0.95rem] font-semibold leading-snug text-forest">{title}</span>
                <span className="mt-0.5 block text-[0.82rem] leading-snug text-stone">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        {sameSpecies.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-3xl text-forest">{t.product.otherPackagings}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {sameSpecies.slice(0, 5).map((r) => (
                <ProductCard key={r.id} p={toPublicProduct(r, lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(r, t, lang)} />
              ))}
            </div>
          </section>
        )}
        {samePackaging.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-3xl text-forest">{t.product.otherSpecies}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {samePackaging.slice(0, 5).map((r) => (
                <ProductCard key={r.id} p={toPublicProduct(r, lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(r, t, lang)} />
              ))}
            </div>
          </section>
        )}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-3xl text-forest">{t.product.related}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={toPublicProduct(r, lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(r, t, lang)} />
              ))}
            </div>
          </section>
        )}
      </div>
      {orderable && (
        <StickyBuyBar
          targetId="buy-box"
          productId={p.id}
          name={name}
          image={p.images[0] ?? null}
          price={money(site, p.priceCents, market.currency)}
          unit={fmt(t.common.perUnit, { unit: unitOne })}
          minQty={p.minQty}
          note={zeroToday}
          labels={{ add: t.marketing.sticky, added: t.common.added }}
        />
      )}
    </>
  );
}
