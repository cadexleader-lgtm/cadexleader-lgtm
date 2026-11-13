import { query, queryOne } from "../db/client";
import type { Lang, MarketId } from "../markets";
import { camelizeAll } from "./util";

export const REVIEW_SOURCES = ["site", "whatsapp", "email", "google", "facebook", "phone", "in_person", "other"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];
export const isReviewSource = (v: string): v is ReviewSource => (REVIEW_SOURCES as readonly string[]).includes(v);

export interface Review {
  id: string;
  marketId: MarketId;
  orderId: string | null;
  productId: string | null;
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  language: Lang;
  verified: boolean;
  source: ReviewSource;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  orderReference?: string | null;
}

export async function listApprovedReviews(market: MarketId, limit = 6): Promise<Review[]> {
  return camelizeAll<Review>(
    await query(
      `select * from reviews where market_id = $1 and status = 'approved' order by created_at desc limit $2`,
      [market, limit],
    ),
  );
}

export async function reviewStats(market: MarketId): Promise<{ count: number; average: number | null }> {
  const row = await queryOne<{ count: number; average: number | null }>(
    `select count(*)::int as count, avg(rating)::float8 as average from reviews where market_id = $1 and status = 'approved'`,
    [market],
  );
  return row ?? { count: 0, average: null };
}

/** Reviews can only be left by customers whose order was delivered (authentic reviews only). */
export async function findDeliveredOrder(reference: string, email: string, market: MarketId) {
  return queryOne<{ id: string; customer_name: string; city: string }>(
    `select id, customer_name, city from orders where upper(reference) = upper($1) and lower(customer_email) = lower($2)
       and market_id = $3 and status = 'delivered'`,
    [reference.trim(), email.trim(), market],
  );
}

export async function hasReviewForOrder(orderId: string): Promise<boolean> {
  return !!(await queryOne(`select 1 from reviews where order_id = $1`, [orderId]));
}

export async function createReview(r: {
  market: MarketId;
  orderId: string;
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  language: Lang;
}) {
  await query(
    `insert into reviews (market_id, order_id, author_name, city, rating, title, body, language, verified)
     values ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
    [r.market, r.orderId, r.authorName, r.city, r.rating, r.title, r.body, r.language],
  );
}

/** A review from a real customer received outside the site, entered by the administrator. */
export async function createManualReview(r: {
  market: MarketId;
  orderId: string | null;
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  language: Lang;
  source: ReviewSource;
  createdAt: Date | null;
}) {
  await query(
    `insert into reviews (market_id, order_id, author_name, city, rating, title, body, language, verified, source, status, moderated_at, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved',now(),coalesce($11::timestamptz, now()))`,
    [r.market, r.orderId, r.authorName, r.city, r.rating, r.title, r.body, r.language, r.orderId != null, r.source, r.createdAt ? r.createdAt.toISOString() : null],
  );
}

export async function deliveredOrderByReference(reference: string, market: MarketId) {
  return queryOne<{ id: string }>(
    `select id from orders where upper(reference) = upper($1) and market_id = $2 and status = 'delivered'`,
    [reference.trim(), market],
  );
}

export async function adminListReviews(status?: Review["status"]): Promise<Review[]> {
  return camelizeAll<Review>(
    await query(
      `select r.*, o.reference as order_reference from reviews r left join orders o on o.id = r.order_id
       where ($1::text is null or r.status = $1) order by r.created_at desc limit 200`,
      [status ?? null],
    ),
  );
}

export async function moderateReview(id: string, status: Review["status"]) {
  await query(`update reviews set status = $2, moderated_at = now() where id = $1`, [id, status]);
}
