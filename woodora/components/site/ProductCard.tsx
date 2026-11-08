import Link from "next/link";
import { ProductVisual } from "./ProductVisual";
import { QuickAdd } from "@/components/cart/AddToCart";
import { Badge, btn } from "@/components/ui";
import type { PublicProduct } from "@/lib/data/products";
import { canOrder } from "@/lib/data/products";
import type { Site } from "@/lib/sites";
import { productPath } from "@/lib/sites";
import type { Dict } from "@/lib/i18n";
import { fmt, money } from "@/lib/format";
import type { Currency } from "@/lib/markets";

const AVAIL_TONE = { available: "success", limited: "warning", out_of_stock: "danger", unavailable: "neutral" } as const;

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
  return (
    <article className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link href={href} className="relative block" tabIndex={-1} aria-hidden>
        <ProductVisual image={p.image} art={p.art} species={p.species} seed={p.slug} alt={p.name} priority={priority} className="aspect-[5/4] transition duration-500 group-hover:scale-[1.02]" />
        <span className="absolute left-3 top-3">
          <Badge tone={AVAIL_TONE[p.availability]} className="bg-white/95 shadow-sm backdrop-blur">
            <span className={`h-1.5 w-1.5 rounded-full ${p.availability === "available" ? "bg-success" : p.availability === "limited" ? "bg-warning" : "bg-danger"}`} />
            {t.availability[p.availability]}
          </Badge>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-wood">{formatLabel}</p>
        <h3 className="mt-1.5 font-display text-[1.32rem] leading-snug text-forest">
          <Link href={href} className="hover:text-pine">
            {p.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.92rem] leading-relaxed text-stone">{p.shortDescription}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[1.35rem] font-semibold leading-none tracking-tight text-charcoal tabular-nums">
                {money(site, p.priceCents, currency)}
                <span className="ml-1 text-sm font-normal text-stone">{fmt(t.common.perUnit, { unit: p.unitLabel })}</span>
              </p>
              <p className="mt-1.5 text-xs text-stone">{fmt(t.common.minQty, { n: p.minQty, unit: p.minQty > 1 ? p.unitLabelPlural : p.unitLabel })}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Link href={href} className={btn("secondary", "md", "flex-1")}>
              {t.common.discover}
            </Link>
            {canOrder(p.availability) && <QuickAdd productId={p.id} minQty={p.minQty} label={t.common.addToPreorder} addedLabel={t.common.added} />}
          </div>
        </div>
      </div>
    </article>
  );
}
