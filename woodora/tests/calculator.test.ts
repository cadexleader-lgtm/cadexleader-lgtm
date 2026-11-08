import { describe, expect, it } from "vitest";
import { estimateHeatingNeeds, suggestedUnits, roundQty } from "@/lib/calculator";
import { climateFor, seasonShare } from "@/lib/climate";

describe("climate lookup", () => {
  it("resolves French climate zones from the postal code", () => {
    expect(climateFor("fr", "75011").label).toContain("H1a");
    expect(climateFor("fr", "13001").label).toContain("H3");
    expect(climateFor("fr", "67000").hdd).toBeGreaterThan(climateFor("fr", "33000").hdd);
  });
  it("adds degree-days for altitude in France", () => {
    expect(climateFor("fr", "74400", "mountain").hdd).toBe(climateFor("fr", "74400").hdd + 1500);
  });
  it("uses Canadian forward sortation areas", () => {
    expect(climateFor("ca", "H2X 1Y4").label).toBe("Montréal");
    expect(climateFor("ca", "G1R 4P5").hdd).toBeGreaterThan(climateFor("ca", "M5V 2T6").hdd);
  });
  it("converts US °F degree-days", () => {
    expect(climateFor("us", "05401").hdd).toBe(Math.round((7700 * 5) / 9)); // Vermont
    expect(climateFor("us", "33101").hdd).toBeLessThan(500); // Florida
  });
  it("falls back to a national average on unknown codes", () => {
    expect(climateFor("fr", "abc").uncertainty).toBeGreaterThan(0.15);
  });
  it("season shares grow with months", () => {
    expect(seasonShare(1)).toBeLessThan(seasonShare(3));
    expect(seasonShare("season")).toBe(1);
  });
});

describe("heating needs estimate", () => {
  const base = {
    market: "fr" as const,
    postalCode: "37000",
    area: 120,
    housing: "house" as const,
    insulation: "average" as const,
    appliance: "wood_stove" as const,
    fuel: "hardwood" as const,
    usage: "daily" as const,
    months: 5 as const,
  };

  it("matches the order of magnitude of the specification example (120 m², 5 months, daily)", () => {
    const r = estimateHeatingNeeds(base);
    const steres = r.quantities.find((q) => q.unit === "stere")!;
    expect(steres.central).toBeGreaterThanOrEqual(4);
    expect(steres.central).toBeLessThanOrEqual(8);
    expect(steres.low).toBeLessThan(steres.central);
    expect(steres.high).toBeGreaterThan(steres.central);
  });

  it("main heating of a Québec house needs several full cords", () => {
    const r = estimateHeatingNeeds({ ...base, market: "ca", postalCode: "G1R 4P5", area: 1600, insulation: "good", usage: "main", months: "season" });
    const cords = r.quantities.find((q) => q.unit === "full_cord")!;
    expect(cords.central).toBeGreaterThanOrEqual(3);
    expect(cords.central).toBeLessThanOrEqual(8);
  });

  it("better insulation means less wood", () => {
    const poor = estimateHeatingNeeds({ ...base, insulation: "poor" }).fuelEnergyKwh.central;
    const good = estimateHeatingNeeds({ ...base, insulation: "excellent" }).fuelEnergyKwh.central;
    expect(good).toBeLessThan(poor / 3);
  });

  it("an open fireplace burns far more wood for the same heat and raises a warning", () => {
    const stove = estimateHeatingNeeds(base);
    const open = estimateHeatingNeeds({ ...base, appliance: "open_fireplace" });
    expect(open.fuelEnergyKwh.central).toBeGreaterThan(stove.fuelEnergyKwh.central * 3);
    expect(open.warnings).toContain("open_fireplace");
  });

  it("pellet stoves are expressed in tonnes and bags", () => {
    const r = estimateHeatingNeeds({ ...base, appliance: "pellet_stove", fuel: "hardwood" });
    expect(r.fuelKind).toBe("pellets");
    expect(r.quantities.map((q) => q.unit)).toEqual(["tonne", "bag_15kg"]);
    const r2 = estimateHeatingNeeds({ ...base, market: "us", postalCode: "05401", area: 1500, appliance: "pellet_stove", fuel: "pellets" });
    expect(r2.quantities.map((q) => q.unit)).toEqual(["short_ton", "bag_40lb"]);
  });

  it("kiln-dried wood needs less volume than seasoned softwood", () => {
    const kiln = estimateHeatingNeeds({ ...base, fuel: "kiln_dried" }).quantities[0].central;
    const soft = estimateHeatingNeeds({ ...base, fuel: "softwood" }).quantities[0].central;
    expect(kiln).toBeLessThan(soft);
  });

  it("the range is bounded", () => {
    const r = estimateHeatingNeeds({ ...base, usage: "occasional" });
    expect(r.uncertainty).toBeLessThanOrEqual(0.5);
  });
});

describe("quantities", () => {
  it("rounds to commercial steps", () => {
    expect(roundQty("stere", 4.3, "nearest")).toBe(4.5);
    expect(roundQty("bag_40lb", 10.1, "up")).toBe(11);
  });
  it("never suggests less than the minimum order", () => {
    expect(suggestedUnits(1000, 7000, 2)).toBe(2);
    expect(suggestedUnits(30000, 7000, 1)).toBe(5);
  });
});
