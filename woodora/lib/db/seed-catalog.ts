// Starter catalogue for the three markets. Every value (prices, purchase
// costs, specifications, suppliers, zones) is a starting point to be reviewed
// and edited from the administration before launch.

import type { MarketId } from "../markets";
import type { CategoryKey } from "../sites";
import type { SaleUnit, SpeciesKey } from "../energy";
import { speciesCatalog } from "./seed-species-catalog";

export type L = { fr?: string; en?: string };

export const SEED_CATEGORIES: Array<{ id: CategoryKey; name: Required<L>; description: Required<L> }> = [
  {
    id: "firewood",
    name: { fr: "Bois de chauffage", en: "Firewood" },
    description: {
      fr: "Bûches de feuillus fendues et séchées à l'air libre, prêtes à brûler dans votre poêle, insert ou cheminée.",
      en: "Split hardwood logs, air-seasoned and ready to burn in your stove, insert or fireplace.",
    },
  },
  {
    id: "kiln-dried",
    name: { fr: "Bois séché", en: "Kiln-dried firewood" },
    description: {
      fr: "Bois extra-sec passé en séchoir : allumage rapide, flamme vive, moins de fumée et de dépôts.",
      en: "Extra-dry wood from the kiln: quick lighting, bright flames, less smoke and creosote.",
    },
  },
  {
    id: "pellets",
    name: { fr: "Granulés", en: "Wood pellets" },
    description: {
      fr: "Granulés de bois à faible humidité pour poêles et chaudières à granulés, en sacs ou en palettes.",
      en: "Low-moisture wood pellets for pellet stoves and boilers, by the bag or by the pallet.",
    },
  },
  {
    id: "briquettes",
    name: { fr: "Briquettes", en: "Compressed logs" },
    description: {
      fr: "Bûches de bois compressé : très denses, régulières et faciles à stocker.",
      en: "Compressed wood logs: dense, consistent and easy to store.",
    },
  },
  {
    id: "kindling",
    name: { fr: "Bois d'allumage", en: "Kindling" },
    description: {
      fr: "Petit bois sec et allume-feu pour démarrer chaque flambée sans effort.",
      en: "Dry small wood and starters to light every fire effortlessly.",
    },
  },
  {
    id: "accessories",
    name: { fr: "Accessoires", en: "Accessories" },
    description: {
      fr: "Les compléments utiles : humidimètre, allume-feu naturels, transport des bûches.",
      en: "Useful extras: moisture meter, natural fire starters, log carriers.",
    },
  },
];

export type Packaging = "pallet" | "big_bag" | "net_bag" | "bag" | "bulk" | "box" | "bundle" | "crate" | "none";

export interface SeedProduct {
  market: MarketId;
  slug: string;
  category: CategoryKey;
  art: string;
  species?: SpeciesKey;
  moisture?: number; // %
  lengthCm?: number;
  packaging: Packaging;
  unit: SaleUnit;
  volumeM3?: number;
  weightKg?: number;
  packing?: "stacked" | "loose";
  min: number;
  price: number; // cents
  cost: number; // cents
  featured?: boolean;
  active?: boolean;
  available?: boolean;
  stock?: number;
  name: L;
  short: L;
  desc: L;
}

const IN16 = 40.64;

const OTHER_PRODUCTS: SeedProduct[] = [
  // ------------------------------------------------------------------ Canada
  {
    market: "ca", slug: "bois-franc-erable-merisier-face-cord", category: "firewood", art: "logs", species: "maple",
    moisture: 20, lengthCm: IN16, packaging: "bulk", unit: "face_cord", min: 2, price: 13900, cost: 9500, featured: true,
    name: { fr: "Bois franc — érable et merisier", en: "Hardwood — maple & yellow birch" },
    short: {
      fr: "Bûches de 16 po fendues, séchées à l'air au moins 12 mois.",
      en: "16-inch split logs, air-seasoned for at least 12 months.",
    },
    desc: {
      fr: "Un mélange d'érable et de merisier, deux bois francs denses qui offrent une chaleur longue et régulière. Les bûches sont fendues à la bonne taille pour la plupart des poêles et foyers, puis séchées à l'air libre sous abri. Vendu à la face cord (corde de 16 po) : la quantité exacte livrée est indiquée ci-dessous.",
      en: "A blend of maple and yellow birch, two dense hardwoods that give long, steady heat. Logs are split to fit most stoves and fireplaces, then seasoned outdoors under cover. Sold by the face cord: the exact quantity delivered is stated below.",
    },
  },
  {
    market: "ca", slug: "bois-franc-corde-complete", category: "firewood", art: "logs", species: "maple",
    moisture: 20, lengthCm: IN16, packaging: "bulk", unit: "full_cord", min: 1, price: 38900, cost: 27000, featured: true,
    name: { fr: "Bois franc — corde complète", en: "Hardwood — full cord" },
    short: {
      fr: "128 pi³ de bois franc fendu : la solution pour tout l'hiver.",
      en: "128 ft³ of split hardwood: your whole winter in one delivery.",
    },
    desc: {
      fr: "La corde complète (4 × 4 × 8 pi) est le format le plus économique pour un chauffage principal. Bois franc d'érable et de merisier, bûches de 16 po, séché à l'air. Idéal si vous chauffez au bois tout l'hiver.",
      en: "The full cord (4 × 4 × 8 ft) is the most economical format for main heating. Maple and yellow birch hardwood, 16-inch logs, air-seasoned. Ideal if you heat with wood all winter.",
    },
  },
  {
    market: "ca", slug: "bois-franc-demi-corde", category: "firewood", art: "logs", species: "maple",
    moisture: 20, lengthCm: IN16, packaging: "bulk", unit: "half_cord", min: 1, price: 21500, cost: 15000,
    name: { fr: "Bois franc — demi-corde", en: "Hardwood — half cord" },
    short: { fr: "64 pi³ de bois franc, pour un chauffage d'appoint.", en: "64 ft³ of hardwood for supplemental heating." },
    desc: {
      fr: "La demi-corde convient aux foyers qui chauffent au bois en appoint ou en soirée. Même qualité que notre corde complète : érable et merisier, bûches de 16 po.",
      en: "A half cord suits homes that use wood for supplemental or evening heat. Same quality as our full cord: maple and yellow birch, 16-inch logs.",
    },
  },
  {
    market: "ca", slug: "bois-seche-four-erable-face-cord", category: "kiln-dried", art: "kiln", species: "maple",
    moisture: 15, lengthCm: IN16, packaging: "bulk", unit: "face_cord", min: 1, price: 18900, cost: 13000, featured: true,
    name: { fr: "Bois séché au four — érable", en: "Kiln-dried maple" },
    short: { fr: "Humidité visée sous 15 % : s'allume vite, brûle propre.", en: "Target moisture under 15%: lights fast, burns clean." },
    desc: {
      fr: "Séché en séchoir, ce bois d'érable atteint une humidité bien inférieure au bois séché à l'air. Résultat : allumage rapide, flamme vive, moins de fumée et moins de créosote dans la cheminée. Parfait pour les poêles modernes à haut rendement.",
      en: "Dried in a kiln, this maple reaches a moisture level well below air-seasoned wood. The result: quick lighting, lively flames, less smoke and less creosote in your chimney. Perfect for modern high-efficiency stoves.",
    },
  },
  {
    market: "ca", slug: "bois-seche-four-palette", category: "kiln-dried", art: "logs-pallet", species: "birch",
    moisture: 15, lengthCm: IN16, packaging: "pallet", unit: "pallet", volumeM3: 1.81, min: 1, price: 32900, cost: 23000,
    name: { fr: "Bois séché au four — palette 64 pi³", en: "Kiln-dried firewood — 64 ft³ pallet" },
    short: { fr: "Bouleau séché au four, cordé sur palette, prêt à ranger.", en: "Kiln-dried birch stacked on a pallet, ready to store." },
    desc: {
      fr: "Une palette de 4 × 4 × 4 pi (64 pi³, l'équivalent d'une demi-corde) de bouleau séché au four, cordé et filmé. Pratique à stocker, propre à manipuler, livré prêt à brûler.",
      en: "A 4 × 4 × 4 ft pallet (64 ft³, the equivalent of a half cord) of kiln-dried birch, stacked and wrapped. Easy to store, clean to handle, delivered ready to burn.",
    },
  },
  {
    market: "ca", slug: "granules-bois-franc-sac-40-lb", category: "pellets", art: "pellets-bag", species: "mixed_hardwood",
    moisture: 7, lengthCm: 2.5, packaging: "bag", unit: "bag", weightKg: 18.14, min: 10, price: 849, cost: 600,
    name: { fr: "Granulés de bois franc — sac de 40 lb", en: "Hardwood pellets — 40 lb bag" },
    short: { fr: "Granulés de 6 mm, faible taux de cendres.", en: "6 mm pellets with a low ash content." },
    desc: {
      fr: "Granulés de bois franc de 6 mm, à faible humidité, pour poêles et chaudières à granulés. Vendus au sac de 40 lb (18,1 kg), minimum 10 sacs par commande.",
      en: "Low-moisture 6 mm hardwood pellets for pellet stoves and boilers. Sold by the 40 lb (18.1 kg) bag, minimum 10 bags per order.",
    },
  },
  {
    market: "ca", slug: "granules-palette-70-sacs", category: "pellets", art: "pellets-pallet", species: "mixed_hardwood",
    moisture: 7, lengthCm: 2.5, packaging: "pallet", unit: "pallet", weightKg: 1270, min: 1, price: 52900, cost: 39000, featured: true,
    name: { fr: "Granulés — palette de 70 sacs", en: "Wood pellets — pallet of 70 bags" },
    short: { fr: "70 sacs de 40 lb, soit 1,27 tonne de granulés.", en: "70 bags of 40 lb — 1.27 tonnes of pellets." },
    desc: {
      fr: "La palette complète pour passer la saison : 70 sacs de 40 lb de granulés de bois franc, filmés sur palette. Le format le plus avantageux pour un poêle utilisé chaque jour.",
      en: "A full pallet for the season: 70 bags of 40 lb hardwood pellets, wrapped on a pallet. The best value for a stove used every day.",
    },
  },
  {
    market: "ca", slug: "buches-compressees-boite-10", category: "briquettes", art: "briquettes", species: "mixed_hardwood",
    moisture: 8, packaging: "box", unit: "pack", weightKg: 11, min: 5, price: 1999, cost: 1300,
    name: { fr: "Bûches compressées — boîte de 10", en: "Compressed logs — box of 10" },
    short: { fr: "Sciure de bois franc compressée, sans additif.", en: "Compressed hardwood sawdust, no additives." },
    desc: {
      fr: "Des bûches très denses fabriquées à partir de sciure de bois franc compressée, sans liant ajouté. Elles brûlent longtemps avec peu de cendres et se rangent facilement. Boîte de 10 bûches (environ 11 kg).",
      en: "Dense logs made of compressed hardwood sawdust with no added binder. They burn for a long time with little ash and store neatly. Box of 10 logs (about 11 kg).",
    },
  },
  {
    market: "ca", slug: "bois-allumage-pied-cube", category: "kindling", art: "kindling", species: "softwood",
    moisture: 15, lengthCm: 30, packaging: "box", unit: "cubic_foot", packing: "loose", min: 3, price: 1299, cost: 800,
    name: { fr: "Bois d'allumage — boîte de 1 pi³", en: "Kindling — 1 ft³ box" },
    short: { fr: "Petit bois d'épinette, très sec, fendu fin.", en: "Very dry spruce kindling, finely split." },
    desc: {
      fr: "Du petit bois d'épinette fendu fin et bien sec pour démarrer vos feux en quelques minutes. Boîte d'un pied cube.",
      en: "Finely split, very dry spruce kindling to start your fires in minutes. One cubic foot box.",
    },
  },
  {
    market: "ca", slug: "allume-feu-laine-de-bois-50", category: "accessories", art: "starters",
    packaging: "box", unit: "pack", min: 1, price: 1499, cost: 800,
    name: { fr: "Allume-feu naturels — 50 unités", en: "Natural fire starters — 50 count" },
    short: { fr: "Laine de bois et cire végétale, sans odeur.", en: "Wood wool and plant wax, odourless." },
    desc: {
      fr: "Des allume-feu en laine de bois enrobée de cire végétale : un seul suffit pour allumer une flambée, sans produit pétrolier ni odeur.",
      en: "Fire starters made of wood wool coated in plant wax: one is enough to light a fire, with no petroleum products and no smell.",
    },
  },
  {
    market: "ca", slug: "humidimetre-bois", category: "accessories", art: "meter",
    packaging: "box", unit: "piece", min: 1, price: 3999, cost: 2200,
    name: { fr: "Humidimètre pour bois de chauffage", en: "Firewood moisture meter" },
    short: { fr: "Vérifiez en 2 secondes si votre bois est prêt à brûler.", en: "Check in 2 seconds whether your wood is ready to burn." },
    desc: {
      fr: "Plantez les deux pointes dans une bûche fraîchement fendue : l'écran affiche le taux d'humidité. Sous 20 %, le bois est prêt. Piles incluses.",
      en: "Push the two pins into a freshly split log and read the moisture content. Below 20%, the wood is ready. Batteries included.",
    },
  },
  {
    market: "ca", slug: "sac-transport-buches", category: "accessories", art: "carrier",
    packaging: "none", unit: "piece", min: 1, price: 3499, cost: 1800,
    name: { fr: "Sac de transport pour bûches", en: "Log carrier bag" },
    short: { fr: "Toile épaisse et poignées renforcées.", en: "Heavy canvas with reinforced handles." },
    desc: {
      fr: "Transportez vos bûches de la cordée au poêle sans salir la maison. Toile de coton épaisse, poignées renforcées, se plie à plat.",
      en: "Carry logs from the woodpile to the stove without a mess. Heavy cotton canvas, reinforced handles, folds flat.",
    },
  },

  // ------------------------------------------------------------------ United States
  {
    market: "us", slug: "seasoned-hardwood-full-cord", category: "firewood", art: "logs", species: "oak",
    moisture: 20, lengthCm: IN16, packaging: "bulk", unit: "full_cord", min: 1, price: 32900, cost: 23000, featured: true,
    name: { en: "Seasoned hardwood — full cord" },
    short: { en: "Oak and hickory, 16-inch splits, seasoned 12+ months." },
    desc: {
      en: "A true full cord (4 × 4 × 8 ft, 128 ft³) of oak and hickory, two of the densest firewoods available. Split to 16 inches and seasoned outdoors for over a year. The best value for heating your home all winter.",
    },
  },
  {
    market: "us", slug: "seasoned-hardwood-face-cord", category: "firewood", art: "logs", species: "oak",
    moisture: 20, lengthCm: IN16, packaging: "bulk", unit: "face_cord", min: 1, price: 14900, cost: 10200, featured: true,
    name: { en: "Seasoned hardwood — face cord" },
    short: { en: "One row of 16-inch oak and hickory: about 1/3 of a full cord." },
    desc: {
      en: "A face cord is a single row 4 ft high and 8 ft long of 16-inch logs. Oak and hickory, seasoned and split, great for evening fires and supplemental heat.",
    },
  },
  {
    market: "us", slug: "kiln-dried-oak-pallet", category: "kiln-dried", art: "logs-pallet", species: "oak",
    moisture: 15, lengthCm: IN16, packaging: "pallet", unit: "pallet", volumeM3: 1.21, min: 1, price: 29900, cost: 21000,
    name: { en: "Kiln-dried oak — pallet (≈ 1/3 cord)" },
    short: { en: "42.7 ft³ of kiln-dried oak, stacked and wrapped." },
    desc: {
      en: "Kiln-dried oak stacked on a pallet: about 42.7 ft³, the equivalent of one face cord of 16-inch logs. Lights quickly, burns hot and clean, and stays tidy in your garage.",
    },
  },
  {
    market: "us", slug: "kiln-dried-mixed-hardwood-rick", category: "kiln-dried", art: "kiln", species: "mixed_hardwood",
    moisture: 15, lengthCm: IN16, packaging: "bulk", unit: "rick", min: 1, price: 19900, cost: 14000, featured: true,
    name: { en: "Kiln-dried mixed hardwood — rick" },
    short: { en: "Target moisture under 15%. Less smoke, more heat." },
    desc: {
      en: "A rick of kiln-dried mixed hardwoods (oak, ash, maple), 16-inch logs. Kiln drying brings moisture far below air-seasoned wood for easy lighting and a cleaner burn.",
    },
  },
  {
    market: "us", slug: "premium-wood-pellets-40-lb", category: "pellets", art: "pellets-bag", species: "mixed_hardwood",
    moisture: 7, lengthCm: 2.5, packaging: "bag", unit: "bag", weightKg: 18.14, min: 20, price: 699, cost: 480,
    name: { en: "Premium wood pellets — 40 lb bag" },
    short: { en: "Low-ash hardwood pellets for pellet stoves and boilers." },
    desc: {
      en: "Premium 6 mm hardwood pellets with low moisture and low ash for a steady, clean burn. Sold by the 40 lb bag, minimum 20 bags per order.",
    },
  },
  {
    market: "us", slug: "premium-wood-pellets-pallet", category: "pellets", art: "pellets-pallet", species: "mixed_hardwood",
    moisture: 7, lengthCm: 2.5, packaging: "pallet", unit: "pallet", weightKg: 907, min: 1, price: 34900, cost: 26000, featured: true,
    name: { en: "Premium wood pellets — 1 ton pallet" },
    short: { en: "50 bags of 40 lb (2,000 lb) on one pallet." },
    desc: {
      en: "A full ton of premium hardwood pellets: 50 bags of 40 lb, wrapped on a pallet. The most economical way to stock up for the heating season.",
    },
  },
  {
    market: "us", slug: "compressed-hardwood-logs-6", category: "briquettes", art: "briquettes", species: "mixed_hardwood",
    moisture: 8, packaging: "box", unit: "pack", weightKg: 6.8, min: 6, price: 1499, cost: 950,
    name: { en: "Compressed hardwood logs — case of 6" },
    short: { en: "100% compressed hardwood, no binders, low ash." },
    desc: {
      en: "Dense logs made from compressed hardwood sawdust with no added binders or chemicals. Each case holds 6 logs (about 15 lb) that burn long and leave very little ash.",
    },
  },
  {
    market: "us", slug: "kiln-dried-kindling-cubic-foot", category: "kindling", art: "kindling", species: "softwood",
    moisture: 12, lengthCm: 30, packaging: "box", unit: "cubic_foot", packing: "loose", min: 2, price: 1499, cost: 900,
    name: { en: "Kiln-dried kindling — 1 ft³ box" },
    short: { en: "Finely split pine kindling, kiln-dried." },
    desc: { en: "Kiln-dried pine split into thin sticks for fast, reliable fire starting. One cubic foot box." },
  },
  {
    market: "us", slug: "natural-fire-starters-48", category: "accessories", art: "starters",
    packaging: "box", unit: "pack", min: 1, price: 1699, cost: 900,
    name: { en: "Natural fire starters — 48 count" },
    short: { en: "Wood wool and plant wax — no chemicals, no odor." },
    desc: { en: "Wood wool coated in plant wax. One starter lights a fire, with no petroleum products and no smell." },
  },
  {
    market: "us", slug: "firewood-moisture-meter", category: "accessories", art: "meter",
    packaging: "box", unit: "piece", min: 1, price: 3499, cost: 1900,
    name: { en: "Firewood moisture meter" },
    short: { en: "Know in seconds if your wood is ready to burn." },
    desc: { en: "Push the pins into a freshly split face and read the moisture. Below 20% the wood is ready to burn. Batteries included." },
  },
  {
    market: "us", slug: "canvas-log-carrier", category: "accessories", art: "carrier",
    packaging: "none", unit: "piece", min: 1, price: 3999, cost: 2000,
    name: { en: "Canvas log carrier" },
    short: { en: "Heavy-duty canvas with reinforced handles." },
    desc: { en: "Bring logs from the woodpile to the stove without a mess. Heavy cotton canvas, reinforced handles, folds flat." },
  },

  // ------------------------------------------------------------------ France
  {
    market: "fr", slug: "chene-hetre-buches-50-cm", category: "firewood", art: "logs", species: "oak",
    moisture: 22, lengthCm: 50, packaging: "bulk", unit: "cubic_meter", min: 2, price: 11500, cost: 8000, featured: true,
    name: { fr: "Chêne et hêtre — bûches de 50 cm" },
    short: { fr: "Feuillus durs fendus, séchés 18 mois sous abri." },
    desc: {
      fr: "Un mélange de chêne et de hêtre, deux essences denses au fort pouvoir calorifique. Bûches de 50 cm fendues, séchées au moins 18 mois sous abri. Vendu au mètre cube apparent (bûches rangées) : la quantité réelle est détaillée ci-dessous.",
    },
  },
  {
    market: "fr", slug: "charme-buches-33-cm", category: "firewood", art: "logs", species: "hornbeam",
    moisture: 22, lengthCm: 33, packaging: "bulk", unit: "cubic_meter", min: 2, price: 12900, cost: 9000, featured: true,
    name: { fr: "Charme — bûches de 33 cm" },
    short: { fr: "L'une des essences les plus calorifiques, en bûches courtes." },
    desc: {
      fr: "Le charme est réputé pour sa densité et sa braise longue durée. Bûches de 33 cm adaptées aux poêles et inserts, fendues et séchées sous abri. Vendu au mètre cube apparent.",
    },
  },
  {
    market: "fr", slug: "feuillus-durs-buches-1-m-stere", category: "firewood", art: "logs", species: "mixed_hardwood",
    moisture: 22, lengthCm: 100, packaging: "bulk", unit: "stere", min: 3, price: 8500, cost: 5800,
    name: { fr: "Mélange de feuillus durs — bûches de 1 m" },
    short: { fr: "Le format traditionnel au stère, à recouper chez vous." },
    desc: {
      fr: "Chêne, hêtre, charme et frêne en bûches de 1 m, vendus au stère. Le format le plus économique si vous disposez d'une scie pour recouper à la longueur de votre appareil.",
    },
  },
  {
    market: "fr", slug: "bois-sec-seche-four-palette-1-8-m3", category: "kiln-dried", art: "logs-pallet", species: "mixed_hardwood",
    moisture: 16, lengthCm: 33, packaging: "pallet", unit: "pallet", volumeM3: 1.8, min: 1, price: 31900, cost: 22500, featured: true,
    name: { fr: "Bois séché au four — palette de 1,8 m³" },
    short: { fr: "Bûches de 33 cm, humidité visée inférieure à 18 %." },
    desc: {
      fr: "Chêne, hêtre et charme séchés en séchoir, en bûches de 33 cm rangées sur palette (1,8 m³ apparent). Prêt à brûler dès la livraison : allumage facile, combustion propre, rendement optimal pour les appareils récents.",
    },
  },
  {
    market: "fr", slug: "sac-buches-extra-seches-40-l", category: "kiln-dried", art: "logs-bag", species: "mixed_hardwood",
    moisture: 16, lengthCm: 25, packaging: "bag", unit: "bag", weightKg: 15, packing: "loose", min: 5, price: 890, cost: 520,
    name: { fr: "Bûches extra-sèches — sac de 40 L" },
    short: { fr: "Environ 15 kg de bûches de 25 cm, pratiques à stocker." },
    desc: {
      fr: "Des bûches de feuillus séchées au four, conditionnées en sac de 40 L (environ 15 kg). Idéal pour un usage occasionnel ou si vous manquez de place pour stocker du bois.",
    },
  },
  {
    market: "fr", slug: "granules-bois-palette-66-sacs", category: "pellets", art: "pellets-pallet", species: "softwood",
    moisture: 8, lengthCm: 2.5, packaging: "pallet", unit: "pallet", weightKg: 990, min: 1, price: 42900, cost: 33000, featured: true,
    name: { fr: "Granulés de bois — palette de 66 sacs" },
    short: { fr: "66 sacs de 15 kg, soit 990 kg de granulés." },
    desc: {
      fr: "Granulés de résineux de 6 mm, à faible humidité et faible taux de cendres, pour poêles et chaudières à granulés. Palette de 66 sacs de 15 kg filmée, le format le plus économique pour la saison.",
    },
  },
  {
    market: "fr", slug: "granules-bois-sac-15-kg", category: "pellets", art: "pellets-bag", species: "softwood",
    moisture: 8, lengthCm: 2.5, packaging: "bag", unit: "bag", weightKg: 15, min: 10, price: 690, cost: 480,
    name: { fr: "Granulés de bois — sac de 15 kg" },
    short: { fr: "Au sac, à partir de 10 sacs." },
    desc: {
      fr: "Les mêmes granulés de 6 mm que notre palette, vendus au sac de 15 kg pour tester ou compléter votre stock. Minimum 10 sacs par commande.",
    },
  },
  {
    market: "fr", slug: "buches-bois-compresse-palette", category: "briquettes", art: "briquettes", species: "mixed_hardwood",
    moisture: 8, packaging: "pallet", unit: "pallet", weightKg: 960, min: 1, price: 39900, cost: 30000,
    name: { fr: "Bûches de bois compressé — palette de 960 kg" },
    short: { fr: "96 packs de 10 kg de bûches denses et régulières." },
    desc: {
      fr: "Fabriquées à partir de sciure de feuillus compressée sans liant, ces bûches très denses offrent une combustion longue avec peu de cendres. Palette de 96 packs de 10 kg.",
    },
  },
  {
    market: "fr", slug: "buches-bois-compresse-pack-10-kg", category: "briquettes", art: "briquettes", species: "mixed_hardwood",
    moisture: 8, packaging: "bag", unit: "pack", weightKg: 10, min: 10, price: 650, cost: 430,
    name: { fr: "Bûches de bois compressé — pack de 10 kg" },
    short: { fr: "Au pack, à partir de 10 packs." },
    desc: { fr: "Les mêmes bûches compressées, en pack de 10 kg filmé. Minimum 10 packs par commande." },
  },
  {
    market: "fr", slug: "petit-bois-allumage-sac-20-l", category: "kindling", art: "kindling", species: "softwood",
    moisture: 15, lengthCm: 25, packaging: "bag", unit: "bag", weightKg: 3.5, packing: "loose", min: 3, price: 690, cost: 380,
    name: { fr: "Petit bois d'allumage — sac de 20 L" },
    short: { fr: "Résineux fendu fin, très sec, environ 3,5 kg." },
    desc: { fr: "Du petit bois de résineux fendu fin pour allumer vos flambées en quelques minutes. Sac de 20 L (environ 3,5 kg)." },
  },
  {
    market: "fr", slug: "allume-feu-laine-de-bois-100", category: "accessories", art: "starters",
    packaging: "box", unit: "pack", min: 1, price: 1290, cost: 650,
    name: { fr: "Allume-feu naturels — 100 pièces" },
    short: { fr: "Laine de bois et cire végétale, sans odeur." },
    desc: { fr: "Laine de bois enrobée de cire végétale : un seul allume-feu suffit, sans produit pétrolier ni odeur." },
  },
  {
    market: "fr", slug: "humidimetre-bois-de-chauffage", category: "accessories", art: "meter",
    packaging: "box", unit: "piece", min: 1, price: 2990, cost: 1600,
    name: { fr: "Humidimètre pour bois de chauffage" },
    short: { fr: "Vérifiez que votre bois affiche moins de 20 % d'humidité." },
    desc: { fr: "Plantez les pointes dans une face fraîchement fendue et lisez le taux d'humidité. Sous 20 %, le bois est prêt à brûler. Piles fournies." },
  },
  {
    market: "fr", slug: "panier-a-buches-feutre", category: "accessories", art: "carrier",
    packaging: "none", unit: "piece", min: 1, price: 3490, cost: 1700,
    name: { fr: "Panier à bûches en feutre" },
    short: { fr: "Feutre épais et anses en cuir." },
    desc: { fr: "Un panier en feutre épais pour transporter et présenter vos bûches près du poêle. Anses renforcées, se plie à plat." },
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  ...speciesCatalog(),
  ...OTHER_PRODUCTS.filter((p) => p.category !== "firewood" && p.category !== "kiln-dried"),
];

export const SEED_SUPPLIERS: Array<{
  market: MarketId;
  name: string;
  city: string;
  region: string;
  leadMin: number;
  leadMax: number;
}> = [
  { market: "ca", name: "Fournisseur partenaire — Québec", city: "", region: "QC", leadMin: 3, leadMax: 7 },
  { market: "us", name: "Partner supplier — Northeast", city: "", region: "NY", leadMin: 3, leadMax: 7 },
  { market: "fr", name: "Fournisseur partenaire — France", city: "", region: "45", leadMin: 5, leadMax: 10 },
];

export const SEED_ZONES: Array<{
  market: MarketId;
  name: string;
  regions: string[];
  excluded: string[];
  freeMin: number;
  leadMin: number;
  leadMax: number;
  remote: L;
}> = [
  {
    market: "ca", name: "Québec (sud)", regions: ["QC"], excluded: ["G0G", "J0M", "J0Y", "G4Z"], freeMin: 15000, leadMin: 3, leadMax: 7,
    remote: {
      fr: "La Côte-Nord, le Nord-du-Québec et les Îles ne sont pas desservis pour le moment.",
      en: "Côte-Nord, Nord-du-Québec and the Islands are not served at the moment.",
    },
  },
  {
    market: "ca", name: "Est et centre de l'Ontario", regions: ["ON"], excluded: ["P"], freeMin: 15000, leadMin: 4, leadMax: 8,
    remote: { fr: "Le Nord de l'Ontario (codes en P) n'est pas desservi.", en: "Northern Ontario (P postal codes) is not served." },
  },
  {
    market: "us", name: "Northeast", regions: ["NY", "VT", "NH", "MA", "CT", "RI", "NJ", "PA", "ME"], excluded: ["005", "063"], freeMin: 15000, leadMin: 3, leadMax: 7,
    remote: { en: "Islands and areas without truck access may require a specific quote." },
  },
  {
    market: "fr", name: "Île-de-France et Centre-Val de Loire",
    regions: ["75", "77", "78", "91", "92", "93", "94", "95", "28", "45", "41", "18", "36", "37", "60", "27", "89"],
    excluded: [], freeMin: 15000, leadMin: 5, leadMax: 10,
    remote: { fr: "Les accès difficiles (rue étroite, absence d'accès poids lourd) sont vérifiés avant confirmation." },
  },
];
