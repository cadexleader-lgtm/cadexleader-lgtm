import Link from "next/link";
import { Plus } from "lucide-react";
import { Flash, PageTitle, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { listZones } from "@/lib/data/zones";
import { listSuppliers } from "@/lib/data/suppliers";
import { MARKETS, MARKET_IDS } from "@/lib/markets";
import { regionName } from "@/lib/regions";
import { formatMoney } from "@/lib/format";

export default async function ZonesPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const [zones, suppliers] = await Promise.all([listZones(), listSuppliers()]);
  const sName = new Map(suppliers.map((s) => [s.id, s.name]));
  return (
    <>
      <PageTitle
        title="Zones de livraison"
        subtitle="Régions desservies, codes postaux exclus, restrictions produits et conditions de livraison gratuite. Le site vérifie l'adresse avant l'envoi de chaque précommande."
        actions={
          <div className="flex flex-wrap gap-2">
            {MARKET_IDS.map((m) => (
              <Link key={m} href={`/admin/zones/new?m=${m}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-cream hover:bg-forest">
                <Plus className="h-4 w-4" /> {MARKETS[m].flag}
              </Link>
            ))}
          </div>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-8">
        {MARKET_IDS.map((m) => (
          <section key={m}>
            <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-stone">{MARKETS[m].flag} {MARKETS[m].names.fr}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {zones.filter((z) => z.marketId === m).map((z) => (
                <Link key={z.id} href={`/admin/zones/${z.id}`} className="card p-5 transition hover:ring-pine/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-xl text-forest">{z.name}</p>
                    <Badge tone={z.active ? "success" : "neutral"}>{z.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-charcoal/85">{z.regionCodes.map((r) => regionName(m, r)).join(" · ") || "Aucune région"}</p>
                  <p className="mt-2 text-xs text-stone">
                    {z.supplierId ? sName.get(z.supplierId) : "Tous fournisseurs"} · {z.freeDelivery ? (z.freeDeliveryMinCents ? `gratuite dès ${formatMoney(z.freeDeliveryMinCents, MARKETS[m].currency, "fr-FR")}` : "toujours gratuite") : "payante"}
                    {z.excludedPostalPrefixes.length ? ` · exclus : ${z.excludedPostalPrefixes.join(", ")}` : ""}
                    {z.excludedProductIds.length ? ` · ${z.excludedProductIds.length} produit(s) exclu(s)` : ""}
                  </p>
                </Link>
              ))}
              {zones.filter((z) => z.marketId === m).length === 0 && <p className="text-sm text-stone">Aucune zone : aucune précommande ne peut être envoyée sur ce marché.</p>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
