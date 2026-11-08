import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Calculator } from "lucide-react";
import { Catalog, type CatalogSearch } from "@/components/site/Catalog";
import { Breadcrumbs, ButtonLink } from "@/components/ui";
import { ProductArt } from "@/components/art/ProductArt";
import { loadSite } from "@/lib/site-context";
import { categoryPath, isCategoryKey, routePath, SITES, type CategoryKey } from "@/lib/sites";
import { loc } from "@/lib/format";
import { CATEGORY_ART } from "@/lib/category-art";

type Props = { params: Promise<{ site: string; cat: string }>; searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: id, cat } = await params;
  const { site, categories } = await loadSite(id);
  const c = categories.find((x) => x.id === cat);
  if (!c || !isCategoryKey(cat)) return {};
  const alt = site.market === "ca" ? { "fr-CA": categoryPath(SITES.ca, cat), "en-CA": categoryPath(SITES["ca-en"], cat) } : undefined;
  return {
    title: loc(c.name, site.lang),
    description: loc(c.description, site.lang),
    alternates: { canonical: categoryPath(site, cat), languages: alt },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { site: id, cat } = await params;
  const ctx = await loadSite(id);
  const { site, t, categories } = ctx;
  const c = categories.find((x) => x.id === cat);
  if (!c || !c.active || !isCategoryKey(cat)) notFound();
  const guide = t.categoryGuides[cat as CategoryKey];
  const art = CATEGORY_ART[cat as CategoryKey];
  const showCalc = cat !== "accessories";

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="grain absolute inset-0" aria-hidden />
        <div className="container-page relative grid items-center gap-8 py-10 md:grid-cols-[1.4fr_1fr] md:py-14">
          <div>
            <Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.shop.title, href: routePath(site, "shop") }, { label: loc(c.name, site.lang) }]} />
            <h1 className="mt-5 text-4xl sm:text-5xl">{loc(c.name, site.lang)}</h1>
            <p className="mt-4 max-w-xl text-lg text-cream/75">{loc(c.description, site.lang)}</p>
          </div>
          <div className="hidden overflow-hidden rounded-2xl ring-1 ring-cream/10 md:block">
            <ProductArt art={art.art} species={art.species} seed={`banner-${cat}`} className="aspect-[5/3] w-full" />
          </div>
        </div>
      </section>
      <div className="container-page py-10 sm:py-12">
        <Catalog ctx={ctx} search={await searchParams} category={cat as CategoryKey} />
        <section className="mt-14 grid gap-6 rounded-[var(--radius-card)] bg-white p-8 ring-1 ring-line/70 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl text-forest sm:text-3xl">{guide.title}</h2>
            <ul className="mt-5 space-y-3">
              {guide.points.map((pt) => (
                <li key={pt} className="flex gap-3 text-charcoal/85">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-wood" /> {pt}
                </li>
              ))}
            </ul>
          </div>
          {showCalc && (
            <div className="flex flex-col justify-center rounded-2xl bg-cream p-6">
              <p className="font-display text-xl text-forest">{t.product.calcPrompt}</p>
              <p className="mt-2 text-sm text-stone">{t.home.calculator.subtitle}</p>
              <ButtonLink href={routePath(site, "calculator")} className="mt-5 self-start">
                <Calculator className="h-4 w-4" /> {t.product.calcPromptCta}
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
