import { describe, expect, it } from "vitest";
import { regionFromPostalCode, isValidPostalCode, formatPostalCode } from "@/lib/regions";

describe("postal codes", () => {
  it("validates per market", () => {
    expect(isValidPostalCode("ca", "h2x 1y4")).toBe(true);
    expect(isValidPostalCode("ca", "D2X 1Y4")).toBe(false);
    expect(isValidPostalCode("us", "10001")).toBe(true);
    expect(isValidPostalCode("us", "10001-1234")).toBe(true);
    expect(isValidPostalCode("fr", "7501")).toBe(false);
  });
  it("maps to provinces, states and départements", () => {
    expect(regionFromPostalCode("ca", "H2X1Y4")).toBe("QC");
    expect(regionFromPostalCode("ca", "K1A 0B1")).toBe("ON");
    expect(regionFromPostalCode("ca", "X0A 0H0")).toBe("NU");
    expect(regionFromPostalCode("ca", "X1A 2P7")).toBe("NT");
    expect(regionFromPostalCode("us", "10001")).toBe("NY");
    expect(regionFromPostalCode("us", "05401")).toBe("VT");
    expect(regionFromPostalCode("us", "73301")).toBe("TX");
    expect(regionFromPostalCode("fr", "75011")).toBe("75");
    expect(regionFromPostalCode("fr", "20000")).toBe("2A");
    expect(regionFromPostalCode("fr", "20200")).toBe("2B");
    expect(regionFromPostalCode("fr", "97400")).toBeNull();
  });
  it("formats Canadian codes", () => {
    expect(formatPostalCode("ca", "h2x1y4")).toBe("H2X 1Y4");
  });
});
