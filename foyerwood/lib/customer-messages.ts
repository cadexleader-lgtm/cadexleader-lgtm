// Messages sent to the customer while an order progresses. The same wording is
// used for WhatsApp, SMS and the automatic e-mails, so the customer always reads
// the same thing whatever the channel.
import type { Order } from "./data/orders";
import type { OrderStatus } from "./order-status";
import { formatMoney } from "./format";
import { routePath, siteFor } from "./sites";
import { siteUrl } from "./site-url";

export type OrderStage = "received" | "pay" | "paid" | "shipping" | "delivered" | "cancelled";

export function stageOf(status: OrderStatus): OrderStage {
  switch (status) {
    case "quote_sent":
    case "awaiting_payment":
      return "pay";
    case "payment_received":
    case "confirmed":
      return "paid";
    case "preparing_delivery":
    case "in_delivery":
      return "shipping";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "received";
  }
}

export function orderLocale(o: Pick<Order, "marketId" | "language">): string {
  if (o.marketId === "fr") return "fr-FR";
  if (o.marketId === "us") return "en-US";
  return o.language === "en" ? "en-CA" : "fr-CA";
}

/** Private page where the customer follows the order (and finds how to pay). */
export function orderPagePath(o: Pick<Order, "marketId" | "language" | "reference" | "accessToken">): string {
  const site = siteFor(o.marketId, o.language);
  return `${routePath(site, "preorder", "confirmation", o.reference)}?t=${encodeURIComponent(o.accessToken)}`;
}

export function orderPageUrl(o: Pick<Order, "marketId" | "language" | "reference" | "accessToken">): string {
  return `${siteUrl()}${orderPagePath(o)}`;
}

export interface StageMessage {
  subject: string;
  /** Short text for WhatsApp / SMS (link included). */
  short: string;
  /** Paragraphs for the e-mail body (the link is added as a button). */
  paragraphs: string[];
  /** Label of the e-mail button. */
  cta: string;
}

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

const TXT = {
  fr: {
    hello: "Bonjour {first},",
    received: {
      subject: "Précommande {ref} bien reçue",
      body: "Nous avons bien reçu votre précommande {ref} ({amount}). Nous vérifions la disponibilité et revenons vers vous très vite.",
      body2: "Rien à payer pour l'instant : vous paierez seulement après notre confirmation.",
      cta: "Suivre ma commande",
    },
    pay: {
      subject: "Commande {ref} confirmée : vous pouvez payer",
      body: "Bonne nouvelle : votre commande {ref} est confirmée et le bois est disponible.",
      body2: "Montant à régler : {amount}, par virement bancaire, avec la référence {pf}. Les coordonnées bancaires et votre facture pro forma sont sur votre page de commande.",
      body3: "Merci de nous prévenir une fois le virement effectué : nous lançons alors la livraison.",
      cta: "Voir ma commande et payer",
    },
    paid: {
      subject: "Paiement reçu pour la commande {ref}",
      body: "Merci ! Nous avons bien reçu votre paiement pour la commande {ref}.",
      body2: "Nous organisons la livraison et revenons vers vous pour convenir de la date.",
      cta: "Suivre ma commande",
    },
    shipping: {
      subject: "Votre commande {ref} est en route",
      body: "Votre commande {ref} est en cours de livraison : nous préparons son acheminement jusqu'à chez vous.",
      body2: "Nous vous contactons si besoin pour l'accès ou l'horaire.",
      cta: "Suivre ma commande",
    },
    delivered: {
      subject: "Commande {ref} livrée",
      body: "Votre commande {ref} a été livrée. Merci de votre confiance, et bonnes flambées !",
      body2: "Une question ou un souci ? Répondez simplement à ce message.",
      cta: "Voir ma commande",
    },
    cancelled: {
      subject: "Commande {ref} annulée",
      body: "Votre commande {ref} a été annulée.",
      body2: "Pour toute question, répondez simplement à ce message.",
      cta: "Voir ma commande",
    },
    link: "Votre commande : {url}",
    sign: "L'équipe {brand}",
  },
  en: {
    hello: "Hello {first},",
    received: {
      subject: "Pre-order {ref} received",
      body: "We have received your pre-order {ref} ({amount}). We are checking availability and will get back to you very soon.",
      body2: "Nothing to pay for now: you only pay after our confirmation.",
      cta: "Track my order",
    },
    pay: {
      subject: "Order {ref} confirmed: you can now pay",
      body: "Good news: your order {ref} is confirmed and the wood is available.",
      body2: "Amount due: {amount}, by bank transfer, with the reference {pf}. Our bank details and your pro forma invoice are on your order page.",
      body3: "Please let us know once the transfer is done: we will then schedule the delivery.",
      cta: "View my order and pay",
    },
    paid: {
      subject: "Payment received for order {ref}",
      body: "Thank you! We have received your payment for order {ref}.",
      body2: "We are organising the delivery and will contact you to agree on a date.",
      cta: "Track my order",
    },
    shipping: {
      subject: "Your order {ref} is on its way",
      body: "Your order {ref} is out for delivery: we are bringing it to your door.",
      body2: "We will contact you if needed about access or timing.",
      cta: "Track my order",
    },
    delivered: {
      subject: "Order {ref} delivered",
      body: "Your order {ref} has been delivered. Thank you for your trust — enjoy the fire!",
      body2: "Any question or issue? Just reply to this message.",
      cta: "View my order",
    },
    cancelled: {
      subject: "Order {ref} cancelled",
      body: "Your order {ref} has been cancelled.",
      body2: "For any question, just reply to this message.",
      cta: "View my order",
    },
    link: "Your order: {url}",
    sign: "The {brand} team",
  },
} as const;

export function stageMessage(
  o: Pick<Order, "marketId" | "language" | "reference" | "accessToken" | "customerName" | "currency">,
  stage: OrderStage,
  opts: { amountCents: number; proformaNumber: string | null; brand: string },
): StageMessage {
  const t = TXT[o.language === "en" ? "en" : "fr"];
  const s = t[stage];
  const first = o.customerName.trim().split(/\s+/)[0] ?? o.customerName;
  const v = {
    first,
    ref: o.reference,
    amount: formatMoney(opts.amountCents, o.currency, orderLocale(o)),
    pf: opts.proformaNumber ?? o.reference,
    brand: opts.brand,
    url: orderPageUrl(o),
  };
  const paragraphs = [s.body, s.body2, ...("body3" in s ? [s.body3] : [])].map((p) => fill(p, v));
  return {
    subject: fill(s.subject, v),
    short: [fill(t.hello, v), "", ...paragraphs, "", fill(t.link, v), "", fill(t.sign, v)].join("\n"),
    paragraphs: [fill(t.hello, v), ...paragraphs],
    cta: s.cta,
  };
}

/** SMS link that works on iOS and Android. */
export function smsLink(phone: string | null | undefined, body: string): string | null {
  const n = (phone ?? "").replace(/[^\d+]/g, "");
  if (n.replace(/\D/g, "").length < 8) return null;
  return `sms:${n}?&body=${encodeURIComponent(body)}`;
}
