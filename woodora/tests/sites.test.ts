import { describe, expect, it } from "vitest";
import { parsePublicPath, switchLanguagePath, SITES, categoryPath, productPath, legalPath } from "@/lib/sites";

describe("localized routing", () => {
  it("parses market prefixes", () => {
    expect(parsePublicPath("/ca/en/shop")?.site.id).toBe("ca-en");
    expect(parsePublicPath("/ca/boutique")?.internal).toEqual(["shop"]);
    expect(parsePublicPath("/us")?.internal).toEqual([]);
    expect(parsePublicPath("/de")).toBeNull();
  });
  it("maps category and legal slugs", () => {
    expect(parsePublicPath("/fr/bois-de-chauffage")?.internal).toEqual(["category", "firewood"]);
    expect(parsePublicPath("/us/wood-pellets")?.internal).toEqual(["category", "pellets"]);
    expect(parsePublicPath("/fr/informations/mentions-legales")?.internal).toEqual(["legal", "notice"]);
  });
  it("flags unknown or wrong-language slugs", () => {
    expect(parsePublicPath("/fr/shop")?.known).toBe(false);
    expect(parsePublicPath("/ca/category/firewood")?.known).toBe(false);
  });
  it("round-trips builders and parser", () => {
    const s = SITES["ca-en"];
    expect(parsePublicPath(categoryPath(s, "kiln-dried"))?.internal).toEqual(["category", "kiln-dried"]);
    expect(parsePublicPath(productPath(s, "maple-face-cord"))?.internal).toEqual(["product", "maple-face-cord"]);
    expect(parsePublicPath(legalPath(SITES.fr, "terms"))?.internal).toEqual(["legal", "terms"]);
  });
  it("switches language in Canada", () => {
    expect(switchLanguagePath("/ca/bois-seche", SITES["ca-en"])).toBe("/ca/en/kiln-dried-firewood");
    expect(switchLanguagePath("/ca/en/product/abc", SITES.ca)).toBe("/ca/produit/abc");
    expect(switchLanguagePath("/ca/conseils/un-article", SITES["ca-en"])).toBe("/ca/en/advice");
  });
});
