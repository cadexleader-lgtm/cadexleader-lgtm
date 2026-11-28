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
import { savingPercent } from "@/lib/promotions";

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
          alt={p.name}
          pendingLabel={t.common.photoPending}
          priority={priority}
          className="aspect-square transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
        <span className="absolute left-0 top-0 inline-flex items-center gap-1.5 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-charcoal sm:px-2.5 sm:py-1.5 sm:text-[0.66rem] sm:tracking-[0.1em]">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[p.availability]}`} />
          {t.availability[p.availability]}
        </span>
        {savingPercent(p.priceCents, p.compareAtCents) > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-wood px-2 py-0.5 text-[0.72rem] font-bold sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[0.78rem] text-ink shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
            −{savingPercent(p.priceCents, p.compareAtCents)} %
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <p className="line-clamp-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-stone sm:text-[0.68rem] sm:tracking-[0.16em]">{formatLabel}</p>
        <h3 className="mt-1.5 text-[0.95rem] leading-snug text-charcoal sm:mt-2 sm:text-[1.06rem]">
          <Link href={href} className="decoration-wood decoration-2 underline-offset-4 hover:underline">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 hidden text-[0.84rem] text-stone sm:line-clamp-1">{p.shortDescription}</p>
        <div className="mt-auto pt-3 sm:pt-5">
          <div className="flex flex-col gap-1 border-t border-line pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
            <p className="leading-none">
              <span className={`text-[1.12rem] font-semibold tracking-tight tabular-nums sm:text-[1.35rem] ${savingPercent(p.priceCents, p.compareAtCents) > 0 ? "text-wood-600" : "text-forest"}`}>{money(site, p.priceCents, currency)}</span>
              {p.compareAtCents && p.compareAtCents > p.priceCents && (
                <span className="ml-1.5 text-[0.8rem] text-stone line-through sm:ml-2 sm:text-sm">{money(site, p.compareAtCents, currency)}</span>
              )}
              <span className="mt-1 block text-[0.75rem] text-stone">{fmt(t.common.perUnit, { unit: p.unitLabel }).replace(/^\/\s*/, "/ ")}</span>
            </p>
            <p className="text-[0.68rem] leading-tight text-stone sm:text-right sm:text-[0.72rem]">{fmt(t.common.minQty, { n: p.minQty, unit: p.minQty > 1 ? p.unitLabelPlural : p.unitLabel })}</p>
          </div>
          <div className="mt-3 sm:mt-4">
            <AddButton productId={p.id} minQty={p.minQty} label={t.common.addToPreorder} shortLabel={t.common.addShort} addedLabel={t.common.added} disabled={!orderable} />
          </div>
        </div>
      </div>
    </article>
  );
}
