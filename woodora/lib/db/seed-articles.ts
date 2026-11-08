// Starter articles for the "Conseils / Advice" section. Editable from the admin.

export interface SeedArticle {
  language: "fr" | "en";
  markets: Array<"ca" | "us" | "fr">;
  slug: string;
  title: string;
  excerpt: string;
  art: string;
  minutes: number;
  content: string;
}

export const SEED_ARTICLES: SeedArticle[] = [
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "quel-bois-choisir-pour-chauffer-sa-maison",
    title: "Quel bois choisir pour chauffer sa maison ?",
    excerpt: "Feuillus durs, bois tendres, résineux : comment choisir l'essence adaptée à votre appareil et à votre usage.",
    art: "logs",
    minutes: 4,
    content: `Toutes les bûches ne se valent pas. À humidité égale, **un kilo de bois sec dégage à peu près la même énergie quelle que soit l'essence** (environ 4 kWh/kg à 20 % d'humidité). Ce qui change, c'est la **densité** : un mètre cube de chêne pèse beaucoup plus qu'un mètre cube de peuplier, et contient donc beaucoup plus d'énergie.

## Les feuillus durs : la référence du chauffage

Chêne, hêtre, charme, frêne, érable : ces essences denses brûlent lentement et produisent une **braise longue durée**. Ce sont les bois à privilégier pour un chauffage principal, notamment la nuit.

- **Charme et hêtre** : très calorifiques, flamme belle et régulière.
- **Chêne** : excellent, mais doit être particulièrement bien sec (il lui faut souvent deux ans).
- **Érable et merisier** : les grands classiques au Québec, faciles à fendre.

## Les bois tendres et mi-durs

Bouleau, châtaignier, tilleul : ils s'enflamment vite et donnent une belle flamme, mais se consument plus rapidement. Parfaits pour **relancer un feu** ou pour une flambée d'ambiance.

## Et les résineux ?

Sapin, épinette, pin : on les dit « encrassants », mais c'est surtout vrai lorsqu'ils sont humides. Bien secs, ils conviennent très bien à l'**allumage** et aux poêles modernes. Leur densité plus faible impose simplement de recharger plus souvent.

## Le critère numéro un : l'humidité

Quelle que soit l'essence, un bois à plus de 25 % d'humidité chauffe mal, fume et encrasse le conduit. **Visez moins de 20 %** : c'est ce que permet de vérifier un humidimètre en quelques secondes.

## En résumé

| Usage | Notre conseil |
|---|---|
| Chauffage principal | Feuillus durs (chêne, hêtre, charme, érable) |
| Flambée d'ambiance | Bouleau, mélange de feuillus |
| Allumage | Petit bois de résineux bien sec |
| Appareil récent à haut rendement | Bois séché au four |

Vous hésitez sur la quantité ? Notre calculateur estime vos besoins en quelques questions.`,
  },
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "chene-ou-bouleau-quelles-differences",
    title: "Chêne ou bouleau : quelles différences ?",
    excerpt: "Deux bois très appréciés, deux comportements au feu bien différents. Lequel choisir selon votre usage ?",
    art: "logs",
    minutes: 3,
    content: `Le chêne et le bouleau sont parmi les bois de chauffage les plus demandés. Pourtant, ils ne répondent pas aux mêmes besoins.

## La densité fait la différence

Le chêne est nettement plus dense que le bouleau : à volume égal, **une bûche de chêne contient environ 10 à 15 % d'énergie en plus**. Il brûle plus lentement et forme une braise qui tient des heures.

Le bouleau, plus léger, s'enflamme très facilement — même son écorce, riche en résine naturelle (bétuline), sert d'allume-feu. Il offre une **flamme vive et décorative**, mais se consume plus vite.

## Le séchage

- **Chêne** : séchage long, souvent 18 à 24 mois. Brûlé trop humide, il fume et chauffe mal.
- **Bouleau** : sèche plus rapidement, mais son écorce étanche retient l'eau : il doit être fendu tôt pour bien sécher.

## Lequel choisir ?

| Critère | Chêne | Bouleau |
|---|---|---|
| Énergie par volume | Très élevée | Bonne |
| Durée de combustion | Longue | Moyenne |
| Facilité d'allumage | Moyenne | Excellente |
| Aspect de la flamme | Régulière | Vive et lumineuse |
| Usage idéal | Chauffage principal, nuit | Allumage, flambées d'ambiance |

## Le bon compromis

Beaucoup de foyers combinent les deux : **bouleau pour démarrer le feu, chêne (ou un autre feuillu dur) pour l'entretenir**. Nos fiches produits indiquent toujours l'essence, la longueur et l'humidité visée pour vous aider à composer votre stock.`,
  },
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "comment-conserver-son-bois-de-chauffage",
    title: "Comment conserver son bois de chauffage ?",
    excerpt: "Abri, aération, distance du sol : les règles simples pour garder un bois sec toute la saison.",
    art: "kiln",
    minutes: 3,
    content: `Un bon bois mal stocké peut reprendre l'humidité en quelques semaines. Voici les règles essentielles.

## 1. Surélever les bûches

Ne posez jamais le bois directement au sol : utilisez des palettes, des madriers ou un range-bûches. **10 à 15 cm de hauteur** suffisent à éviter les remontées d'humidité.

## 2. Couvrir le dessus, aérer les côtés

Le bois doit être protégé de la pluie et de la neige **sur le dessus uniquement**. Les côtés doivent rester ouverts pour que l'air circule. Une bâche qui enveloppe toute la pile emprisonne l'humidité : c'est l'erreur la plus fréquente.

## 3. Choisir le bon emplacement

- Un endroit **ensoleillé et venté** est idéal.
- Laissez quelques centimètres entre la pile et le mur.
- Évitez les sous-sols humides et les garages non ventilés.

## 4. Ranger serré, écorce vers le haut

Empilez les bûches en rangs réguliers, **écorce vers le haut** sur le dernier rang pour faire office de toit naturel.

## 5. Garder une petite réserve à l'intérieur

Rentrez la quantité de quelques jours près de l'appareil : le bois s'y réchauffe et brûle mieux. Évitez d'en stocker beaucoup dans la maison (insectes, poussière).

## Et le bois séché au four ?

Il arrive très sec : stockez-le **à l'abri complet** (garage ventilé, abri fermé) pour conserver sa faible humidité.

Un humidimètre permet de vérifier en un instant que votre stock reste sous les 20 %.`,
  },
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "quelle-quantite-de-bois-prevoir-pour-l-hiver",
    title: "Quelle quantité de bois prévoir pour l'hiver ?",
    excerpt: "Surface, isolation, climat et appareil : les facteurs qui déterminent votre consommation, et des ordres de grandeur.",
    art: "logs",
    minutes: 4,
    content: `Il n'existe pas de chiffre unique : deux maisons de même surface peuvent consommer du simple au triple. Voici les facteurs qui comptent vraiment.

## Les quatre facteurs principaux

1. **Le climat** : un hiver à Strasbourg ou à Québec n'a rien à voir avec un hiver à Bordeaux ou à Vancouver. Les spécialistes utilisent les *degrés-jours* pour mesurer la rigueur d'un climat.
2. **L'isolation** : une maison mal isolée peut demander trois à cinq fois plus de chaleur qu'une maison récente bien isolée.
3. **L'appareil** : un foyer ouvert ne restitue que 10 à 20 % de l'énergie du bois, contre 65 à 80 % pour un poêle moderne.
4. **L'usage** : flambées du week-end, appoint en soirée ou chauffage principal.

## Des ordres de grandeur

Pour une maison de 100 à 130 m² moyennement isolée, chauffée **principalement** au bois avec un poêle récent :

- en France, comptez souvent **8 à 14 stères** par hiver selon la région ;
- au Québec, **4 à 7 cordes complètes** sont courantes.

En appoint (quelques heures par jour), ces quantités peuvent être divisées par deux ou trois.

## Stère, mètre cube, corde : attention aux unités

- **Stère** : 1 m³ de bûches de 1 m empilées.
- **Mètre cube apparent** : 1 m³ de bûches courtes rangées ; ce n'est pas un stère.
- **Corde complète** : 4 × 4 × 8 pieds, soit 128 pi³.
- **Corde de 16 po (face cord)** : environ un tiers de corde complète.

## Estimez vos besoins en deux minutes

Notre calculateur combine votre code postal (climat), la surface, l'isolation, l'appareil et la durée de chauffe pour produire une **fourchette indicative**, accompagnée des produits adaptés.`,
  },
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "pourquoi-utiliser-du-bois-seche",
    title: "Pourquoi utiliser du bois séché ?",
    excerpt: "Plus de chaleur, moins de fumée, un conduit plus propre : les avantages concrets d'un bois bien sec.",
    art: "kiln",
    minutes: 3,
    content: `Un bois fraîchement coupé contient souvent **40 à 50 % d'eau**. Avant de chauffer votre maison, le feu doit d'abord évaporer cette eau : autant d'énergie perdue.

## Les avantages d'un bois sec

- **Plus de chaleur** : l'énergie sert à chauffer, pas à évaporer de l'eau.
- **Moins de fumée et de particules** : la combustion est plus complète.
- **Un conduit plus propre** : moins de créosote, donc moins de risques de feu de cheminée.
- **Une vitre qui reste propre** sur les poêles et inserts.
- **Un allumage plus facile** et une flamme plus vive.

## Séché à l'air ou séché au four ?

| | Séché à l'air | Séché au four |
|---|---|---|
| Durée | 12 à 24 mois | Quelques jours en séchoir |
| Humidité habituelle | 20 à 25 % | Souvent sous 18 % |
| Prix | Plus économique | Plus élevé |
| Usage idéal | Chauffage principal, grand stock | Appareils récents, usage pratique, petits espaces de stockage |

## Comment vérifier ?

Un bois sec est plus léger, sonne « clair » quand on frappe deux bûches, et présente des fentes aux extrémités. Mais le plus fiable reste l'**humidimètre** : plantez-le dans une face fraîchement fendue. **Sous 20 %, le bois est prêt.**

Sur chaque fiche produit, nous indiquons l'humidité visée par notre fournisseur partenaire.`,
  },
  {
    language: "fr",
    markets: ["fr", "ca"],
    slug: "comment-choisir-ses-granules-de-chauffage",
    title: "Comment choisir ses granulés de chauffage ?",
    excerpt: "Humidité, taux de cendres, certification, résineux ou feuillus : les critères pour bien choisir vos granulés.",
    art: "pellets-bag",
    minutes: 3,
    content: `Les granulés (ou pellets) sont de petits cylindres de sciure compressée. Leur qualité influence directement le rendement et l'entretien de votre poêle.

## Les critères qui comptent

- **L'humidité** : elle doit rester sous 10 %. Un granulé humide se désagrège et chauffe moins.
- **Le taux de cendres** : moins il y en a, moins vous videz le cendrier et moins le brûleur s'encrasse. Les meilleures qualités affichent moins de 0,7 %.
- **La durabilité mécanique** : un granulé solide produit peu de fines (poussière) au fond du sac.
- **Le diamètre** : 6 mm est le standard pour les poêles domestiques.

## Les certifications

Les labels **ENplus®** et **DINplus** (en Europe), ou le programme **PFI** (en Amérique du Nord), attestent que les granulés respectent des seuils précis d'humidité, de cendres et de pouvoir calorifique. Fiez-vous au logo et au numéro de certification imprimés sur le sac.

## Résineux ou feuillus ?

Les granulés de résineux ont souvent un pouvoir calorifique légèrement supérieur et peu de cendres ; les granulés de feuillus brûlent plus lentement. Les deux conviennent à la plupart des poêles : consultez la notice de votre appareil.

## Combien en prévoir ?

Un poêle à granulés utilisé quotidiennement consomme couramment **1 à 3 tonnes par saison** selon la maison et le climat. Notre calculateur vous donne une estimation personnalisée en sacs et en tonnes.

## Bien les stocker

Gardez les sacs dans un endroit **sec et à l'abri**, surélevés du sol, loin des murs humides.`,
  },

  // ----------------------------------------------------------------- English
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "which-firewood-to-heat-your-home",
    title: "Which firewood should you choose to heat your home?",
    excerpt: "Hardwoods, softwoods and mixed loads: how to pick the right species for your stove and your needs.",
    art: "logs",
    minutes: 4,
    content: `Not all logs are equal. At the same moisture content, **a pound of dry wood holds roughly the same energy whatever the species** (about 4 kWh/kg at 20% moisture). What changes is **density**: a cord of oak weighs far more than a cord of poplar, so it holds far more heat.

## Hardwoods: the benchmark for heating

Oak, hickory, sugar maple, ash and beech burn slowly and leave **long-lasting coals**. They are the woods to choose for main heating and overnight burns.

- **Hickory and oak**: among the highest heat per cord. Oak needs thorough seasoning.
- **Sugar maple and ash**: excellent heat, easy to split, dry relatively fast.

## Medium-density woods

Birch, cherry and red maple light easily and give beautiful flames, but burn faster. Great for **evening fires** and for getting a fire going.

## What about softwoods?

Pine, spruce and fir are often blamed for creosote, but that is mostly true when they are wet. Well dried, they make **excellent kindling** and work fine in modern stoves — you simply reload more often.

## The number-one factor: moisture

Whatever the species, wood above 25% moisture heats poorly, smokes and fouls the chimney. **Aim for under 20%** — a moisture meter tells you in seconds.

## Quick guide

| Use | Our advice |
|---|---|
| Main heating | Hardwoods (oak, hickory, maple, ash) |
| Evening fires | Birch, cherry, mixed hardwoods |
| Kindling | Dry softwood |
| Modern high-efficiency stove | Kiln-dried firewood |

Not sure how much you need? Our heating calculator estimates it in a few questions.`,
  },
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "oak-vs-birch-firewood",
    title: "Oak vs. birch firewood: what's the difference?",
    excerpt: "Two popular firewoods with very different behavior in the stove. Which one fits your needs?",
    art: "logs",
    minutes: 3,
    content: `Oak and birch are both in high demand, yet they answer different needs.

## Density makes the difference

Oak is noticeably denser than birch: by volume, **an oak log holds roughly 10–15% more energy**. It burns slower and builds a bed of coals that lasts for hours.

Birch is lighter and catches fire very easily — its bark, rich in natural oils (betulin), is a classic fire starter. It gives **bright, lively flames** but burns faster.

## Seasoning

- **Oak**: slow to dry, often 18–24 months. Burned too wet, it smokes and heats poorly.
- **Birch**: dries faster, but its waterproof bark traps moisture — split it early so it can dry.

## Which one to choose?

| | Oak | Birch |
|---|---|---|
| Heat per cord | Very high | Good |
| Burn time | Long | Medium |
| Ease of lighting | Medium | Excellent |
| Flame | Steady | Bright and lively |
| Best for | Main heating, overnight | Starting fires, evening ambiance |

## The best of both

Many households combine them: **birch to get the fire going, oak (or another dense hardwood) to keep it burning**. Every product page lists the species, log length and target moisture so you can build the right mix.`,
  },
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "how-to-store-firewood",
    title: "How to store firewood the right way",
    excerpt: "Cover, airflow and ground clearance: simple rules to keep your wood dry all season.",
    art: "kiln",
    minutes: 3,
    content: `Good firewood stored badly can soak up moisture again within weeks. Here are the essentials.

## 1. Keep it off the ground

Never stack wood directly on soil or concrete. Use pallets, rails or a log rack: **4 to 6 inches** of clearance stops moisture from wicking up.

## 2. Cover the top, leave the sides open

Protect the stack from rain and snow **on top only**. The sides must stay open so air can move through. A tarp wrapped around the whole pile traps moisture — the most common mistake.

## 3. Pick the right spot

- A **sunny, breezy** location is ideal.
- Leave a few inches between the stack and any wall.
- Avoid damp basements and unventilated garages.

## 4. Stack tight, bark up

Build tidy rows and place the top layer **bark side up** to shed water like a roof.

## 5. Keep a small supply indoors

Bring in a few days' worth near the stove so it warms up and burns better. Don't store large amounts inside (insects, dust).

## What about kiln-dried wood?

It arrives very dry: keep it **fully sheltered** (ventilated garage or closed shed) to preserve its low moisture.

A moisture meter lets you check in seconds that your supply stays under 20%.`,
  },
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "how-much-firewood-for-winter",
    title: "How much firewood do you need for the winter?",
    excerpt: "Climate, insulation, appliance and usage: what drives your consumption, with realistic ranges.",
    art: "logs",
    minutes: 4,
    content: `There is no single number: two homes of the same size can burn anywhere from one to three times as much wood. These are the factors that really matter.

## The four main factors

1. **Climate**: a Vermont or Québec winter is nothing like one in Virginia or Vancouver. Engineers measure it in *heating degree-days*.
2. **Insulation**: a poorly insulated house can need three to five times more heat than a recent, well-insulated one.
3. **Appliance**: an open fireplace returns only 10–20% of the wood's energy, compared with 65–80% for a modern EPA-certified stove.
4. **Usage**: weekend fires, evening supplemental heat, or main heating.

## Ballpark figures

For a 1,500–2,000 sq ft home with average insulation, heated **mainly** with wood in a modern stove:

- in the Northeast and Midwest, **3 to 6 full cords** per winter are common;
- in Québec and northern Ontario, **4 to 7 full cords**.

As supplemental heat (a few hours a day), divide by two or three.

## Cord, face cord, rick: watch the units

- **Full cord**: 4 × 4 × 8 ft = 128 ft³ of stacked wood.
- **Face cord / rick**: one row 4 × 8 ft of logs — with 16-inch logs, about one third of a full cord.
- Always ask for the **volume in cubic feet**: words vary by region, volumes don't.

## Get your estimate in two minutes

Our calculator combines your ZIP or postal code (climate), floor area, insulation, appliance and heating period to give an **indicative range**, along with matching products.`,
  },
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "why-choose-kiln-dried-firewood",
    title: "Why choose kiln-dried firewood?",
    excerpt: "More heat, less smoke, a cleaner chimney: the concrete benefits of truly dry wood.",
    art: "kiln",
    minutes: 3,
    content: `Freshly cut wood often contains **40–50% water**. Before it can heat your home, the fire has to boil that water off — wasted energy.

## Benefits of dry wood

- **More heat**: energy goes into your room, not into evaporating water.
- **Less smoke and fewer particles**: combustion is more complete.
- **A cleaner chimney**: less creosote, lower risk of chimney fires.
- **Clean glass** on stoves and inserts.
- **Easier lighting** and livelier flames.

## Seasoned vs. kiln-dried

| | Air-seasoned | Kiln-dried |
|---|---|---|
| Drying time | 12–24 months | A few days in a kiln |
| Typical moisture | 20–25% | Often below 18% |
| Price | Lower | Higher |
| Best for | Main heating, large supply | Modern stoves, convenience, small storage |

Kiln drying also reaches temperatures that kill insects and their eggs, which is why many states accept certified heat-treated firewood when moving wood is regulated.

## How to check

Dry wood is lighter, sounds hollow when two logs knock together, and shows cracks on the ends. The most reliable test is a **moisture meter** on a freshly split face: **below 20%, it's ready**.

Every product page shows the target moisture announced by our partner supplier.`,
  },
  {
    language: "en",
    markets: ["us", "ca"],
    slug: "how-to-choose-wood-pellets",
    title: "How to choose wood pellets",
    excerpt: "Moisture, ash content, certification, hardwood or softwood: what to look for on the bag.",
    art: "pellets-bag",
    minutes: 3,
    content: `Pellets are small cylinders of compressed sawdust. Their quality directly affects your stove's efficiency and maintenance.

## What matters

- **Moisture**: should stay below 10%. Damp pellets crumble and heat less.
- **Ash content**: the lower, the less often you empty the ash pan and the cleaner the burn pot. Premium grades are below 1%.
- **Durability**: strong pellets leave few fines (dust) at the bottom of the bag.
- **Diameter**: 6 mm (1/4") is standard for residential stoves.

## Certifications

The **PFI** standards program in North America and **ENplus®** in Europe certify pellets against precise thresholds for moisture, ash and heating value. Look for the logo and certification number printed on the bag.

## Hardwood or softwood?

Softwood pellets often have a slightly higher heating value and low ash; hardwood pellets burn a bit slower. Both work in most stoves — check your appliance manual.

## How many do you need?

A pellet stove used every day commonly burns **1 to 3 tons per season**, depending on the house and climate. Our calculator gives a personalized estimate in bags and tons.

## Storage

Keep bags somewhere **dry and sheltered**, off the ground and away from damp walls.`,
  },
];
