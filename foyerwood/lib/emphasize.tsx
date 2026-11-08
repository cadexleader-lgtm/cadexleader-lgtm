import type { ReactNode } from "react";

/** "La chaleur du *bois*" → La chaleur du <em>bois</em> (italic accent). */
export function emphasize(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part));
}
