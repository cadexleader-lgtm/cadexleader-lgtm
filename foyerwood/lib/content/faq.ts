import type { Lang, MarketId } from "../markets";

export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

interface Ctx {
  freeFrom: string | null; // formatted amount or null
  currency: string;
}

export function faqFor(market: MarketId, lang: Lang, ctx: Ctx): FaqGroup[] {
  const fr = lang === "fr";
  const free = ctx.freeFrom
    ? fr
      ? `La livraison est gratuite dans nos zones desservies dès ${ctx.freeFrom} de commande. En dessous de ce montant, ou pour une adresse nécessitant un accès particulier, les frais éventuels figurent clairement sur votre facture pro forma, avant tout paiement.`
      : `Delivery is free in our service areas for orders from ${ctx.freeFrom}. Below that amount, or for an address with special access requirements, any fee is shown clearly on your pro forma invoice, before any payment.`
    : fr
      ? "La livraison est gratuite dans nos zones desservies. Toute condition particulière figure sur votre facture pro forma, avant tout paiement."
      : "Delivery is free in our service areas. Any special condition is shown on your pro forma invoice, before any payment.";

  const units: Record<MarketId, FaqItem> = {
    fr: {
      q: "Quelle différence entre un stère et un mètre cube ?",
      a: "Le stère correspond à 1 m³ de bûches de 1 m empilées. Le mètre cube apparent correspond à 1 m³ de bûches courtes (25 à 50 cm) rangées. Une fois recoupées, les bûches d'un stère occupent moins de place : ces deux unités ne sont donc pas équivalentes. Chaque fiche produit précise l'unité de vente, la longueur des bûches et le contenu réel d'une unité.",
    },
    ca: fr
      ? {
          q: "Corde complète, demi-corde, face cord : que vais-je recevoir ?",
          a: "Une corde complète mesure 4 × 4 × 8 pi (128 pi³). Au Québec, on appelle souvent « corde » une rangée de 4 × 8 pi de bûches de 16 po : c'est une face cord, soit environ un tiers de corde complète. Pour éviter toute confusion, chaque fiche produit indique le volume exact en pieds cubes et en mètres cubes.",
        }
      : {
          q: "Full cord, half cord, face cord: what will I receive?",
          a: "A full cord measures 4 × 4 × 8 ft (128 ft³). A face cord is one row 4 × 8 ft of logs — with 16-inch logs, about one third of a full cord (in Québec it is often simply called a “cord”). To avoid any confusion, every product page states the exact volume in cubic feet and cubic metres.",
        },
    us: {
      q: "Full cord, face cord, rick: what will I receive?",
      a: "A full cord measures 4 × 4 × 8 ft (128 ft³) of stacked wood. A face cord or rick is a single row 4 ft high and 8 ft long; its volume depends on the log length (with 16-inch logs, about one third of a full cord). Words vary by region, so every product page states the exact volume in cubic feet.",
    },
  };

  const taxes: Record<MarketId, FaqItem> = {
    fr: {
      q: "Les prix incluent-ils la TVA ?",
      a: "Oui, les prix affichés sont TTC. La TVA est de 10 % sur les combustibles bois (bûches, granulés, bûches compressées) et de 20 % sur les accessoires. Le détail figure sur votre facture pro forma.",
    },
    ca: fr
      ? {
          q: "Les taxes sont-elles incluses ?",
          a: "Les prix sont affichés avant taxes. La TPS/TVH et, au Québec, la TVQ s'appliquent selon votre province de livraison ; leur montant exact figure sur la facture pro forma.",
        }
      : {
          q: "Are taxes included?",
          a: "Prices are shown before tax. GST/HST and, in Québec, QST apply according to your delivery province; the exact amounts appear on your pro forma invoice.",
        },
    us: {
      q: "Is sales tax included?",
      a: "No. Prices exclude sales tax, which depends on your state and local rules. The exact amount appears on your pro forma invoice before any payment.",
    },
  };

  if (fr) {
    return [
      {
        title: "Précommande et paiement",
        items: [
          {
            q: "Comment fonctionne la précommande ?",
            a: "Vous composez votre précommande sur le site et l'envoyez avec vos coordonnées. Vous recevez une référence unique et un message WhatsApp prérempli. Un conseiller vérifie la disponibilité auprès de notre fournisseur partenaire, puis vous transmet une facture pro forma avec le montant final et les coordonnées bancaires.",
          },
          {
            q: "Dois-je payer en ligne ?",
            a: "Non. Aucun paiement n'est demandé sur le site. Vous réglez par virement bancaire après réception de la facture pro forma. Votre commande n'est confirmée qu'après réception effective et vérification de votre virement sur notre compte.",
          },
          {
            q: "Comment être sûr de payer le bon destinataire ?",
            a: "Les coordonnées bancaires figurent uniquement sur la facture pro forma liée à votre référence. Nous ne vous demanderons jamais de payer par un autre moyen ni sur un autre compte. En cas de doute, contactez-nous avant tout virement.",
          },
          {
            q: "Puis-je modifier ou annuler ma précommande ?",
            a: "Oui, sans frais tant que vous n'avez pas réglé la facture pro forma : il suffit de nous écrire en indiquant votre référence. Après paiement, les conditions de la politique d'annulation s'appliquent.",
          },
          taxes[market],
        ],
      },
      {
        title: "Produits et quantités",
        items: [
          units[market],
          {
            q: "Quelle humidité pour un bon bois de chauffage ?",
            a: "Un bois prêt à brûler affiche moins de 20 à 25 % d'humidité. Le bois séché au four descend généralement sous 18 %. Chaque fiche indique l'humidité visée par notre fournisseur ; un humidimètre permet de la vérifier en quelques secondes.",
          },
          {
            q: "Quelle quantité dois-je commander ?",
            a: "Utilisez notre calculateur : à partir de votre code postal, de la surface, de l'isolation, de l'appareil et de la durée de chauffe, il estime une fourchette de consommation et vous suggère des produits et quantités adaptés.",
          },
          {
            q: "Les photos sont-elles contractuelles ?",
            a: "Les caractéristiques (essence, longueur, humidité visée, volume ou poids) sont décrites précisément sur chaque fiche. Le bois étant un produit naturel, l'aspect des bûches peut varier d'une livraison à l'autre.",
          },
        ],
      },
      {
        title: "Livraison",
        items: [
          { q: "La livraison est-elle vraiment gratuite ?", a: free },
          {
            q: "Quels sont les délais ?",
            a: "Le délai dépend de votre zone et de la saison ; il est indiqué lors de la vérification de votre adresse et confirmé sur la facture pro forma. La date de livraison est convenue avec vous après confirmation du paiement.",
          },
          {
            q: "Qui effectue la livraison ?",
            a: "La livraison est assurée par notre fournisseur partenaire local. Foyerwood ne possède pas d'entrepôts : nous sélectionnons les fournisseurs, vérifions les commandes et vous accompagnons jusqu'à la livraison.",
          },
          {
            q: "Mon adresse n'est pas desservie, que faire ?",
            a: "Le site vous indique avant l'envoi de la précommande si votre adresse est hors zone. Contactez-nous : nous étendons progressivement nos zones de livraison.",
          },
        ],
      },
      {
        title: "Avis et données",
        items: [
          {
            q: "Les avis clients sont-ils vérifiés ?",
            a: "Oui. Seuls les clients dont la commande a été livrée peuvent laisser un avis, à partir de leur référence de commande. Chaque avis est relu avant publication. Nous ne publions aucun faux avis.",
          },
          {
            q: "Que faites-vous de mes données ?",
            a: "Vos coordonnées servent uniquement à traiter votre précommande, organiser la livraison et, si vous l'avez demandé, à vous envoyer notre newsletter. Elles sont transmises à notre fournisseur partenaire uniquement pour la livraison. Consultez notre politique de confidentialité pour le détail.",
          },
        ],
      },
    ];
  }

  return [
    {
      title: "Pre-orders and payment",
      items: [
        {
          q: "How does pre-ordering work?",
          a: "You build your pre-order on the site and send it with your details. You get a unique reference and a pre-filled WhatsApp message. An advisor checks availability with our partner supplier, then sends you a pro forma invoice with the final amount and bank details.",
        },
        {
          q: "Do I pay online?",
          a: "No. No payment is taken on the site. You pay by bank transfer after receiving the pro forma invoice. Your order is only confirmed once your transfer has actually been received and verified on our account.",
        },
        {
          q: "How can I be sure I'm paying the right recipient?",
          a: "Bank details appear only on the pro forma invoice linked to your reference. We will never ask you to pay by another method or to another account. If in doubt, contact us before making any transfer.",
        },
        {
          q: "Can I change or cancel my pre-order?",
          a: "Yes, at no cost as long as you have not paid the pro forma invoice — just message us with your reference. After payment, the cancellation policy applies.",
        },
        taxes[market],
      ],
    },
    {
      title: "Products and quantities",
      items: [
        units[market],
        {
          q: "What moisture content should good firewood have?",
          a: "Ready-to-burn wood is below 20–25% moisture. Kiln-dried wood is usually below 18%. Every product page shows the target moisture announced by our supplier; a moisture meter checks it in seconds.",
        },
        {
          q: "How much should I order?",
          a: "Use our calculator: from your ZIP or postal code, floor area, insulation, appliance and heating period, it estimates a consumption range and suggests matching products and quantities.",
        },
        {
          q: "Are the pictures binding?",
          a: "Specifications (species, log length, target moisture, volume or weight) are described precisely on each product page. Wood being a natural product, the look of the logs may vary from one delivery to another.",
        },
      ],
    },
    {
      title: "Delivery",
      items: [
        { q: "Is delivery really free?", a: free },
        {
          q: "How long does delivery take?",
          a: "Lead time depends on your area and the season; it is shown when your address is checked and confirmed on the pro forma invoice. The delivery date is agreed with you after payment confirmation.",
        },
        {
          q: "Who delivers?",
          a: "Delivery is handled by our local partner supplier. Foyerwood does not own warehouses: we select suppliers, check orders and guide you until delivery.",
        },
        {
          q: "My address is not served — what can I do?",
          a: "The site tells you before you send your pre-order if your address is outside our areas. Contact us: we are gradually expanding our delivery areas.",
        },
      ],
    },
    {
      title: "Reviews and data",
      items: [
        {
          q: "Are customer reviews verified?",
          a: "Yes. Only customers whose order was delivered can leave a review, using their order reference. Each review is checked before publication. We never publish fake reviews.",
        },
        {
          q: "What do you do with my data?",
          a: "Your details are only used to process your pre-order, organize delivery and, if you asked for it, send our newsletter. They are shared with our partner supplier only for delivery. See our privacy policy for details.",
        },
      ],
    },
  ];
}
