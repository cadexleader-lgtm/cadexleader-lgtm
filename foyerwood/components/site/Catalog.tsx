import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { CatalogFilters } from "./CatalogFilters";
import { listProducts, toPublicProduct, type ProductFilters } from "@/lib/data/products";
import { isCategoryKey, type CategoryKey } from "@/lib/sites";
import { SPECIES, isSpeciesKey } from "@/lib/energy";
import { fmt, loc } from "@/lib/format";
import { formatLabel } from "@/lib/product-format";
import type { SiteContext } from "@/lib/site-context";

export type CatalogSearch = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function Catalog({ ctx, search, category }: { ctx: SiteContext; search: CatalogSearch; category?: CategoryKey }) {
  const { site, t, market, categories } = ctx;
  const base = await listProducts(site.market, site.lang, { category });
  const cat = category ?? (isCategoryKey(one(search.category)) ? (one(search.category) as CategoryKey) : undefined);
  const sort = one(search.sort);
  const filters: ProductFilters = {
    category: cat,
    q: one(search.q).slice(0, 80) || undefined,
    species: isSpeciesKey(one(search.species)) ? one(search.species) : undefined,
    packaging: one(search.packaging) || undefined,
    availableOnly: one(search.available) === "1",
    sort: (["price_asc", "price_desc", "name"].includes(sort) ? sort : "featured") as ProductFilters["sort"],
  };
  const products = await listProducts(site.market, site.lang, filters);
  const speciesOpts = [...new Set(base.map((p) => p.species).filter(Boolean))].map((s) => ({ value: s!, label: SPECIES[s!].names[site.lang] }));
  const packOpts = [...new Set(base.map((p) => p.packaging))].map((v) => ({ value: v, label: t.packaging[v] }));

  return (
    <div className="space-y-6">
      <Suspense>
        <CatalogFilters
          showCategory={!category}
          categories={categories.filter((c) => c.active).map((c) => ({ value: c.id, label: loc(c.name, site.lang) }))}
          species={speciesOpts}
          packagings={packOpts}
          labels={{
            filters: t.shop.filters,
            category: t.shop.category,
            allCategories: t.shop.allCategories,
            species: t.shop.species,
            allSpecies: t.shop.allSpecies,
            packaging: t.shop.packaging,
            allPackaging: t.shop.allPackaging,
            availableOnly: t.shop.availableOnly,
            sort: t.shop.sort,
            sortOptions: t.shop.sortOptions,
            reset: t.shop.reset,
            search: t.shop.search,
            searchPlaceholder: t.nav.searchPlaceholder,
          }}
        />
      </Suspense>
      <p className="text-sm text-stone" aria-live="polite">
        {filters.q ? `${fmt(t.shop.searchFor, { q: filters.q })} · ` : ""}
        {products.length === 1 ? t.shop.result1 : fmt(t.shop.results, { n: products.length })}
      </p>
      {products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} p={toPublicProduct(p, site.lang)} site={site} t={t} currency={market.currency} formatLabel={formatLabel(p, t, site.lang)} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <PackageSearch className="h-10 w-10 text-wood" />
          <p className="font-display text-2xl text-forest">{t.shop.empty}</p>
          <p className="text-stone">{t.shop.emptyHint}</p>
        </div>
      )}
    </div>
  );
}
