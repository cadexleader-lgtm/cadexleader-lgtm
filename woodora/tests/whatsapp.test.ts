import { describe, expect, it } from "vitest";
import { buildPreorderMessage, whatsappLink } from "@/lib/whatsapp";
import { evaluateDelivery, type DeliveryZone } from "@/lib/data/zones";

describe("WhatsApp", () => {
  it("builds wa.me links with digits only", () => {
    expect(whatsappLink("+1 (514) 555-0100", "Bonjour")).toBe("https://wa.me/15145550100?text=Bonjour");
    expect(whatsappLink("", "x")).toBeNull();
  });
  it("prefills the pre-order message", () => {
    const msg = buildPreorderMessage({
      lang: "fr", reference: "WD-CA-2026-000125", total: "278 $", address: "1 rue X, H2X 1Y4 Montréal", name: "Marie",
      items: [{ name: "Bois franc", quantity: 2, unit: "face cords" }],
    });
    expect(msg).toContain("Référence : WD-CA-2026-000125");
    expect(msg).toContain("facture pro forma");
  });
});

describe("delivery zones", () => {
  const zone: DeliveryZone = {
    id: "z1", marketId: "ca", supplierId: "s1", name: "QC", regionCodes: ["QC"], excludedPostalPrefixes: ["G0G"],
    excludedProductIds: ["p-excluded"], freeDelivery: true, freeDeliveryMinCents: 15000, leadTimeDaysMin: 3,
    leadTimeDaysMax: 7, remoteAreaNote: {}, active: true,
  };
  it("accepts covered addresses", () => {
    const r = evaluateDelivery("ca", "H2X 1Y4", [zone], [{ productId: "p1", supplierId: "s1" }], 20000);
    expect(r.ok).toBe(true);
    expect(r.freeDelivery).toBe(true);
  });
  it("refuses regions, excluded postal codes and excluded products", () => {
    expect(evaluateDelivery("ca", "M5V 2T6", [zone]).reason).toBe("region_not_served");
    expect(evaluateDelivery("ca", "G0G 1A0", [zone]).reason).toBe("postal_excluded");
    const r = evaluateDelivery("ca", "H2X 1Y4", [zone], [{ productId: "p-excluded", supplierId: "s1" }]);
    expect(r.ok).toBe(false);
    expect(r.blockedProductIds).toEqual(["p-excluded"]);
  });
  it("does not offer free delivery below the threshold", () => {
    expect(evaluateDelivery("ca", "H2X 1Y4", [zone], [{ productId: "p1", supplierId: "s1" }], 5000).freeDelivery).toBe(false);
  });
  it("rejects invalid postal codes and other suppliers", () => {
    expect(evaluateDelivery("ca", "123", [zone]).reason).toBe("invalid_postal");
    expect(evaluateDelivery("ca", "H2X 1Y4", [zone], [{ productId: "p1", supplierId: "other" }]).ok).toBe(false);
  });
});
