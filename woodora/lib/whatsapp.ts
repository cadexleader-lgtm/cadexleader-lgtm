import type { Lang } from "./markets";

/** Keeps digits only (E.164 without "+"), as required by wa.me links. */
export function whatsappDigits(number: string | null | undefined): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  const digits = whatsappDigits(number);
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export interface PreorderMessageInput {
  lang: Lang;
  reference: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  total: string;
  address: string;
  name: string;
}

/** Pre-filled WhatsApp message sent by the customer to confirm a pre-order (spec §7). */
export function buildPreorderMessage(m: PreorderMessageInput): string {
  const lines =
    m.lang === "fr"
      ? [
          "Bonjour, je souhaite confirmer ma précommande.",
          "",
          `Référence : ${m.reference}`,
          ...m.items.map((i) => `Produit : ${i.name} — Quantité : ${i.quantity} ${i.unit}`),
          `Montant estimé : ${m.total}`,
          `Adresse de livraison : ${m.address}`,
          "",
          "Merci de me transmettre une facture pro forma.",
          m.name,
        ]
      : [
          "Hello, I would like to confirm my pre-order.",
          "",
          `Reference: ${m.reference}`,
          ...m.items.map((i) => `Product: ${i.name} — Quantity: ${i.quantity} ${i.unit}`),
          `Estimated amount: ${m.total}`,
          `Delivery address: ${m.address}`,
          "",
          "Please send me a pro forma invoice.",
          m.name,
        ];
  return lines.join("\n");
}
