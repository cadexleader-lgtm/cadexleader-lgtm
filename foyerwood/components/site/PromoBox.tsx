import { Gift, TrendingDown } from "lucide-react";
import type { Dict } from "@/lib/i18n/fr";
import type { ResolvedPromotions } from "@/lib/promotions";
import { fmt, formatMoney } from "@/lib/format";

/** "The more you order, the more you save": volume discounts and free accessories. */
export function PromoBox({
  promos,
  t,
  currency,
  locale,
  className = "",
}: {
  promos: ResolvedPromotions | null;
  t: Dict;
  currency: string;
  locale: string;
  className?: string;
}) {
  if (!promos || !promos.enabled || (promos.tiers.length === 0 && promos.gifts.length === 0)) return null;
  const money = (c: number) => formatMoney(c, currency, locale);
  const rows = [
    ...promos.tiers.map((tier) => ({ key: `t${tier.minCents}`, min: tier.minCents, icon: "tier" as const, text: fmt(t.promo.tierLine, { amount: money(tier.minCents), pct: tier.percent }), image: null as string | null })),
    ...promos.gifts.map((g) => ({ key: `g${g.productId}${g.minCents}`, min: g.minCents, icon: "gift" as const, text: fmt(t.promo.giftLine, { amount: money(g.minCents), gift: g.name }), image: g.image })),
  ].sort((a, b) => a.min - b.min);
  return (
    <section className={`overflow-hidden rounded-[var(--radius-card)] bg-forest-950 text-cream ${className}`} aria-label={t.promo.boxTitle}>
      <p className="flex items-center gap-2 border-b border-cream/10 px-5 py-3 text-sm font-semibold text-wood">
        <Gift className="h-4 w-4" /> {t.promo.boxTitle}
      </p>
      <ul className="divide-y divide-cream/10">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 px-5 py-3 text-[0.92rem]">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" className="h-9 w-9 shrink-0 rounded-[3px] bg-white object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-wood text-ink">
                {r.icon === "tier" ? <TrendingDown className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
              </span>
            )}
            <span className="text-cream/90">{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
