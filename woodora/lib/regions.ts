// Administrative regions and postal-code parsing for the three markets.
// Used for delivery zones (provinces / states / départements) and for the
// climate lookup of the heating calculator.

import type { MarketId } from "./markets";

export interface Region {
  code: string;
  name: string;
}

export const CA_PROVINCES: Region[] = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "Colombie-Britannique / British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "Nouveau-Brunswick / New Brunswick" },
  { code: "NL", name: "Terre-Neuve-et-Labrador / Newfoundland and Labrador" },
  { code: "NS", name: "Nouvelle-Écosse / Nova Scotia" },
  { code: "NT", name: "Territoires du Nord-Ouest / Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Île-du-Prince-Édouard / Prince Edward Island" },
  { code: "QC", name: "Québec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

export const US_STATES: Region[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

const FR_DEPT_NAMES: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube", "11": "Aude",
  "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente",
  "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud", "2B": "Haute-Corse",
  "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne", "25": "Doubs", "26": "Drôme",
  "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère", "30": "Gard", "31": "Haute-Garonne", "32": "Gers",
  "33": "Gironde", "34": "Hérault", "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire",
  "38": "Isère", "39": "Jura", "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire",
  "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère",
  "49": "Maine-et-Loire", "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne",
  "54": "Meurthe-et-Moselle", "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône",
  "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie",
  "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres",
  "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse", "85": "Vendée",
  "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort",
  "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise",
};

export const FR_DEPARTMENTS: Region[] = Object.entries(FR_DEPT_NAMES)
  .map(([code, name]) => ({ code, name: `${code} — ${name}` }))
  .sort((a, b) => a.code.localeCompare(b.code));

export function regionsFor(market: MarketId): Region[] {
  if (market === "ca") return CA_PROVINCES;
  if (market === "us") return US_STATES;
  return FR_DEPARTMENTS;
}

export function regionName(market: MarketId, code: string): string {
  return regionsFor(market).find((r) => r.code === code)?.name ?? code;
}

// ---------------------------------------------------------------------------
// Postal codes

/** Normalizes a postal code: uppercase, no spaces (A1A 1A1 → A1A1A1). */
export function normalizePostalCode(market: MarketId, input: string): string {
  const raw = input.trim().toUpperCase().replace(/\s+/g, "");
  if (market === "us") return raw.replace(/[^0-9-]/g, "");
  return raw;
}

export function isValidPostalCode(market: MarketId, input: string): boolean {
  const pc = normalizePostalCode(market, input);
  if (market === "ca") return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(pc);
  if (market === "us") return /^\d{5}(-?\d{4})?$/.test(pc);
  return /^\d{5}$/.test(pc);
}

/** Human formatting (Canada: A1A 1A1). */
export function formatPostalCode(market: MarketId, input: string): string {
  const pc = normalizePostalCode(market, input);
  if (market === "ca" && pc.length === 6) return `${pc.slice(0, 3)} ${pc.slice(3)}`;
  return pc;
}

const CA_FIRST_LETTER: Record<string, string> = {
  A: "NL", B: "NS", C: "PE", E: "NB", G: "QC", H: "QC", J: "QC", K: "ON", L: "ON", M: "ON", N: "ON",
  P: "ON", R: "MB", S: "SK", T: "AB", V: "BC", Y: "YT",
};

// US ZIP3 prefix ranges → state (USPS). Military and territories are not served.
const US_ZIP3: Array<[number, number, string]> = [
  [5, 5, "NY"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 54, "VT"],
  [55, 55, "MA"], [56, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"],
  [197, 199, "DE"], [200, 200, "DC"], [201, 201, "VA"], [202, 205, "DC"], [206, 219, "MD"],
  [220, 246, "VA"], [247, 268, "WV"], [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"],
  [320, 339, "FL"], [341, 349, "FL"], [350, 369, "AL"], [370, 385, "TN"], [386, 397, "MS"],
  [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [569, 569, "DC"], [570, 577, "SD"],
  [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"], [660, 679, "KS"],
  [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"], [730, 732, "OK"], [733, 733, "TX"],
  [734, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"],
  [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"], [885, 885, "TX"], [889, 898, "NV"],
  [900, 961, "CA"], [967, 968, "HI"], [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

/**
 * Returns the region code (province / state / département) of a postal code,
 * or null when it cannot be determined.
 */
export function regionFromPostalCode(market: MarketId, input: string): string | null {
  if (!isValidPostalCode(market, input)) return null;
  const pc = normalizePostalCode(market, input);
  if (market === "ca") {
    if (pc[0] === "X") return ["X0A", "X0B", "X0C"].includes(pc.slice(0, 3)) ? "NU" : "NT";
    return CA_FIRST_LETTER[pc[0]] ?? null;
  }
  if (market === "us") {
    const zip3 = Number(pc.slice(0, 3));
    const hit = US_ZIP3.find(([a, b]) => zip3 >= a && zip3 <= b);
    return hit ? hit[2] : null;
  }
  // France (metropolitan only — overseas départements are not served).
  const two = pc.slice(0, 2);
  if (two === "20") return Number(pc.slice(0, 3)) < 202 ? "2A" : "2B";
  if (two === "97" || two === "98") return null;
  return FR_DEPT_NAMES[two] ? two : null;
}
