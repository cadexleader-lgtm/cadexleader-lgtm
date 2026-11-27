import { describe, expect, it, vi } from "vitest";
import { orderPagePath, smsLink, stageMessage, stageOf } from "@/lib/customer-messages";

const order = {
  marketId: "ca" as const,
  language: "fr" as const,
  reference: "FW-CA-2026-000007",
  accessToken: "tok123",
  customerName: "Marie Tremblay",
  currency: "CAD" as const,
};

describe("customer messages", () => {
  it("maps statuses to customer stages", () => {
    expect(stageOf("new")).toBe("received");
    expect(stageOf("verifying")).toBe("received");
    expect(stageOf("quote_sent")).toBe("pay");
    expect(stageOf("awaiting_payment")).toBe("pay");
    expect(stageOf("payment_received")).toBe("paid");
    expect(stageOf("in_delivery")).toBe("shipping");
    expect(stageOf("delivered")).toBe("delivered");
    expect(stageOf("cancelled")).toBe("cancelled");
  });

  it("links to the private order page on the official domain", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(orderPagePath(order)).toBe("/ca/precommande/confirmation/FW-CA-2026-000007?t=tok123");
    const m = stageMessage(order, "pay", { amountCents: 66310, proformaNumber: "PF-CA-2026-000007-1", brand: "Foyerwood" });
    expect(m.subject).toContain("FW-CA-2026-000007");
    expect(m.short).toContain("Bonjour Marie,");
    expect(m.short).toContain("PF-CA-2026-000007-1");
    expect(m.short).toMatch(/663,10/);
    expect(m.short).toContain("https://www.foyerwoods.com/ca/precommande/confirmation/FW-CA-2026-000007?t=tok123");
    vi.unstubAllEnvs();
  });

  it("writes in English for English orders", () => {
    const m = stageMessage({ ...order, language: "en" }, "paid", { amountCents: 1000, proformaNumber: null, brand: "Foyerwood" });
    expect(m.short.startsWith("Hello Marie,")).toBe(true);
  });

  it("builds SMS links only for real numbers", () => {
    expect(smsLink("+1 514 555 0199", "Bonjour")).toBe("sms:+15145550199?&body=Bonjour");
    expect(smsLink("123", "x")).toBeNull();
  });
});
