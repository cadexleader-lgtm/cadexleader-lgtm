"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Landmark, Loader2, MapPin, MessageCircle, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { evaluatePromotions, type ResolvedPromotions } from "@/lib/promotions";
import { PromoNudges } from "./PromoNudges";
import { QuantityInput } from "./AddToCart";
import { ProductVisual } from "@/components/site/ProductVisual";
import { btn } from "@/components/ui";
import { checkDeliveryAction, submitPreorderAction, type DeliveryCheckResult, type FormState } from "@/app/[site]/actions";
import type { PublicProduct } from "@/lib/data/products";
import type { Dict } from "@/lib/i18n";
import { isValidPostalCode } from "@/lib/regions";
import type { MarketId } from "@/lib/markets";

interface Props {
  siteId: string;
  market: MarketId;
  locale: string;
  currency: string;
  countryName: string;
  products: PublicProduct[];
  t: Dict["preorder"];
  common: Dict["common"];
  availability: Dict["availability"];
  productBase: string;
  shopHref: string;
  calculatorHref: string;
  termsHref: string;
  privacyHref: string;
  deliveryHref: string;
  taxNote: string;
  postalPlaceholder: string;
  phonePlaceholder: string;
  calculatorLabel: string;
  /** Real customer reviews, shown next to the submit button (server-rendered). */
  proof?: React.ReactNode;
  promotions: ResolvedPromotions | null;
  promoLabels: Dict["promo"];
}

export function PreorderClient(p: Props) {
  const { t } = p;
  const cart = useCart();
  const [state, action, submitting] = useActionState<FormState, FormData>(submitPreorderAction, { status: "idle" });
  const [values, setValues] = useState<Record<string, string>>({});
  const postal = values.postalCode ?? "";
  const [delivery, setDelivery] = useState<DeliveryCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const checkSeq = useRef(0);
  const byId = useMemo(() => new Map(p.products.map((x) => [x.id, x])), [p.products]);
  const money = (c: number) => new Intl.NumberFormat(p.locale, { style: "currency", currency: p.currency, maximumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100);

  // Drop lines whose product no longer exists in this market.
  const [removedNotice, setRemovedNotice] = useState(false);
  useEffect(() => {
    if (!cart.ready) return;
    const valid = cart.lines.filter((l) => byId.has(l.id));
    if (valid.length !== cart.lines.length) {
      cart.replace(valid);
      setRemovedNotice(true);
    }
  }, [cart.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = cart.lines
    .map((l) => ({ ...l, product: byId.get(l.id)! }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const promo = evaluatePromotions(
    p.promotions,
    lines.map((l) => ({ priceCents: l.product.priceCents, qty: l.qty, categoryId: l.product.categoryId })),
  );
  const lineError = (l: (typeof lines)[number]) => {
    const pr = l.product;
    if (pr.availability === "unavailable" || pr.availability === "out_of_stock") return t.unavailable;
    if (l.qty < pr.minQty) return t.belowMin.replace("{n}", String(pr.minQty)).replace("{unit}", pr.minQty > 1 ? pr.unitLabelPlural : pr.unitLabel);
    if (pr.maxQty != null && l.qty > pr.maxQty) return t.aboveMax.replace("{n}", String(pr.maxQty)).replace("{unit}", pr.unitLabelPlural);
    return null;
  };
  const hasLineErrors = lines.some((l) => lineError(l));

  // Delivery zone check, as soon as the postal code is valid.
  const idsKey = lines.map((l) => l.id).join(",");
  useEffect(() => {
    if (!isValidPostalCode(p.market, postal)) {
      setDelivery(null);
      return;
    }
    const seq = ++checkSeq.current;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkDeliveryAction(p.siteId, postal, idsKey ? idsKey.split(",") : [], promo.totalCents);
        if (seq === checkSeq.current) setDelivery(res);
      } finally {
        if (seq === checkSeq.current) setChecking(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [postal, idsKey, promo.totalCents, p.market, p.siteId]);

  const fe = state.status === "error" ? state.fieldErrors ?? {} : {};

  if (!cart.ready) {
    return (
      <div className="flex justify-center py-24 text-stone">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/foyo.svg" alt="" className="mx-auto h-40 w-auto" />
        <p className="mt-6 font-display text-3xl text-forest">{t.empty}</p>
        <p className="mt-2 text-stone">{t.emptyText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={p.shopHref} className={btn("primary", "md")}>{p.common.continueShopping}</Link>
          <Link href={p.calculatorHref} className={btn("secondary", "md")}>{p.calculatorLabel}</Link>
        </div>
      </div>
    );
  }

  const field = (name: string, label: string, opts: { type?: string; autoComplete?: string; placeholder?: string; help?: string; full?: boolean } = {}) => (
    <div className={opts.full ? "sm:col-span-2" : ""}>
      <label htmlFor={`po-${name}`} className="field-label">{label}</label>
      <input
        id={`po-${name}`}
        name={name}
        type={opts.type ?? "text"}
        required
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        className="field"
        aria-invalid={!!fe[name]}
        value={values[name] ?? ""}
        onChange={(e) => setValues((x) => ({ ...x, [name]: e.target.value }))}
      />
      {fe[name] ? <p className="field-error">{fe[name]}</p> : opts.help ? <p className="mt-1 text-xs text-stone">{opts.help}</p> : null}
    </div>
  );

  const deliveryBlocked = delivery && !delivery.ok;
  const canSubmit = !hasLineErrors && !deliveryBlocked && !submitting;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
      <input type="hidden" name="site" value={p.siteId} />
      <input type="hidden" name="lines" value={JSON.stringify(lines.map((l) => ({ id: l.id, qty: l.qty })))} />
      <input type="hidden" name="calculationId" value={cart.calculationId ?? ""} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="space-y-8">
        {/* Products */}
        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-3 border-b border-line px-6 py-4 font-display text-2xl text-forest">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest font-sans text-sm text-cream">1</span>
            {t.stepCart}
          </h2>
          {removedNotice && <p className="bg-wood-100 px-6 py-3 text-sm text-wood-600">{t.removed}</p>}
          {cart.calculationId && <p className="bg-sage-100/70 px-6 py-2.5 text-sm text-pine">{t.fromCalculator}</p>}
          <ul className="divide-y divide-line">
            {lines.map((l) => {
              const pr = l.product;
              const err = lineError(l);
              const blocked = delivery?.blockedProductIds.includes(pr.id);
              return (
                <li key={l.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <Link href={`${p.productBase}/${pr.slug}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
                    <ProductVisual image={pr.image} alt="" compact sizes="96px" className="h-full w-full" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`${p.productBase}/${pr.slug}`} className="font-medium text-forest hover:text-pine">{pr.name}</Link>
                    <p className="text-sm text-stone">
                      {money(pr.priceCents)} {p.common.perUnit.replace("{unit}", pr.unitLabel)} ·{" "}
                      {p.common.minQty.replace("{n}", String(pr.minQty)).replace("{unit}", pr.minQty > 1 ? pr.unitLabelPlural : pr.unitLabel)}
                    </p>
                    {err && <p className="mt-1 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" /> {err}</p>}
                    {blocked && <p className="mt-1 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" /> {t.delivery.reasons.product_excluded}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <QuantityInput
                      value={l.qty}
                      onChange={(v) => cart.setQty(l.id, v)}
                      min={pr.minQty}
                      max={pr.maxQty}
                      size="sm"
                      labels={{ decrease: p.common.decrease, increase: p.common.increase, quantity: p.common.quantity }}
                    />
                    <p className="w-24 text-right font-semibold tabular-nums text-charcoal">{money(pr.priceCents * l.qty)}</p>
                    <button type="button" onClick={() => cart.remove(l.id)} aria-label={`${p.common.remove} ${pr.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-line bg-cream/50 px-6 py-3 text-sm">
            <Link href={p.shopHref} className="font-medium text-pine hover:text-forest">← {p.common.continueShopping}</Link>
            <span className="text-stone">{p.common.subtotal} : <strong className="text-charcoal">{money(subtotal)}</strong></span>
          </div>
        </section>

        {/* Customer details */}
        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-3 border-b border-line px-6 py-4 font-display text-2xl text-forest">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest font-sans text-sm text-cream">2</span>
            {t.details}
          </h2>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {field("fullName", t.fields.fullName, { autoComplete: "name", full: true })}
            {field("email", t.fields.email, { type: "email", autoComplete: "email" })}
            {field("phone", t.fields.phone, { type: "tel", autoComplete: "tel", placeholder: p.phonePlaceholder, help: t.fields.phoneHelp })}
            {field("address", t.fields.address, { autoComplete: "street-address", full: true })}
            {field("postalCode", t.fields.postalCode, { autoComplete: "postal-code", placeholder: p.postalPlaceholder })}
            {field("city", t.fields.city, { autoComplete: "address-level2" })}
            <div>
              <label className="field-label" htmlFor="po-country">{t.fields.country}</label>
              <input id="po-country" className="field bg-cream-200/50 text-stone" value={p.countryName} readOnly aria-readonly />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="po-instructions" className="field-label">
                {t.fields.instructions} <span className="font-normal text-stone">({p.common.optional})</span>
              </label>
              <textarea
                id="po-instructions"
                name="instructions"
                rows={3}
                maxLength={1000}
                placeholder={t.fields.instructionsPlaceholder}
                className="field"
                value={values.instructions ?? ""}
                onChange={(e) => setValues((x) => ({ ...x, instructions: e.target.value }))}
              />
            </div>
          </div>

          <div className="mx-6 mb-6 rounded-xl bg-cream p-4" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <Truck className="h-4 w-4 text-wood" /> {t.delivery.title}
            </p>
            {!isValidPostalCode(p.market, postal) ? (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-stone"><MapPin className="h-4 w-4" /> {t.fields.postalCode}…</p>
            ) : checking && !delivery ? (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-stone"><Loader2 className="h-4 w-4 animate-spin" /> {t.delivery.checking}</p>
            ) : delivery ? (
              <div className="mt-1.5 space-y-1 text-sm">
                <p className={`flex items-center gap-2 font-medium ${delivery.ok ? "text-success" : "text-danger"}`}>
                  {delivery.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {delivery.message}
                </p>
                {delivery.details.map((d) => (
                  <p key={d} className="text-stone">{d}</p>
                ))}
                {!delivery.ok && (
                  <Link href={p.deliveryHref} className="inline-block font-medium text-pine underline underline-offset-2">{t.delivery.seeZones}</Link>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <div className="card overflow-hidden">
          <h2 className="flex items-center gap-3 border-b border-line px-6 py-4 font-display text-2xl text-forest">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest font-sans text-sm text-cream">3</span>
            {t.summary}
          </h2>
          <div className="space-y-3 p-6 text-[0.95rem]">
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span className="text-stone">
                    {l.qty} × {l.product.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{money(l.product.priceCents * l.qty)}</span>
                </li>
              ))}
              {promo.gifts.map((g) => (
                <li key={g.productId} className="flex justify-between gap-3">
                  <span className="text-stone">1 × {g.name}</span>
                  <span className="shrink-0 font-semibold uppercase text-wood-600">{p.promoLabels.free}</span>
                </li>
              ))}
            </ul>
            {promo.discountCents > 0 && (
              <div className="flex justify-between border-t border-line pt-3 font-semibold text-success">
                <span>{p.promoLabels.discountLine.replace("{pct}", String(promo.discountPercent))}</span>
                <span className="tabular-nums">−{money(promo.discountCents)}</span>
              </div>
            )}
            {(promo.nextGift || promo.nextTier) && (
              <PromoNudges result={promo} labels={p.promoLabels} money={money} className="rounded-xl bg-wood-100/60 p-3" />
            )}
            <div className="flex justify-between border-t border-line pt-3">
              <span className="text-stone">{t.deliveryLine}</span>
              <span className="font-medium text-success">{delivery?.ok && delivery.free ? t.deliveryFree : delivery?.ok ? t.deliveryQuoted : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">{t.taxNote}</span>
              <span className="max-w-[60%] text-right text-xs text-stone">{p.taxNote}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-medium text-charcoal">{t.total}</span>
              <span className="text-2xl font-semibold tabular-nums text-forest">{money(promo.totalCents)}</span>
            </div>

            <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl bg-cream p-3 text-sm leading-relaxed text-charcoal/85">
              <input
                type="checkbox"
                name="consent"
                required
                checked={values.consent === "on"}
                onChange={(e) => setValues((x) => ({ ...x, consent: e.target.checked ? "on" : "" }))}
                className="mt-1 h-4 w-4 shrink-0 accent-pine"
                aria-invalid={!!fe.consent}
              />
              <span>
                {t.consent.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
                  part === "{terms}" ? (
                    <Link key={i} href={p.termsHref} target="_blank" className="font-medium text-pine underline underline-offset-2">{t.terms}</Link>
                  ) : part === "{privacy}" ? (
                    <Link key={i} href={p.privacyHref} target="_blank" className="font-medium text-pine underline underline-offset-2">{t.privacy}</Link>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </span>
            </label>
            {fe.consent && <p className="field-error">{fe.consent}</p>}

            {state.status === "error" && state.message && !Object.keys(fe).length && (
              <p className="flex items-start gap-2 rounded-xl bg-[#f6e3df] p-3 text-sm text-danger" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
              </p>
            )}
            {state.status === "error" && Object.keys(fe).length > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-[#f6e3df] p-3 text-sm text-danger" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
              </p>
            )}

            <button type="submit" disabled={!canSubmit} className={btn("wood", "lg", "mt-2 w-full uppercase tracking-wide")}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
              {submitting ? t.submitting : t.submit}
            </button>
            {hasLineErrors && <p className="text-center text-sm text-danger">{t.errors.cart}</p>}
            <ul className="space-y-2 pt-2 text-sm text-stone">
              {t.reassurance.map((r, i) => (
                <li key={r} className="flex items-center gap-2">
                  {i === 0 ? <Landmark className="h-4 w-4 text-wood" /> : i === 1 ? <ShieldCheck className="h-4 w-4 text-wood" /> : <MessageCircle className="h-4 w-4 text-wood" />}
                  {r}
                </li>
              ))}
            </ul>
            {p.proof}
          </div>
        </div>
      </aside>
    </form>
  );
}
