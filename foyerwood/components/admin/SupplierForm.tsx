import { Field, TextArea, Select, Check, SubmitButton, Panel } from "./AdminUi";
import type { Supplier } from "@/lib/data/suppliers";
import { MARKETS, MARKET_IDS } from "@/lib/markets";
import { saveSupplierAction } from "@/app/admin/actions";

export function SupplierForm({ s }: { s?: Supplier | null }) {
  return (
    <form action={saveSupplierAction}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <Panel title="Fiche fournisseur">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom / raison sociale" name="name" required defaultValue={s?.name ?? ""} />
          <Select label="Pays (marché)" name="marketId" defaultValue={s?.marketId ?? "fr"} options={MARKET_IDS.map((m) => ({ value: m, label: `${MARKETS[m].flag} ${MARKETS[m].names.fr}` }))} />
          <Field label="Contact" name="contactName" defaultValue={s?.contactName ?? ""} />
          <Field label="E-mail" name="email" type="email" defaultValue={s?.email ?? ""} />
          <Field label="Téléphone" name="phone" defaultValue={s?.phone ?? ""} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={s?.whatsapp ?? ""} />
          <Field label="Adresse" name="address" defaultValue={s?.address ?? ""} className="lg:col-span-2" />
          <Field label="Code postal" name="postalCode" defaultValue={s?.postalCode ?? ""} />
          <Field label="Ville" name="city" defaultValue={s?.city ?? ""} />
          <Field label="Province / État / département" name="region" defaultValue={s?.region ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Délai min. (jours)" name="leadMin" inputMode="numeric" defaultValue={s?.leadTimeDaysMin ?? ""} />
            <Field label="Délai max. (jours)" name="leadMax" inputMode="numeric" defaultValue={s?.leadTimeDaysMax ?? ""} />
          </div>
          <TextArea label="Notes (conditions d'achat, contrat, contacts secondaires…)" name="notes" defaultValue={s?.notes ?? ""} rows={4} className="sm:col-span-2 lg:col-span-3" />
          <Check label="Fournisseur actif" name="active" defaultChecked={s?.active ?? true} />
        </div>
        <div className="mt-5"><SubmitButton>{s ? "Enregistrer" : "Créer le fournisseur"}</SubmitButton></div>
      </Panel>
    </form>
  );
}
