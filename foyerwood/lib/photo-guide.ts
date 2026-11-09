// What to look for when sourcing a real photo for each species × packaging.
// Used by Administration → Photos du catalogue and docs/photos-produits.md.
import type { CatalogPackaging, CatalogSpecies } from "./db/seed-species-catalog";

export interface SpeciesGuide {
  fr: string;
  /** Names used in Québec / Canada (French). */
  frCa: string;
  en: string;
  /** Names used in North America and the UK. */
  enAlt: string;
  latin: string;
  /** How to recognise the species on a photo. */
  look: string;
}

export const SPECIES_GUIDE: Record<CatalogSpecies, SpeciesGuide> = {
  oak: {
    fr: "Chêne",
    frCa: "Chêne rouge, chêne blanc",
    en: "Oak",
    enAlt: "Red oak, white oak",
    latin: "Quercus robur, Q. petraea (Europe) · Q. rubra, Q. alba (Amérique du Nord)",
    look: "Écorce épaisse gris-brun, profondément crevassée. Bois beige à brun clair, cœur plus foncé, rayons et cernes bien visibles sur la coupe.",
  },
  beech: {
    fr: "Hêtre",
    frCa: "Hêtre à grandes feuilles",
    en: "Beech",
    enAlt: "American beech, European beech",
    latin: "Fagus sylvatica (Europe) · Fagus grandifolia (Amérique du Nord)",
    look: "Écorce lisse et fine, gris clair argenté. Bois homogène beige rosé, sans cœur marqué.",
  },
  birch: {
    fr: "Bouleau",
    frCa: "Bouleau blanc, bouleau jaune (merisier)",
    en: "Birch",
    enAlt: "White birch, paper birch, yellow birch",
    latin: "Betula pendula (Europe) · B. papyrifera, B. alleghaniensis (Amérique du Nord)",
    look: "Écorce blanche et papyracée à taches noires (bouleau blanc), ou jaune-bronze qui s'effiloche (merisier). Bois très clair, crème.",
  },
  maple: {
    fr: "Érable",
    frCa: "Érable à sucre, érable dur, érable rouge",
    en: "Maple",
    enAlt: "Sugar maple, hard maple, red maple",
    latin: "Acer saccharum, A. rubrum (Amérique du Nord) · Acer pseudoplatanus (Europe)",
    look: "Écorce grise en plaques ou en longs sillons verticaux. Bois blanc crème, parfois avec un cœur brun clair.",
  },
  ash: {
    fr: "Frêne",
    frCa: "Frêne blanc, frêne noir",
    en: "Ash",
    enAlt: "White ash, European ash",
    latin: "Fraxinus excelsior (Europe) · F. americana, F. nigra (Amérique du Nord)",
    look: "Écorce grise à crêtes croisées formant des losanges réguliers. Bois clair blanc-beige, cernes nets.",
  },
  pine: {
    fr: "Pin",
    frCa: "Pin blanc, pin rouge, pin gris",
    en: "Pine",
    enAlt: "White pine, red pine, Scots pine",
    latin: "Pinus sylvestris (Europe) · P. strobus, P. resinosa, P. banksiana (Amérique du Nord)",
    look: "Écorce orangée en fines écailles (haut du pin sylvestre) ou en plaques brun-rouge. Bois jaune pâle résineux, nœuds visibles, cœur rougeâtre.",
  },
};

export interface PackagingGuide {
  fr: string;
  frAlt: string;
  en: string;
  enAlt: string;
  /** What the photo must show. */
  show: string;
  /** Search queries; {fr} / {en} are replaced by the species name. */
  queryFr: string;
  queryEn: string;
}

export const PACKAGING_GUIDE: Record<CatalogPackaging, PackagingGuide> = {
  bulk: {
    fr: "Vrac",
    frAlt: "bois en vrac, tas de bûches, livraison en vrac, benne de bois",
    en: "Bulk",
    enAlt: "bulk firewood, loose firewood pile, firewood delivery load, dumped firewood",
    show: "Un tas de bûches fendues, sans emballage, déchargé au sol ou dans une benne.",
    queryFr: "bois de chauffage {fr} en vrac tas",
    queryEn: "{en} firewood pile loose bulk",
  },
  pallet: {
    fr: "Palette",
    frAlt: "palette de bûches, caisse palette, palette cerclée, caisse grillagée",
    en: "Pallet",
    enAlt: "firewood pallet, palletized firewood, firewood crate, firewood stillage",
    show: "Des bûches rangées sur une palette : caisse en bois ajourée, cage grillagée ou palette cerclée.",
    queryFr: "palette bois de chauffage {fr}",
    queryEn: "{en} firewood pallet crate",
  },
  big_bag: {
    fr: "Big Bag",
    frAlt: "big bag de bûches, sac 1 m³, sac à anses",
    en: "Big Bag",
    enAlt: "firewood bulk bag, dumpy bag (UK), tote bag (US), FIBC bag",
    show: "Un grand sac tissé blanc d'environ 1 m³, à 4 anses, rempli de bûches.",
    queryFr: "big bag bois de chauffage {fr}",
    queryEn: "{en} firewood bulk bag",
  },
  net_bag: {
    fr: "Filet",
    frAlt: "sac filet, filet de bûches, sac à mailles",
    en: "Net bag",
    enAlt: "firewood net bag, mesh bag of logs, netted firewood",
    show: "Un sac en filet (rouge, orange ou vert) d'environ 20 à 25 L, rempli de bûches.",
    queryFr: "filet de bûches {fr}",
    queryEn: "{en} firewood net bag mesh",
  },
  bag: {
    fr: "Sac",
    frAlt: "sac de bûches, sac 40 L, sac de bois sec",
    en: "Bag",
    enAlt: "bagged firewood, firewood bag, firewood bundle (US/CA, sous film plastique)",
    show: "Un sac fermé de bûches séchées, vendu en magasin. En Amérique du Nord : fagot de bûches sous film plastique.",
    queryFr: "sac de bûches {fr} bois sec",
    queryEn: "bagged {en} firewood",
  },
  box: {
    fr: "Carton",
    frAlt: "carton de bûches, caisse carton, bois en carton",
    en: "Box",
    enAlt: "boxed firewood, kiln dried firewood box, firewood in cardboard box",
    show: "Un carton (souvent ouvert pour montrer les bûches) de bois séché au four.",
    queryFr: "carton de bûches {fr} séché au four",
    queryEn: "boxed kiln dried {en} firewood",
  },
};

export function photoQueries(species: CatalogSpecies, packaging: CatalogPackaging): { fr: string; en: string } {
  const s = SPECIES_GUIDE[species];
  const p = PACKAGING_GUIDE[packaging];
  return {
    fr: p.queryFr.replace("{fr}", s.fr.toLowerCase()),
    en: p.queryEn.replace("{en}", s.en.toLowerCase()),
  };
}
