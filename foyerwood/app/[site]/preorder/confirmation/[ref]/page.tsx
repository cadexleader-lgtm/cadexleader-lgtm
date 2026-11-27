import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, Mail, MapPin, Phone, Route, ShieldCheck } from "lucide-react";
import { ClearCartOnMount, WhatsappOptIn } from "@/components/cart/ConfirmationClient";
import { ButtonLink, btn } from "@/components/ui";
import { loadSite } from "@/lib/site-context";
import { getActiveProformaNumber, getOrderForCustomer } from "@/lib/data/orders";
import { routePath } from "@/lib/sites";
import { siteUrl } from "@/lib/site-url";
import { fmt, money } from "@/lib/format";
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
  const total = money(site, order.subtotalCents - (order.discountCents ?? 0), order.currency);
  const tk = token ?? "";
  const pf = await getActiveProformaNumber(order.id);
  const pfPath = pf ? `/documents/proforma/${encodeURIComponent(pf)}?t=${encodeURIComponent(tk)}` : null;
  const c = t.confirmation;

  // E-mail to the shop, fully written: the customer only presses "Send".
  const emailBody = [
    fmt(c.emailIntro, { ref: order.reference, pf: pf ?? "—" }),
    "",
    ...(pfPath ? [c.emailProformaLink, `${siteUrl()}${pfPath}`, ""] : []),
    ...items.map((i) => `- ${i.quantity} ${unit(i.unit, i.quantity)} — ${i.productName}`),
    fmt(c.emailTotal, { amount: total }),
    "",
    c.emailContact,
    order.customerName,
    address,
    order.customerPhone,
    ...(order.customerWhatsapp ? [fmt(c.emailWhatsapp, { phone: order.customerWhatsapp })] : []),
    order.customerEmail,
    "",
    c.emailThanks,
    order.customerName,
  ].join("\n");
  const emailSubject = pf ? `${fmt(c.emailSubject, { ref: order.reference })} — ${c.proformaNumber} ${pf}` : fmt(c.emailSubject, { ref: order.reference });
  const emailHref = settings.contactEmail
    ? `mailto:${settings.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;
  const contactHref = `${routePath(site, "contact")}?ref=${encodeURIComponent(order.reference)}&t=${encodeURIComponent(tk)}`;
  const phoneHref = settings.contactPhone ? `tel:${settings.contactPhone.replace(/[^\d+]/g, "")}` : null;
  const trackHref = `${routePath(site, "track")}?ref=${encodeURIComponent(order.reference)}`;
  const phonePlaceholder = site.market === "fr" ? "+33 6 12 34 56 78" : site.market === "us" ? "+1 212 555 0123" : "+1 514 555 0123";

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
          <div className="mt-10 max-w-2xl space-y-4">
            <div className="rounded-2xl bg-cream/[0.06] p-6 ring-1 ring-cream/15">
              <p className="font-display text-2xl">{c.sendTitle}</p>
              <p className="mt-2 text-cream/75">{emailHref ? c.sendText : c.noEmailText}</p>
              {pfPath && (
                <a
                  href={pfPath}
                  target="_blank"
                  rel="noopener"
                  className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-cream p-4 text-ink transition hover:bg-white"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-wood-100 text-wood-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs uppercase tracking-wider text-stone">{c.proformaNumber}</span>
                    <span className="block break-all font-mono text-[0.95rem] font-semibold">{pf}</span>
                  </span>
                  <span className="w-full text-sm font-semibold underline underline-offset-4 sm:w-auto">{c.viewProforma} →</span>
                </a>
              )}
              <div className="mt-5">
                {emailHref ? (
                  <a href={emailHref} className={btn("wood", "lg", "w-full sm:w-auto")}>
                    <Mail className="h-5 w-5" /> {c.sendEmail}
                  </a>
                ) : (
                  <Link href={contactHref} className={btn("wood", "lg", "w-full sm:w-auto")}>
                    <Mail className="h-5 w-5" /> {c.writeSite}
                  </Link>
                )}
                {emailHref && <p className="mt-2 text-xs leading-relaxed text-cream/60">{c.sendHint}</p>}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-cream/10 pt-4 text-sm">
                {phoneHref && (
                  <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto">
                    <span className="text-cream/70">{c.orCall}</span>
                    <a
                      href={phoneHref}
                      className="inline-flex h-11 items-center gap-2 rounded-[3px] px-4 font-semibold text-cream ring-1 ring-cream/30 transition hover:bg-cream/10"
                    >
                      <Phone className="h-4 w-4 text-wood" /> <span className="tabular-nums">{settings.contactPhone}</span>
                    </a>
                  </span>
                )}
                {emailHref && (
                  <Link href={contactHref} className="text-cream/70 underline underline-offset-4 hover:text-cream">
                    {c.orSite}
                  </Link>
                )}
              </div>
            </div>
            <WhatsappOptIn
              site={site.id}
              reference={order.reference}
              token={tk}
              current={order.customerWhatsapp}
              placeholder={phonePlaceholder}
              labels={{
                title: c.whatsappOptTitle,
                text: c.whatsappOptText,
                onFile: c.whatsappOnFile,
                change: c.whatsappChange,
                save: c.whatsappSave,
                field: t.preorder.fields.whatsapp,
              }}
            />
            <Link href={trackHref} className="inline-flex items-center gap-2 text-sm font-semibold text-cream underline decoration-cream/30 underline-offset-[6px] hover:decoration-cream">
              <Route className="h-4 w-4 text-wood" /> {c.trackCta}
            </Link>
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
                <span className={`shrink-0 tabular-nums ${i.isGift ? "font-semibold text-wood-600" : ""}`}>{i.isGift ? t.promo.free : money(site, i.lineTotalCents, order.currency)}</span>
              </li>
            ))}
          </ul>
          {order.discountCents > 0 && (
            <div className="mt-3 flex justify-between text-[0.95rem] text-success">
              <span>{fmt(t.promo.discountLine, { pct: Number(order.discountPercent) })}</span>
              <span className="tabular-nums">−{money(site, order.discountCents, order.currency)}</span>
            </div>
          )}
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
          <Link href={trackHref} className="mt-5 inline-block text-sm font-medium text-pine underline underline-offset-2">
            {t.confirmation.track} →
          </Link>
        </aside>
      </div>
    </>
  );
}
