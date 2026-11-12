// Heating season, based on real calendar dates (all our markets are in the
// northern hemisphere): used for honest urgency messages, never a fake timer.
export type SeasonPhase = "before" | "winter" | "off";

const DAY = 86_400_000;

/**
 * "before": from 1 September to 20 December, with the number of days until
 * winter starts (21 December). "winter": 21 December – 20 March.
 * "off": the rest of the year.
 */
export function seasonInfo(now: Date = new Date()): { phase: SeasonPhase; days: number } {
  const y = now.getUTCFullYear();
  const today = Date.UTC(y, now.getUTCMonth(), now.getUTCDate());
  const winterStart = Date.UTC(y, 11, 21);
  const winterEnd = Date.UTC(y, 2, 20);
  if (today <= winterEnd || today >= winterStart) return { phase: "winter", days: 0 };
  const days = Math.round((winterStart - today) / DAY);
  return { phase: today >= Date.UTC(y, 8, 1) ? "before" : "off", days };
}

export function seasonMessage(
  t: { before: string; beforeOne: string; winter: string; off: string },
  now: Date = new Date(),
): string {
  const s = seasonInfo(now);
  if (s.phase === "winter") return t.winter;
  if (s.phase === "off") return t.off;
  return s.days === 1 ? t.beforeOne : t.before.replace("{n}", String(s.days));
}
