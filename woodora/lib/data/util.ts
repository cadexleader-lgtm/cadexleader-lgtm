/** snake_case row → camelCase object (top-level keys only). */
export function camelize<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as T;
}

export function camelizeAll<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => camelize<T>(r));
}

export function toIso(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}
