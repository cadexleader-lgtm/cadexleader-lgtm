// Sale units, wood species and energy content of fuels.
//
// References (rounded, documented values):
//  - Lower heating value (LHV) of oven-dry wood: 18.4 MJ/kg ≈ 5.1 kWh/kg for
//    hardwoods, ≈ 5.25 kWh/kg for resinous softwoods (ISO 17225 / FCBA tables).
//  - LHV at moisture content H (wet basis): LHV(H) = LHV0 × (1 − H) − 0.68 × H
//    (kWh/kg; 0.68 kWh/kg = 2.44 MJ/kg latent heat of water) — EN ISO 18125.
//  - Basic density (oven-dry mass / green volume) by species: USDA Wood Handbook
//    (FPL-GTR-282) and CIRAD/FCBA data for European species.
//  - Solid wood content of stacked volumes: ≈ 0.62 for 1 m logs (stère),
//    ≈ 0.68 for short split logs neatly stacked (a full cord holds ~85 ft³ of
//    solid wood out of 128 ft³), ≈ 0.45 for loose (thrown) wood.
//  - Wood pellets: ≤ 10 % moisture, LHV ≈ 4.6–4.9 kWh/kg (ISO 17225-2 A1 ≥ 4.6).

import type { Lang, MarketId } from "./markets";
import type { CategoryKey } from "./sites";

export const CUBIC_FOOT_M3 = 0.0283168;
export const LB_KG = 0.45359237;

export type SaleUnit =
  | "full_cord"
  | "half_cord"
  | "face_cord"
  | "rick"
  | "cubic_foot"
  | "stere"
  | "cubic_meter"
  | "pallet"
  | "big_bag"
  | "net_bag"
  | "bag"
  | "box"
  | "pack"
  | "piece";

export const SALE_UNITS: SaleUnit[] = [
  "full_cord",
  "half_cord",
  "face_cord",
  "rick",
  "cubic_foot",
  "stere",
  "cubic_meter",
  "pallet",
  "big_bag",
  "net_bag",
  "bag",
  "box",
  "pack",
  "piece",
];

/** Units offered to the administrator for each market (spec §5). */
export const MARKET_UNITS: Record<MarketId, SaleUnit[]> = {
  ca: ["full_cord", "half_cord", "face_cord", "cubic_foot", "pallet", "big_bag", "net_bag", "bag", "box", "pack", "piece"],
  us: ["full_cord", "face_cord", "rick", "cubic_foot", "pallet", "big_bag", "net_bag", "bag", "box", "pack", "piece"],
  fr: ["stere", "cubic_meter", "pallet", "big_bag", "net_bag", "bag", "box", "pack", "piece"],
};

const UNIT_LABELS: Record<SaleUnit, Record<Lang, [string, string]>> = {
  full_cord: { fr: ["corde complète", "cordes complètes"], en: ["full cord", "full cords"] },
  half_cord: { fr: ["demi-corde", "demi-cordes"], en: ["half cord", "half cords"] },
  face_cord: { fr: ["face cord", "face cords"], en: ["face cord", "face cords"] },
  rick: { fr: ["rick", "ricks"], en: ["rick", "ricks"] },
  cubic_foot: { fr: ["pied cube", "pieds cubes"], en: ["cubic foot", "cubic feet"] },
  stere: { fr: ["stère", "stères"], en: ["stère", "stères"] },
  cubic_meter: { fr: ["m³ apparent", "m³ apparents"], en: ["cubic metre", "cubic metres"] },
  pallet: { fr: ["palette", "palettes"], en: ["pallet", "pallets"] },
  big_bag: { fr: ["big bag", "big bags"], en: ["big bag", "big bags"] },
  net_bag: { fr: ["filet", "filets"], en: ["net bag", "net bags"] },
  bag: { fr: ["sac", "sacs"], en: ["bag", "bags"] },
  box: { fr: ["carton", "cartons"], en: ["box", "boxes"] },
  pack: { fr: ["lot", "lots"], en: ["pack", "packs"] },
  piece: { fr: ["pièce", "pièces"], en: ["item", "items"] },
};

export function unitLabel(unit: SaleUnit, lang: Lang, qty = 1): string {
  const [one, many] = UNIT_LABELS[unit][lang];
  return Math.abs(qty) >= 2 ? many : one;
}

export function isSaleUnit(v: unknown): v is SaleUnit {
  return typeof v === "string" && (SALE_UNITS as string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Species

export type SpeciesKey =
  | "oak"
  | "beech"
  | "hornbeam"
  | "ash"
  | "maple"
  | "hickory"
  | "birch"
  | "cherry"
  | "chestnut"
  | "mixed_hardwood"
  | "spruce"
  | "fir"
  | "pine"
  | "larch"
  | "poplar"
  | "softwood"
  | "mixed";

interface SpeciesInfo {
  /** Basic density, kg of oven-dry wood per m³ of green solid wood. */
  density: number;
  /** LHV of oven-dry wood, kWh/kg. */
  lhv0: number;
  names: Record<Lang, string>;
  /** Bark and wood colours used by the product illustrations. */
  bark: string;
  wood: string;
}

export const SPECIES: Record<SpeciesKey, SpeciesInfo> = {
  oak: { density: 570, lhv0: 5.1, names: { fr: "Chêne", en: "Oak" }, bark: "#4a3a2c", wood: "#c9a273" },
  beech: { density: 560, lhv0: 5.1, names: { fr: "Hêtre", en: "Beech" }, bark: "#8d8a80", wood: "#e2b48e" },
  hornbeam: { density: 630, lhv0: 5.1, names: { fr: "Charme", en: "Hornbeam" }, bark: "#7d7a72", wood: "#e8d6b8" },
  ash: { density: 560, lhv0: 5.1, names: { fr: "Frêne", en: "Ash" }, bark: "#6b6257", wood: "#e9d8b4" },
  maple: { density: 560, lhv0: 5.1, names: { fr: "Érable", en: "Maple" }, bark: "#5e5246", wood: "#efdcbc" },
  hickory: { density: 640, lhv0: 5.1, names: { fr: "Caryer (hickory)", en: "Hickory" }, bark: "#5a4b3e", wood: "#d9b88f" },
  birch: { density: 510, lhv0: 5.1, names: { fr: "Bouleau", en: "Birch" }, bark: "#ece6da", wood: "#f1e2c4" },
  cherry: { density: 470, lhv0: 5.1, names: { fr: "Cerisier", en: "Cherry" }, bark: "#5b3a2e", wood: "#d79c74" },
  chestnut: { density: 480, lhv0: 5.1, names: { fr: "Châtaignier", en: "Chestnut" }, bark: "#5a4636", wood: "#cfa977" },
  spruce: { density: 380, lhv0: 5.25, names: { fr: "Épicéa", en: "Spruce" }, bark: "#6e4a36", wood: "#f0dfb8" },
  fir: { density: 370, lhv0: 5.25, names: { fr: "Sapin", en: "Fir" }, bark: "#7b7166", wood: "#eedfc0" },
  pine: { density: 430, lhv0: 5.25, names: { fr: "Pin", en: "Pine" }, bark: "#7a4b32", wood: "#ecc98f" },
  larch: { density: 490, lhv0: 5.25, names: { fr: "Mélèze", en: "Larch" }, bark: "#6a4434", wood: "#dca274" },
  poplar: { density: 350, lhv0: 5.1, names: { fr: "Peuplier", en: "Poplar" }, bark: "#8c8a7c", wood: "#f2e6cc" },
  mixed_hardwood: {
    density: 540,
    lhv0: 5.1,
    names: { fr: "Mélange de feuillus durs", en: "Mixed hardwoods" },
    bark: "#5b4a3b",
    wood: "#d8b486",
  },
  softwood: { density: 420, lhv0: 5.25, names: { fr: "Résineux", en: "Softwood" }, bark: "#7a4b32", wood: "#e6c48f" },
  mixed: { density: 480, lhv0: 5.15, names: { fr: "Essences mélangées", en: "Mixed species" }, bark: "#5f4d3d", wood: "#dcb88b" },
};

/** Softwoods (resinous): lighter, quick to light, less heat per volume. */
export const SOFTWOODS: SpeciesKey[] = ["spruce", "fir", "pine", "larch", "softwood"];

export const SPECIES_KEYS = Object.keys(SPECIES) as SpeciesKey[];

export function isSpeciesKey(v: unknown): v is SpeciesKey {
  return typeof v === "string" && v in SPECIES;
}

// ---------------------------------------------------------------------------
// Physics

/** LHV in kWh per kg of wood at moisture content H (wet basis, 0–1). */
export function lhvPerKg(moisture: number, lhv0 = 5.1): number {
  const h = clamp(moisture, 0, 0.6);
  return lhv0 * (1 - h) - 0.68 * h;
}

/** Energy (kWh) contained in 1 m³ of solid wood of a species at moisture H. */
export function energyPerSolidM3(species: SpeciesKey, moisture: number): number {
  const s = SPECIES[species];
  const h = clamp(moisture, 0, 0.6);
  // Oven-dry mass stays constant while drying: E = m0 × (LHV0 − 0.68 × H / (1 − H)).
  return s.density * (s.lhv0 - (0.68 * h) / (1 - h));
}

export const SOLID_FRACTION = { stere: 0.62, stacked: 0.68, loose: 0.45 } as const;
export type Packing = "stacked" | "loose";

export type FuelKind = "logs" | "pellets" | "briquettes" | "none";

export function fuelKindForCategory(category: CategoryKey): FuelKind {
  switch (category) {
    case "firewood":
    case "kiln-dried":
    case "kindling":
      return "logs";
    case "pellets":
      return "pellets";
    case "briquettes":
      return "briquettes";
    default:
      return "none";
  }
}

export const DEFAULT_MOISTURE: Record<CategoryKey, number> = {
  firewood: 0.22,
  "kiln-dried": 0.15,
  kindling: 0.15,
  pellets: 0.08,
  briquettes: 0.08,
  accessories: 0,
};

/** Densified fuels (pellets, compressed logs): LHV of the dry matter. */
const DENSIFIED_LHV0 = 5.15;

export interface UnitContentInput {
  category: CategoryKey;
  unit: SaleUnit;
  species?: SpeciesKey | null;
  moisture?: number | null; // 0–1
  lengthCm?: number | null;
  unitVolumeM3?: number | null; // stacked volume of a pallet / bag / pack
  unitWeightKg?: number | null;
  packing?: Packing | null;
}

/** Stacked volume (m³) of one sale unit, when it is defined by the unit itself. */
export function standardStackedVolumeM3(unit: SaleUnit, lengthCm?: number | null): number | null {
  const lengthIn = (lengthCm ?? 40.64) / 2.54; // 16" by default
  switch (unit) {
    case "full_cord":
      return 128 * CUBIC_FOOT_M3;
    case "half_cord":
      return 64 * CUBIC_FOOT_M3;
    case "face_cord":
    case "rick":
      return 4 * 8 * (lengthIn / 12) * CUBIC_FOOT_M3;
    case "cubic_foot":
      return CUBIC_FOOT_M3;
    case "stere":
    case "cubic_meter":
      return 1;
    default:
      return null;
  }
}

/** Solid wood volume (m³) contained in one sale unit, or null when unknown. */
export function solidVolumeM3(p: UnitContentInput): number | null {
  const std = standardStackedVolumeM3(p.unit, p.lengthCm);
  if (p.unit === "stere") return SOLID_FRACTION.stere;
  const stacked = std ?? p.unitVolumeM3 ?? null;
  if (!stacked) return null;
  const fraction = p.packing === "loose" ? SOLID_FRACTION.loose : SOLID_FRACTION.stacked;
  return stacked * fraction;
}

/**
 * Energy content (kWh, lower heating value) of one sale unit of a product,
 * or null when it is not a fuel or its content is not defined.
 */
export function energyPerUnitKwh(p: UnitContentInput): number | null {
  const kind = fuelKindForCategory(p.category);
  if (kind === "none") return null;
  const moisture = p.moisture ?? DEFAULT_MOISTURE[p.category];

  if (kind === "pellets" || kind === "briquettes") {
    if (!p.unitWeightKg) return null;
    return p.unitWeightKg * lhvPerKg(moisture, DENSIFIED_LHV0);
  }

  const species: SpeciesKey = p.species ?? "mixed_hardwood";
  const solid = solidVolumeM3(p);
  if (solid) return solid * energyPerSolidM3(species, moisture);
  if (p.unitWeightKg) return p.unitWeightKg * lhvPerKg(moisture, SPECIES[species].lhv0);
  return null;
}

// ---------------------------------------------------------------------------
// Customer-facing explanation of what one unit really contains (spec §5).

export function unitDefinition(unit: SaleUnit, lang: Lang, lengthCm?: number | null): string {
  const lengthIn = Math.round((lengthCm ?? 40.64) / 2.54);
  const faceFt3 = 4 * 8 * (lengthIn / 12);
  const fraction = faceFt3 / 128;
  const fracLabel = fraction > 0.3 && fraction < 0.36 ? "1/3" : fraction > 0.23 && fraction < 0.27 ? "1/4" : fmtNum(fraction, lang, 2);
  const fr = lang === "fr";
  switch (unit) {
    case "full_cord":
      return fr
        ? "Corde complète : pile de 4 pi × 4 pi × 8 pi, soit 128 pi³ (3,62 m³) de bûches cordées serré."
        : "Full cord: a stack 4 ft high × 4 ft deep × 8 ft long — 128 ft³ (3.62 m³) of tightly stacked wood.";
    case "half_cord":
      return fr
        ? "Demi-corde : la moitié d'une corde complète, soit 64 pi³ (1,81 m³) de bûches cordées."
        : "Half cord: half of a full cord — 64 ft³ (1.81 m³) of stacked wood.";
    case "face_cord":
      return fr
        ? `Face cord (souvent appelée « corde » au Québec) : une rangée de 4 pi × 8 pi de bûches de ${lengthIn} po, soit ${fmtNum(faceFt3, lang, 1)} pi³ — environ ${fracLabel} de corde complète.`
        : `Face cord: a single row 4 ft high × 8 ft long of ${lengthIn}-inch logs — ${fmtNum(faceFt3, lang, 1)} ft³, about ${fracLabel} of a full cord.`;
    case "rick":
      return fr
        ? `Rick : une rangée de 4 pi × 8 pi de bûches de ${lengthIn} po, soit ${fmtNum(faceFt3, lang, 1)} pi³ (environ ${fracLabel} de corde complète). Le terme varie selon les régions : nous indiquons toujours le volume.`
        : `Rick: a single row 4 ft high × 8 ft long of ${lengthIn}-inch logs — ${fmtNum(faceFt3, lang, 1)} ft³ (about ${fracLabel} of a full cord). The word varies by region, so we always state the volume.`;
    case "cubic_foot":
      return fr ? "Pied cube : 1 pi³ (0,028 m³) de bois rangé." : "Cubic foot: 1 ft³ (0.028 m³) of stacked wood.";
    case "stere":
      return fr
        ? "Stère : 1 m³ apparent de bûches de 1 m empilées. Recoupées en 33 ou 50 cm, les bûches d'un stère se rangent dans un volume plus petit (environ 0,8 à 0,9 m³)."
        : "Stère: 1 m³ of stacked 1-metre logs. Once cut to 33 or 50 cm, the same wood stacks into a smaller volume (about 0.8–0.9 m³).";
    case "cubic_meter":
      return fr
        ? "Mètre cube apparent : 1 m³ de bûches courtes (25 à 50 cm) rangées. À ne pas confondre avec le stère, qui se mesure en bûches de 1 m."
        : "Cubic metre: 1 m³ of short logs (25–50 cm) neatly stacked — not to be confused with the stère, measured with 1-metre logs.";
    case "pallet":
      return fr ? "Palette : le contenu exact (volume ou poids) est précisé ci-dessous." : "Pallet: the exact content (volume or weight) is stated below.";
    case "big_bag":
      return fr
        ? "Big bag : grand sac tissé rempli de bûches en vrac (non rangées), déposé sur votre terrain. Volume et poids exacts précisés ci-dessous."
        : "Big bag: a large woven bag filled with loose (unstacked) logs, dropped on your property. Exact volume and weight are stated below.";
    case "net_bag":
      return fr
        ? "Filet : sac en filet aéré de bûches séchées, facile à porter. Volume et poids exacts précisés ci-dessous."
        : "Net bag: a breathable mesh bag of dried logs, easy to carry. Exact volume and weight are stated below.";
    case "box":
      return fr
        ? "Carton : bûches séchées conditionnées en carton, propres à manipuler. Volume et poids exacts précisés ci-dessous."
        : "Box: dried logs packed in a cardboard box, clean to handle. Exact volume and weight are stated below.";
    case "bag":
      return fr ? "Sac : le poids ou le volume exact est précisé ci-dessous." : "Bag: the exact weight or volume is stated below.";
    case "pack":
      return fr ? "Lot : le contenu exact est précisé ci-dessous." : "Pack: the exact content is stated below.";
    case "piece":
      return fr ? "Vendu à l'unité." : "Sold individually.";
  }
}

/** One-line summary of the real content of one unit (volume, weight, energy). */
export function unitContentSummary(p: UnitContentInput, lang: Lang, market: MarketId): string | null {
  const parts: string[] = [];
  const std = standardStackedVolumeM3(p.unit, p.lengthCm);
  const vol = std ?? p.unitVolumeM3 ?? null;
  const fr = lang === "fr";
  if (vol && p.unit !== "cubic_foot") {
    if (market === "fr") {
      parts.push(`${fmtNum(vol, lang, 2)} m³ ${p.unit === "stere" ? (fr ? "apparent (bûches de 1 m)" : "stacked (1 m logs)") : fr ? (p.packing === "loose" ? "en vrac" : "rangé") : p.packing === "loose" ? "loose" : "stacked"}`);
    } else {
      parts.push(`${fmtNum(vol / CUBIC_FOOT_M3, lang, 1)} ${fr ? "pi³" : "ft³"} (${fmtNum(vol, lang, 2)} m³)`);
    }
  }
  if (p.unitWeightKg) {
    parts.push(
      market === "fr"
        ? `${fmtNum(p.unitWeightKg, lang, 0)} kg`
        : `${fmtNum(p.unitWeightKg / LB_KG, lang, 0)} lb (${fmtNum(p.unitWeightKg, lang, 0)} kg)`,
    );
  }
  const kwh = energyPerUnitKwh(p);
  if (kwh) parts.push(fr ? `≈ ${fmtNum(kwh, lang, 0)} kWh d'énergie` : `≈ ${fmtNum(kwh, lang, 0)} kWh of energy`);
  return parts.length ? parts.join(" · ") : null;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function fmtNum(v: number, lang: Lang, digits: number) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(v);
}
