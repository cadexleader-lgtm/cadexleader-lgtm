"use client";

import { Gift, TrendingDown } from "lucide-react";
import type { PromoResult } from "@/lib/promotions";
import type { Dict } from "@/lib/i18n/fr";

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** "Only X more to get −5 % / a free gift" messages, with a progress bar. */
export function PromoNudges({ result, labels, money, className = "" }: { result: PromoResult; labels: Dict["promo"]; money: (c: number) => string; className?: string }) {
  const items: Array<{ key: string; icon: "gift" | "tier"; text: string; progress: number }> = [];
  if (result.nextGift) {
    const target = result.nextGift.gift.minCents;
    items.push({ key: "gift", icon: "gift", text: fill(labels.nextGift, { amount: money(result.nextGift.missingCents), gift: result.nextGift.gift.name }), progress: Math.min(100, (result.qualifyingCents / target) * 100) });
  }
  if (result.nextTier) {
    const target = result.qualifyingCents + result.nextTier.missingCents;
    items.push({ key: "tier", icon: "tier", text: fill(labels.nextTier, { amount: money(result.nextTier.missingCents), pct: result.nextTier.percent }), progress: Math.min(100, (result.qualifyingCents / target) * 100) });
  }
  if (items.length === 0) return null;
  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map((it) => (
        <div key={it.key}>
          <p className="flex items-start gap-2 text-[0.82rem] font-medium leading-snug text-charcoal">
            {it.icon === "gift" ? <Gift className="mt-px h-4 w-4 shrink-0 text-wood-600" /> : <TrendingDown className="mt-px h-4 w-4 shrink-0 text-wood-600" />}
            {it.text}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full bg-wood transition-[width] duration-500" style={{ width: `${it.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Free accessories unlocked by the order, shown as cart lines. */
export function GiftLines({ result, labels, className = "" }: { result: PromoResult; labels: Dict["promo"]; className?: string }) {
  if (result.gifts.length === 0) return null;
  return (
    <ul className={className}>
      {result.gifts.map((g) => (
        <li key={g.productId} className="flex items-center gap-3 py-3">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-cream-200 ring-1 ring-line">
            {g.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Gift className="absolute inset-0 m-auto h-5 w-5 text-wood-600" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-wood-600">{fill(labels.giftReached, { gift: "" }).replace(/\s*:\s*$/, "")}</span>
            <span className="block truncate text-sm font-semibold text-forest">{g.name}</span>
          </span>
          <span className="rounded-[2px] bg-wood px-2 py-1 text-xs font-bold uppercase text-ink">{labels.free}</span>
        </li>
      ))}
    </ul>
  );
}
