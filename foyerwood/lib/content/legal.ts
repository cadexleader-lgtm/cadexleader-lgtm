// Legal and policy pages. These texts are a solid starting point written for
// the pre-order model; they must be reviewed by a legal professional in each
// country before launch. Company details come from the administration
// (Settings → Company).

import type { Lang, MarketId } from "../markets";
import type { LegalDoc } from "../sites";
import type { CompanySettings } from "../data/settings";

export interface LegalCtx {
  company: CompanySettings;
  contactEmail: string | null;
  whatsapp: string | null;
  freeFrom: string | null;
  missing: string;
}

export const LEGAL_UPDATED = "2026-11-01";

const v = (value: string | null | undefined, missing: string) => (value && value.trim() ? value.trim() : `*${missing}*`);

export function legalDoc(doc: LegalDoc, market: MarketId, lang: Lang, c: LegalCtx): { title: string; body: string } {
  const fr = lang === "fr";
  const co = c.company;
  const name = v(co.legalName || co.tradeName, c.missing);
  const contact = [c.contactEmail || co.email ? `${fr ? "e-mail" : "email"} : ${c.contactEmail || co.email}` : null, c.whatsapp ? `WhatsApp : ${c.whatsapp}` : null]
    .filter(Boolean)
    .join(" · ") || `*${c.missing}*`;
  const fn = fr ? FR : EN;
  return fn[doc]({ market, name, contact, co, c });
}

type Args = { market: MarketId; name: string; contact: string; co: CompanySettings; c: LegalCtx };

const consumerLawFr: Record<MarketId, string> = {
  fr: "le Code de la consommation et le Code civil français",
  ca: "la Loi sur la protection du consommateur de votre province (au Québec, la Loi sur la protection du consommateur, RLRQ c. P-40.1)",
  us: "les lois de protection des consommateurs de votre État",
};
const consumerLawEn: Record<MarketId, string> = {
  fr: "the French Consumer Code and Civil Code",
  ca: "the consumer protection legislation of your province (in Québec, the Consumer Protection Act, CQLR c. P-40.1)",
  us: "the consumer protection laws of your state",
};

const FR: Record<LegalDoc, (a: Args) => { title: string; body: string }> = {
  terms: ({ market, name, contact }) => ({
    title: "Conditions générales de vente",
    body: `## 1. Objet

Les présentes conditions régissent les ventes de bois de chauffage, combustibles et accessoires proposées par **${name}** (« Foyerwood ») sur ce site, pour des livraisons ${market === "fr" ? "en France métropolitaine" : market === "ca" ? "au Canada" : "aux États-Unis"}. Contact : ${contact}.

## 2. Un modèle de précommande

L'envoi d'une précommande sur le site **ne constitue pas un achat et n'entraîne aucun paiement**. Il s'agit d'une demande que nous vérifions (disponibilité, adresse, délai) avant de vous adresser une **facture pro forma**. Le contrat de vente est formé lorsque vous acceptez cette facture pro forma et que votre paiement est **reçu et vérifié** sur notre compte.

## 3. Produits et quantités

Chaque fiche produit précise l'essence, l'humidité visée, la longueur des bûches, l'unité de vente et le contenu réel d'une unité (volume ou poids). Le bois est un produit naturel : son aspect peut varier. Les volumes de bois sont mesurés empilés, selon la définition de l'unité indiquée sur la fiche.

## 4. Prix

Les prix sont indiqués en ${market === "fr" ? "euros, toutes taxes comprises (TVA à 10 % sur les combustibles bois, 20 % sur les accessoires)" : market === "ca" ? "dollars canadiens, avant taxes (TPS/TVH et TVQ selon la province)" : "dollars américains, hors taxe de vente (selon l'État)"}. Le prix applicable est celui de la facture pro forma, valable pendant la durée qui y est indiquée.

## 5. Paiement

Le paiement s'effectue par **virement bancaire** sur le compte indiqué dans la facture pro forma. Une commande n'est jamais considérée comme payée sur simple déclaration : elle l'est uniquement après réception et vérification des fonds. Foyerwood ne vous demandera jamais de payer par un autre moyen ou sur un autre compte.

## 6. Livraison

La livraison est effectuée par notre fournisseur partenaire local, dans les zones desservies, selon la [politique de livraison](./politique-de-livraison). Elle est gratuite dans les conditions affichées sur le site et rappelées sur la facture pro forma.

## 7. Annulation${market === "fr" ? " et droit de rétractation" : ""}

Vous pouvez annuler sans frais votre précommande tant que la facture pro forma n'est pas réglée. ${market === "fr" ? "Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de **14 jours** à compter de la livraison pour exercer votre droit de rétractation, sans avoir à motiver votre décision ; les frais de reprise des marchandises restent à votre charge. " : ""}Voir la [politique d'annulation](./politique-d-annulation).

## 8. Conformité et réclamations

Vérifiez votre livraison en présence du chauffeur. Toute réclamation est traitée selon la page [retours et réclamations](./retours-et-reclamations), sans préjudice des garanties légales prévues par ${consumerLawFr[market]}.${market === "fr" ? " Vous bénéficiez notamment de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil)." : ""}

## 9. Données personnelles

Vos données sont traitées conformément à notre [politique de confidentialité](./politique-de-confidentialite).

## 10. Litiges

En cas de difficulté, contactez-nous d'abord : nous recherchons toujours une solution amiable.${market === "fr" ? " Vous pouvez également recourir gratuitement au médiateur de la consommation dont les coordonnées figurent dans les mentions légales (article L612-1 du Code de la consommation)." : ""} Les présentes conditions sont soumises au droit ${market === "fr" ? "français" : market === "ca" ? "applicable dans votre province de résidence" : "de l'État de livraison"}, sans priver le consommateur de la protection des dispositions impératives de sa loi de résidence.`,
  }),

  privacy: ({ market, name, contact }) => ({
    title: "Politique de confidentialité",
    body: `## Responsable du traitement

**${name}** — ${contact}.${market === "ca" ? " Responsable de la protection des renseignements personnels : joignable à la même adresse." : ""}

## Données collectées

- **Précommande** : nom, e-mail, téléphone, adresse de livraison, instructions, produits et quantités.
- **Calculateur** : réponses au questionnaire et uniquement les 3 premiers caractères du code postal, sans donnée d'identification.
- **Newsletter** : adresse e-mail, si vous vous inscrivez.
- **Contact et avis** : informations que vous nous transmettez.

## Finalités ${market === "fr" ? "et bases légales" : ""}

- Traiter votre précommande, établir la facture pro forma et organiser la livraison${market === "fr" ? " (exécution du contrat)" : ""}.
- Vous contacter par WhatsApp, téléphone ou e-mail au sujet de votre commande${market === "fr" ? " (exécution du contrat)" : ""}.
- Respecter nos obligations comptables et fiscales${market === "fr" ? " (obligation légale)" : ""}.
- Vous envoyer la newsletter${market === "fr" ? " (consentement, retirable à tout moment)" : ", avec votre consentement"}.
- Améliorer nos estimations à partir de statistiques anonymes du calculateur${market === "fr" ? " (intérêt légitime)" : ""}.

## Destinataires

- Notre **fournisseur partenaire** du pays de livraison, uniquement pour préparer et livrer votre commande.
- Nos prestataires techniques : hébergement du site (Vercel) et base de données (Supabase), liés par des engagements de confidentialité.
- **WhatsApp (Meta)** lorsque vous choisissez d'échanger avec nous par cette messagerie.

Nous ne vendons jamais vos données.${market === "fr" ? " Lorsque des données sont traitées hors de l'Union européenne, ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne." : ""}

## Durées de conservation

- Données de commande : ${market === "fr" ? "10 ans (obligations comptables)" : "pendant la durée exigée par les obligations comptables et fiscales applicables"}.
- Données de prospect et de contact : 3 ans après le dernier échange.
- Newsletter : jusqu'à votre désinscription.

## Cookies et stockage local

Le site n'utilise **aucun cookie publicitaire ni de mesure d'audience tiers**. Il enregistre uniquement votre choix de pays (cookie technique) et le contenu de votre précommande dans votre navigateur (stockage local).

## Vos droits

Vous pouvez demander l'accès, la rectification, l'effacement de vos données, vous opposer à leur traitement ou retirer votre consentement en nous écrivant (${contact}).${market === "fr" ? " Vous disposez aussi des droits à la limitation et à la portabilité, et pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr)." : market === "ca" ? " Vous pouvez également vous adresser au Commissariat à la protection de la vie privée du Canada ou, au Québec, à la Commission d'accès à l'information." : ""}`,
  }),

  shipping: ({ market, c }) => ({
    title: "Politique de livraison",
    body: `## Zones desservies

Nous livrons dans les zones couvertes par notre fournisseur partenaire ${market === "fr" ? "en France" : market === "ca" ? "au Canada" : "aux États-Unis"}. La liste des ${market === "fr" ? "départements" : market === "ca" ? "provinces" : "États"} desservis et des secteurs exclus est publiée sur la page Livraison, et le site vérifie votre code postal **avant** l'envoi de la précommande.

## Livraison gratuite

${c.freeFrom ? `La livraison est gratuite dès **${c.freeFrom}** de commande dans les zones desservies.` : "La livraison est gratuite dans les zones desservies."} Pour une commande inférieure à ce montant, une zone éloignée ou un accès particulier, les éventuels frais sont indiqués sur la facture pro forma, avant tout paiement.

## Délais

Le délai indicatif est affiché lors de la vérification de votre adresse. La date de livraison est convenue avec vous après confirmation du paiement. Les périodes de forte demande (début de l'hiver) peuvent allonger les délais.

## Conditions d'accès

- Le véhicule de livraison (camion-benne ou camion à hayon) doit pouvoir accéder au point de déchargement.
- Signalez dans vos instructions toute contrainte : rue étroite, pente, portail, hauteur limitée, terrain meuble.
- Le vrac est déchargé au plus près de l'accès ; les palettes sont déposées à un emplacement accessible. Le rangement et le cordage ne sont pas inclus.

## Réception

Vérifiez la marchandise en présence du chauffeur et notez toute réserve sur le bon de livraison. En cas d'absence ou d'accès impossible le jour convenu, une nouvelle livraison peut être facturée.`,
  }),

  cancellation: ({ market }) => ({
    title: "Politique d'annulation",
    body: `## Avant paiement

Vous pouvez annuler ou modifier votre précommande **sans frais et à tout moment** tant que la facture pro forma n'est pas réglée. Il suffit de nous écrire en indiquant votre référence.

## Après paiement, avant livraison

Contactez-nous au plus vite. Si la commande n'a pas encore été préparée par notre fournisseur, elle est annulée et **remboursée intégralement** par virement sous 14 jours. Si elle est déjà en préparation, les frais réellement engagés peuvent être déduits, après information préalable.

## Après livraison

${market === "fr" ? "Vous disposez d'un **droit de rétractation de 14 jours** à compter de la livraison (article L221-18 du Code de la consommation). Informez-nous de votre décision par écrit ; les produits doivent être restitués dans leur état d'origine et les frais de reprise sont à votre charge. Le remboursement intervient au plus tard 14 jours après la réception de votre demande, la somme pouvant être différée jusqu'à la récupération des produits." : "Les produits livrés conformes ne sont ni repris ni échangés, sauf disposition contraire de la loi applicable. En cas de non-conformité, consultez la page retours et réclamations."}

## Annulation de notre part

Si un produit devient indisponible ou si la livraison s'avère impossible, nous vous en informons immédiatement et vous remboursons intégralement toute somme versée.`,
  }),

  returns: () => ({
    title: "Retours et réclamations",
    body: `## Signaler un problème

Contactez-nous **dans les 48 heures** suivant la livraison, avec votre référence de commande et des photos. Nous traitons chaque réclamation avec notre fournisseur partenaire et vous répondons rapidement.

## Volume livré

Le volume se mesure **empilé**, selon la définition de l'unité figurant sur la fiche produit (stère, mètre cube apparent, corde…). Pour toute contestation, rangez le bois de façon serrée et photographiez la pile avec un mètre ruban visible.

## Humidité

L'humidité se mesure au cœur d'une bûche **fraîchement fendue**, sur plusieurs bûches, avec un humidimètre. La mesure en surface n'est pas représentative.

## Solutions

Selon le cas : complément de livraison, remplacement, avoir ou remboursement. Nos engagements s'ajoutent aux garanties légales dont vous bénéficiez.`,
  }),

  notice: ({ market, name, contact, co, c }) => ({
    title: "Mentions légales",
    body: `## Éditeur du site

- Raison sociale : **${name}**
- Adresse : ${v(co.address, c.missing)}
- ${market === "fr" ? "Immatriculation (RCS / SIREN)" : "Numéro d'entreprise"} : ${v(co.registration, c.missing)}
- ${market === "fr" ? "N° de TVA intracommunautaire" : "Numéros de taxes"} : ${v(co.vatNumber, c.missing)}
- Directeur de la publication : ${v(co.publisher, c.missing)}
- Contact : ${contact}

## Hébergement

${v(co.host, c.missing)}

${market === "fr" ? `## Médiation de la consommation

${v(co.mediator, c.missing)}

Plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr

` : ""}## Modèle d'activité

Foyerwood est une plateforme de distribution : les produits sont préparés et livrés par des fournisseurs partenaires indépendants dans chaque pays. Foyerwood ne possède pas d'entrepôts.

## Propriété intellectuelle

Les textes, visuels, logos et éléments graphiques du site sont protégés. Toute reproduction sans autorisation est interdite.`,
  }),

  safety: ({ market }) => ({
    title: "Sécurité et bonne utilisation des combustibles",
    body: `## Utiliser le bon combustible

- Brûlez chaque combustible uniquement dans un appareil prévu pour lui : les granulés exclusivement dans un poêle ou une chaudière à granulés ; les bûches compressées selon la notice de votre appareil.
- Ne brûlez jamais de bois traité, peint, aggloméré ou de déchets : leurs fumées sont toxiques et encrassent le conduit.
- Respectez la charge maximale indiquée par le fabricant de votre appareil.

## Entretien du conduit

${market === "fr" ? "Le ramonage est obligatoire, généralement **deux fois par an dont une pendant la période de chauffe**, selon le règlement sanitaire de votre département. Conservez le certificat de ramonage." : "Faites inspecter et ramoner votre cheminée **au moins une fois par an**, idéalement avant la saison de chauffe, par un professionnel."} Un bois sec (moins de 20 % d'humidité) limite fortement les dépôts de créosote.

## Détecteurs

${market === "fr" ? "Le détecteur de fumée (DAAF) est obligatoire dans tous les logements ; un détecteur de monoxyde de carbone est fortement recommandé près des appareils à combustion." : "Installez des avertisseurs de fumée et de monoxyde de carbone à chaque étage et près des chambres, et vérifiez-les régulièrement."}

## Cendres et stockage

- Les cendres peuvent rester chaudes plusieurs jours : stockez-les dans un **seau métallique fermé**, à l'extérieur, loin de tout matériau combustible.
- Stockez le bois et les granulés à l'abri de l'humidité et à distance des sources de chaleur.
- Gardez les enfants et les animaux éloignés des appareils en fonctionnement.

## Qualité de l'air

Un bon allumage (par le haut), un bois sec et un appareil performant réduisent nettement les émissions de particules.${market === "fr" ? " Renseignez-vous sur les éventuelles restrictions locales (plans de protection de l'atmosphère, épisodes de pollution)." : " Renseignez-vous sur les éventuelles restrictions locales de chauffage au bois."}`,
  }),
};

const EN: Record<LegalDoc, (a: Args) => { title: string; body: string }> = {
  terms: ({ market, name, contact }) => ({
    title: "Terms of sale",
    body: `## 1. Purpose

These terms govern the sale of firewood, wood fuels and accessories offered by **${name}** (“Foyerwood”) on this site, for deliveries ${market === "ca" ? "in Canada" : market === "us" ? "in the United States" : "in mainland France"}. Contact: ${contact}.

## 2. A pre-order model

Sending a pre-order on the site **is not a purchase and involves no payment**. It is a request that we check (availability, address, lead time) before sending you a **pro forma invoice**. The sales contract is formed when you accept the pro forma invoice and your payment has been **received and verified** on our account.

## 3. Products and quantities

Each product page states the species, target moisture, log length, unit of sale and the real content of one unit (volume or weight). Wood is a natural product and its appearance may vary. Wood volumes are measured stacked, according to the unit definition shown on the product page.

## 4. Prices

Prices are shown in ${market === "ca" ? "Canadian dollars, before tax (GST/HST and QST depending on the province)" : market === "us" ? "U.S. dollars, excluding sales tax (depending on the state)" : "euros, including VAT"}. The applicable price is the one on the pro forma invoice, valid for the period stated on it.

## 5. Payment

Payment is made by **bank transfer** to the account shown on the pro forma invoice. An order is never considered paid on the customer's word alone: only once the funds have been received and verified. Foyerwood will never ask you to pay by another method or to another account.

## 6. Delivery

Delivery is carried out by our local partner supplier within our service areas, as described in the [delivery policy](./delivery-policy). It is free under the conditions shown on the site and repeated on the pro forma invoice.

## 7. Cancellation

You can cancel your pre-order at no cost as long as the pro forma invoice has not been paid. See the [cancellation policy](./cancellation-policy).

## 8. Conformity and claims

Check your delivery in the presence of the driver. Claims are handled as described on the [returns and claims](./returns-and-claims) page, without prejudice to the legal warranties provided by ${consumerLawEn[market]}.

## 9. Personal data

Your data is processed according to our [privacy policy](./privacy-policy).

## 10. Disputes

If a problem arises, please contact us first: we always seek an amicable solution. These terms are governed by ${market === "ca" ? "the law of your province of residence" : market === "us" ? "the law of the state of delivery" : "French law"}, without depriving consumers of the protection of the mandatory provisions of their law of residence.`,
  }),

  privacy: ({ market, name, contact }) => ({
    title: "Privacy policy",
    body: `## Who is responsible

**${name}** — ${contact}.${market === "ca" ? " Our person in charge of the protection of personal information can be reached at the same address." : ""}

## Data we collect

- **Pre-orders**: name, email, phone, delivery address, instructions, products and quantities.
- **Calculator**: your answers and only the first 3 characters of your postal code, with no identifying data.
- **Newsletter**: your email address, if you subscribe.
- **Contact and reviews**: the information you send us.

## Why we use it

- To process your pre-order, issue the pro forma invoice and organize delivery.
- To contact you by WhatsApp, phone or email about your order.
- To meet our accounting and tax obligations.
- To send the newsletter, with your consent (you can unsubscribe at any time).
- To improve our estimates using anonymous calculator statistics.

## Who receives it

- Our **partner supplier** in the delivery country, only to prepare and deliver your order.
- Our technical providers: website hosting (Vercel) and database (Supabase), bound by confidentiality commitments.
- **WhatsApp (Meta)** when you choose to talk to us through this app.

We never sell your data.

## Retention

- Order data: for as long as required by applicable accounting and tax rules.
- Prospect and contact data: 3 years after our last exchange.
- Newsletter: until you unsubscribe.

## Cookies and local storage

The site uses **no advertising or third-party analytics cookies**. It only stores your country choice (technical cookie) and your pre-order content in your browser (local storage).

## Your rights

You can ask to access, correct or delete your data, object to its processing or withdraw your consent by writing to us (${contact}).${market === "us" ? " California residents have the rights provided by the CCPA/CPRA; we do not sell or share personal information for cross-context advertising." : market === "ca" ? " You may also contact the Office of the Privacy Commissioner of Canada or, in Québec, the Commission d'accès à l'information." : ""}`,
  }),

  shipping: ({ market, c }) => ({
    title: "Delivery policy",
    body: `## Service areas

We deliver within the areas covered by our partner supplier ${market === "ca" ? "in Canada" : "in the United States"}. The list of ${market === "ca" ? "provinces" : "states"} served and excluded areas is published on the Delivery page, and the site checks your ZIP or postal code **before** you send your pre-order.

## Free delivery

${c.freeFrom ? `Delivery is free for orders from **${c.freeFrom}** in our service areas.` : "Delivery is free in our service areas."} Below that amount, for remote areas or special access, any fee is shown on the pro forma invoice before any payment.

## Lead times

The estimated lead time is shown when your address is checked. The delivery date is agreed with you after payment confirmation. Peak periods (early winter) can extend lead times.

## Access

- The delivery truck (dump truck or liftgate truck) must be able to reach the unloading point.
- Mention any constraint in your instructions: narrow street, slope, gate, height limit, soft ground.
- Bulk wood is unloaded as close as possible to the access; pallets are dropped at an accessible spot. Stacking is not included.

## Receipt

Check the goods with the driver and note any issue on the delivery slip. If nobody is present or access is impossible on the agreed day, a new delivery may be charged.`,
  }),

  cancellation: () => ({
    title: "Cancellation policy",
    body: `## Before payment

You can cancel or change your pre-order **at any time and at no cost** as long as the pro forma invoice has not been paid. Just message us with your reference.

## After payment, before delivery

Contact us as soon as possible. If our supplier has not yet prepared the order, it is cancelled and **fully refunded** by bank transfer within 14 days. If preparation has started, costs actually incurred may be deducted, after telling you first.

## After delivery

Conforming products that have been delivered are not taken back or exchanged, unless applicable law provides otherwise. For non-conforming deliveries, see the returns and claims page.

## Cancellation on our side

If a product becomes unavailable or delivery proves impossible, we inform you immediately and refund any amount paid in full.`,
  }),

  returns: () => ({
    title: "Returns and claims",
    body: `## Reporting an issue

Contact us **within 48 hours** of delivery with your order reference and photos. We handle every claim with our partner supplier and get back to you quickly.

## Delivered volume

Volume is measured **stacked**, according to the unit definition on the product page (full cord, face cord, cubic foot…). If you dispute a volume, stack the wood tightly and photograph the stack with a tape measure in view.

## Moisture

Moisture is measured in the center of a **freshly split** log, on several logs, with a moisture meter. Surface readings are not representative.

## Remedies

Depending on the case: additional delivery, replacement, credit or refund. These commitments are in addition to your legal warranties.`,
  }),

  notice: ({ name, contact, co, c }) => ({
    title: "Legal notice",
    body: `## Site publisher

- Company: **${name}**
- Address: ${v(co.address, c.missing)}
- Business number: ${v(co.registration, c.missing)}
- Tax numbers: ${v(co.vatNumber, c.missing)}
- Publication manager: ${v(co.publisher, c.missing)}
- Contact: ${contact}

## Hosting

${v(co.host, c.missing)}

## Business model

Foyerwood is a distribution platform: products are prepared and delivered by independent partner suppliers in each country. Foyerwood does not own warehouses.

## Intellectual property

The texts, visuals, logos and graphic elements of the site are protected. Any reproduction without permission is prohibited.`,
  }),

  safety: ({ market }) => ({
    title: "Fuel safety and proper use",
    body: `## Use the right fuel

- Burn each fuel only in an appliance designed for it: pellets only in a pellet stove or boiler; compressed logs according to your appliance manual.
- Never burn treated or painted wood, particle board or trash: the smoke is toxic and fouls the chimney.
- Respect the maximum load stated by your appliance manufacturer.

## Chimney care

Have your chimney inspected and swept **at least once a year**, ideally before the heating season, by a certified professional${market === "us" ? " (for example, CSIA-certified)" : ""}. Dry wood (below 20% moisture) greatly reduces creosote buildup.

## Alarms

Install smoke and carbon monoxide alarms on every level and near bedrooms, and test them regularly.

## Ashes and storage

- Ashes can stay hot for days: store them in a **closed metal container**, outdoors, away from anything combustible.
- Keep wood and pellets dry and away from heat sources.
- Keep children and pets away from operating appliances.

## Air quality

Top-down lighting, dry wood and an efficient appliance (${market === "us" ? "EPA-certified" : "EPA or CSA B415 certified"}) significantly reduce particle emissions. Check for local burn restrictions or air-quality alerts.`,
  }),
};
