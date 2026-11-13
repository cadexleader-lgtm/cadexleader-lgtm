import Link from "next/link";
import { Flash, PageTitle, Panel, type SearchProps } from "@/components/admin/AdminUi";
import { getMarketPromotions } from "@/lib/data/promotions";
import { adminListProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/settings";
import { isMarketId, MARKETS, MARKET_IDS, type MarketId } from "@/lib/markets";
import { formatMoney, loc } from "@/lib/format";
import { savingPercent } from "@/lib/promotions";
import { SPECIES, SPECIES_KEYS } from "@/lib/energy";
import { priceDropAction, savePromotionsAction } from "@/app/admin/actions";

export const metadata = { title: "Promotions & cadeaux" };

const PACKAGINGS = [
  ["bulk", "Vrac"],
  ["pallet", "Palette"],
  ["big_bag", "Big Bag"],
  ["net_bag", "Filet"],
  ["bag", "Sac"],
  ["box", "Carton"],
] as const;

const input = "field h-10";

export default async function PromotionsPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const market: MarketId = isMarketId(sp.m) ? (sp.m as MarketId) : "ca";
  const m = MARKETS[market];
  const [promo, products, categories] = await Promise.all([getMarketPromotions(market), adminListProducts(market), listCategories()]);
  const money = (c: number) => formatMoney(c, m.currency, m.defaultLang === "fr" ? "fr-FR" : "en-US");
  const amount = (c: number | undefined) => (c ? (c / 100).toFixed(0) : "");
  const giftChoices = products
    .filter((p) => p.active)
    .sort((a, b) => Number(b.categoryId === "accessories") - Number(a.categoryId === "accessories") || a.priceCents - b.priceCents)
    .map((p) => ({ slug: p.slug, label: `${loc(p.name, m.defaultLang)} — ${money(p.priceCents)}${p.costCents != null ? ` (coût ${money(p.costCents)})` : ""}` }));
  const onSale = products.filter((p) => savingPercent(p.priceCents, p.compareAtCents) > 0);

  return (
    <>
      <PageTitle
        title="Promotions & cadeaux"
        subtitle="Remises selon le montant de bois commandé, accessoires offerts et prix barrés. Tout s'affiche aussitôt sur le site, dans le panier et sur la précommande, et le serveur recalcule chaque commande."
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-6 flex flex-wrap gap-2">
        {MARKET_IDS.map((id) => (
          <Link
            key={id}
            href={`/admin/promotions?m=${id}`}
            className={`rounded-full px-4 py-2 text-sm ring-1 ${id === market ? "bg-forest text-cream ring-forest" : "ring-line hover:bg-cream"}`}
          >
            {MARKETS[id].flag} {MARKETS[id].names.fr}
          </Link>
        ))}
      </div>

      <form action={savePromotionsAction} className="space-y-6">
        <input type="hidden" name="marketId" value={market} />
        <Panel title={`Remises volume et cadeaux — ${m.flag} ${m.names.fr} (${m.currency})`}>
          <label className="mb-5 flex items-center gap-2 text-sm font-medium text-charcoal">
            <input type="checkbox" name="enabled" defaultChecked={promo.enabled} className="h-4 w-4 accent-pine" />
            Promotions actives dans ce pays
          </label>
          <p className="mb-4 text-sm text-stone">
            Les seuils portent sur le <strong>montant de bois</strong> (tous les produits sauf les accessoires), au prix affiché. La remise s'applique au bois ; les cadeaux s'ajoutent à la commande à 0.
          </p>

          <h3 className="mb-2 text-sm font-semibold text-forest">Remise selon le montant de bois</h3>
          <div className="mb-6 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-10 text-stone">Dès</span>
                <input name={`tierMin${i}`} inputMode="decimal" defaultValue={amount(promo.tiers[i]?.minCents)} placeholder="ex. 600" className={`${input} w-32`} aria-label={`Seuil ${i + 1} (${m.currency})`} />
                <span className="text-stone">{m.currency} de bois →</span>
                <input name={`tierPct${i}`} inputMode="decimal" defaultValue={promo.tiers[i]?.percent ?? ""} placeholder="ex. 5" className={`${input} w-20`} aria-label={`Remise ${i + 1} (%)`} />
                <span className="text-stone">% de remise</span>
              </div>
            ))}
          </div>

          <h3 className="mb-2 text-sm font-semibold text-forest">Accessoire offert selon le montant de bois</h3>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-10 text-stone">Dès</span>
                <input name={`giftMin${i}`} inputMode="decimal" defaultValue={amount(promo.gifts[i]?.minCents)} placeholder="ex. 300" className={`${input} w-32`} aria-label={`Seuil cadeau ${i + 1} (${m.currency})`} />
                <span className="text-stone">{m.currency} de bois →</span>
                <select name={`giftSlug${i}`} defaultValue={promo.gifts[i]?.productSlug ?? ""} className={`${input} min-w-[280px] flex-1`} aria-label={`Cadeau ${i + 1}`}>
                  <option value="">— Aucun cadeau —</option>
                  {giftChoices.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone">
            Pour offrir un nouvel accessoire, créez-le d'abord dans <Link href="/admin/products/new" className="underline">Produits &amp; stocks</Link> (catégorie Accessoires, avec sa photo et son coût d'achat), puis choisissez-le ici.
          </p>
          <div className="mt-6">
            <button type="submit" className="inline-flex h-10 items-center rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest">
              Enregistrer
            </button>
          </div>
        </Panel>
      </form>

      <Panel id="prix" title="Prix barrés (réduction sur des produits)" className="mt-8">
        <form action={priceDropAction} className="space-y-4">
          <input type="hidden" name="marketId" value={market} />
          <p className="text-sm text-stone">
            Le prix actuel devient le prix barré et le nouveau prix est réduit du pourcentage choisi. Exemple : 140 → −15 % → 119.
            Laissez un filtre vide pour l'appliquer à tout.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <select name="categoryId" className={input} aria-label="Catégorie">
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name.fr}</option>
              ))}
            </select>
            <select name="species" className={input} aria-label="Essence">
              <option value="">Toutes les essences</option>
              {SPECIES_KEYS.map((k) => (
                <option key={k} value={k}>{SPECIES[k].names.fr}</option>
              ))}
            </select>
            <select name="packaging" className={input} aria-label="Conditionnement">
              <option value="">Tous les conditionnements</option>
              {PACKAGINGS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input name="percent" inputMode="decimal" placeholder="ex. 15" className={`${input} w-24`} aria-label="Réduction (%)" />
              <span className="text-sm text-stone">%</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" name="mode" value="apply" className="inline-flex h-10 items-center rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest">
              Appliquer la réduction
            </button>
            <button type="submit" name="mode" value="clear" className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-forest ring-1 ring-line hover:bg-cream">
              Arrêter la promotion (remettre l'ancien prix)
            </button>
          </div>
          <p className="rounded-lg bg-wood-100/70 p-3 text-xs leading-relaxed text-wood-600">
            À respecter : le prix barré doit être un prix que vous avez réellement pratiqué. En France, c'est le prix le plus bas des 30 jours précédant la réduction ;
            au Canada et aux États-Unis, un prix habituel réellement pratiqué. N'augmentez pas un prix juste avant de le « réduire ».
          </p>
        </form>

        <h3 className="mb-2 mt-8 text-sm font-semibold text-forest">Produits en promotion ({onSale.length})</h3>
        {onSale.length === 0 ? (
          <p className="text-sm text-stone">Aucun produit en promotion dans ce pays.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {onSale.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/admin/products/${p.id}`} className="text-forest hover:underline">{loc(p.name, m.defaultLang)}</Link>
                <span className="tabular-nums">
                  <span className="text-stone line-through">{money(p.compareAtCents!)}</span>{" "}
                  <strong className="text-wood-600">{money(p.priceCents)}</strong> <span className="text-xs text-stone">(−{savingPercent(p.priceCents, p.compareAtCents)} %)</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
