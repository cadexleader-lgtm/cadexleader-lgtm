import Link from "next/link";
import { ProductVisual } from "./ProductVisual";
import { AddButton } from "@/components/cart/AddToCart";
import type { PublicProduct } from "@/lib/data/products";
import { canOrder } from "@/lib/data/products";
import type { Site } from "@/lib/sites";
import { productPath } from "@/lib/sites";
import type { Dict } from "@/lib/i18n";
import { fmt, money } from "@/lib/format";
import type { Currency } from "@/lib/markets";

const DOT = { available: "bg-success", limited: "bg-warning", out_of_stock: "bg-danger", unavailable: "bg-stone" } as const;

export function ProductCard({
  p,
  site,
  t,
  currency,
  formatLabel,
  priority,
}: {
  p: PublicProduct;
  site: Site;
  t: Dict;
  currency: Currency;
  formatLabel: string;
  priority?: boolean;
}) {
  const compareAtCents = p.compareAtCents;
  const href = productPath(site, p.slug);
  const orderable = canOrder(p.availability);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgb(24_61_50/0.05),0_10px_30px_-18px_rgb(24_61_50/0.35)] ring-1 ring-line/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgb(24_61_50/0.05),0_24px_44px_-20px_rgb(24_61_50/0.45)]">
      <Link href={href} className="relative block overflow-hidden bg-cream" tabIndex={-1} aria-hidden>
        <ProductVisual
          image={p.image}
          art={p.art}
          species={p.species}
          seed={p.slug}
          alt={p.name}
          priority={priority}
          className="aspect-[4/3.2] transition duration-700 ease-out group-hover:scale-[1.05]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-semibold text-charcoal shadow-sm backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[p.availability]}`} />
          {t.availability[p.availability]}
        </span>
        <span className="absolute bottom-3 right-3 translate-y-2 rounded-full bg-forest/90 px-3 py-1 text-[0.72rem] font-medium text-cream opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {t.common.discover} →
        </span>
      </Link>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-wood">{formatLabel}</p>
        <h3 className="mt-1.5 font-sans text-[1.05rem] font-semibold leading-snug tracking-normal text-charcoal">
          <Link href={href} className="transition hover:text-wood-600">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-[0.82rem] text-stone">{p.shortDescription}</p>
        <div className="mt-auto pt-4">
          <p className="flex items-baseline justify-center gap-2">
            <span className="text-[1.45rem] font-bold tracking-tight text-forest tabular-nums">{money(site, p.priceCents, currency)}</span>
            {compareAtCents && compareAtCents > p.priceCents && <span className="text-sm text-stone line-through">{money(site, compareAtCents, currency)}</span>}
            <span className="text-[0.8rem] text-stone">{fmt(t.common.perUnit, { unit: p.unitLabel })}</span>
          </p>
          <p className="mt-0.5 text-[0.72rem] text-stone">{fmt(t.common.minQty, { n: p.minQty, unit: p.minQty > 1 ? p.unitLabelPlural : p.unitLabel })}</p>
          <div className="mt-4">
            <AddButton productId={p.id} minQty={p.minQty} label={t.common.addToPreorder} addedLabel={t.common.added} disabled={!orderable} />
          </div>
        </div>
      </div>
    </article>
  );
}
