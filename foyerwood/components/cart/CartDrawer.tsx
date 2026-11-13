"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { AlertCircle, Landmark, Star, Trash2, Truck, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { QuantityInput } from "./AddToCart";
import { ProductVisual } from "@/components/site/ProductVisual";
import { formatMoney } from "@/lib/format";
import { evaluatePromotions, type ResolvedPromotions } from "@/lib/promotions";
import type { Dict } from "@/lib/i18n/fr";
import { GiftLines, PromoNudges } from "./PromoNudges";

export interface DrawerProduct {
  id: string;
  name: string;
  href: string;
  image: string | null;
  priceCents: number;
  unitLabel: string;
  unitLabelPlural: string;
  minQty: number;
  maxQty: number | null;
  categoryId: string;
  compareAtCents: number | null;
}

export interface CartDrawerLabels {
  title: string;
  added: string;
  emptyTitle: string;
  emptyText: string;
  browse: string;
  subtotal: string;
  note: string;
  checkout: string;
  continue: string;
  remove: string;
  close: string;
  freeLeft: string;
  freeOk: string;
  freeHint: string;
  lineTotal: string;
  perUnit: string;
  minQty: string;
  decrease: string;
  increase: string;
  quantity: string;
  photoPending: string;
  notReserved: string;
  zeroToday: string;
}

/** Slide-in pre-order panel, opened whenever a product is added. */
export function CartDrawer({
  products,
  currency,
  locale,
  preorderHref,
  shopHref,
  freeThresholdCents,
  rating,
  promotions,
  promoLabels,
  labels,
}: {
  promotions: ResolvedPromotions | null;
  promoLabels: Dict["promo"];
  /** Real review summary (only when published reviews exist). */
  rating?: { text: string; average: number; href: string } | null;
  products: DrawerProduct[];
  currency: string;
  locale: string;
  preorderHref: string;
  shopHref: string;
  freeThresholdCents: number | null;
  labels: CartDrawerLabels;
}) {
  const { lines, ready, drawerOpen, closeDrawer, setQty, remove } = useCart();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const rows = lines.map((l) => ({ line: l, product: byId.get(l.id) })).filter((r) => r.product) as Array<{
    line: { id: string; qty: number };
    product: DrawerProduct;
  }>;
  const subtotal = rows.reduce((sum, r) => sum + r.product.priceCents * r.line.qty, 0);
  const promo = evaluatePromotions(
    promotions,
    rows.map((r) => ({ priceCents: r.product.priceCents, qty: r.line.qty, categoryId: r.product.categoryId })),
  );
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const open = drawerOpen && ready;

  // Close on navigation (e.g. after clicking "Complete my pre-order").
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Focus management, Escape key, focus trap and scroll lock while open.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
      } else if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.();
    };
  }, [open, closeDrawer]);

  const left = freeThresholdCents ? Math.max(0, freeThresholdCents - subtotal) : null;
  const progress = freeThresholdCents ? Math.min(100, Math.round((subtotal / freeThresholdCents) * 100)) : 0;
  const unitWord = (p: DrawerProduct, n: number) => (n > 1 ? p.unitLabelPlural : p.unitLabel);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        className={`absolute inset-0 bg-forest-950/50 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-cream shadow-[-24px_0_60px_-30px_rgb(22_21_21/0.5)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 id="cart-drawer-title" className="font-sans text-base font-semibold text-forest">
            {labels.title} <span className="text-stone">({rows.length})</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            aria-label={labels.close}
            className="flex h-9 w-9 items-center justify-center rounded-[3px] text-forest transition hover:bg-cream-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>


        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/foyo.svg" alt="" className="h-44 w-auto" />
            <p className="mt-4 font-display text-2xl text-forest">{labels.emptyTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone">{labels.emptyText}</p>
            <Link
              href={shopHref}
              onClick={closeDrawer}
              className="mt-6 inline-flex h-11 items-center rounded-[3px] bg-wood px-6 text-sm font-semibold text-ink transition-colors hover:bg-ember"
            >
              {labels.browse}
            </Link>
          </div>
        ) : (
          <>
            {freeThresholdCents != null && left != null && (
              <div className="border-b border-line bg-white px-5 py-3">
                <p className="flex items-start gap-2 text-[0.82rem] leading-snug text-charcoal">
                  <Truck className="mt-px h-4 w-4 shrink-0 text-wood-600" />
                  <span>
                    {left > 0 ? labels.freeLeft.replace("{amount}", money(left)) : labels.freeOk}{" "}
                    <span className="text-stone">· {labels.freeHint}</span>
                  </span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200">
                  <div className="h-full rounded-full bg-wood transition-[width] duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {(promo.nextGift || promo.nextTier) && (
              <PromoNudges result={promo} labels={promoLabels} money={money} className="border-b border-line bg-wood-100/50 px-5 py-3" />
            )}

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {rows.map(({ line, product: p }) => {
                const tooFew = line.qty < p.minQty;
                return (
                  <li key={p.id} className="flex gap-4 py-4">
                    <Link href={p.href} onClick={closeDrawer} className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
                      <ProductVisual image={p.image} alt="" compact sizes="80px" className="h-full w-full" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={p.href} onClick={closeDrawer} className="text-sm font-semibold leading-snug text-forest hover:underline">
                          {p.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          aria-label={labels.remove.replace("{name}", p.name)}
                          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-stone transition hover:bg-cream-200 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-stone">
                        {money(p.priceCents)} {labels.perUnit.replace("{unit}", p.unitLabel)}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-3">
                        <QuantityInput
                          size="sm"
                          value={line.qty}
                          onChange={(v) => setQty(p.id, v)}
                          min={p.minQty}
                          max={p.maxQty}
                          labels={{ decrease: labels.decrease, increase: labels.increase, quantity: labels.quantity }}
                        />
                        <span className="text-sm font-semibold tabular-nums text-charcoal">{money(p.priceCents * line.qty)}</span>
                      </div>
                      {tooFew && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {labels.minQty.replace("{n}", String(p.minQty)).replace("{unit}", unitWord(p, p.minQty))}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
              {promo.gifts.length > 0 && (
                <li>
                  <GiftLines result={promo} labels={promoLabels} />
                </li>
              )}
            </ul>

            <div className="border-t border-line bg-white px-5 pb-5 pt-4">
              {promo.discountCents > 0 && (
                <div className="mb-1 space-y-1 text-sm">
                  <div className="flex justify-between text-stone">
                    <span>{labels.lineTotal}</span>
                    <span className="tabular-nums">{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-success">
                    <span>{promoLabels.discountLine.replace("{pct}", String(promo.discountPercent))}</span>
                    <span className="tabular-nums">−{money(promo.discountCents)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-stone">{promo.discountCents > 0 ? promoLabels.totalAfter : labels.subtotal}</span>
                <span className="font-display text-3xl tabular-nums text-forest">{money(promo.totalCents)}</span>
              </div>
              <p className="mt-2 flex gap-2 text-xs leading-relaxed text-stone">
                <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wood-600" />
                {labels.note}
              </p>
              {rating && (
                <Link href={rating.href} onClick={closeDrawer} className="mt-3 flex items-center gap-2 text-xs font-semibold text-charcoal hover:underline">
                  <span className="flex gap-0.5 text-wood" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating.average + 0.25) ? "fill-current" : "opacity-25"}`} />
                    ))}
                  </span>
                  {rating.text}
                </Link>
              )}
              <p className="mt-3 flex items-center gap-2 rounded-[3px] bg-wood-100 px-3 py-2 text-xs font-semibold text-wood-600">
                <AlertCircle className="h-4 w-4 shrink-0" /> {labels.notReserved}
              </p>
              <Link
                href={preorderHref}
                onClick={closeDrawer}
                className="mt-3 flex h-14 w-full flex-col items-center justify-center rounded-[3px] bg-wood text-ink transition-colors hover:bg-ember"
              >
                <span className="text-[0.95rem] font-semibold leading-tight">{labels.checkout}</span>
                <span className="text-[0.72rem] font-medium leading-tight opacity-80">{labels.zeroToday}</span>
              </Link>
              <button type="button" onClick={closeDrawer} className="mt-2 h-10 w-full text-sm font-medium text-forest underline-offset-4 hover:underline">
                {labels.continue}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
