import { LogoMark } from "@/components/art/Logo";
import type { Order, OrderItem, Quotation } from "@/lib/data/orders";
import type { BillingSettings, CompanySettings, MarketSettings } from "@/lib/data/settings";
import { MARKETS } from "@/lib/markets";
import { formatMoney } from "@/lib/format";
import { isSaleUnit, unitLabel } from "@/lib/energy";

const TXT = {
  fr: {
    title: "Facture pro forma",
    number: "N°",
    date: "Date",
    validUntil: "Valable jusqu'au",
    order: "Précommande",
    seller: "Émetteur",
    customer: "Client",
    deliverTo: "Livraison",
    designation: "Désignation",
    qty: "Quantité",
    unitPrice: "Prix unitaire",
    total: "Total",
    gift: "Offert",
    giftNote: "accessoire offert",
    subtotal: "Sous-total",
    discount: "Remise volume (−{pct} % sur le bois)",
    adjustment: "Ajustement de prix",
    delivery: "Livraison",
    deliveryFree: "Offerte",
    taxes: "Taxes",
    taxesIncluded: "Incluses dans les prix",
    toPay: "Total à payer",
    payTitle: "Règlement par virement bancaire",
    payBefore: "À régler avant le {date}",
    beneficiary: "Bénéficiaire",
    reference: "Référence à indiquer",
    amount: "Montant",
    bankMissing: "Coordonnées bancaires communiquées par votre conseiller.",
    notes: "Remarques",
    legalTitle: "Informations importantes",
    l1: "Ce document est une facture pro forma : il ne constitue pas une facture. La facture définitive vous est remise après réception du paiement.",
    l2: "Votre commande est confirmée uniquement après réception et vérification de votre virement. Les quantités et le prix sont garantis jusqu'à la date de validité indiquée.",
    l3: "Sécurité : nous ne vous demanderons jamais de payer par un autre moyen ni sur un autre compte que celui indiqué ci-dessus. En cas de doute, contactez-nous avant tout paiement.",
    withdrawal: "Vous disposez d'un délai de rétractation de 14 jours à compter de la livraison, dans les conditions prévues par nos conditions générales de vente.",
    mediator: "Médiation de la consommation : {m}",
    terms: "Conditions générales de vente : {url}",
    registration: "Immatriculation",
    vat: "N° TVA",
    thanks: "Merci de votre confiance.",
  },
  en: {
    title: "Pro forma invoice",
    number: "No.",
    date: "Date",
    validUntil: "Valid until",
    order: "Pre-order",
    seller: "From",
    customer: "Customer",
    deliverTo: "Delivery",
    designation: "Description",
    qty: "Quantity",
    unitPrice: "Unit price",
    total: "Total",
    gift: "Free",
    giftNote: "free accessory",
    subtotal: "Subtotal",
    discount: "Volume discount (−{pct}% on firewood)",
    adjustment: "Price adjustment",
    delivery: "Delivery",
    deliveryFree: "Free",
    taxes: "Taxes",
    taxesIncluded: "Included in prices",
    toPay: "Total due",
    payTitle: "Payment by bank transfer",
    payBefore: "To be paid before {date}",
    beneficiary: "Account holder",
    reference: "Payment reference",
    amount: "Amount",
    bankMissing: "Bank details provided by your advisor.",
    notes: "Notes",
    legalTitle: "Important information",
    l1: "This is a pro forma invoice: it is not a tax invoice. The final invoice is issued once payment has been received.",
    l2: "Your order is confirmed only once your bank transfer has been received and verified. Quantities and prices are guaranteed until the validity date shown.",
    l3: "Security: we will never ask you to pay by any other means or into any account other than the one shown above. If in doubt, contact us before paying.",
    withdrawal: "",
    mediator: "Consumer mediation: {m}",
    terms: "Terms of sale: {url}",
    registration: "Registration",
    vat: "Tax ID",
    thanks: "Thank you for your trust.",
  },
} as const;

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export function proformaLocale(order: Pick<Order, "marketId" | "language">): string {
  if (order.marketId === "fr") return "fr-FR";
  if (order.marketId === "us") return "en-US";
  return order.language === "en" ? "en-CA" : "fr-CA";
}

export function ProformaDocument({
  order,
  items,
  quotation,
  company,
  billing,
  market,
  termsUrl,
}: {
  order: Order;
  items: OrderItem[];
  quotation: Quotation;
  company: CompanySettings;
  billing: BillingSettings | undefined;
  market: MarketSettings;
  termsUrl: string;
}) {
  const lang = order.language === "en" ? "en" : "fr";
  const t = TXT[lang];
  const locale = proformaLocale(order);
  const m = MARKETS[order.marketId];
  const money = (c: number) => formatMoney(c, quotation.currency, locale);
  const date = (d: Date | string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: m.timeZone }).format(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d);
  const unit = (u: string, q: number) => (isSaleUnit(u) ? unitLabel(u, lang, q) : u);

  const linesTotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
  const discount = order.discountCents ?? 0;
  const adjustment = quotation.amountCents - (linesTotal - discount);
  const total = quotation.amountCents + quotation.deliveryCents + quotation.taxCents;
  const sellerName = company.legalName || company.tradeName || "Foyerwood";
  const contactEmail = market.contactEmail || company.email;

  return (
    <article className="proforma mx-auto w-full max-w-[210mm] bg-white text-[13px] leading-relaxed text-charcoal shadow-[0_30px_80px_-40px_rgb(22_21_21/0.45)] print:max-w-none print:text-[11.5px] print:leading-snug print:shadow-none">
      {/* Header band */}
      <header className="flex flex-col gap-5 bg-forest-950 px-6 py-6 text-cream sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:py-8 print:flex-row print:items-start print:justify-between print:px-8 print:py-4">
        <div className="flex items-center gap-3">
          <LogoMark tone="light" className="h-12 w-12" />
          <div>
            <p className="font-display text-[2rem] leading-none">{company.tradeName || "Foyerwood"}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-cream/60">{lang === "fr" ? "Bois de chauffage livré" : "Firewood, delivered"}</p>
          </div>
        </div>
        <div className="sm:text-right print:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wood">{t.title}</p>
          <p className="mt-1 break-all font-mono text-lg font-semibold">{quotation.number}</p>
          <dl className="mt-2 space-y-0.5 text-[12px] text-cream/75">
            <div><dt className="inline">{t.date} : </dt><dd className="inline text-cream">{date(quotation.createdAt)}</dd></div>
            {quotation.validUntil && <div><dt className="inline">{t.validUntil} : </dt><dd className="inline font-semibold text-wood">{date(quotation.validUntil)}</dd></div>}
            <div><dt className="inline">{t.order} : </dt><dd className="inline font-mono text-cream">{order.reference}</dd></div>
          </dl>
        </div>
      </header>
      <div className="h-1.5 bg-wood print:h-1" aria-hidden />

      <div className="px-6 py-6 sm:px-10 sm:py-8 print:px-8 print:py-5">
        {/* Parties */}
        <section className="grid gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">{t.seller}</p>
            <p className="mt-2 font-semibold text-forest">{sellerName}</p>
            {company.legalName && company.tradeName && company.legalName !== company.tradeName && <p className="text-stone">{company.tradeName}</p>}
            {company.address && <p className="whitespace-pre-line">{company.address}</p>}
            {company.registration && <p>{t.registration} : {company.registration}</p>}
            {company.vatNumber && <p>{t.vat} : {company.vatNumber}</p>}
            {contactEmail && <p>{contactEmail}</p>}
            {market.contactPhone && <p>{market.contactPhone}</p>}
          </div>
          <div className="rounded-[4px] bg-cream p-4 ring-1 ring-line">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">{t.customer}</p>
            <p className="mt-2 font-semibold text-forest">{order.customerName}</p>
            <p>{order.addressLine}</p>
            <p>{order.postalCode} {order.city}{order.region ? `, ${order.region}` : ""}</p>
            <p>{m.names[lang]}</p>
            <p className="mt-1">{order.customerEmail}</p>
            <p>{order.customerPhone}</p>
          </div>
        </section>

        {/* Lines */}
        <div className="mt-8 overflow-x-auto print:mt-5"><table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-forest text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-stone">
              <th className="py-2 pr-3">{t.designation}</th>
              <th className="py-2 pr-3 text-right">{t.qty}</th>
              <th className="hidden py-2 pr-3 text-right sm:table-cell print:table-cell">{t.unitPrice}</th>
              <th className="py-2 text-right">{t.total}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-line align-top [&>td]:print:py-2">
                <td className="py-3 pr-3">
                  <span className="font-medium text-forest">{i.productName.replace(/\s*\((offert|free)\)\s*$/i, "")}</span>
                  {i.isGift && <span className="ml-2 rounded-[2px] bg-wood-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-wood-600">{t.giftNote}</span>}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">{i.quantity} {unit(i.unit, i.quantity)}</td>
                <td className="hidden py-3 pr-3 text-right tabular-nums sm:table-cell print:table-cell">{i.isGift ? "—" : money(i.unitPriceCents)}</td>
                <td className="py-3 text-right font-medium tabular-nums">{i.isGift ? t.gift : money(i.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>

        {/* Totals */}
        <section className="mt-6 flex justify-end print:mt-3">
          <dl className="w-full max-w-[300px] space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-stone">{t.subtotal}</dt><dd className="tabular-nums">{money(linesTotal)}</dd></div>
            {discount > 0 && (
              <div className="flex justify-between text-success"><dt>{fill(t.discount, { pct: Number(order.discountPercent) })}</dt><dd className="tabular-nums">−{money(discount)}</dd></div>
            )}
            {adjustment !== 0 && (
              <div className="flex justify-between"><dt className="text-stone">{t.adjustment}</dt><dd className="tabular-nums">{adjustment > 0 ? "+" : "−"}{money(Math.abs(adjustment))}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-stone">{t.delivery}</dt><dd className="tabular-nums">{quotation.deliveryCents > 0 ? money(quotation.deliveryCents) : t.deliveryFree}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">{t.taxes}</dt><dd className="tabular-nums">{quotation.taxCents > 0 ? money(quotation.taxCents) : market.pricesIncludeTax ? t.taxesIncluded : money(0)}</dd></div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-forest pt-3">
              <dt className="font-semibold text-forest">{t.toPay}</dt>
              <dd className="font-display text-[1.9rem] leading-none tabular-nums text-forest">{money(total)}</dd>
            </div>
          </dl>
        </section>

        {/* Payment */}
        <section className="mt-8 grid gap-0 overflow-hidden rounded-[4px] ring-1 ring-wood/40 break-inside-avoid sm:grid-cols-[1.3fr_1fr] print:mt-3 print:grid-cols-[1.3fr_1fr]">
          <div className="bg-wood-100/50 p-5 print:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wood-600">{t.payTitle}</p>
            {quotation.validUntil && <p className="mt-1 font-semibold text-forest">{fill(t.payBefore, { date: date(quotation.validUntil) })}</p>}
            {billing?.beneficiary || billing?.bankDetails ? (
              <dl className="mt-3 space-y-1">
                {billing.beneficiary && <div><dt className="inline text-stone">{t.beneficiary} : </dt><dd className="inline font-medium">{billing.beneficiary}</dd></div>}
                {billing.bankDetails && <dd className="whitespace-pre-line font-mono text-[12px]">{billing.bankDetails}</dd>}
              </dl>
            ) : (
              <p className="mt-3 text-stone">{t.bankMissing}</p>
            )}
          </div>
          <div className="flex flex-col justify-center gap-2 bg-forest-950 p-5 text-cream print:p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cream/60">{t.reference}</p>
            <p className="font-mono text-lg font-semibold text-wood">{quotation.number}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cream/60">{t.amount}</p>
            <p className="font-display text-2xl leading-none tabular-nums">{money(total)}</p>
          </div>
        </section>

        {quotation.notes && (
          <section className="mt-6 print:mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">{t.notes}</p>
            <p className="mt-1 whitespace-pre-line">{quotation.notes}</p>
          </section>
        )}

        {/* Legal */}
        <section className="mt-8 border-t border-line pt-5 text-[11px] leading-relaxed text-stone print:mt-3 print:pt-2 print:text-[9.5px] print:leading-snug">
          <p className="font-semibold uppercase tracking-[0.16em] text-charcoal">{t.legalTitle}</p>
          <ul className="mt-2 space-y-1 print:mt-1 print:space-y-0.5">
            <li>{t.l1}</li>
            <li>{t.l2}</li>
            <li className="font-medium text-charcoal">{t.l3}</li>
            {order.marketId === "fr" && t.withdrawal && <li>{t.withdrawal}</li>}
            {billing?.taxMention && <li className="whitespace-pre-line text-charcoal">{billing.taxMention}</li>}
            {order.marketId === "fr" && company.mediator && <li>{fill(t.mediator, { m: company.mediator })}</li>}
            <li>{fill(t.terms, { url: termsUrl })}</li>
          </ul>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 bg-cream px-6 py-4 text-[11px] text-stone sm:px-10 print:px-8 print:py-3">
        <span>
          {sellerName}
          {company.address ? ` · ${company.address.replace(/\n/g, ", ")}` : ""}
          {company.registration ? ` · ${company.registration}` : ""}
        </span>
        <span className="font-medium text-forest">{t.thanks}</span>
      </footer>
    </article>
  );
}
