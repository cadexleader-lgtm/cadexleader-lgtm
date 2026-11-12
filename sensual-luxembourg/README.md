# Sensual Luxembourg — site vitrine (maquette animée)

Site vitrine one-page pour **Sensual Luxembourg** : massages relaxants et massages sensuels à Luxembourg.
Version de présentation à montrer au client avant validation.

- **100 % statique** (HTML / CSS / JavaScript) : aucune compilation, aucun serveur, déploiement Vercel en 1 clic.
- Palette **bleu nuit · bleu royal · blanc · rouge carmin**, cartes très arrondies, effet verre dépoli.
- **Parcours de réservation complet** : massage + durée + lieu → jour + heure → coordonnées + paiement
  → message pré-rempli envoyé sur WhatsApp → paiement en ligne (acompte ou totalité), ajout à l'agenda, référence.
- **Animations « vidéo » au défilement** :
  - *Le Rituel*, un **film interactif** en WebGL : le scroll fait avancer le film (zooms, transitions liquides
    bordées de lumière rouge, étalonnage cinéma, bandes noires, timecode « Lecture / Pause ») ;
  - une **galerie en vol 3D** où l'on traverse les photos en profondeur ;
  - fond « soie » animé, titre lettre par lettre, visuel 3D, cartes qui basculent en 3D, rideaux d'images,
    étapes en carrousel 3D, tarifs en éventail, vidéo d'ambiance plein écran, compteurs…

## Structure

```
sensual-luxembourg/
├── index.html              ← toute la page (textes modifiables directement)
├── vercel.json             ← cache + en-têtes de sécurité pour Vercel
├── PROPOSITION.md          ← proposition commerciale à présenter au client
└── assets/
    ├── css/style.css       ← design (couleurs en haut du fichier, variables :root)
    ├── js/config.js        ← ⚙️ CONFIGURATION : WhatsApp, e-mail, paiement, créneaux, suppléments
    ├── js/main.js          ← animations générales, navigation, curseur
    ├── js/booking.js       ← parcours de réservation (tiroir en 3 étapes)
    ├── js/reel.js          ← film interactif « Le Rituel » (WebGL)
    ├── js/tunnel.js        ← galerie en vol 3D
    ├── js/silk.js          ← fond animé WebGL du hero
    ├── img/                ← logo (SVG), favicon, photos WebP, image de partage
    ├── video/              ← film d'ambiance (MP4 + WebM) et son affiche
    ├── fonts/              ← Cormorant Garamond + Manrope (hébergées localement)
    └── vendor/             ← GSAP, ScrollTrigger, Lenis
```

## Voir le site en local

```bash
cd sensual-luxembourg
npx serve .            # ou : python3 -m http.server 8000
```

Puis ouvrir l'adresse affichée (ex. http://localhost:3000).
Pour revoir l'écran « 18+ », vider le stockage local du navigateur (clé `sl-age-ok`).

## Configuration (WhatsApp, paiement, créneaux)

Tout se règle dans **`assets/js/config.js`** :

```js
window.SL_CONFIG = {
  whatsapp: "352621123456",            // format international, sans + ni espaces
  whatsappDisplay: "+352 621 123 456",
  email: "contact@sensual-luxembourg.lu",
  placeFees: { salon: 0, hotel: 40, domicile: 40 },   // supplément déplacement
  slots: ["10:00", "11:00", /* … */ "01:00"],          // heures proposées
  daysAhead: 14,
  minNoticeMinutes: 60,
  simulateBusySlots: true,             // DÉMO : quelques créneaux "complet" → false en production
  payment: { url: "", iban: "", beneficiary: "", depositPercent: 30 },
};
```

**Massages, durées et prix** : directement dans `index.html`, sur chaque carte
(`data-prices="60:150,90:200"` = 60 min à 150 €, 90 min à 200 €). Le tiroir de réservation lit ces valeurs :
il n'y a qu'un seul endroit à modifier.

### Ce qui se passe quand un client réserve

1. Il clique sur « Réserver » (menu, hero, carte de massage, tarifs, film, barre mobile…).
2. Il choisit massage, durée, lieu (supplément hôtel/domicile ajouté), puis le jour et l'heure.
3. Il indique son prénom, choisit **payer sur place**, **acompte en ligne** ou **totalité en ligne**.
4. **WhatsApp s'ouvre avec le message déjà rédigé** (massage, date, lieu, prix, paiement, référence `SL-XXXX`).
5. Écran de confirmation : bouton **« Payer X € maintenant »**, coordonnées de virement si un IBAN est configuré,
   **ajout à l'agenda** (fichier .ics avec un intitulé discret « Rendez-vous bien-être »).

Sans numéro configuré, le site reste en **mode démo** : le tiroir fonctionne entièrement et montre un aperçu du
message WhatsApp que le salon recevra. Astuce : mettez **votre propre numéro** pour faire la démonstration au client.

### Paiement en ligne — à lire

Le site est statique : il redirige vers un **lien de paiement** fourni par le prestataire du salon (`payment.url`),
le client saisit le montant et la référence. Attention : la plupart des prestataires grand public
(Stripe, PayPal, SumUp…) **interdisent les services pour adultes** dans leurs conditions d'utilisation et peuvent
bloquer le compte. Il faut donc un prestataire qui accepte explicitement ce secteur (à vérifier avec lui),
ou se limiter au **virement instantané / Payconiq** (`payment.iban`) et au paiement sur place.

## Déployer sur Vercel

1. Pousser le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le dépôt.
3. **Root Directory** : `sensual-luxembourg` (important, le dépôt contient d'autres projets).
4. Framework Preset : **Other**. Pas de Build Command, pas d'Output Directory.
5. **Deploy**. L'URL `*.vercel.app` peut être envoyée au client tout de suite.

Ensuite, chaque `git push` redéploie automatiquement. Le domaine (ex. `sensual-luxembourg.lu`) s'ajoute dans
*Project → Settings → Domains*. Pensez alors à mettre l'URL complète dans `og:image` (`index.html`).

> Bon à savoir : les hébergeurs encadrent les contenus pour adultes. Relire la politique d'utilisation
> (Acceptable Use Policy) de Vercel avant la mise en ligne définitive, et garder un contenu suggestif mais non explicite.

## Contenus de démonstration à remplacer avant la mise en ligne

| Élément | Où | À faire |
|---|---|---|
| Avis clients | `index.html`, section `#avis` | Remplacer par de vrais avis (ou retirer la section) |
| Créneaux « complet » | `config.js` → `simulateBusySlots` | Mettre `false` (ou brancher un vrai planning) |
| Chiffres (8 ans, 2 500 séances, 4,9/5) | section « Chiffres » | Valider avec le client |
| Tarifs et durées | sections `#massages` et `#tarifs` | Prix réels du client |
| Moyens de paiement, horaires, zones | FAQ, Contact, bento | Valider avec le client |
| Mentions légales / confidentialité | pied de page | Créer les pages (obligatoire) |

## Photos, vidéo et licences

- Photos : [Unsplash](https://unsplash.com/license) (usage commercial gratuit, sans attribution obligatoire).
  Aucune photo ne montre le visage d'une personne identifiable : les vraies photos de l'équipe devront être
  fournies par le client, **avec l'accord écrit des personnes photographiées**.
- Vidéo d'ambiance : montage réalisé à partir de ces photos (zooms lents + fondus), MP4 H.264 et WebM VP9.
- Film interactif et galerie 3D : calculés en direct dans le navigateur à partir des mêmes photos (aucun fichier vidéo lourd).
- Polices : Cormorant Garamond et Manrope (SIL Open Font License), servies localement.
- GSAP + ScrollTrigger (licence GSAP standard, gratuite y compris en commercial) et Lenis (MIT).

## Accessibilité & performance

- Respect de `prefers-reduced-motion` : animations lourdes coupées pour les personnes sensibles au mouvement.
- Fonds WebGL (soie, film) mis en pause hors écran ; repli automatique (dégradé CSS / Canvas 2D) sans WebGL.
- Tiroir de réservation accessible au clavier (Échap pour fermer, focus maintenu dans le tiroir).
- Images WebP en chargement différé, polices préchargées, curseur personnalisé uniquement sur souris.
- Balises `rating=adult` / RTA pour les filtres parentaux.
