import { describe, expect, it } from "vitest";
import { energyPerUnitKwh, lhvPerKg, standardStackedVolumeM3, unitDefinition } from "@/lib/energy";

describe("energy content", () => {
  it("LHV decreases with moisture", () => {
    expect(lhvPerKg(0.2)).toBeCloseTo(3.94, 1);
    expect(lhvPerKg(0.4)).toBeLessThan(lhvPerKg(0.2));
  });
  it("a stère of seasoned oak holds ~1 500–2 000 kWh", () => {
    const e = energyPerUnitKwh({ category: "firewood", unit: "stere", species: "oak", moisture: 0.2 })!;
    expect(e).toBeGreaterThan(1500);
    expect(e).toBeLessThan(2000);
  });
  it("a full cord of hardwood holds ~6 000–7 500 kWh (≈ 20–26 MBtu LHV)", () => {
    const e = energyPerUnitKwh({ category: "firewood", unit: "full_cord", species: "maple", moisture: 0.2 })!;
    expect(e).toBeGreaterThan(6000);
    expect(e).toBeLessThan(7500);
  });
  it("a face cord of 16-inch logs is one third of a full cord", () => {
    expect(standardStackedVolumeM3("face_cord", 40.64)! * 3).toBeCloseTo(standardStackedVolumeM3("full_cord")!, 5);
  });
  it("pellets are computed from the bag weight", () => {
    const e = energyPerUnitKwh({ category: "pellets", unit: "bag", unitWeightKg: 15, moisture: 0.08 })!;
    expect(e / 15).toBeGreaterThan(4.6);
    expect(e / 15).toBeLessThan(4.9);
  });
  it("accessories carry no energy", () => {
    expect(energyPerUnitKwh({ category: "accessories", unit: "piece" })).toBeNull();
  });
  it("explains units in both languages", () => {
    expect(unitDefinition("face_cord", "fr", 40.64)).toContain("1/3");
    expect(unitDefinition("full_cord", "en")).toContain("128 ft³");
  });
});
