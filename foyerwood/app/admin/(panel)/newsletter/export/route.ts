import { getCurrentUser } from "@/lib/admin-auth";
import { listSubscribers } from "@/lib/data/misc";
import { isMarketId, type MarketId } from "@/lib/markets";

export const dynamic = "force-dynamic";

const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const m = new URL(req.url).searchParams.get("m");
  const subs = await listSubscribers(isMarketId(m) ? (m as MarketId) : undefined);
  const rows = [["email", "market", "language", "status", "created_at"], ...subs.map((s) => [s.email, s.marketId, s.language, s.status, new Date(s.createdAt).toISOString()])];
  const csv = "﻿" + rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foyerwood-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
