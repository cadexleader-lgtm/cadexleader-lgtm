// Firewood catalogue organised by species × packaging, for each market.
// 6 species × 6 packagings = 36 products per market. Prices, purchase costs and
// specifications are starting values to be adjusted in the administration.

import type { MarketId } from "../markets";
import type { SaleUnit } from "../energy";
import type { L, Packaging, SeedProduct } from "./seed-catalog";

export const CATALOG_SPECIES = ["oak", "beech", "birch", "maple", "ash", "pine"] as const;
export type CatalogSpecies = (typeof CATALOG_SPECIES)[number];

export const CATALOG_PACKAGINGS = ["bulk", "pallet", "big_bag", "net_bag", "bag", "box"] as const;
export type CatalogPackaging = (typeof CATALOG_PACKAGINGS)[number];

const NAMES: Record<CatalogSpecies, { fr: string; frSlug: string; en: string }> = {
  oak: { fr: "Chêne", frSlug: "chene", en: "Oak" },
  beech: { fr: "Hêtre", frSlug: "hetre", en: "Beech" },
  birch: { fr: "Bouleau", frSlug: "bouleau", en: "Birch" },
  maple: { fr: "Érable", frSlug: "erable", en: "Maple" },
  ash: { fr: "Frêne", frSlug: "frene", en: "Ash" },
  pine: { fr: "Pin", frSlug: "pin", en: "Pine" },
};

const PACK_NAMES: Record<CatalogPackaging, { fr: (s: string) => string; frSlug: string; en: (s: string) => string; enSlug: (s: string) => string }> = {
  bulk: { fr: (s) => `${s} en vrac`, frSlug: "vrac", en: (s) => `${s} Bulk Firewood`, enSlug: (s) => `${s}-bulk-firewood` },
  pallet: { fr: (s) => `${s} sur palette`, frSlug: "palette", en: (s) => `${s} Firewood Pallet`, enSlug: (s) => `${s}-firewood-pallet` },
  big_bag: { fr: (s) => `${s} en big bag`, frSlug: "big-bag", en: (s) => `${s} Firewood Big Bag`, enSlug: (s) => `${s}-firewood-big-bag` },
  net_bag: { fr: (s) => `${s} en filet`, frSlug: "filet", en: (s) => `${s} Firewood Net Bag`, enSlug: (s) => `${s}-firewood-net-bag` },
  bag: { fr: (s) => `${s} en sac`, frSlug: "sac", en: (s) => `Bagged ${s} Firewood`, enSlug: (s) => `bagged-${s}-firewood` },
  box: { fr: (s) => `${s} en carton`, frSlug: "carton", en: (s) => `Boxed ${s} Firewood`, enSlug: (s) => `boxed-${s}-firewood` },
};

const SPECIES_TEXT: Record<CatalogSpecies, L> = {
  oak: {
    fr: "Le chêne est l'un des bois de chauffage les plus denses : il forme une braise qui dure des heures et diffuse une chaleur régulière, idéale pour le chauffage principal et les nuits froides.",
    en: "Oak is one of the densest firewoods: it builds coals that last for hours and gives steady heat, ideal for main heating and cold nights.",
  },
  beech: {
    fr: "Le hêtre offre un excellent pouvoir calorifique et une belle flamme claire. Bien sec, il s'allume facilement et brûle de façon régulière.",
    en: "Beech offers excellent heat output and a bright, clear flame. Well dried, it lights easily and burns evenly.",
  },
  birch: {
    fr: "Le bouleau s'enflamme très facilement et donne une flamme vive et lumineuse. Son écorce blanche, riche en résine naturelle, sert d'allume-feu.",
    en: "Birch catches fire very easily and gives a lively, bright flame. Its white bark, rich in natural oils, works as a fire starter.",
  },
  maple: {
    fr: "L'érable est un bois franc dense et régulier qui offre une chaleur durable. C'est un grand classique du chauffage au bois au Québec.",
    en: "Maple is a dense, consistent hardwood that gives long-lasting heat — a classic for wood heating in Québec and the Northeast.",
  },
  ash: {
    fr: "Le frêne brûle proprement avec une flamme régulière et peu de fumée. Il sèche rapidement et se fend facilement.",
    en: "Ash burns cleanly with a steady flame and little smoke. It dries quickly and splits easily.",
  },
  pine: {
    fr: "Le pin, résineux léger, s'allume en quelques secondes et chauffe vite : parfait pour démarrer le feu, relancer une flambée ou un usage d'appoint.",
    en: "Pine, a light softwood, lights in seconds and heats up fast: perfect to start a fire, revive a burn or for occasional use.",
  },
};

const PACK_TEXT: Record<CatalogPackaging, L> = {
  bulk: {
    fr: "Livré en vrac par camion-benne et déchargé au plus près de votre accès : le format le plus économique pour faire la réserve de la saison. Quantité calculée en volume rangé.",
    en: "Delivered loose by dump truck and unloaded as close as possible to your access: the most economical way to stock up for the season. Quantity measured stacked.",
  },
  pallet: {
    fr: "Bûches rangées à la main sur palette, dans une caisse ajourée qui laisse circuler l'air : propre, facile à stocker et à déplacer.",
    en: "Logs hand-stacked on a pallet in a slatted crate that lets air circulate: clean, easy to store and to move.",
  },
  big_bag: {
    fr: "Big bag tissé rempli de bûches en vrac, déposé sur votre terrain : pratique, sans cordage, et facile à ranger à l'abri.",
    en: "Woven big bag filled with loose logs, dropped on your property: convenient, no stacking needed and easy to keep under cover.",
  },
  net_bag: {
    fr: "Filet aéré de bûches séchées, léger et facile à porter : idéal pour un usage occasionnel, un chalet ou un petit espace de stockage.",
    en: "Breathable net bag of dried logs, light and easy to carry: ideal for occasional fires, a cabin or small storage spaces.",
  },
  bag: {
    fr: "Sac de bûches séchées, propre et maniable, à garder près du poêle ou de la cheminée.",
    en: "Bag of dried logs, clean and easy to handle, to keep next to your stove or fireplace.",
  },
  box: {
    fr: "Carton de bûches séchées au four, prêtes à brûler : la solution la plus propre pour l'intérieur, sans écorce qui s'effrite ni insectes.",
    en: "Box of kiln-dried logs, ready to burn: the cleanest option indoors, with no crumbling bark or insects.",
  },
};

/** Per-market sale unit and real content of one unit for each packaging. */
interface PackSpec {
  unit: SaleUnit;
  min: number;
  lengthCm: number;
  moisture: number;
  volumeM3?: number;
  weightKg?: number;
  packing: "stacked" | "loose";
  base: number; // price in cents for a reference species
}

const FT3 = 0.0283168;

const SPECS: Record<MarketId, Record<CatalogPackaging, PackSpec>> = {
  fr: {
    bulk: { unit: "cubic_meter", min: 2, lengthCm: 33, moisture: 22, packing: "stacked", base: 10500 },
    pallet: { unit: "pallet", min: 1, lengthCm: 33, moisture: 20, volumeM3: 1.8, packing: "stacked", base: 29900 },
    big_bag: { unit: "big_bag", min: 1, lengthCm: 33, moisture: 20, volumeM3: 1.2, packing: "loose", base: 13900 },
    net_bag: { unit: "net_bag", min: 10, lengthCm: 25, moisture: 16, volumeM3: 0.025, weightKg: 8, packing: "loose", base: 690 },
    bag: { unit: "bag", min: 5, lengthCm: 25, moisture: 16, volumeM3: 0.04, weightKg: 14, packing: "loose", base: 990 },
    box: { unit: "box", min: 4, lengthCm: 25, moisture: 15, volumeM3: 0.05, weightKg: 18, packing: "stacked", base: 1690 },
  },
  ca: {
    bulk: { unit: "face_cord", min: 2, lengthCm: 40.64, moisture: 22, packing: "stacked", base: 13500 },
    pallet: { unit: "pallet", min: 1, lengthCm: 40.64, moisture: 20, volumeM3: 64 * FT3, packing: "stacked", base: 31900 },
    big_bag: { unit: "big_bag", min: 1, lengthCm: 40.64, moisture: 20, volumeM3: 1.0, packing: "loose", base: 23900 },
    net_bag: { unit: "net_bag", min: 10, lengthCm: 30, moisture: 16, volumeM3: 0.75 * FT3, weightKg: 9, packing: "loose", base: 1099 },
    bag: { unit: "bag", min: 6, lengthCm: 30, moisture: 16, volumeM3: 1 * FT3, weightKg: 12, packing: "loose", base: 1399 },
    box: { unit: "box", min: 4, lengthCm: 30, moisture: 15, volumeM3: 1.5 * FT3, weightKg: 18, packing: "stacked", base: 1999 },
  },
  us: {
    bulk: { unit: "full_cord", min: 1, lengthCm: 40.64, moisture: 22, packing: "stacked", base: 33900 },
    pallet: { unit: "pallet", min: 1, lengthCm: 40.64, moisture: 20, volumeM3: 64 * FT3, packing: "stacked", base: 30900 },
    big_bag: { unit: "big_bag", min: 1, lengthCm: 40.64, moisture: 20, volumeM3: 1.0, packing: "loose", base: 22900 },
    net_bag: { unit: "net_bag", min: 10, lengthCm: 30, moisture: 16, volumeM3: 0.75 * FT3, weightKg: 9, packing: "loose", base: 899 },
    bag: { unit: "bag", min: 6, lengthCm: 30, moisture: 16, volumeM3: 1 * FT3, weightKg: 12, packing: "loose", base: 1199 },
    box: { unit: "box", min: 4, lengthCm: 30, moisture: 15, volumeM3: 1.5 * FT3, weightKg: 18, packing: "stacked", base: 1699 },
  },
};

const PRICE_FACTOR: Record<CatalogSpecies, number> = { oak: 1.1, beech: 1.05, birch: 1, maple: 1.05, ash: 1, pine: 0.78 };

function price(base: number, f: number, market: MarketId): number {
  const raw = (base * f) / 100;
  if (raw < 60) return Math.round((Math.floor(raw) + (market === "fr" ? 0.9 : 0.99)) * 100);
  return (Math.round(raw / 5) * 5 - 1) * 100;
}

/** Combinations that do not make sense commercially on a market (kept inactive). */
const INACTIVE: Partial<Record<MarketId, CatalogSpecies[]>> = { fr: ["maple"] };

const FEATURED: Record<MarketId, string[]> = {
  fr: ["oak:pallet", "beech:bulk", "birch:big_bag", "ash:box"],
  ca: ["maple:bulk", "birch:big_bag", "oak:pallet", "maple:box"],
  us: ["oak:bulk", "oak:pallet", "birch:big_bag", "maple:box"],
};

const ART: Record<CatalogPackaging, string> = {
  bulk: "bulk",
  pallet: "pallet",
  big_bag: "big-bag",
  net_bag: "net-bag",
  bag: "bag",
  box: "box",
};

function shortText(spec: PackSpec, market: MarketId, lang: "fr" | "en"): string {
  const fr = lang === "fr";
  const len = market === "fr" ? `${Math.round(spec.lengthCm)} cm` : `${Math.round(spec.lengthCm / 2.54)} ${fr ? "po" : "in"}`;
  const dryness =
    spec.moisture <= 16 ? (fr ? `séché au four, ${spec.moisture} % max.` : `kiln-dried, ${spec.moisture}% max.`) : fr ? `séché, ${spec.moisture} % max.` : `seasoned, ${spec.moisture}% max.`;
  return fr ? `Bûches de ${len} · ${dryness}` : `${len} logs · ${dryness}`;
}

export function speciesCatalog(): SeedProduct[] {
  const out: SeedProduct[] = [];
  for (const market of ["fr", "ca", "us"] as MarketId[]) {
    for (const sp of CATALOG_SPECIES) {
      for (const pk of CATALOG_PACKAGINGS) {
        const spec = SPECS[market][pk];
        const n = NAMES[sp];
        const p = PACK_NAMES[pk];
        const nameFr = p.fr(n.fr);
        const nameEn = p.en(n.en);
        const slug = market === "us" ? p.enSlug(n.en.toLowerCase()) : `${n.frSlug}-${p.frSlug}`;
        const priceCents = price(spec.base, PRICE_FACTOR[sp], market);
        const names: L = market === "fr" ? { fr: nameFr } : market === "us" ? { en: nameEn } : { fr: nameFr, en: nameEn };
        const short: L = market === "us" ? { en: shortText(spec, market, "en") } : market === "fr" ? { fr: shortText(spec, market, "fr") } : { fr: shortText(spec, market, "fr"), en: shortText(spec, market, "en") };
        const desc: L = {};
        if (market !== "us") desc.fr = `${SPECIES_TEXT[sp].fr} ${PACK_TEXT[pk].fr}`;
        if (market !== "fr") desc.en = `${SPECIES_TEXT[sp].en} ${PACK_TEXT[pk].en}`;
        out.push({
          market,
          slug,
          category: pk === "bulk" || pk === "pallet" || pk === "big_bag" ? "firewood" : "kiln-dried",
          art: ART[pk],
          species: sp,
          moisture: sp === "pine" && spec.moisture > 16 ? spec.moisture - 2 : spec.moisture,
          lengthCm: spec.lengthCm,
          packaging: pk as Packaging,
          unit: spec.unit,
          volumeM3: spec.volumeM3 ? Math.round(spec.volumeM3 * 10000) / 10000 : undefined,
          weightKg: spec.weightKg ? Math.round(spec.weightKg * (sp === "pine" ? 0.8 : sp === "oak" ? 1.1 : 1)) : undefined,
          packing: spec.packing,
          min: spec.min,
          price: priceCents,
          cost: Math.round(priceCents * 0.7),
          featured: FEATURED[market].includes(`${sp}:${pk}`),
          active: !(INACTIVE[market] ?? []).includes(sp),
          name: names,
          short,
          desc,
        });
      }
    }
  }
  return out;
}
