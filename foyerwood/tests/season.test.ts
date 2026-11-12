import { describe, expect, it } from "vitest";
import { seasonInfo, seasonMessage } from "@/lib/season";

const t = { before: "in {n} days", beforeOne: "tomorrow", winter: "winter", off: "off" };

describe("heating season", () => {
  it("counts the real days until 21 December", () => {
    expect(seasonInfo(new Date("2026-11-12T10:00:00Z"))).toEqual({ phase: "before", days: 39 });
    expect(seasonMessage(t, new Date("2026-12-20T08:00:00Z"))).toBe("tomorrow");
  });
  it("is winter from 21 December to 20 March", () => {
    expect(seasonInfo(new Date("2026-12-21T00:00:00Z")).phase).toBe("winter");
    expect(seasonInfo(new Date("2027-01-15T00:00:00Z")).phase).toBe("winter");
    expect(seasonInfo(new Date("2027-03-20T23:00:00Z")).phase).toBe("winter");
  });
  it("is off season in spring and summer", () => {
    expect(seasonInfo(new Date("2027-03-21T00:00:00Z")).phase).toBe("off");
    expect(seasonMessage(t, new Date("2027-07-01T00:00:00Z"))).toBe("off");
    expect(seasonInfo(new Date("2027-09-01T00:00:00Z")).phase).toBe("before");
  });
});
