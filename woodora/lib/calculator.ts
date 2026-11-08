// Heating needs estimator (spec §6).
//
// Method (degree-day method, documented in ASHRAE Fundamentals ch. 19 and in
// the French "méthode des DJU"):
//   useful heat (kWh) = area (m²) × heat-loss intensity (Wh/m²·K·day)
//                       × degree-days of the period × housing factor
//                       × share of the heating covered by the wood appliance / 1000
//   fuel energy (kWh) = useful heat / appliance efficiency
//   quantity          = fuel energy / energy content of one unit
//
// Heat-loss intensities are derived from typical space-heating demands
// (ADEME / CEREN residential statistics, NRCan SHEU survey, passive-house and
// RT 2012 benchmarks) divided by typical degree-days:
//   excellent ≈ 40 kWh/m²/yr, good ≈ 90, average ≈ 140, poor ≈ 230 (at ~2 300 DJU).
// The result is an indicative range, never a guarantee: every input carries an
// uncertainty that is combined (root-sum-square) into the displayed range.

import { climateFor, seasonShare, type AltitudeBand, type ClimateInfo } from "./climate";
import {
  CUBIC_FOOT_M3,
  LB_KG,
  SOLID_FRACTION,
  energyPerSolidM3,
  lhvPerKg,
  type SpeciesKey,
} from "./energy";
import { SQFT_PER_M2, type MarketId } from "./markets";

export type Housing = "house" | "chalet" | "apartment" | "other";
export type Insulation = "excellent" | "good" | "average" | "poor";
export type Appliance = "open_fireplace" | "wood_stove" | "insert" | "pellet_stove" | "wood_boiler" | "other";
export type Usage = "occasional" | "few_hours" | "daily" | "main";
export type FuelChoice = "hardwood" | "mixed" | "softwood" | "kiln_dried" | "briquettes" | "pellets";
export type Months = 1 | 2 | 3 | 4 | 5 | 6 | "season";

export interface CalcInput {
  market: MarketId;
  postalCode: string;
  altitude?: AltitudeBand;
  /** Floor area in the unit of the market (m² in France, ft² in North America). */
  area: number;
  housing: Housing;
  insulation: Insulation;
  appliance: Appliance;
  fuel: FuelChoice;
  usage: Usage;
  months: Months;
}

export const HEAT_LOSS_WH_PER_M2_DD: Record<Insulation, number> = {
  excellent: 17,
  good: 38,
  average: 60,
  poor: 100,
};
const ENVELOPE_UNCERTAINTY = 0.22;

export const HOUSING_FACTOR: Record<Housing, number> = {
  house: 1,
  chalet: 1.1, // more exposed walls, often intermittent occupation
  apartment: 0.65, // shared walls and floors
  other: 1,
};

export const USAGE_SHARE: Record<Usage, { share: number; uncertainty: number }> = {
  occasional: { share: 0.15, uncertainty: 0.4 },
  few_hours: { share: 0.35, uncertainty: 0.3 },
  daily: { share: 0.6, uncertainty: 0.2 },
  main: { share: 0.9, uncertainty: 0.1 },
};

/** Seasonal efficiencies (ADEME / Flamme Verte, U.S. EPA certified appliance data). */
export const APPLIANCE_EFFICIENCY: Record<Appliance, { low: number; high: number }> = {
  open_fireplace: { low: 0.1, high: 0.2 },
  wood_stove: { low: 0.65, high: 0.8 },
  insert: { low: 0.6, high: 0.75 },
  pellet_stove: { low: 0.82, high: 0.92 },
  wood_boiler: { low: 0.7, high: 0.85 },
  other: { low: 0.5, high: 0.75 },
};

export const FUEL_PROPS: Record<FuelChoice, { kind: "logs" | "pellets" | "briquettes"; species?: SpeciesKey; moisture: number }> = {
  hardwood: { kind: "logs", species: "oak", moisture: 0.22 },
  mixed: { kind: "logs", species: "mixed", moisture: 0.22 },
  softwood: { kind: "logs", species: "softwood", moisture: 0.22 },
  kiln_dried: { kind: "logs", species: "mixed_hardwood", moisture: 0.15 },
  briquettes: { kind: "briquettes", moisture: 0.08 },
  pellets: { kind: "pellets", moisture: 0.08 },
};

export function fuelsForAppliance(appliance: Appliance): FuelChoice[] {
  if (appliance === "pellet_stove") return ["pellets"];
  if (appliance === "open_fireplace") return ["hardwood", "mixed", "kiln_dried", "briquettes"];
  return ["hardwood", "mixed", "softwood", "kiln_dried", "briquettes"];
}

/** Burning wood wetter than 20 % lowers the real efficiency of the appliance. */
export function moistureEfficiencyFactor(moisture: number): number {
  if (moisture <= 0.2) return 1;
  return Math.max(0.7, 1 - (moisture - 0.2) * 1.7);
}

export interface Range {
  low: number;
  central: number;
  high: number;
}

export type QuantityUnit =
  | "stere"
  | "cubic_meter"
  | "full_cord"
  | "face_cord"
  | "kg"
  | "tonne"
  | "short_ton"
  | "bag_15kg"
  | "bag_40lb"
  | "lb";

export interface QuantityLine extends Range {
  unit: QuantityUnit;
  /** Energy (kWh) contained in one unit, for transparency. */
  kwhPerUnit: number;
}

export interface CalcResult {
  input: CalcInput;
  areaM2: number;
  climate: ClimateInfo;
  periodDegreeDays: number;
  usefulHeatKwh: Range;
  fuelEnergyKwh: Range;
  efficiency: number;
  uncertainty: number;
  fuelKind: "logs" | "pellets" | "briquettes";
  quantities: QuantityLine[];
  warnings: Array<"open_fireplace" | "pellet_fuel_mismatch" | "small_area" | "large_area">;
}

export function estimateHeatingNeeds(input: CalcInput): CalcResult {
  const areaM2 = input.market === "fr" ? input.area : input.area / SQFT_PER_M2;
  const climate = climateFor(input.market, input.postalCode, input.market === "fr" ? input.altitude : "low");
  const periodDegreeDays = climate.hdd * seasonShare(input.months);

  const usage = USAGE_SHARE[input.usage];
  const usefulCentral =
    (areaM2 * HEAT_LOSS_WH_PER_M2_DD[input.insulation] * periodDegreeDays * HOUSING_FACTOR[input.housing] * usage.share) /
    1000;

  // A pellet stove only burns pellets, whatever was selected.
  const fuel: FuelChoice = input.appliance === "pellet_stove" ? "pellets" : input.fuel === "pellets" ? "hardwood" : input.fuel;
  const props = FUEL_PROPS[fuel];
  const eff = APPLIANCE_EFFICIENCY[input.appliance];
  const effCentral = ((eff.low + eff.high) / 2) * (props.kind === "logs" ? moistureEfficiencyFactor(props.moisture) : 1);
  const effUncertainty = (eff.high - eff.low) / (eff.high + eff.low);

  const uncertainty = Math.min(
    0.5,
    Math.sqrt(climate.uncertainty ** 2 + ENVELOPE_UNCERTAINTY ** 2 + usage.uncertainty ** 2 + effUncertainty ** 2),
  );

  const fuelCentral = usefulCentral / effCentral;
  const usefulHeatKwh = spread(usefulCentral, uncertainty);
  const fuelEnergyKwh = spread(fuelCentral, uncertainty);

  const warnings: CalcResult["warnings"] = [];
  if (input.appliance === "open_fireplace") warnings.push("open_fireplace");
  if (input.fuel === "pellets" && input.appliance !== "pellet_stove") warnings.push("pellet_fuel_mismatch");
  if (areaM2 < 20) warnings.push("small_area");
  if (areaM2 > 600) warnings.push("large_area");

  return {
    input: { ...input, fuel },
    areaM2,
    climate,
    periodDegreeDays,
    usefulHeatKwh,
    fuelEnergyKwh,
    efficiency: effCentral,
    uncertainty,
    fuelKind: props.kind,
    quantities: quantitiesFor(input.market, fuel, fuelEnergyKwh),
    warnings,
  };
}

function spread(central: number, u: number): Range {
  return { low: central * (1 - u), central, high: central * (1 + u) };
}

/** Energy per display unit for a fuel, then quantities in the market's usual units. */
export function quantitiesFor(market: MarketId, fuel: FuelChoice, energy: Range): QuantityLine[] {
  const props = FUEL_PROPS[fuel];
  const lines: Array<[QuantityUnit, number]> = [];

  if (props.kind === "logs") {
    const perSolid = energyPerSolidM3(props.species ?? "mixed_hardwood", props.moisture);
    const perStackedM3 = perSolid * SOLID_FRACTION.stacked;
    if (market === "fr") {
      lines.push(["stere", perSolid * SOLID_FRACTION.stere]);
      lines.push(["cubic_meter", perStackedM3]);
    } else {
      const fullCord = 128 * CUBIC_FOOT_M3 * perStackedM3;
      lines.push(["full_cord", fullCord]);
      lines.push(["face_cord", fullCord / 3]);
    }
  } else {
    const perKg = lhvPerKg(props.moisture, 5.15);
    if (props.kind === "pellets") {
      if (market === "fr") {
        lines.push(["tonne", perKg * 1000]);
        lines.push(["bag_15kg", perKg * 15]);
      } else {
        lines.push([market === "us" ? "short_ton" : "tonne", perKg * (market === "us" ? 2000 * LB_KG : 1000)]);
        lines.push(["bag_40lb", perKg * 40 * LB_KG]);
      }
    } else {
      lines.push(market === "fr" ? ["kg", perKg] : ["lb", perKg * LB_KG]);
    }
  }

  return lines.map(([unit, kwhPerUnit]) => ({
    unit,
    kwhPerUnit,
    low: roundQty(unit, energy.low / kwhPerUnit, "down"),
    central: roundQty(unit, energy.central / kwhPerUnit, "nearest"),
    high: roundQty(unit, energy.high / kwhPerUnit, "up"),
  }));
}

const QTY_STEP: Record<QuantityUnit, number> = {
  stere: 0.5,
  cubic_meter: 0.5,
  full_cord: 0.25,
  face_cord: 0.5,
  kg: 10,
  lb: 25,
  tonne: 0.1,
  short_ton: 0.1,
  bag_15kg: 1,
  bag_40lb: 1,
};

export function roundQty(unit: QuantityUnit, value: number, mode: "down" | "up" | "nearest"): number {
  const step = QTY_STEP[unit];
  const fn = mode === "down" ? Math.floor : mode === "up" ? Math.ceil : Math.round;
  const r = fn(value / step) * step;
  return Math.max(r, mode === "down" ? 0 : step);
}

/** Number of sale units of a product needed to supply an amount of energy. */
export function suggestedUnits(needKwh: number, kwhPerUnit: number, minQty: number): number {
  if (!(kwhPerUnit > 0)) return minQty;
  return Math.max(minQty, Math.ceil(needKwh / kwhPerUnit));
}
