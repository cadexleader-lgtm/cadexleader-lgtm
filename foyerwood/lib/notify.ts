import "server-only";
import { getOrderDetail, quotationTotal, orderProductsTotal, type OrderDetail } from "./data/orders";
import { getMarketSettings, getSetting } from "./data/settings";
import { query } from "./db/client";
import { brandedEmail, mailConfigured, sendMail } from "./mailer";
import { orderLocale, orderPageUrl, stageMessage, type OrderStage } from "./customer-messages";
import { formatMoney } from "./format";
import { siteUrl } from "./site-url";

/** Amount and pro forma number the customer is told about. */
export function amountFor(d: Pick<OrderDetail, "order" | "quotations">): { amountCents: number; proformaNumber: string | null } {
  const q = d.quotations.find((x) => x.status !== "cancelled");
  return { amountCents: q ? quotationTotal(q) : orderProductsTotal(d.order), proformaNumber: q?.number ?? null };
}

async function logEvent(orderId: string, note: string) {
  await query(`insert into order_events (order_id, note) values ($1, $2)`, [orderId, note]);
}

const STAGE_FR: Record<OrderStage, string> = {
  received: "précommande reçue",
  pay: "commande confirmée, paiement attendu",
  paid: "paiement reçu",
  shipping: "livraison en cours",
  delivered: "commande livrée",
  cancelled: "commande annulée",
};

/** E-mails the customer about the current stage of the order (no-op when SMTP is not configured). */
export async function emailCustomerStage(orderId: string, stage: OrderStage): Promise<boolean> {
  if (!mailConfigured()) return false;
  const d = await getOrderDetail(orderId);
  if (!d) return false;
  const [company, market] = await Promise.all([getSetting("company"), getMarketSettings(d.order.marketId)]);
  const brand = company.tradeName || "Foyerwood";
  const { amountCents, proformaNumber } = amountFor(d);
  const msg = stageMessage(d.order, stage, { amountCents, proformaNumber, brand });
  const en = d.order.language === "en";
  const facts: Array<[string, string]> = [[en ? "Order" : "Commande", d.order.reference]];
  if (stage === "received" || stage === "pay") facts.push([en ? "Amount" : "Montant", formatMoney(amountCents, d.order.currency, orderLocale(d.order))]);
  if (stage === "pay" && proformaNumber) facts.push([en ? "Transfer reference" : "Référence du virement", proformaNumber]);
  const url = orderPageUrl(d.order);
  const footer = [brand, market.contactPhone, market.contactEmail].filter(Boolean).join(" · ");
  const res = await sendMail({
    to: d.order.customerEmail,
    subject: msg.subject,
    text: `${msg.paragraphs.join("\n\n")}\n\n${msg.cta} : ${url}\n\n${footer}`,
    html: brandedEmail({ brand, paragraphs: msg.paragraphs, facts, button: { label: msg.cta, url }, footer }),
    replyTo: market.contactEmail || company.email || null,
    fromName: brand,
  });
  await logEvent(
    orderId,
    res.ok
      ? `E-mail automatique envoyé au client (${STAGE_FR[stage]}).`
      : `Échec de l'e-mail automatique au client (${STAGE_FR[stage]}) : ${res.error}`,
  );
  return res.ok;
}

/** Tells the shop that a new pre-order arrived (no-op when SMTP is not configured). */
export async function emailShopNewOrder(orderId: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const d = await getOrderDetail(orderId);
  if (!d) return false;
  const [company, market] = await Promise.all([getSetting("company"), getMarketSettings(d.order.marketId)]);
  const to = market.contactEmail || company.email;
  if (!to) return false;
  const o = d.order;
  const money = (c: number) => formatMoney(c, o.currency, orderLocale(o));
  const { amountCents, proformaNumber } = amountFor(d);
  const lines = d.items.map((i) => `${i.quantity} × ${i.productName}${i.isGift ? "" : ` — ${money(i.lineTotalCents)}`}`);
  const contact = [o.customerName, o.customerEmail, o.customerPhone, o.customerWhatsapp ? `WhatsApp : ${o.customerWhatsapp}` : null, `${o.addressLine}, ${o.postalCode} ${o.city}`]
    .filter(Boolean)
    .join("\n");
  const adminUrl = `${siteUrl()}/admin/orders/${o.id}`;
  const res = await sendMail({
    to,
    subject: `Nouvelle précommande ${o.reference} — ${o.customerName} — ${money(amountCents)}`,
    text: `Nouvelle précommande ${o.reference}\n\n${lines.join("\n")}\nTotal : ${money(amountCents)}${proformaNumber ? ` (pro forma ${proformaNumber})` : ""}\n\nClient :\n${contact}\n\nOuvrir dans l'admin : ${adminUrl}`,
    html: brandedEmail({
      brand: company.tradeName || "Foyerwood",
      paragraphs: [`Nouvelle précommande ${o.reference}.`, lines.join("\n"), `Client :\n${contact}`],
      facts: [["Total", money(amountCents)], ...(proformaNumber ? ([["Pro forma", proformaNumber]] as Array<[string, string]>) : [])],
      button: { label: "Ouvrir dans l'admin", url: adminUrl },
    }),
    replyTo: o.customerEmail,
    fromName: company.tradeName || "Foyerwood",
  });
  if (!res.ok) await logEvent(orderId, `Échec de l'e-mail d'alerte à la boutique : ${res.error}`);
  return res.ok;
}
