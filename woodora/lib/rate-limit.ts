import "server-only";
import { headers } from "next/headers";

// Best-effort, per-instance rate limiting for public forms. Combined with the
// honeypot fields it stops naive spam; use a shared store (e.g. Upstash) if
// abuse appears at scale.
const buckets = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const id = `${key}:${await clientIp()}`;
  const now = Date.now();
  const hits = (buckets.get(id) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(id, hits);
    return false;
  }
  hits.push(now);
  buckets.set(id, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t > windowMs)) buckets.delete(k);
  }
  return true;
}
