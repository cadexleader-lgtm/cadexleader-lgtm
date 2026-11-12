# Sensual Luxembourg — site vitrine (maquette animée)

Site vitrine one-page pour **Sensual Luxembourg** : massages relaxants et massages sensuels à Luxembourg.
Version de présentation à montrer au client avant validation.

- **100 % statique** (HTML / CSS / JavaScript) : aucune compilation, aucun serveur, déploiement Vercel en 1 clic.
- Palette **bleu nuit · bleu royal · blanc · rouge carmin**, cartes très arrondies, effet verre dépoli.
- Animations : fond « soie » en WebGL qui réagit à la souris, entrée cinématique du titre lettre par lettre,
  visuel 3D en profondeur (parallaxe), défilement fluide, section épinglée à défilement horizontal,
  texte qui s'allume au scroll, vidéo d'ambiance qui s'ouvre en plein écran, compteurs, galerie en parallaxe…

## Structure

```
sensual-luxembourg/
├── index.html              ← toute la page (textes modifiables directement)
├── vercel.json             ← cache + en-têtes de sécurité pour Vercel
├── PROPOSITION.md          ← proposition commerciale à présenter au client
└── assets/
    ├── css/style.css       ← design (couleurs en haut du fichier, variables :root)
    ├── js/main.js          ← interactions + CONFIG (WhatsApp, e-mail)
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

## Ajouter le numéro WhatsApp et l'e-mail

Dans `assets/js/main.js`, tout en haut :

```js
const CONFIG = {
  whatsapp: "352621123456",            // format international, sans + ni espaces
  whatsappDisplay: "+352 621 123 456",
  email: "contact@sensual-luxembourg.lu",
};
```

Dès que `whatsapp` est rempli :
- le formulaire de réservation ouvre WhatsApp avec un message pré-rempli (massage, date, heure, lieu, prénom) ;
- le bouton vert flottant ouvre directement la conversation ;
- les coordonnées s'affichent dans la section Contact.

Tant que le numéro est vide, le site fonctionne en **mode démo** (un message l'indique à l'envoi du formulaire).

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
| Chiffres (8 ans, 2 500 séances, 4,9/5) | section « Chiffres » | Valider avec le client |
| Tarifs et durées | sections `#massages` et `#tarifs` | Prix réels du client |
| Moyens de paiement, horaires, zones | FAQ, Contact, bento | Valider avec le client |
| Mentions légales / confidentialité | pied de page | Créer les pages (obligatoire) |

## Photos, vidéo et licences

- Photos : [Unsplash](https://unsplash.com/license) (usage commercial gratuit, sans attribution obligatoire).
  Aucune photo ne montre le visage d'une personne identifiable : les vraies photos de l'équipe devront être
  fournies par le client, **avec l'accord écrit des personnes photographiées**.
- Vidéo d'ambiance : montage réalisé à partir de ces photos (zooms lents + fondus), MP4 H.264 et WebM VP9.
- Polices : Cormorant Garamond et Manrope (SIL Open Font License), servies localement.
- GSAP + ScrollTrigger (licence GSAP standard, gratuite y compris en commercial) et Lenis (MIT).

## Accessibilité & performance

- Respect de `prefers-reduced-motion` : animations lourdes coupées pour les personnes sensibles au mouvement.
- Fond WebGL rendu en basse résolution et mis en pause hors écran ; repli en dégradé CSS si WebGL indisponible.
- Images WebP en chargement différé, polices préchargées, curseur personnalisé uniquement sur souris.
- Balises `rating=adult` / RTA pour les filtres parentaux.
