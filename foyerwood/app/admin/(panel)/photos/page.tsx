import Link from "next/link";
import { Search } from "lucide-react";
import { Flash, PageTitle, Panel, type SearchProps } from "@/components/admin/AdminUi";
import { ImageInput } from "@/components/admin/ImageInput";
import { PhotoPending } from "@/components/site/ProductVisual";
import { Badge } from "@/components/ui";
import { listCatalogPhotos } from "@/lib/data/catalog-photos";
import { adminListProducts, type Product } from "@/lib/data/products";
import { CATALOG_PACKAGINGS, CATALOG_SPECIES } from "@/lib/db/seed-species-catalog";
import { MARKETS, MARKET_IDS } from "@/lib/markets";
import { PACKAGING_GUIDE, SPECIES_GUIDE, photoQueries } from "@/lib/photo-guide";
import { autoProductPhoto } from "@/lib/product-photos";
import { loc } from "@/lib/format";
import { removeCatalogPhotoAction, uploadCatalogPhotoAction } from "@/app/admin/actions";

export const metadata = { title: "Photos du catalogue" };

export default async function CatalogPhotosPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const [photos, products] = await Promise.all([listCatalogPhotos(), adminListProducts()]);
  const uploaded = new Map(photos.map((p) => [`${p.species}-${p.packaging}`, p.url]));

  const byCombo = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.species || !p.packaging) continue;
    const key = `${p.species}-${p.packaging}`;
    byCombo.set(key, [...(byCombo.get(key) ?? []), p]);
  }

  const total = CATALOG_SPECIES.length * CATALOG_PACKAGINGS.length;
  let done = 0;
  for (const s of CATALOG_SPECIES) for (const k of CATALOG_PACKAGINGS) if (uploaded.has(`${s}-${k}`) || autoProductPhoto(s, k)) done++;

  // Products outside the species × packaging grid (pellets, briquettes, accessories…) without any photo.
  const inGrid = (p: Product) =>
    (CATALOG_SPECIES as readonly string[]).includes(p.species ?? "") && (CATALOG_PACKAGINGS as readonly string[]).includes(p.packaging);
  const others = products.filter((p) => p.active && !inGrid(p) && p.images.length === 0);

  return (
    <>
      <PageTitle
        title="Photos du catalogue"
        subtitle="Une vraie photo par essence et par conditionnement. Elle s'affiche automatiquement sur le produit correspondant, dans les 3 pays."
      />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-5">
          <p className="text-sm text-stone">Photos en place</p>
          <p className="mt-1 font-display text-4xl text-forest">
            {done}
            <span className="text-2xl text-stone"> / {total}</span>
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full bg-wood" style={{ width: `${Math.round((done / total) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-stone">Tant qu&apos;une photo manque, le site affiche « Photo à venir » à la place, jamais une illustration.</p>
        </div>
        <div className="card p-5 text-sm leading-relaxed text-charcoal">
          <p className="font-semibold text-forest">Pour chaque photo</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone">
            <li>Le <strong className="text-charcoal">bon bois</strong> (écorce et couleur reconnaissables) dans le <strong className="text-charcoal">bon conditionnement</strong>.</li>
            <li>Une photo différente pour chaque case, de préférence prise chez votre fournisseur.</li>
            <li>Sujet bien centré : la photo est recadrée en carré sur les fiches produit.</li>
            <li>Vous devez avoir le droit de l&apos;utiliser commercialement (votre photo, celle du fournisseur ou une banque d&apos;images sous licence).</li>
          </ul>
        </div>
      </div>

      <div className="space-y-8">
        {CATALOG_SPECIES.map((s) => {
          const g = SPECIES_GUIDE[s];
          return (
            <Panel key={s} id={s} title={`${g.fr} — ${g.en}`}>
              <div className="mb-5 grid gap-1 text-xs text-stone sm:grid-cols-[auto_1fr] sm:gap-x-4">
                <span className="font-semibold uppercase tracking-wider">Autres noms</span>
                <span>{g.frCa} · {g.enAlt} · <em>{g.latin}</em></span>
                <span className="font-semibold uppercase tracking-wider">Comment le reconnaître</span>
                <span>{g.look}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {CATALOG_PACKAGINGS.map((k) => {
                  const key = `${s}-${k}`;
                  const pk = PACKAGING_GUIDE[k];
                  const url = uploaded.get(key) ?? null;
                  const file = autoProductPhoto(s, k);
                  const shown = url ?? file;
                  const items = byCombo.get(key) ?? [];
                  const markets = MARKET_IDS.filter((m) => items.some((p) => p.marketId === m && p.active));
                  const overridden = items.filter((p) => p.ownImages.length > 0);
                  const q = photoQueries(s, k);
                  const productName = items[0] ? loc(items[0].name, "fr") : `${g.fr} · ${pk.fr}`;
                  return (
                    <div key={k} id={key} className="flex scroll-mt-6 flex-col overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
                      <div className="relative aspect-[4/3] bg-cream-200">
                        {shown ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shown} alt={productName} className="h-full w-full object-cover" />
                        ) : (
                          <PhotoPending compact className="h-full w-full" />
                        )}
                        <span className="absolute left-2 top-2">
                          {url ? <Badge tone="success">En ligne</Badge> : file ? <Badge tone="neutral">Fichier du site</Badge> : <Badge tone="warning">À fournir</Badge>}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-3">
                        <div>
                          <p className="text-sm font-semibold text-forest">{pk.fr}</p>
                          <p className="text-xs text-stone">{productName}</p>
                          <p className="mt-1 text-xs">{markets.length ? markets.map((m) => MARKETS[m].flag).join(" ") : <span className="text-stone">Aucun produit actif</span>}</p>
                        </div>
                        <div className="rounded-md bg-cream p-2 text-[0.7rem] leading-snug text-charcoal">
                          <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-stone"><Search className="h-3 w-3" /> À chercher</p>
                          <p className="mt-1">« {q.en} »</p>
                          <p>« {q.fr} »</p>
                          <p className="mt-1 text-stone">{pk.show}</p>
                        </div>
                        {overridden.length > 0 && (
                          <p className="text-[0.7rem] text-stone">
                            {overridden.length} fiche(s) ont leur propre photo, prioritaire :{" "}
                            {overridden.map((p, i) => (
                              <span key={p.id}>
                                {i > 0 && ", "}
                                <Link href={`/admin/products/${p.id}`} className="underline">{MARKETS[p.marketId].flag}</Link>
                              </span>
                            ))}
                          </p>
                        )}
                        <form action={uploadCatalogPhotoAction} className="mt-auto">
                          <input type="hidden" name="species" value={s} />
                          <input type="hidden" name="packaging" value={k} />
                          <ImageInput name="photo" compact submitLabel={shown ? "Remplacer la photo" : "Envoyer la photo"} />
                        </form>
                        {url && (
                          <form action={removeCatalogPhotoAction}>
                            <input type="hidden" name="species" value={s} />
                            <input type="hidden" name="packaging" value={k} />
                            <button type="submit" className="text-[0.7rem] text-danger underline">Retirer cette photo</button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}

        <Panel title={`Autres produits sans photo (${others.length})`}>
          {others.length === 0 ? (
            <p className="text-sm text-stone">Tous les autres produits (granulés, bûches compressées, allumage, accessoires) ont une photo.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-stone">Granulés, bûches compressées, allumage et accessoires : ajoutez leur photo directement sur la fiche produit.</p>
              <ul className="divide-y divide-line text-sm">
                {others.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {MARKETS[p.marketId].flag} {loc(p.name, MARKETS[p.marketId].defaultLang)}
                    </span>
                    <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-forest underline">Ajouter une photo</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
