import Link from "next/link";
import { Plus } from "lucide-react";
import { Flash, PageTitle, TabLinks, MARKET_TABS, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { PhotoPending } from "@/components/site/ProductVisual";
import { adminListProducts, availabilityOf } from "@/lib/data/products";
import { listCategories } from "@/lib/data/settings";
import { listSuppliers } from "@/lib/data/suppliers";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { formatMoney, loc } from "@/lib/format";
import { unitLabel } from "@/lib/energy";
import { toggleProductAction } from "@/app/admin/actions";

const AV = { available: ["Disponible", "success"], limited: ["Stock limité", "warning"], out_of_stock: ["Rupture", "danger"], unavailable: ["Indisponible", "neutral"] } as const;

export default async function ProductsPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const market = isMarketId(sp.m) ? (sp.m as MarketId) : undefined;
  const [products, categories, suppliers] = await Promise.all([adminListProducts(market), listCategories(), listSuppliers()]);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
  const catName = new Map(categories.map((c) => [c.id, c.name.fr]));
  return (
    <>
      <PageTitle
        title="Produits & stocks"
        subtitle={`${products.length} produit(s)`}
        actions={<Link href="/admin/products/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest"><Plus className="h-4 w-4" /> Ajouter un produit</Link>}
      />
      <Flash ok={sp.ok} error={sp.error} />
      <TabLinks items={MARKET_TABS("/admin/products")} current={market ?? ""} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
            <tr>
              <th className="px-4 py-3">Produit</th><th className="px-4 py-3">Marché</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3 text-right">Prix</th><th className="px-4 py-3 text-right">Achat</th><th className="px-4 py-3 text-right">Min.</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Disponibilité</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => {
              const av = AV[availabilityOf(p)];
              return (
                <tr key={p.id} className={`hover:bg-cream/60 ${p.active ? "" : "opacity-55"}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="h-11 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <PhotoPending compact className="h-full w-full" />
                        )}
                      </span>
                      <span>
                        <span className="block font-medium text-forest hover:underline">{loc(p.name, MARKETS[p.marketId].defaultLang)}</span>
                        <span className="text-xs text-stone">{p.sku} · {unitLabel(p.unit, "fr")}{p.featured ? " · ★ mis en avant" : ""}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{MARKETS[p.marketId].flag}</td>
                  <td className="px-4 py-3 text-stone">{catName.get(p.categoryId)}</td>
                  <td className="px-4 py-3 text-stone">{p.supplierId ? supplierName.get(p.supplierId) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(p.priceCents, MARKETS[p.marketId].currency, "fr-FR")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone">{p.costCents != null ? formatMoney(p.costCents, MARKETS[p.marketId].currency, "fr-FR") : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.minQty}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.trackStock ? p.stockQuantity : <span className="text-stone">non suivi</span>}</td>
                  <td className="px-4 py-3"><Badge tone={av[1]}>{av[0]}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                      <input type="hidden" name="redirect" value={`/admin/products${market ? `?m=${market}` : ""}`} />
                      <button className="rounded-full px-3 py-1 text-xs ring-1 ring-line hover:bg-cream">{p.active ? "Désactiver" : "Activer"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
