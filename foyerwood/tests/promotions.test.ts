import { describe, expect, it } from "vitest";
import { evaluatePromotions, sanitizePromotions, savingPercent, type ResolvedPromotions } from "@/lib/promotions";

const promo: ResolvedPromotions = {
  enabled: true,
  tiers: [
    { minCents: 50000, percent: 5 },
    { minCents: 100000, percent: 10 },
  ],
  gifts: [
    { minCents: 25000, productId: "g1", name: "Allume-feu", image: null },
    { minCents: 60000, productId: "g2", name: "Humidimètre", image: null },
  ],
};
const wood = (priceCents: number, qty: number) => ({ priceCents, qty, categoryId: "firewood" });
const acc = (priceCents: number, qty: number) => ({ priceCents, qty, categoryId: "accessories" });

describe("promotions", () => {
  it("does nothing below the first thresholds and says what is missing", () => {
    const r = evaluatePromotions(promo, [wood(10000, 2)]);
    expect(r.discountCents).toBe(0);
    expect(r.gifts).toHaveLength(0);
    expect(r.nextGift).toEqual({ gift: promo.gifts[0], missingCents: 5000 });
    expect(r.nextTier).toEqual({ percent: 5, missingCents: 30000 });
  });
  it("applies the best reached tier to firewood only, and every reached gift", () => {
    const r = evaluatePromotions(promo, [wood(35000, 2), acc(2990, 1)]);
    expect(r.qualifyingCents).toBe(70000);
    expect(r.discountPercent).toBe(5);
    expect(r.discountCents).toBe(3500);
    expect(r.totalCents).toBe(70000 + 2990 - 3500);
    expect(r.gifts.map((g) => g.productId)).toEqual(["g1", "g2"]);
    expect(r.nextTier).toEqual({ percent: 10, missingCents: 30000 });
    expect(r.nextGift).toBeNull();
  });
  it("accessories alone never trigger discounts or gifts", () => {
    const r = evaluatePromotions(promo, [acc(100000, 2)]);
    expect(r.discountCents).toBe(0);
    expect(r.gifts).toHaveLength(0);
  });
  it("is off when disabled", () => {
    const r = evaluatePromotions({ ...promo, enabled: false }, [wood(200000, 1)]);
    expect(r.discountCents).toBe(0);
    expect(r.gifts).toHaveLength(0);
    expect(r.totalCents).toBe(200000);
  });
  it("cleans invalid settings", () => {
    const s = sanitizePromotions({ tiers: [{ minCents: 100000, percent: 10 }, { minCents: -5, percent: 5 }, { minCents: 5000, percent: 80 }], gifts: [{ minCents: 0, productSlug: "x" }, { minCents: 30000, productSlug: " kit " }] });
    expect(s.tiers).toEqual([{ minCents: 100000, percent: 10 }]);
    expect(s.gifts).toEqual([{ minCents: 30000, productSlug: "kit" }]);
  });
  it("never overstates a saving", () => {
    expect(savingPercent(12000, 14000)).toBe(14);
    expect(savingPercent(14000, 14000)).toBe(0);
    expect(savingPercent(14000, null)).toBe(0);
  });
});
