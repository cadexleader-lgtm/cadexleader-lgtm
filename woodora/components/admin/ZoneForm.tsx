import { Field, TextArea, Select, Check, SubmitButton, Panel } from "./AdminUi";
import type { DeliveryZone } from "@/lib/data/zones";
import type { Supplier } from "@/lib/data/suppliers";
import type { Product } from "@/lib/data/products";
import { MARKETS, type MarketId } from "@/lib/markets";
import { regionsFor } from "@/lib/regions";
import { loc } from "@/lib/format";
import { saveZoneAction, deleteZoneAction } from "@/app/admin/actions";

export function ZoneForm({ market, zone, suppliers, products }: { market: MarketId; zone?: DeliveryZone | null; suppliers: Supplier[]; products: Product[] }) {
  const z = zone;
  const regions = regionsFor(market);
  return (
    <div className="space-y-6">
      <form action={saveZoneAction} className="space-y-6">
        {z && <input type="hidden" name="id" value={z.id} />}
        <input type="hidden" name="marketId" value={market} />
        <Panel title={`Zone — ${MARKETS[market].flag} ${MARKETS[market].names.fr}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nom de la zone" name="name" required defaultValue={z?.name ?? ""} />
            <Select
              label="Fournisseur"
              name="supplierId"
              defaultValue={z?.supplierId ?? ""}
              options={[{ value: "", label: "Tous les fournisseurs du marché" }, ...suppliers.filter((s) => s.marketId === market).map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Check label="Zone active" name="active" defaultChecked={z?.active ?? true} />
            <Check label="Livraison gratuite" name="freeDelivery" defaultChecked={z?.freeDelivery ?? true} />
            <Field label={`Gratuite dès (${MARKETS[market].currency})`} name="freeDeliveryMin" inputMode="decimal" defaultValue={z ? (z.freeDeliveryMinCents / 100).toFixed(2) : "150"} hint="0 = toujours gratuite" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Délai min. (j)" name="leadMin" inputMode="numeric" defaultValue={z?.leadTimeDaysMin ?? ""} />
              <Field label="Délai max. (j)" name="leadMax" inputMode="numeric" defaultValue={z?.leadTimeDaysMax ?? ""} />
            </div>
          </div>
        </Panel>
        <Panel title={`${MARKETS[market].regionLabel.fr}s desservi(e)s`}>
          <div className="grid max-h-80 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
            {regions.map((r) => (
              <label key={r.code} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-cream">
                <input type="checkbox" name="regionCodes" value={r.code} defaultChecked={z?.regionCodes.includes(r.code)} className="accent-pine" />
                {r.name}
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="Exclusions et zones éloignées">
          <div className="grid gap-4 lg:grid-cols-2">
            <TextArea
              label="Codes postaux exclus (préfixes)"
              name="excludedPostalPrefixes"
              defaultValue={z?.excludedPostalPrefixes.join(", ") ?? ""}
              hint={market === "ca" ? "Ex. : G0G, J0M (régions éloignées)" : market === "us" ? "Ex. : 005, 063 (préfixes ZIP)" : "Ex. : 05, 7311 (début du code postal)"}
            />
            <div>
              <p className="field-label">Produits non livrés dans cette zone</p>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg bg-cream p-2">
                {products.filter((p) => p.marketId === market).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="excludedProductIds" value={p.id} defaultChecked={z?.excludedProductIds.includes(p.id)} className="accent-danger" />
                    {loc(p.name, MARKETS[market].defaultLang)}
                  </label>
                ))}
              </div>
            </div>
            <TextArea label="Note zones éloignées (FR)" name="remote_fr" defaultValue={z?.remoteAreaNote.fr ?? ""} rows={2} />
            <TextArea label="Note zones éloignées (EN)" name="remote_en" defaultValue={z?.remoteAreaNote.en ?? ""} rows={2} />
          </div>
          <div className="mt-5"><SubmitButton>{z ? "Enregistrer la zone" : "Créer la zone"}</SubmitButton></div>
        </Panel>
      </form>
      {z && (
        <form action={deleteZoneAction}>
          <input type="hidden" name="id" value={z.id} />
          <SubmitButton variant="danger">Supprimer cette zone</SubmitButton>
        </form>
      )}
    </div>
  );
}
