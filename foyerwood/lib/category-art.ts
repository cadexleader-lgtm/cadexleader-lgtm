import type { CategoryKey } from "./sites";

export const CATEGORY_ART: Record<CategoryKey, { art: string; species: "oak" | "birch" | "maple" | "softwood" | "mixed_hardwood" }> = {
  firewood: { art: "logs", species: "oak" },
  "kiln-dried": { art: "kiln", species: "maple" },
  pellets: { art: "pellets-bag", species: "mixed_hardwood" },
  briquettes: { art: "briquettes", species: "mixed_hardwood" },
  kindling: { art: "kindling", species: "softwood" },
  accessories: { art: "meter", species: "mixed_hardwood" },
};
