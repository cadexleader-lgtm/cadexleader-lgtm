import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Mail, Phone, MapPin, ShieldAlert } from "lucide-react";
import { Flash, Panel, StatusBadge, Field, TextArea, Select, SubmitButton } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { getOrderDetail, quotationTotal } from "@/lib/data/orders";
import { MARKETS } from "@/lib/markets";
import { ORDER_STATUSES, STATUS_LABELS, PAID_STATUSES } from "@/lib/order-status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { isSaleUnit, unitLabel } from "@/lib/energy";
import {
  addNoteAction, changeStatusAction, createQuotationAction, paymentStatusAction, quotationStatusAction,
  recordPaymentAction, saveDeliveryAction, saveInternalNotesAction,
} from "@/app/admin/actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const PAYMENT_LABEL = { awaiting: "Annoncé (non reçu)", verified: "Reçu et vérifié", rejected: "Rejeté", refunded: "Remboursé" } as const;
const PAYMENT_TONE = { awaiting: "warning", verified: "success", rejected: "danger", refunded: "neutral" } as const;
const QUOTE_LABEL = { draft: "Brouillon", sent: "Envoyé", accepted: "Accepté", expired: "Expiré", cancelled: "Annulé" } as const;
const DELIVERY_LABEL = { pending: "À planifier", scheduled: "Planifiée", in_transit: "En cours", delivered: "Livrée", failed: "Échec" } as const;

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await getOrderDetail(id);
  if (!d) notFound();
  const { order: o, items, events, quotations, payments, delivery } = d;
  const market = MARKETS[o.marketId];
  const money = (c: number) => formatMoney(c, o.currency, "fr-FR");
  const tz = market.timeZone;
  const activeQuote = quotations.find((q) => q.status !== "cancelled");
  const due = activeQuote ? quotationTotal(activeQuote) : null;
  const verified = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.receivedCents, 0);
  const cost = items.reduce((s, i) => s + (i.unitCostCents ?? 0) * i.quantity, 0);
  const costKnown = items.every((i) => i.unitCostCents != null);
  const greet =
    o.language === "fr"
      ? `Bonjour ${o.customerName}, ici Woodora au sujet de votre précommande ${o.reference}.`
      : `Hello ${o.customerName}, this is Woodora about your pre-order ${o.reference}.`;
  const waCustomer = whatsappLink(o.customerPhone, greet);
  const unit = (u: string, q: number) => (isSaleUnit(u) ? unitLabel(u, "fr", q) : u);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-stone hover:text-forest">← Précommandes</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold text-forest sm:text-3xl">{o.reference}</h1>
        <StatusBadge status={o.status} />
        <span className="text-sm text-stone">
          {market.flag} {market.names.fr} · {o.language.toUpperCase()} · reçue le {formatDateTime(o.createdAt, "fr-FR", tz)}
        </span>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Produits">
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
                  <tr><th className="px-5 py-2.5">Produit</th><th className="px-5 py-2.5 text-right">Qté</th><th className="px-5 py-2.5 text-right">Prix unitaire</th><th className="px-5 py-2.5 text-right">Achat</th><th className="px-5 py-2.5 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-5 py-3">{i.productId ? <Link href={`/admin/products/${i.productId}`} className="text-forest hover:underline">{i.productName}</Link> : i.productName}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{i.quantity} <span className="text-stone">{unit(i.unit, i.quantity)}</span></td>
                      <td className="px-5 py-3 text-right tabular-nums">{money(i.unitPriceCents)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-stone">{i.unitCostCents != null ? money(i.unitCostCents) : "—"}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">{money(i.lineTotalCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-line text-sm">
                  <tr><td colSpan={4} className="px-5 py-2.5 text-right text-stone">Sous-total estimé (prix catalogue)</td><td className="px-5 py-2.5 text-right font-semibold tabular-nums">{money(o.subtotalCents)}</td></tr>
                  <tr><td colSpan={4} className="px-5 py-2.5 text-right text-stone">Marge estimée</td><td className="px-5 py-2.5 text-right tabular-nums">{costKnown ? `${money(o.subtotalCents - cost)} (${o.subtotalCents ? Math.round(((o.subtotalCents - cost) / o.subtotalCents) * 100) : 0} %)` : "Tarifs d'achat incomplets"}</td></tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Client">
              <p className="font-medium text-charcoal">{o.customerName}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-wood" /><a href={`mailto:${o.customerEmail}`} className="hover:underline">{o.customerEmail}</a></li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-wood" /><a href={`tel:${o.customerPhone.replace(/\s/g, "")}`} className="hover:underline">{o.customerPhone}</a></li>
              </ul>
              {waCustomer && (
                <a href={waCustomer} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1f7a4d] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                  <MessageCircle className="h-4 w-4" /> Écrire au client sur WhatsApp
                </a>
              )}
            </Panel>
            <Panel title="Livraison">
              <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wood" /><span>{o.addressLine}<br />{o.postalCode} {o.city}{o.region ? ` (${o.region})` : ""}<br />{market.names.fr}</span></p>
              {o.deliveryInstructions && <p className="mt-3 rounded-lg bg-cream p-3 text-sm text-charcoal/85">{o.deliveryInstructions}</p>}
              {delivery && (
                <p className="mt-3 text-sm text-stone">
                  Statut : <strong className="text-charcoal">{DELIVERY_LABEL[delivery.status]}</strong>
                  {delivery.scheduledDate ? ` · prévue le ${formatDate(delivery.scheduledDate, "fr-FR")}` : ""}
                </p>
              )}
            </Panel>
          </div>

          <Panel title="Historique">
            <form action={addNoteAction} className="mb-5 flex gap-2">
              <input type="hidden" name="orderId" value={o.id} />
              <input name="note" placeholder="Ajouter une note (appel, message WhatsApp, échange fournisseur…)" className="field h-10 flex-1 text-sm" />
              <SubmitButton variant="secondary">Ajouter</SubmitButton>
            </form>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-wood" />
                  <p className="text-xs text-stone">{formatDateTime(e.createdAt, "fr-FR", tz)}{e.userName ? ` · ${e.userName}` : ""}</p>
                  {e.toStatus && <p className="font-medium text-charcoal">{e.fromStatus ? `${STATUS_LABELS[e.fromStatus].fr} → ` : ""}{STATUS_LABELS[e.toStatus].fr}</p>}
                  {e.note && <p className="text-charcoal/80">{e.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Statut de la commande">
            <form action={changeStatusAction} className="space-y-3">
              <input type="hidden" name="orderId" value={o.id} />
              <Select label="Nouveau statut" name="status" defaultValue={o.status} options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s].fr }))} />
              <Field label="Note (facultatif)" name="note" />
              <SubmitButton>Mettre à jour le statut</SubmitButton>
            </form>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-cream p-3 text-xs leading-relaxed text-stone">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Les statuts « {PAID_STATUSES.map((s) => STATUS_LABELS[s].fr).join(" », « ")} » exigent des virements vérifiés couvrant le montant de la facture pro forma. Le stock est déduit à la confirmation et réintégré en cas d'annulation.
            </p>
          </Panel>

          <Panel title="Facture pro forma (devis)">
            {quotations.length > 0 && (
              <ul className="mb-5 space-y-3">
                {quotations.map((q) => (
                  <li key={q.id} className={`rounded-xl p-3 text-sm ring-1 ${q.status === "cancelled" ? "opacity-60 ring-line" : "ring-pine/30"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium">{q.number}</span>
                      <Badge tone={q.status === "accepted" ? "success" : q.status === "sent" ? "info" : "neutral"}>{QUOTE_LABEL[q.status]}</Badge>
                    </div>
                    <p className="mt-1 text-stone">
                      Produits {money(q.amountCents)} + livraison {money(q.deliveryCents)} + taxes {money(q.taxCents)} = <strong className="text-charcoal">{money(quotationTotal(q))}</strong>
                    </p>
                    {q.validUntil && <p className="text-xs text-stone">Valable jusqu'au {formatDate(q.validUntil, "fr-FR")}</p>}
                    {q.notes && <p className="mt-1 text-xs text-stone">{q.notes}</p>}
                    {q.status !== "cancelled" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["sent", "accepted", "expired"] as const).filter((st) => st !== q.status).map((st) => (
                          <form key={st} action={quotationStatusAction}>
                            <input type="hidden" name="orderId" value={o.id} />
                            <input type="hidden" name="quotationId" value={q.id} />
                            <input type="hidden" name="status" value={st} />
                            <button className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-line hover:bg-cream">Marquer « {QUOTE_LABEL[st]} »</button>
                          </form>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form action={createQuotationAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={o.id} />
              <Field label={`Montant produits (${o.currency})`} name="amount" inputMode="decimal" defaultValue={(o.subtotalCents / 100).toFixed(2)} required />
              <Field label="Livraison" name="delivery" inputMode="decimal" defaultValue="0" />
              <Field label={o.marketId === "fr" ? "Taxes (si non incluses)" : "Taxes"} name="tax" inputMode="decimal" defaultValue="0" hint={o.marketId === "fr" ? "Prix catalogue TTC en France." : "TPS/TVH/TVQ ou sales tax selon l'adresse."} />
              <Field label="Valable jusqu'au" name="validUntil" type="date" min={today} />
              <TextArea label="Notes / conditions" name="notes" className="sm:col-span-2" rows={2} />
              <div className="sm:col-span-2"><SubmitButton>{quotations.length ? "Remplacer par un nouveau devis" : "Créer la facture pro forma"}</SubmitButton></div>
            </form>
          </Panel>

          <Panel title="Paiements">
            <div className="mb-4 rounded-xl bg-cream p-3 text-sm">
              <p>À payer : <strong>{due != null ? money(due) : "devis non créé"}</strong></p>
              <p>Reçu et vérifié : <strong className={due != null && verified >= due ? "text-success" : "text-warning"}>{money(verified)}</strong></p>
            </div>
            {payments.length > 0 && (
              <ul className="mb-5 space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="rounded-xl p-3 text-sm ring-1 ring-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium tabular-nums">{money(p.receivedCents)}</span>
                      <Badge tone={PAYMENT_TONE[p.status]}>{PAYMENT_LABEL[p.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone">
                      {p.transferDate ? `Virement du ${formatDate(p.transferDate, "fr-FR")}` : "Date non renseignée"} · Réf. {p.bankReference || "—"}
                      {p.verifiedByName ? ` · vérifié par ${p.verifiedByName}` : ""}
                    </p>
                    {p.notes && <p className="mt-1 text-xs text-stone">{p.notes}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["verified", "rejected", "refunded"] as const).filter((st) => st !== p.status).map((st) => (
                        <form key={st} action={paymentStatusAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="paymentId" value={p.id} />
                          <input type="hidden" name="status" value={st} />
                          <button className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-line hover:bg-cream">{PAYMENT_LABEL[st]}</button>
                        </form>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form action={recordPaymentAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={o.id} />
              <Field label={`Montant du devis (${o.currency})`} name="expected" inputMode="decimal" defaultValue={due != null ? (due / 100).toFixed(2) : ""} />
              <Field label="Montant reçu" name="received" inputMode="decimal" required />
              <Field label="Date du virement" name="transferDate" type="date" max={today} />
              <Field label="Référence bancaire" name="bankReference" />
              <Select
                label="Statut"
                name="status"
                className="sm:col-span-2"
                defaultValue="awaiting"
                options={[
                  { value: "awaiting", label: "Annoncé par le client — non vérifié" },
                  { value: "verified", label: "Reçu et vérifié sur le compte bancaire" },
                  { value: "rejected", label: "Rejeté" },
                  { value: "refunded", label: "Remboursé" },
                ]}
              />
              <TextArea label="Notes" name="notes" className="sm:col-span-2" rows={2} />
              <div className="sm:col-span-2"><SubmitButton>Enregistrer le paiement</SubmitButton></div>
            </form>
          </Panel>

          <Panel title="Organisation de la livraison">
            <form action={saveDeliveryAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={o.id} />
              <Select label="Statut" name="status" defaultValue={delivery?.status ?? "pending"} options={Object.entries(DELIVERY_LABEL).map(([value, label]) => ({ value, label }))} />
              <Field label="Date prévue" name="scheduledDate" type="date" defaultValue={delivery?.scheduledDate ?? ""} />
              <Field label="Transporteur / chauffeur" name="carrier" defaultValue={delivery?.carrier ?? ""} />
              <Field label="Suivi" name="trackingInfo" defaultValue={delivery?.trackingInfo ?? ""} />
              <TextArea label="Notes" name="notes" className="sm:col-span-2" rows={2} defaultValue={delivery?.notes ?? ""} />
              <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
            </form>
          </Panel>

          <Panel title="Notes internes">
            <form action={saveInternalNotesAction} className="space-y-3">
              <input type="hidden" name="orderId" value={o.id} />
              <textarea name="internalNotes" rows={4} defaultValue={o.internalNotes ?? ""} className="field text-sm" aria-label="Notes internes" />
              <SubmitButton variant="secondary">Enregistrer les notes</SubmitButton>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
