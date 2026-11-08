# Woodora — plateforme internationale de bois de chauffage

> *The warmth of nature, delivered.* — La chaleur du bois, directement chez vous.

Woodora est une plateforme de **précommande** de bois de chauffage, bois séché, granulés, briquettes, bois d'allumage et accessoires, pour trois marchés indépendants :

| Marché | URL | Langue(s) | Devise | Unités de vente |
|---|---|---|---|---|
| 🇨🇦 Canada | `/ca` · `/ca/en` | Français + anglais | CAD | corde complète, demi-corde, face cord, pied cube, palette |
| 🇺🇸 États-Unis | `/us` | Anglais | USD | full cord, face cord, rick, cubic foot, pallet |
| 🇫🇷 France | `/fr` | Français | EUR | stère, mètre cube apparent, palette, sac |

Le site **n'encaisse aucun paiement** : le client envoie une précommande, reçoit une référence unique (`WD-CA-2026-000125`) et un message WhatsApp prérempli. L'équipe vérifie la commande, envoie une facture pro forma, **vérifie le virement**, puis organise la livraison.

---

## Démarrage rapide (2 minutes)

Prérequis : Node.js 20.9 ou plus récent.

```bash
cd woodora
npm install
npm run dev
```

Ouvrez http://localhost:3000. Sans configuration, l'application utilise une base PostgreSQL embarquée (PGlite, dossier `.data/`), créée et remplie automatiquement au premier lancement.

- Site : http://localhost:3000 (choix du pays), puis `/fr`, `/ca`, `/ca/en`, `/us`
- Administration : http://localhost:3000/admin
  - compte de démonstration local : `admin@woodora.local` / `woodora-demo`
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

## Mise en production : Supabase + Vercel

### 1. Supabase (base de données et photos)

1. Créez un projet sur https://supabase.com.
2. **Database → Connection string → Transaction pooler** : copiez l'URI (port `6543`) : c'est `DATABASE_URL`.
3. **Storage** : créez un bucket **public** nommé `media` (photos produits et articles).
4. **Project Settings → API** : notez l'URL du projet (`NEXT_PUBLIC_SUPABASE_URL`) et la clé `service_role` (`SUPABASE_SERVICE_ROLE_KEY`, à garder secrète, uniquement côté serveur).
5. En local, avec ces variables dans `.env.local` :
   ```bash
   npm run db:migrate
   ADMIN_EMAIL=vous@domaine.com ADMIN_PASSWORD="un-mot-de-passe-long" npm run db:seed
   ```
   (Vous pouvez aussi exécuter `db/migrations/0001_init.sql` dans l'éditeur SQL de Supabase.)

**Sécurité** : le site accède à la base uniquement depuis le serveur. La *Row Level Security* est activée sur toutes les tables **sans aucune règle publique** : la clé `anon` de Supabase ne peut lire ni commandes, ni coordonnées, ni paiements. Les pages de confirmation sont protégées par un jeton aléatoire, le suivi exige référence + e-mail.

### 2. Vercel (hébergement)

1. Importez le dépôt GitHub sur https://vercel.com.
2. **Root Directory** : `woodora` (le dépôt contient aussi votre README de profil GitHub).
3. Variables d'environnement (voir `.env.example`) :
   - `DATABASE_URL`, `SESSION_SECRET` (32 caractères aléatoires ou plus : `openssl rand -base64 48`)
   - `NEXT_PUBLIC_SITE_URL` (ex. `https://woodora.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=media`
4. Déployez. La sélection automatique du pays utilise l'en-tête de géolocalisation de Vercel ; le visiteur peut toujours changer de pays.

> Sans `DATABASE_URL`, un déploiement fonctionne en **mode démonstration** (base en mémoire, réinitialisée à chaque redémarrage). Ne l'utilisez pas pour de vraies commandes.

---

## Avant le lancement — à compléter dans l'administration

Le tableau de bord affiche une liste « À faire » qui reprend ces points.

1. **Réglages → marchés** : numéro **WhatsApp commercial** de chaque pays (sinon le bouton de confirmation WhatsApp est masqué), e-mail, téléphone, horaires.
2. **Réglages → entreprise** : raison sociale, adresse, immatriculation, numéros de taxes, directeur de publication, médiateur (France). Ces données alimentent les mentions légales et les CGV.
3. **Fournisseurs** : les trois fiches de départ sont à compléter (coordonnées, délais, conditions).
4. **Produits** : le catalogue de départ (36 produits) contient des **prix, tarifs d'achat et caractéristiques indicatifs** à remplacer par ceux de vos fournisseurs. Ajoutez les vraies photos.
5. **Zones de livraison** : les zones de départ (Québec et Est de l'Ontario, Nord-Est des États-Unis, Île-de-France et Centre-Val de Loire) et le seuil de livraison gratuite (150) sont des hypothèses à ajuster.
6. **Textes légaux** : les pages CGV, confidentialité, livraison, annulation, réclamations, mentions légales et sécurité sont une base solide adaptée au modèle de précommande. Elles **doivent être relues par un juriste** dans chaque pays (droit de la consommation, taxes, étiquetage des combustibles).
7. **Photos** : les photos fournies sont dans `public/images/photos/` (plaques d'immatriculation floutées). Vérifiez que vous détenez les droits d'utilisation de chaque image avant la mise en ligne. Les produits sans photo affichent une illustration à la charte.

---

## Fonctionnalités

### Boutique (3 marchés)
- Accueil : hero, 6 catégories, meilleures ventes du marché, calculateur, arguments, 4 étapes de commande, avis vérifiés, conseils, newsletter.
- Catalogue avec recherche, filtres (catégorie, essence, conditionnement, disponibilité) et tri.
- Fiches produits : essence, humidité, longueur, conditionnement, unité expliquée (« ce que vous recevez exactement » : volume, poids, énergie), quantité minimale, disponibilité, livraison, transparence fournisseur.
- Panier de précommande par marché (conservé dans le navigateur), quantités minimales, **vérification de la zone de livraison avant envoi**, consentement.
- Référence unique par marché et par année (`WD-FR-2026-000001`), page de confirmation, **message WhatsApp prérempli**, suivi de commande.
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
woodora/
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
