import type { Lang } from "./markets";

export const ORDER_STATUSES = [
  "new",
  "verifying",
  "quote_to_prepare",
  "quote_sent",
  "awaiting_payment",
  "payment_received",
  "confirmed",
  "preparing_delivery",
  "in_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABELS: Record<OrderStatus, Record<Lang, string>> = {
  new: { fr: "Nouvelle précommande", en: "New pre-order" },
  verifying: { fr: "En cours de vérification", en: "Being verified" },
  quote_to_prepare: { fr: "Devis à préparer", en: "Quote to prepare" },
  quote_sent: { fr: "Devis envoyé", en: "Quote sent" },
  awaiting_payment: { fr: "En attente de paiement", en: "Awaiting payment" },
  payment_received: { fr: "Paiement reçu", en: "Payment received" },
  confirmed: { fr: "Commande confirmée", en: "Order confirmed" },
  preparing_delivery: { fr: "Livraison en préparation", en: "Preparing delivery" },
  in_delivery: { fr: "En cours de livraison", en: "Out for delivery" },
  delivered: { fr: "Livrée", en: "Delivered" },
  cancelled: { fr: "Annulée", en: "Cancelled" },
};

/** Statuses that require the payment to be verified by an administrator. */
export const PAID_STATUSES: OrderStatus[] = ["payment_received", "confirmed", "preparing_delivery", "in_delivery", "delivered"];

export function isPaidStatus(s: OrderStatus): boolean {
  return PAID_STATUSES.includes(s);
}

/** Customer-facing timeline (simplified, used by order tracking). */
export const CUSTOMER_STEPS: Array<{ key: string; statuses: OrderStatus[]; label: Record<Lang, string> }> = [
  { key: "received", statuses: ["new", "verifying", "quote_to_prepare"], label: { fr: "Précommande reçue", en: "Pre-order received" } },
  { key: "quote", statuses: ["quote_sent", "awaiting_payment"], label: { fr: "Facture pro forma envoyée", en: "Pro forma invoice sent" } },
  { key: "paid", statuses: ["payment_received", "confirmed"], label: { fr: "Paiement vérifié, commande confirmée", en: "Payment verified, order confirmed" } },
  { key: "shipping", statuses: ["preparing_delivery", "in_delivery"], label: { fr: "Livraison en cours", en: "Delivery in progress" } },
  { key: "delivered", statuses: ["delivered"], label: { fr: "Livrée", en: "Delivered" } },
];

export function customerStepIndex(status: OrderStatus): number {
  return CUSTOMER_STEPS.findIndex((s) => s.statuses.includes(status));
}

export const STATUS_TONE: Record<OrderStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  new: "info",
  verifying: "info",
  quote_to_prepare: "warning",
  quote_sent: "neutral",
  awaiting_payment: "warning",
  payment_received: "success",
  confirmed: "success",
  preparing_delivery: "neutral",
  in_delivery: "info",
  delivered: "success",
  cancelled: "danger",
};
