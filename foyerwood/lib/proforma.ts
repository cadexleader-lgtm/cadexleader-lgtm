import { getSetting, getMarketSettings } from "./data/settings";
import type { ProformaData } from "./data/orders";
import { legalPath, siteFor } from "./sites";
import { siteUrl } from "./site-url";
import { formatMoney } from "./format";
import { proformaLocale } from "@/components/proforma/ProformaDocument";

/** Everything the pro forma document needs besides the order itself. */
export async function proformaContext(d: ProformaData) {
  const [company, billingAll, market] = await Promise.all([getSetting("company"), getSetting("billing"), getMarketSettings(d.order.marketId)]);
  const site = siteFor(d.order.marketId, d.order.language);
  const base = siteUrl();
  return {
    company,
    billing: billingAll[d.order.marketId],
    market,
    termsUrl: `${base}${legalPath(site, "terms")}`,
    publicUrl: `${base}/documents/proforma/${encodeURIComponent(d.quotation.number)}?t=${encodeURIComponent(d.order.accessToken)}`,
  };
}

export function proformaMessage(d: ProformaData, url: string, tradeName: string): { subject: string; body: string } {
  const total = formatMoney(d.quotation.amountCents + d.quotation.deliveryCents + d.quotation.taxCents, d.quotation.currency, proformaLocale(d.order));
  const first = d.order.customerName.split(/\s+/)[0] ?? d.order.customerName;
  if (d.order.language === "en") {
    return {
      subject: `Pro forma invoice ${d.quotation.number} — ${tradeName}`,
      body: [
        `Hello ${first},`,
        "",
        `Here is your pro forma invoice ${d.quotation.number} for pre-order ${d.order.reference}:`,
        url,
        "",
        `Amount due: ${total}, by bank transfer (reference: ${d.quotation.number}).`,
        "Your order is confirmed as soon as the payment is received.",
        "",
        "Thank you!",
        tradeName,
      ].join("\n"),
    };
  }
  return {
    subject: `Facture pro forma ${d.quotation.number} — ${tradeName}`,
    body: [
      `Bonjour ${first},`,
      "",
      `Voici votre facture pro forma ${d.quotation.number} pour la précommande ${d.order.reference} :`,
      url,
      "",
      `Montant à régler : ${total}, par virement (référence : ${d.quotation.number}).`,
      "Votre commande est confirmée dès réception du paiement.",
      "",
      "Merci de votre confiance !",
      tradeName,
    ].join("\n"),
  };
}
