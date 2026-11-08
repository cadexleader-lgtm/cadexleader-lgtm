import Link from "next/link";
import { Plus } from "lucide-react";
import { Flash, PageTitle, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { listSuppliers } from "@/lib/data/suppliers";
import { listZones } from "@/lib/data/zones";
import { MARKETS } from "@/lib/markets";
import { formatMoney } from "@/lib/format";

export default async function SuppliersPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const [suppliers, zones] = await Promise.all([listSuppliers(), listZones()]);
  return (
    <>
      <PageTitle
        title="Fournisseurs"
        subtitle="Un fournisseur partenaire par pays : coordonnées, produits, tarifs d'achat, stocks, zones et délais."
        actions={<Link href="/admin/suppliers/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest"><Plus className="h-4 w-4" /> Ajouter</Link>}
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-5 lg:grid-cols-3">
        {suppliers.map((s) => (
          <Link key={s.id} href={`/admin/suppliers/${s.id}`} className="card p-6 transition hover:ring-pine/40">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{MARKETS[s.marketId].flag}</span>
              <Badge tone={s.active ? "success" : "neutral"}>{s.active ? "Actif" : "Inactif"}</Badge>
            </div>
            <p className="mt-3 font-display text-2xl text-forest">{s.name}</p>
            <p className="text-sm text-stone">{[s.contactName, s.city, s.region].filter(Boolean).join(" · ") || "Coordonnées à compléter"}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-stone">Produits actifs</dt><dd className="font-semibold text-forest">{s.productCount}</dd></div>
              <div><dt className="text-stone">Délais</dt><dd className="font-semibold text-forest">{s.leadTimeDaysMin ?? "?"}–{s.leadTimeDaysMax ?? "?"} j</dd></div>
              <div><dt className="text-stone">Zones</dt><dd className="font-semibold text-forest">{zones.filter((z) => z.supplierId === s.id).length}</dd></div>
              <div><dt className="text-stone">Valeur du stock suivi</dt><dd className="font-semibold text-forest">{formatMoney(s.stockValueCents ?? 0, MARKETS[s.marketId].currency, "fr-FR")}</dd></div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}
