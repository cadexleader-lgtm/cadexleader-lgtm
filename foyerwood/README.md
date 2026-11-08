# Foyerwood — plateforme internationale de bois de chauffage

> *The warmth of nature, delivered.* — La chaleur du bois, directement chez vous.

Foyerwood est une plateforme de **précommande** de bois de chauffage, bois séché, granulés, briquettes, bois d'allumage et accessoires, pour trois marchés indépendants :

| Marché | URL | Langue(s) | Devise | Unités de vente |
|---|---|---|---|---|
| 🇨🇦 Canada | `/ca` · `/ca/en` | Français + anglais | CAD | corde complète, demi-corde, face cord, pied cube, palette, big bag, filet, sac, carton |
| 🇺🇸 États-Unis | `/us` | Anglais | USD | full cord, face cord, rick, cubic foot, pallet, big bag, net bag, bag, box |
| 🇫🇷 France | `/fr` | Français | EUR | stère, mètre cube apparent, palette, big bag, filet, sac, carton |

Le site **n'encaisse aucun paiement** : le client envoie une précommande, reçoit une référence unique (`FW-CA-2026-000125`) et un message WhatsApp prérempli. L'équipe vérifie la commande, envoie une facture pro forma, **vérifie le virement**, puis organise la livraison.

---

## Démarrage rapide (2 minutes)

Prérequis : Node.js 20.9 ou plus récent.

```bash
cd foyerwood
npm install
npm run dev
```

Ouvrez http://localhost:3000. Sans configuration, l'application utilise une base PostgreSQL embarquée (PGlite, dossier `.data/`), créée et remplie automatiquement au premier lancement.

- Site : http://localhost:3000 (choix du pays), puis `/fr`, `/ca`, `/ca/en`, `/us`
- Administration : http://localhost:3000/admin
  - compte de démonstration local : `admin@foyerwood.local` / `foyerwood-demo`
  - (créé uniquement pour la base locale, jamais en production)

Pour repartir de zéro en local : arrêtez le serveur et supprimez le dossier `.data/`.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm test` | Tests unitaires (calculateur, unités, codes postaux, zones, routage, WhatsApp) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:migrate` | Applique `db/migrations/*.sql` sur `DATABASE_URL` |
| `npm run db:seed` | Insère le catalogue de départ (si la base est vide) et le premier administrateur |
| `npm run admin:create -- email "mot de passe" "Nom"` | Crée ou réinitialise un administrateur |

---

## Mise en ligne sur Vercel (recommandé)

Tout se fait depuis le tableau de bord Vercel : hébergement, base de données Postgres (Neon) et stockage des photos (Vercel Blob), avec les offres gratuites.

1. **Importer le projet** : vercel.com → *Add New… → Project* → importez le dépôt GitHub `cadexleader-lgtm/cadexleader-lgtm`.
   - **Root Directory** : `foyerwood`
   - Framework : Next.js (détecté automatiquement)
2. **Base de données** : onglet *Storage* du projet → *Create Database* → **Neon (Postgres)** → connectez-la au projet. La variable `DATABASE_URL` est ajoutée automatiquement.
3. **Photos** : onglet *Storage* → *Create* → **Blob** → connectez-le au projet. La variable `BLOB_READ_WRITE_TOKEN` est ajoutée automatiquement.
4. **Variables d'environnement** (*Settings → Environment Variables*) :
   - `SESSION_SECRET` : 48 caractères aléatoires (`openssl rand -base64 48`)
   - `ADMIN_EMAIL` et `ADMIN_PASSWORD` : votre accès à l'administration (12 caractères minimum)
   - `NEXT_PUBLIC_SITE_URL` : `https://foyerwood.com`
   - facultatif : `WHATSAPP_CA`, `WHATSAPP_US`, `WHATSAPP_FR`, `CONTACT_EMAIL` (modifiables ensuite dans l'admin)
5. **Déployer**. À la première visite, le site crée automatiquement les tables, le catalogue de départ et votre compte administrateur.

### Nom de domaine foyerwood.com

1. Achetez `foyerwood.com` (Vercel *Domains*, ou Cloudflare Registrar au prix coûtant).
2. Vercel → projet → *Settings → Domains* → ajoutez `foyerwood.com` et `www.foyerwood.com`.
3. Si le domaine est chez Cloudflare : créez les enregistrements DNS indiqués par Vercel (enregistrement `A` pour `foyerwood.com`, `CNAME` pour `www`) en mode **DNS only** (nuage gris). Le certificat HTTPS est automatique.

### Alternative : Supabase

Le site fonctionne aussi avec Supabase : `DATABASE_URL` = chaîne *Transaction pooler* (port 6543) du projet, et pour les photos `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et un bucket public `media`.

**Sécurité** : la base n'est accessible que depuis le serveur. La *Row Level Security* est activée sur toutes les tables sans aucune règle publique ; les pages de confirmation sont protégées par un jeton aléatoire, le suivi exige référence + e-mail.

> Sans `DATABASE_URL`, le site fonctionne en **mode démonstration** (base embarquée, réinitialisée à chaque redémarrage sur Vercel). Ne l'utilisez pas pour de vraies commandes.

---

## Avant le lancement — à compléter dans l'administration

Le tableau de bord affiche une liste « À faire » qui reprend ces points.

1. **Réglages → marchés** : numéro **WhatsApp commercial** de chaque pays (sinon le bouton de confirmation WhatsApp est masqué), e-mail, téléphone, horaires.
2. **Réglages → entreprise** : raison sociale, adresse, immatriculation, numéros de taxes, directeur de publication, médiateur (France). Ces données alimentent les mentions légales et les CGV.
3. **Fournisseurs** : les trois fiches de départ sont à compléter (coordonnées, délais, conditions).
4. **Produits** : le catalogue de départ est organisé **par essence × conditionnement** (Chêne, Hêtre, Bouleau, Érable, Frêne, Pin × vrac, palette, big bag, filet, sac, carton = 36 produits par pays, plus granulés, briquettes, allumage et accessoires). Les **prix, tarifs d'achat et caractéristiques sont indicatifs** et doivent être remplacés par ceux de vos fournisseurs. L'érable est désactivé en France (activable dans l'admin).
5. **Zones de livraison** : les zones de départ (Québec et Est de l'Ontario, Nord-Est des États-Unis, Île-de-France et Centre-Val de Loire) et le seuil de livraison gratuite (150) sont des hypothèses à ajuster.
6. **Textes légaux** : les pages CGV, confidentialité, livraison, annulation, réclamations, mentions légales et sécurité sont une base solide adaptée au modèle de précommande. Elles **doivent être relues par un juriste** dans chaque pays (droit de la consommation, taxes, étiquetage des combustibles).
7. **Photos** : voir [`docs/photos-produits.md`](docs/photos-produits.md). Une photo par combinaison essence × conditionnement, nommée `<essence>-<conditionnement>.webp` et déposée dans `public/images/products/`, est utilisée automatiquement. Les produits sans photo affichent une illustration propre à leur essence et à leur conditionnement. Les photos d'ambiance sont dans `public/images/ambiance/` et `public/images/photos/` (plaques floutées). Vérifiez que vous détenez les droits d'utilisation commerciale de chaque image (plusieurs semblent provenir de Pinterest) et privilégiez des photos paysage d'au moins 1920 px de large pour le diaporama.

---

## Fonctionnalités

### Boutique (3 marchés)
- Accueil : barre supérieure (recherche, suivi, pays, panier), diaporama photo plein écran animé (fondu, zoom lent, braises), bande défilante, bannières Livraison / Conseils, carrousels « Produits en vedette » et « Bois séché », fiches essences (chaleur, allumage, braise), tuiles photo, calculateur, arguments avec compteurs animés, 4 étapes de commande, avis vérifiés, newsletter et pied de page sombre ; apparitions au défilement (désactivées si l'utilisateur réduit les animations).
- Catalogue par essence × conditionnement, avec filtres par essence et conditionnement ; chaque fiche propose « ce bois dans d'autres conditionnements » et « le même conditionnement dans d'autres essences ».
- Catalogue avec recherche, filtres (catégorie, essence, conditionnement, disponibilité) et tri.
- Fiches produits : essence, humidité, longueur, conditionnement, unité expliquée (« ce que vous recevez exactement » : volume, poids, énergie), quantité minimale, disponibilité, livraison, transparence fournisseur.
- Panier de précommande par marché (conservé dans le navigateur), quantités minimales, **vérification de la zone de livraison avant envoi**, consentement.
- Référence unique par marché et par année (`FW-FR-2026-000001`), page de confirmation, **message WhatsApp prérempli**, suivi de commande.
- Avis **authentiques uniquement** : seuls les clients livrés (référence + e-mail) peuvent publier, après modération.
- Conseils (blog), FAQ par marché, livraison et zones desservies, contact, à propos, pages légales.
- Référencement : métadonnées, `hreflang`, sitemap, robots, données structurées (Product, FAQPage, Article).

### Calculateur de besoins en chauffage
Assistant en 7 étapes : localisation (code postal → référence climatique), surface (m² ou pi²), type de logement, isolation, appareil et combustible, fréquence, durée. Le résultat donne une **fourchette** dans les unités du pays, les hypothèses retenues et des produits recommandés avec une quantité suggérée ajoutable en un clic.

Méthode (détaillée dans `lib/calculator.ts`) : méthode des degrés-jours (normales du Code national du bâtiment du Canada, NOAA, zones climatiques RT 2012), intensités de déperdition dérivées des statistiques ADEME/CEREN et NRCan, rendements saisonniers des appareils (ADEME, Flamme Verte, EPA), pouvoir calorifique selon EN ISO 18125 et densités du *Wood Handbook* (USDA). L'incertitude de chaque paramètre est combinée dans la fourchette affichée.

### Administration (`/admin`)
- Tableau de bord : précommandes (total, du jour), devis envoyés, paiements vérifiés, commandes confirmées et livrées, chiffre d'affaires confirmé et marge estimée **par devise**, pipeline des 11 statuts, liste « À faire ».
- Précommandes : 11 statuts, historique, notes, facture pro forma, paiements, livraison, contact WhatsApp du client.
  - Une commande ne peut passer à « Paiement reçu » ou au-delà **que si des virements vérifiés** (montant, date, référence bancaire) couvrent le devis. Un paiement « annoncé par le client » ne suffit jamais.
  - Le stock est déduit à la confirmation et réintégré en cas d'annulation.
- Produits & stocks, fournisseurs (produits, tarifs d'achat, stocks, zones, délais), zones de livraison (régions, codes postaux exclus, produits exclus, seuil de gratuité), avis, articles (Markdown), messages, newsletter (export CSV), réglages, utilisateurs.

---

## Architecture

```
foyerwood/
├── app/
│   ├── page.tsx               Choix du pays
│   ├── [site]/                Boutique (site = fr | us | ca | ca-en)
│   │   └── actions.ts         Actions serveur publiques (précommande, calculateur…)
│   └── admin/                 Administration (actions.ts = actions protégées)
├── proxy.ts                   URL localisées (/fr/boutique → /fr/shop…)
├── components/                Interface (site, panier, calculateur, admin, illustrations)
├── lib/
│   ├── calculator.ts, climate.ts, energy.ts   Moteur du calculateur et unités
│   ├── markets.ts, sites.ts, regions.ts       Marchés, URL, codes postaux
│   ├── i18n/ (fr.ts, en.ts), content/         Textes, FAQ, pages légales
│   ├── data/                  Accès aux données (SQL)
│   └── db/                    Connexion (Supabase ou PGlite), migrations, données de départ
├── db/migrations/             Schéma SQL (tables, contraintes, RLS)
└── tests/                     Tests unitaires (Vitest)
```

Pile technique : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL (Supabase) via `postgres`, PGlite en local, Supabase Storage, Zod, Lucide. Polices : DM Serif Display (titres) et Inter (textes).

Tables : `users`, `markets`, `suppliers`, `products`, `product_categories`, `inventory`, `customers`, `orders`, `order_items`, `order_events`, `order_sequences`, `quotations`, `payments`, `deliveries`, `delivery_zones`, `heating_calculations`, `reviews`, `blog_articles`, `site_settings`, `newsletter_subscribers`, `contact_messages`.

## Évolutions suggérées
- Notifications automatiques (e-mail ou WhatsApp Business API) à la réception d'une précommande.
- Génération PDF de la facture pro forma.
- Espace client.
- Limitation de débit partagée (ex. Upstash) si le trafic augmente.
