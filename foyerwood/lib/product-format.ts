import type { Product } from "./data/products";

import type { Dict } from "./i18n";
import type { Lang } from "./markets";
import { unitLabel } from "./energy";

/** Short "format" line shown on product cards: "Face cord · 16 po" / "Palette · 990 kg". */
export function formatLabel(p: Pick<Product, "unit" | "packaging" | "lengthCm" | "unitWeightKg" | "marketId">, t: Dict, lang: Lang): string {
  const parts: string[] = [];
  const unit = unitLabel(p.unit, lang, 1);
  parts.push(unit.charAt(0).toUpperCase() + unit.slice(1));
  if (p.lengthCm && p.lengthCm >= 20) {
    parts.push(p.marketId === "fr" ? `${Math.round(p.lengthCm)} cm` : `${Math.round(p.lengthCm / 2.54)} ${lang === "fr" ? "po" : "in"}`);
  } else if (p.unitWeightKg) {
    const lb = Math.round(p.unitWeightKg / 0.45359237);
    parts.push(p.marketId === "fr" ? `${Math.round(p.unitWeightKg)} kg` : `${lb.toLocaleString(lang === "fr" ? "fr-CA" : "en-US")} lb`);
  } else if (p.packaging !== "none" && p.packaging !== "bulk" && p.packaging !== p.unit) {
    parts.push(t.packaging[p.packaging]);
  }
  return parts.join(" · ");
}
