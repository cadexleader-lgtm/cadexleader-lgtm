# Site officiel de Christopher Masiree Dibba : guide de mise en ligne

Le dossier `site/` contient le site complet : deux pages (français à la racine, anglais dans `/en/`), les images, le plan du site pour Google et l'icône. Il n'y a rien à compiler : ce sont des fichiers statiques.

Ce guide est hors du dossier `site/` : il n'est donc pas publié avec le site.

---

## 1. À confirmer avant la mise en ligne

- [ ] Le nom de domaine. Par défaut, le site utilise `christophermasireedibba.com`.
- [ ] L'adresse email publique. Par défaut : `contact@christophermasireedibba.com`.
- [ ] Les liens vers ses réseaux (LinkedIn, Instagram, Facebook…).
- [ ] La relecture complète du texte par Christopher : chaque fait doit être exact (écoles, université, entreprises).

### Changer le nom de domaine partout en une commande

Depuis le dossier `site/` (remplacer `nouveaudomaine.com`) :

```bash
grep -rl "christophermasireedibba.com" . | xargs sed -i 's/christophermasireedibba\.com/nouveaudomaine.com/g'
```

---

## 2. Mise en ligne

### Nom de domaine
1. L'acheter chez un registraire qui masque gratuitement les coordonnées du propriétaire (Cloudflare Registrar, Porkbun ou Namecheap). Compter environ 10 à 15 € par an.
2. Vérifier que la protection des données WHOIS (« WHOIS privacy ») est activée.

### Hébergement (gratuit)
Option recommandée : **Vercel** ou **Cloudflare Pages**.
1. Mettre le contenu du dossier `site/` dans un dépôt GitHub **privé**, sur un compte qui ne permet pas de remonter jusqu'à une autre personne. Un dépôt public sur un profil personnel reste visible et indexable.
2. Sur Vercel : *Add New → Project*, importer le dépôt, choisir *Framework : Other*, sans commande de compilation. Le dossier de sortie est la racine du dépôt (ou `site/`).
3. Dans *Settings → Domains*, ajouter le domaine puis suivre les instructions DNS.

### Adresse email sur le domaine
- **Cloudflare Email Routing** (gratuit) : les messages envoyés à `contact@domaine.com` sont redirigés vers sa boîte Gmail.
- Ou **Zoho Mail** (offre gratuite) pour une vraie boîte de réception.

---

## 3. Google

### Search Console (indispensable)
1. Aller sur https://search.google.com/search-console avec **son** compte Google.
2. *Ajouter une propriété → Domaine*, puis copier l'enregistrement TXT dans les DNS du domaine.
3. *Sitemaps* : soumettre `sitemap.xml`.
4. *Inspection de l'URL* : tester `https://domaine.com/` puis `https://domaine.com/en/`, et cliquer sur « Demander une indexation » pour chacune.

### Vérifier les données structurées
Tester l'adresse du site sur https://search.google.com/test/rich-results : la page doit être reconnue comme « Profile page » avec une « Person ».

### Délais
- Apparition du site sur une recherche de son nom : de quelques jours à quelques semaines.
- Panneau de connaissances (l'encadré avec la photo) : en général plusieurs mois, et sans garantie. Il apparaît plus vite si plusieurs sites cohérents parlent de lui.

### Revendiquer le panneau de connaissances
Quand l'encadré apparaît sur une recherche de son nom, cliquer en bas sur **« Revendiquer ce panneau de connaissances »** et se connecter avec le compte Google utilisé pour la Search Console ou ses profils officiels.

---

## 4. Profils sur les réseaux

C'est Christopher qui crée les comptes, avec son propre email et son propre numéro. Sur chaque plateforme, utiliser :
- **le même nom** : `Christopher Masiree Dibba` ;
- **la même photo** : `site/images/christopher-masiree-dibba.jpg` ;
- **un lien vers le site officiel** dans la bio ;
- **aucune localisation** quand le champ est facultatif.

Plateformes par ordre d'importance : LinkedIn, Instagram, Facebook (page publique), X, puis éventuellement YouTube, Medium et Crunchbase.

### Ensuite, relier les profils au site
1. Dans `index.html` et `en/index.html`, décommenter le bloc `socials` (section Contact) et y mettre les vraies adresses.
2. Dans le bloc `Person` des données structurées (`index.html`), ajouter :

```json
"sameAs": [
  "https://www.linkedin.com/in/ADRESSE",
  "https://www.instagram.com/ADRESSE",
  "https://www.facebook.com/ADRESSE"
]
```

### Textes prêts à copier

**Titre LinkedIn**
> Fondateur & PDG — Masiree Hotel · Dibba Velocity Motors | Entrepreneur & investisseur

**Bio courte (Instagram, X, Facebook) — FR**
> Entrepreneur & investisseur · Fondateur & PDG de Masiree Hotel et Dibba Velocity Motors · Hôtellerie, automobile, agriculture

**Bio courte — EN**
> Entrepreneur & investor · Founder & CEO of Masiree Hotel and Dibba Velocity Motors · Hospitality, automotive, agriculture

**Section « Infos » LinkedIn — FR**
> Homme d'affaires et investisseur, je suis le fondateur et PDG de Masiree Hotel et de Dibba Velocity Motors. Mes investissements couvrent l'hôtellerie, la restauration, l'automobile, l'agriculture et l'élevage.
>
> Né et élevé aux États-Unis, d'origine sénégalaise et gambienne, j'ai étudié l'informatique et la gestion des entreprises à l'Université du Minnesota. Mon parcours, entre deux cultures, m'a appris la discipline, la persévérance et l'importance du travail.
>
> Ma conviction : bâtir des entreprises solides qui créent des emplois et de la valeur dans la durée, en restant fidèle à des principes d'intégrité, de loyauté et d'humilité.

**About — EN**
> Businessman and investor, I am the founder and CEO of Masiree Hotel and Dibba Velocity Motors. My investments span hospitality, restaurants, automotive, agriculture and livestock farming.
>
> Born and raised in the United States, of Senegalese and Gambian descent, I studied Computer Science and Business Management at the University of Minnesota. Growing up between two cultures taught me discipline, perseverance and the value of hard work.
>
> My conviction: build solid companies that create jobs and lasting value, while staying true to integrity, loyalty and humility.

---

## 5. Confidentialité : liste de contrôle

- [ ] Pas de numéro de téléphone sur le site ni dans les bios : seulement l'email.
- [ ] Pas d'adresse, de ville ni de date de naissance complète.
- [ ] Le champ « lieu » reste vide sur les réseaux quand il est facultatif.
- [ ] Les photos sont publiées sans métadonnées (déjà fait pour celles du site). Vérifier aussi l'arrière-plan des nouvelles photos (enseignes, plaques, monuments).
- [ ] La WHOIS privacy est active sur le domaine.
- [ ] Aucune mention « site réalisé par… » qui renverrait vers une autre personne.
- [ ] Les anciens contenus publics le concernant (vieux posts, photos où il est tagué) ont été vérifiés : supprimés ou passés en privé si nécessaire.
