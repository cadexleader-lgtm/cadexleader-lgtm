import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { ClearCartOnMount, WhatsAppActions } from "@/components/cart/ConfirmationClient";
import { ButtonLink } from "@/components/ui";
import { loadSite } from "@/lib/site-context";
import { getOrderForCustomer } from "@/lib/data/orders";
import { routePath } from "@/lib/sites";
import { fmt, money } from "@/lib/format";
import { buildPreorderMessage, whatsappLink } from "@/lib/whatsapp";
import { isSaleUnit, unitLabel } from "@/lib/energy";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { AMBIANCE } from "@/lib/illustrations";

type Props = { params: Promise<{ site: string; ref: string }>; searchParams: Promise<{ t?: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { site: id, ref } = await params;
  const { t: token } = await searchParams;
  const { site, t, settings, market } = await loadSite(id);
  const data = await getOrderForCustomer(decodeURIComponent(ref), token ?? "");

  if (!data || data.order.marketId !== site.market) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-3xl text-forest">{t.confirmation.notFound}</p>
        <ButtonLink href={routePath(site, "track")} className="mt-6">{t.track.title}</ButtonLink>
      </div>
    );
  }
  const { order, items } = data;
  const lang = site.lang;
  const unit = (u: string, q: number) => (isSaleUnit(u) ? unitLabel(u, lang, q) : u);
  const address = `${order.addressLine}, ${order.postalCode} ${order.city}`;
  const total = money(site, order.subtotalCents, order.currency);
  const message = buildPreorderMessage({
    lang,
    reference: order.reference,
    items: items.map((i) => ({ name: i.productName, quantity: i.quantity, unit: unit(i.unit, i.quantity) })),
    total,
    address,
    name: order.customerName,
  });
  const wa = whatsappLink(settings.whatsappNumber, message);

  return (
    <>
      <ClearCartOnMount reference={order.reference} />
      <section className="relative isolate overflow-hidden bg-forest-950 text-cream">
        <HeroBackdrop src={AMBIANCE.livingRoom} />
        <div className="container-page relative py-14 sm:py-20">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wood text-ink">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl leading-tight sm:text-5xl">{t.confirmation.title}</h1>
          <p className="mt-3 text-lg text-cream/75">{t.confirmation.subtitle}</p>
          <div className="mt-8 inline-flex flex-col rounded-2xl bg-cream/[0.08] px-6 py-4 ring-1 ring-cream/20">
            <span className="text-xs uppercase tracking-wider text-cream/60">{t.confirmation.reference}</span>
            <span className="mt-1 font-mono text-2xl font-semibold tracking-wide text-wood-100 sm:text-3xl">{order.reference}</span>
          </div>
          <div className="mt-10 max-w-2xl rounded-2xl bg-cream/[0.06] p-6 ring-1 ring-cream/15">
            <p className="font-display text-2xl">{t.confirmation.whatsappTitle}</p>
            <p className="mt-2 text-cream/75">{wa ? t.confirmation.whatsappText : fmt(t.confirmation.noWhatsapp, { phone: order.customerPhone })}</p>
            <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-forest-950/60 p-4 font-sans text-sm text-cream/85">{message}</pre>
            <div className="mt-5">
              <WhatsAppActions href={wa} message={message} labels={{ cta: t.confirmation.whatsappCta, copy: t.confirmation.copy, copied: t.confirmation.copied }} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-14 lg:grid-cols-[1fr_420px]">
        <section>
          <h2 className="text-3xl text-forest">{t.confirmation.next}</h2>
          <ol className="mt-6 space-y-4">
            {t.confirmation.steps.map((s, i) => (
              <li key={s} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-line">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest font-semibold text-cream">{i + 1}</span>
                <p className="pt-1.5 text-charcoal/85">{s}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-start gap-3 rounded-xl bg-sage-100/70 p-4 text-sm text-pine">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /> {t.confirmation.security}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/cosy-stove.svg" alt={t.home.cosyAlt} className="mx-auto mt-10 block w-full max-w-[520px]" />
        </section>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-forest">{t.confirmation.summary}</h2>
          <ul className="mt-4 divide-y divide-line text-[0.95rem]">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2.5">
                <span>
                  {i.quantity} {unit(i.unit, i.quantity)} — {i.productName}
                </span>
                <span className="shrink-0 tabular-nums">{money(site, i.lineTotalCents, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
            <span>{t.preorder.total}</span>
            <span className="tabular-nums text-forest">{total}</span>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm text-stone">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wood" />
            <span>
              {t.confirmation.deliveryTo} : {order.customerName}, {address} ({market.names[lang]})
            </span>
          </p>
          <Link href={routePath(site, "track")} className="mt-5 inline-block text-sm font-medium text-pine underline underline-offset-2">
            {t.confirmation.track} →
          </Link>
        </aside>
      </div>
    </>
  );
}
