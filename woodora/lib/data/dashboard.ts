import { query } from "../db/client";
import { MARKETS, type MarketId } from "../markets";
import type { OrderStatus } from "../order-status";

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  byStatus: Record<string, number>;
  quotesSent: number;
  paymentsVerified: number;
  confirmedOrders: number;
  deliveredOrders: number;
  revenueByCurrency: Array<{ currency: string; cents: number }>;
  marginByCurrency: Array<{ currency: string; cents: number; revenueCents: number }>;
  calculations30d: number;
  newMessages: number;
  pendingReviews: number;
}

export async function getDashboardStats(market?: MarketId): Promise<DashboardStats> {
  const m = market ?? null;
  // "Today" is evaluated in the market's time zone (Paris when all markets are shown).
  const tz = market ? MARKETS[market].timeZone : "Europe/Paris";
  const [counts] = await query<{ total: number; today: number }>(
    `select count(*)::int as total,
       count(*) filter (where (created_at at time zone $2)::date = (now() at time zone $2)::date)::int as today
     from orders where ($1::text is null or market_id = $1)`,
    [m, tz],
  );
  const statusRows = await query<{ status: OrderStatus; n: number }>(
    `select status, count(*)::int as n from orders where ($1::text is null or market_id = $1) group by status`,
    [m],
  );
  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.n]));
  const [q] = await query<{ n: number }>(
    `select count(*)::int as n from quotations qu join orders o on o.id = qu.order_id
     where qu.status in ('sent','accepted') and ($1::text is null or o.market_id = $1)`,
    [m],
  );
  const [p] = await query<{ n: number }>(
    `select count(*)::int as n from payments pa join orders o on o.id = pa.order_id
     where pa.status = 'verified' and ($1::text is null or o.market_id = $1)`,
    [m],
  );
  const revenue = await query<{ currency: string; cents: number }>(
    `select pa.currency, sum(pa.received_cents)::float8 as cents from payments pa join orders o on o.id = pa.order_id
     where pa.status = 'verified' and o.status <> 'cancelled' and ($1::text is null or o.market_id = $1)
     group by pa.currency order by pa.currency`,
    [m],
  );
  const margin = await query<{ currency: string; cents: number; revenue_cents: number }>(
    `select o.currency, sum(oi.line_total_cents - coalesce(oi.unit_cost_cents, 0) * oi.quantity)::float8 as cents,
       sum(oi.line_total_cents)::float8 as revenue_cents
     from order_items oi join orders o on o.id = oi.order_id
     where o.status in ('payment_received','confirmed','preparing_delivery','in_delivery','delivered')
       and ($1::text is null or o.market_id = $1)
     group by o.currency order by o.currency`,
    [m],
  );
  const [calc] = await query<{ n: number }>(
    `select count(*)::int as n from heating_calculations where created_at > now() - interval '30 days' and ($1::text is null or market_id = $1)`,
    [m],
  );
  const [msg] = await query<{ n: number }>(`select count(*)::int as n from contact_messages where status = 'new' and ($1::text is null or market_id = $1)`, [m]);
  const [rev] = await query<{ n: number }>(`select count(*)::int as n from reviews where status = 'pending' and ($1::text is null or market_id = $1)`, [m]);

  const confirmedSet: OrderStatus[] = ["confirmed", "preparing_delivery", "in_delivery", "delivered"];
  return {
    totalOrders: counts.total,
    todayOrders: counts.today,
    byStatus,
    quotesSent: q.n,
    paymentsVerified: p.n,
    confirmedOrders: confirmedSet.reduce((s, k) => s + (byStatus[k] ?? 0), 0),
    deliveredOrders: byStatus.delivered ?? 0,
    revenueByCurrency: revenue,
    marginByCurrency: margin.map((r) => ({ currency: r.currency, cents: r.cents, revenueCents: r.revenue_cents })),
    calculations30d: calc.n,
    newMessages: msg.n,
    pendingReviews: rev.n,
  };
}

export async function ordersPerDay(days = 30, market?: MarketId) {
  return query<{ day: string; n: number }>(
    `select to_char(d, 'YYYY-MM-DD') as day, coalesce(c.n, 0)::int as n
     from generate_series((now() - ($1::int - 1) * interval '1 day')::date, now()::date, interval '1 day') d
     left join (select created_at::date as day, count(*) as n from orders where ($2::text is null or market_id = $2) group by 1) c
       on c.day = d::date
     order by d`,
    [days, market ?? null],
  );
}
