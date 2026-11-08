// Climate reference used by the heating calculator: annual heating degree-days
// (HDD, base 18 °C, in kelvin·days). Values are rounded climate normals for a
// representative populated location of each region:
//  - Canada: National Building Code of Canada 2015, Appendix C (HDD below 18 °C).
//  - United States: NOAA 1991–2020 normals, population-weighted state values
//    (base 65 °F), converted to °C·days (× 5/9).
//  - France: climate zones H1a…H3 of the French thermal regulation (RT 2012 /
//    RE 2020 zoning) with typical "DJU base 18" of each zone.
// They are regional averages: local values (altitude, coast, valleys) can differ
// by ±15 % or more, which is reflected in the calculator's uncertainty range.

import type { MarketId } from "./markets";
import { normalizePostalCode, regionFromPostalCode } from "./regions";

export interface ClimateInfo {
  hdd: number;
  /** Human label of the climate reference used. */
  label: string;
  /** Relative uncertainty of the regional value (0.12 = ±12 %). */
  uncertainty: number;
}

// --- Canada ---------------------------------------------------------------
const CA_HDD: Record<string, [number, string]> = {
  NL: [4800, "St. John's"],
  NS: [4000, "Halifax"],
  PE: [4460, "Charlottetown"],
  NB: [4650, "Fredericton / Moncton"],
  QC: [4800, "Québec (moyenne)"],
  ON: [4000, "Ontario (moyenne)"],
  MB: [5670, "Winnipeg"],
  SK: [5650, "Regina / Saskatoon"],
  AB: [5100, "Edmonton / Calgary"],
  BC: [3200, "Colombie-Britannique (moyenne)"],
  YT: [6580, "Whitehorse"],
  NT: [8170, "Yellowknife"],
  NU: [9980, "Iqaluit"],
};

// Finer values from the first letter / forward sortation area of the postal code.
const CA_FSA_PREFIX: Array<[string, number, string]> = [
  ["H", 4200, "Montréal"],
  ["G", 5100, "Québec / Est du Québec"],
  ["J", 4600, "Sud et Ouest du Québec"],
  ["K", 4440, "Ottawa / Est de l'Ontario"],
  ["M", 3520, "Toronto"],
  ["L", 3800, "Région du Grand Toronto / Niagara"],
  ["N", 3800, "Sud-Ouest de l'Ontario"],
  ["P", 5400, "Nord de l'Ontario"],
  ["V5", 2850, "Vancouver"],
  ["V6", 2850, "Vancouver"],
  ["V7", 2850, "North Shore / Vancouver"],
  ["V3", 2950, "Lower Mainland"],
  ["V4", 2950, "Lower Mainland"],
  ["V8", 2650, "Victoria"],
  ["V9", 3000, "Île de Vancouver"],
  ["V1", 3600, "Intérieur de la C.-B."],
  ["V2", 4300, "Intérieur nord de la C.-B."],
  ["V0", 4500, "C.-B. rurale"],
];

// --- United States (°F·days base 65) ---------------------------------------
const US_HDD_F: Record<string, number> = {
  AL: 2700, AK: 10800, AZ: 1500, AR: 3200, CA: 2000, CO: 6000, CT: 5900, DE: 4600, DC: 4200,
  FL: 600, GA: 2600, HI: 0, ID: 6300, IL: 6000, IN: 5600, IA: 6700, KS: 5000, KY: 4400, LA: 1600,
  ME: 7600, MD: 4600, MA: 5800, MI: 6600, MN: 7800, MS: 2300, MO: 4900, MT: 7500, NE: 6200,
  NV: 2800, NH: 7000, NJ: 4900, NM: 4200, NY: 5400, NC: 3400, ND: 8800, OH: 5600, OK: 3600,
  OR: 4700, PA: 5700, RI: 5700, SC: 2600, SD: 7400, TN: 3700, TX: 2000, UT: 5700, VT: 7700,
  VA: 4200, WA: 5300, WV: 4900, WI: 7300, WY: 7300,
};

// --- France ------------------------------------------------------------------
export type FrZone = "H1a" | "H1b" | "H1c" | "H2a" | "H2b" | "H2c" | "H2d" | "H3";

const FR_ZONES: Record<FrZone, string[]> = {
  H1a: ["02", "14", "27", "50", "59", "60", "61", "62", "75", "76", "77", "78", "80", "91", "92", "93", "94", "95"],
  H1b: ["08", "10", "51", "52", "54", "55", "57", "58", "67", "68", "70", "88", "89", "90"],
  H1c: ["01", "03", "05", "15", "19", "21", "23", "25", "38", "39", "42", "43", "63", "69", "71", "73", "74", "87"],
  H2a: ["22", "29", "35", "56"],
  H2b: ["16", "17", "18", "28", "36", "37", "41", "44", "45", "49", "53", "72", "79", "85", "86"],
  H2c: ["09", "12", "24", "31", "32", "33", "40", "46", "47", "64", "65", "81", "82"],
  H2d: ["04", "07", "26", "48", "84"],
  H3: ["06", "11", "13", "2A", "2B", "30", "34", "66", "83"],
};

const FR_ZONE_HDD: Record<FrZone, number> = {
  H1a: 2450,
  H1b: 2800,
  H1c: 2650,
  H2a: 2250,
  H2b: 2250,
  H2c: 2000,
  H2d: 2100,
  H3: 1550,
};

export function frZoneForDepartment(dept: string): FrZone | null {
  for (const [zone, depts] of Object.entries(FR_ZONES) as Array<[FrZone, string[]]>) {
    if (depts.includes(dept)) return zone;
  }
  return null;
}

/** Altitude bands (France): extra degree-days, ~0.6 °C per 100 m over the heating season. */
export const ALTITUDE_HDD_BONUS = { low: 0, mid: 350, high: 900, mountain: 1500 } as const;
export type AltitudeBand = keyof typeof ALTITUDE_HDD_BONUS;

/** National fallbacks when the postal code cannot be resolved. */
const FALLBACK: Record<MarketId, ClimateInfo> = {
  ca: { hdd: 4500, label: "Moyenne canadienne (zones habitées)", uncertainty: 0.25 },
  us: { hdd: 2900, label: "U.S. average (heating-climate states)", uncertainty: 0.3 },
  fr: { hdd: 2300, label: "Moyenne France métropolitaine", uncertainty: 0.2 },
};

export function climateFor(market: MarketId, postalCode: string, altitude: AltitudeBand = "low"): ClimateInfo {
  const region = regionFromPostalCode(market, postalCode);
  if (!region) return FALLBACK[market];

  if (market === "ca") {
    const pc = normalizePostalCode(market, postalCode);
    const fsa = CA_FSA_PREFIX.find(([p]) => pc.startsWith(p));
    if (fsa) return { hdd: fsa[1], label: fsa[2], uncertainty: 0.12 };
    const [hdd, label] = CA_HDD[region];
    return { hdd, label, uncertainty: 0.15 };
  }

  if (market === "us") {
    const hddF = US_HDD_F[region];
    if (hddF === undefined) return FALLBACK.us;
    return { hdd: Math.round((hddF * 5) / 9), label: region, uncertainty: 0.18 };
  }

  const zone = frZoneForDepartment(region);
  if (!zone) return FALLBACK.fr;
  return {
    hdd: FR_ZONE_HDD[zone] + ALTITUDE_HDD_BONUS[altitude],
    label: `Zone climatique ${zone}`,
    uncertainty: altitude === "low" ? 0.12 : 0.18,
  };
}

/**
 * Share of the annual degree-days that falls in the N coldest months.
 * Derived from monthly normals of Montréal and Paris (both curves are within
 * 2 points of each other), index 0 = 1 month … index 5 = 6 months.
 */
export const COLDEST_MONTHS_SHARE = [0.18, 0.35, 0.51, 0.65, 0.77, 0.86];

export function seasonShare(months: number | "season"): number {
  if (months === "season") return 1;
  const m = Math.min(Math.max(Math.round(months), 1), 6);
  return COLDEST_MONTHS_SHARE[m - 1];
}
