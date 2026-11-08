import type { Lang } from "../markets";
import { en } from "./en";
import { fr, type Dict } from "./fr";

export type { Dict };

/** French typography: non-breaking space before ? ! : ; » and after «. */
function frenchSpacing<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ") as T;
  }
  if (Array.isArray(value)) return value.map(frenchSpacing) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchSpacing(v)])) as T;
  }
  return value;
}

const frTyped = frenchSpacing(fr);

export function getDict(lang: Lang): Dict {
  return lang === "fr" ? frTyped : en;
}
