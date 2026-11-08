import { describe, expect, it } from "vitest";
import { speciesCatalog, CATALOG_SPECIES, CATALOG_PACKAGINGS } from "@/lib/db/seed-species-catalog";
import { SEED_PRODUCTS } from "@/lib/db/seed-catalog";
import { MARKET_UNITS, energyPerUnitKwh } from "@/lib/energy";

describe("species × packaging catalogue", () => {
  const all = speciesCatalog();
  it("has 6 species × 6 packagings in each of the 3 markets", () => {
    expect(all).toHaveLength(CATALOG_SPECIES.length * CATALOG_PACKAGINGS.length * 3);
    for (const m of ["fr", "ca", "us"] as const) {
      for (const sp of CATALOG_SPECIES) {
        expect(new Set(all.filter((p) => p.market === m && p.species === sp).map((p) => p.packaging)).size).toBe(6);
      }
    }
  });
  it("uses unique slugs per market across the whole seed", () => {
    for (const m of ["fr", "ca", "us"] as const) {
      const slugs = SEED_PRODUCTS.filter((p) => p.market === m).map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
  it("only uses units offered on each market, with a computable energy content", () => {
    for (const p of all) {
      expect(MARKET_UNITS[p.market]).toContain(p.unit);
      const kwh = energyPerUnitKwh({ category: p.category, unit: p.unit, species: p.species, moisture: (p.moisture ?? 20) / 100, lengthCm: p.lengthCm, unitVolumeM3: p.volumeM3, unitWeightKg: p.weightKg, packing: p.packing });
      expect(kwh).toBeGreaterThan(0);
    }
  });
  it("names products in the language(s) of each market", () => {
    for (const p of all) {
      if (p.market === "fr") expect(p.name.fr).toBeTruthy();
      if (p.market === "us") expect(p.name.en).toMatch(/Firewood/);
      if (p.market === "ca") expect(p.name.fr && p.name.en).toBeTruthy();
    }
  });
});
