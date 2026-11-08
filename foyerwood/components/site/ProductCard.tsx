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
  const href = productPath(site, p.slug);
  const orderable = canOrder(p.availability);
  return (
    <article className="group flex h-full flex-col bg-white ring-1 ring-line transition-shadow duration-300 hover:ring-forest/25 hover:shadow-[var(--shadow-lift)]">
      <Link href={href} className="relative block overflow-hidden bg-cream-200" tabIndex={-1} aria-hidden>
        <ProductVisual
          image={p.image}
          art={p.art}
          species={p.species}
          seed={p.slug}
          alt={p.name}
          priority={priority}
          className="aspect-square transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
        />
        <span className="absolute left-0 top-0 inline-flex items-center gap-1.5 bg-white px-2.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-charcoal">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[p.availability]}`} />
          {t.availability[p.availability]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-stone">{formatLabel}</p>
        <h3 className="mt-2 text-[1.06rem] leading-snug text-charcoal">
          <Link href={href} className="decoration-wood decoration-2 underline-offset-4 hover:underline">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-[0.84rem] text-stone">{p.shortDescription}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
            <p className="leading-none">
              <span className="text-[1.35rem] font-semibold tracking-tight text-forest tabular-nums">{money(site, p.priceCents, currency)}</span>
              {p.compareAtCents && p.compareAtCents > p.priceCents && (
                <span className="ml-2 text-sm text-stone line-through">{money(site, p.compareAtCents, currency)}</span>
              )}
              <span className="mt-1 block text-[0.75rem] text-stone">{fmt(t.common.perUnit, { unit: p.unitLabel }).replace(/^\/\s*/, "/ ")}</span>
            </p>
            <p className="text-right text-[0.72rem] leading-tight text-stone">{fmt(t.common.minQty, { n: p.minQty, unit: p.minQty > 1 ? p.unitLabelPlural : p.unitLabel })}</p>
          </div>
          <div className="mt-4">
            <AddButton productId={p.id} minQty={p.minQty} label={t.common.addToPreorder} addedLabel={t.common.added} disabled={!orderable} />
          </div>
        </div>
      </div>
    </article>
  );
}
