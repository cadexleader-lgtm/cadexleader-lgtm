import { Field, TextArea, Select, Check, SubmitButton, Panel } from "./AdminUi";
import type { Product } from "@/lib/data/products";
import type { Supplier } from "@/lib/data/suppliers";
import type { Category } from "@/lib/data/settings";
import { MARKETS, MARKET_IDS } from "@/lib/markets";
import { MARKET_UNITS, SALE_UNITS, SPECIES, SPECIES_KEYS, unitLabel } from "@/lib/energy";
import Link from "next/link";
import { saveProductAction } from "@/app/admin/actions";
import { ImageInput } from "./ImageInput";

const PACKAGINGS = [
  ["bulk", "Vrac"],
  ["pallet", "Palette"],
  ["big_bag", "Big Bag"],
  ["net_bag", "Filet"],
  ["bag", "Sac"],
  ["box", "Carton"],
  ["bundle", "Fagot"],
  ["crate", "Caisse"],
  ["none", "À l'unité"],
];

export function ProductForm({ product, suppliers, categories }: { product?: Product | null; suppliers: Supplier[]; categories: Category[] }) {
  const p = product;
  const price = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2));
  return (
    <form action={saveProductAction} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="space-y-6">
        <Panel title="Informations générales">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Marché" name="marketId" defaultValue={p?.marketId ?? "fr"} options={MARKET_IDS.map((m) => ({ value: m, label: `${MARKETS[m].flag} ${MARKETS[m].names.fr} (${MARKETS[m].currency})` }))} />
            <Select label="Catégorie" name="categoryId" defaultValue={p?.categoryId ?? "firewood"} options={categories.map((c) => ({ value: c.id, label: c.name.fr ?? c.id }))} />
            <Select
              label="Fournisseur"
              name="supplierId"
              defaultValue={p?.supplierId ?? ""}
              options={[{ value: "", label: "— Aucun —" }, ...suppliers.map((s) => ({ value: s.id, label: `${MARKETS[s.marketId].flag} ${s.name}` }))]}
              hint="Le fournisseur détermine les zones de livraison applicables."
            />
            <Field label="Référence interne (SKU)" name="sku" defaultValue={p?.sku ?? ""} />
            <Field label="Nom (français)" name="name_fr" defaultValue={p?.name.fr ?? ""} hint="Obligatoire pour la France et le Canada." />
            <Field label="Nom (anglais)" name="name_en" defaultValue={p?.name.en ?? ""} hint="Obligatoire pour les États-Unis et le Canada." />
            <Field label="Slug (URL)" name="slug" defaultValue={p?.slug ?? ""} hint="Laissez vide pour le générer depuis le nom." className="sm:col-span-2" />
          </div>
        </Panel>

        <Panel title="Descriptions">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextArea label="Description courte (FR)" name="short_fr" defaultValue={p?.shortDescription.fr ?? ""} rows={2} />
            <TextArea label="Description courte (EN)" name="short_en" defaultValue={p?.shortDescription.en ?? ""} rows={2} />
            <TextArea label="Description détaillée (FR)" name="description_fr" defaultValue={p?.description.fr ?? ""} rows={6} />
            <TextArea label="Description détaillée (EN)" name="description_en" defaultValue={p?.description.en ?? ""} rows={6} />
            <TextArea label="Conditions de livraison (FR)" name="delivery_fr" defaultValue={p?.deliveryInfo.fr ?? ""} rows={2} />
            <TextArea label="Conditions de livraison (EN)" name="delivery_en" defaultValue={p?.deliveryInfo.en ?? ""} rows={2} />
          </div>
        </Panel>

        <Panel title="Caractéristiques et unité de vente">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Essence" name="species" defaultValue={p?.species ?? ""} options={[{ value: "", label: "— Non applicable —" }, ...SPECIES_KEYS.map((k) => ({ value: k, label: SPECIES[k].names.fr }))]} />
            <Field label="Humidité visée (%)" name="moisturePct" inputMode="decimal" defaultValue={p?.moisturePct ?? ""} />
            <Field label="Longueur des bûches (cm)" name="lengthCm" inputMode="decimal" defaultValue={p?.lengthCm ?? ""} hint="16 po = 40,6 cm" />
            <Select label="Conditionnement" name="packaging" defaultValue={p?.packaging ?? "bulk"} options={PACKAGINGS.map(([value, label]) => ({ value, label }))} />
            <Select
              label="Unité de vente"
              name="unit"
              defaultValue={p?.unit ?? "stere"}
              options={SALE_UNITS.map((u) => ({
                value: u,
                label: `${unitLabel(u, "fr")} — ${MARKET_IDS.filter((m) => MARKET_UNITS[m].includes(u)).map((m) => m.toUpperCase()).join("/")}`,
              }))}
              hint="Doit être proposée sur le marché choisi."
            />
            <Select label="Rangement" name="packing" defaultValue={p?.packing ?? "stacked"} options={[{ value: "stacked", label: "Rangé / cordé" }, { value: "loose", label: "Vrac (non rangé)" }]} />
            <Field label="Volume d'une unité (m³ apparent)" name="unitVolumeM3" inputMode="decimal" defaultValue={p?.unitVolumeM3 ?? ""} hint="Palettes, sacs de bûches… (64 pi³ = 1,81 m³)" />
            <Field label="Poids d'une unité (kg)" name="unitWeightKg" inputMode="decimal" defaultValue={p?.unitWeightKg ?? ""} hint="Granulés, briquettes, sacs (40 lb = 18,14 kg)" />
            <Field label="Énergie par unité (kWh)" name="energyKwhOverride" inputMode="decimal" defaultValue={p?.energyKwhOverride ?? ""} hint="Facultatif : remplace le calcul automatique." />
          </div>
          <p className="mt-4 rounded-lg bg-cream p-3 text-xs leading-relaxed text-stone">
            Le contenu réel d'une unité (volume, poids, énergie) est affiché aux clients et utilisé par le calculateur pour suggérer des quantités. Corde, face cord, stère et mètre cube sont calculés automatiquement ; pour une palette ou un sac, indiquez le volume ou le poids.
          </p>
        </Panel>

        <Panel title="Photos">
          {p && p.ownImages.length === 0 && p.images[0] && (
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-cream p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover ring-1 ring-line" />
              <p className="text-xs leading-relaxed text-stone">
                Ce produit affiche la photo du catalogue pour son essence et son conditionnement (commune aux 3 pays).{" "}
                <Link href="/admin/photos" className="font-medium text-forest underline">Gérer les photos du catalogue</Link>. Ajoutez une photo ici uniquement pour la remplacer sur ce produit.
              </p>
            </div>
          )}
          {p && p.ownImages.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {p.ownImages.map((src, i) => (
                <div key={src} className="overflow-hidden rounded-xl ring-1 ring-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                  <div className="space-y-1 p-2 text-xs">
                    <label className="flex items-center gap-1.5"><input type="radio" name="coverImage" value={src} defaultChecked={i === 0} className="accent-pine" /> Principale</label>
                    <label className="flex items-center gap-1.5 text-danger"><input type="checkbox" name="removeImage" value={src} className="accent-danger" /> Supprimer</label>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="f-images">Ajouter des photos</label>
              <ImageInput id="f-images" name="images" multiple />
            </div>
            <Field label="…ou ajouter une URL d'image" name="imageUrl" placeholder="https://…" />
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Prix">
          <div className="grid gap-4">
            <Field label="Prix de vente (par unité)" name="price" inputMode="decimal" required defaultValue={price(p?.priceCents)} hint="Dans la devise du marché. France : prix TTC." />
            <Field label="Tarif d'achat fournisseur (par unité)" name="cost" inputMode="decimal" defaultValue={price(p?.costCents)} hint="Jamais affiché aux clients. Sert au calcul de la marge." />
            <Field label="Ancien prix (facultatif)" name="compareAt" inputMode="decimal" defaultValue={price(p?.compareAtCents)} />
          </div>
        </Panel>
        <Panel title="Quantités et stock">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantité minimale" name="minQty" inputMode="numeric" defaultValue={p?.minQty ?? 1} required />
            <Field label="Quantité maximale" name="maxQty" inputMode="numeric" defaultValue={p?.maxQty ?? ""} />
            <div className="sm:col-span-2"><Check label="Suivre le stock" name="trackStock" defaultChecked={p?.trackStock ?? false} hint="Le stock est déduit à la confirmation des commandes." /></div>
            <Field label="Stock disponible" name="stockQuantity" inputMode="numeric" defaultValue={p?.stockQuantity ?? 0} />
            <Field label="Seuil « stock limité »" name="lowStockThreshold" inputMode="numeric" defaultValue={p?.lowStockThreshold ?? 0} />
          </div>
        </Panel>
        <Panel title="Publication">
          <div className="space-y-3">
            <Check label="Produit actif (visible sur le site)" name="active" defaultChecked={p?.active ?? true} />
            <Check label="Disponible à la précommande" name="isAvailable" defaultChecked={p?.isAvailable ?? true} />
            <Check label="Meilleure vente (mis en avant sur l'accueil)" name="featured" defaultChecked={p?.featured ?? false} />
          </div>
        </Panel>
        <div className="sticky bottom-4 rounded-2xl bg-white/90 p-4 shadow-[var(--shadow-lift)] ring-1 ring-line backdrop-blur">
          <SubmitButton>{p ? "Enregistrer les modifications" : "Créer le produit"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
