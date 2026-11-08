import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageTitle, Panel } from "@/components/admin/AdminUi";
import { SupplierForm } from "@/components/admin/SupplierForm";
import { getSupplier } from "@/lib/data/suppliers";
import { adminListProducts, availabilityOf } from "@/lib/data/products";
import { listZones } from "@/lib/data/zones";
import { MARKETS } from "@/lib/markets";
import { formatMoney, loc } from "@/lib/format";
import { unitLabel } from "@/lib/energy";
import { regionName } from "@/lib/regions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function SupplierPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (id === "new") {
    return (
      <>
        <Link href="/admin/suppliers" className="text-sm text-stone hover:text-forest">← Fournisseurs</Link>
        <PageTitle title="Nouveau fournisseur" />
        <Flash ok={sp.ok} error={sp.error} />
        <SupplierForm />
      </>
    );
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const s = await getSupplier(id);
  if (!s) notFound();
  const [products, zones] = await Promise.all([adminListProducts(s.marketId), listZones(s.marketId)]);
  const mine = products.filter((p) => p.supplierId === s.id);
  const cur = MARKETS[s.marketId].currency;
  return (
    <>
      <Link href="/admin/suppliers" className="text-sm text-stone hover:text-forest">← Fournisseurs</Link>
      <PageTitle title={s.name} subtitle={`${MARKETS[s.marketId].flag} ${MARKETS[s.marketId].names.fr}`} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-6">
        <SupplierForm s={s} />
        <Panel title={`Produits proposés, tarifs d'achat et stocks (${mine.length})`}>
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
                <tr><th className="px-5 py-2.5">Produit</th><th className="px-5 py-2.5">Unité</th><th className="px-5 py-2.5 text-right">Achat</th><th className="px-5 py-2.5 text-right">Vente</th><th className="px-5 py-2.5 text-right">Marge</th><th className="px-5 py-2.5 text-right">Stock</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {mine.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2.5"><Link href={`/admin/products/${p.id}`} className="text-forest hover:underline">{loc(p.name, MARKETS[p.marketId].defaultLang)}</Link></td>
                    <td className="px-5 py-2.5 text-stone">{unitLabel(p.unit, "fr")}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.costCents != null ? formatMoney(p.costCents, cur, "fr-FR") : "—"}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{formatMoney(p.priceCents, cur, "fr-FR")}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.costCents != null ? `${Math.round(((p.priceCents - p.costCents) / p.priceCents) * 100)} %` : "—"}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.trackStock ? p.stockQuantity : availabilityOf(p) === "available" ? "dispo." : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Zones de livraison" actions={<Link href="/admin/zones/new" className="text-sm font-medium text-pine">Ajouter une zone →</Link>}>
          <ul className="space-y-2 text-sm">
            {zones.filter((z) => z.supplierId === s.id || z.supplierId === null).map((z) => (
              <li key={z.id}><Link href={`/admin/zones/${z.id}`} className="text-forest hover:underline">{z.name}</Link> — <span className="text-stone">{z.regionCodes.map((r) => regionName(s.marketId, r)).join(", ")}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
