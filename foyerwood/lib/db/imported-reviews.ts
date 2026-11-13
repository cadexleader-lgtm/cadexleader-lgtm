// Real customer reviews received by the owner before this site existed (on
// their previous online store), imported once with their source. Each entry
// has a fixed id: it is inserted on the next start and never recreated, so a
// review hidden or edited in the administration stays that way.
import type { Queryable } from "./client";

export interface ImportedReview {
  id: string;
  market: "fr" | "ca" | "us";
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  language: "fr" | "en";
  /** Date shown with the review (ISO date), as on the original platform. */
  date: string | null;
}

export const IMPORTED_REVIEWS: ImportedReview[] = [];

export async function ensureImportedReviews(db: Queryable) {
  for (const r of IMPORTED_REVIEWS) {
    await db.query(
      `insert into reviews (id, market_id, author_name, city, rating, title, body, language, verified, source, status, moderated_at, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,false,'previous_shop','approved',now(),coalesce($9::timestamptz, now()))
       on conflict (id) do nothing`,
      [r.id, r.market, r.authorName, r.city, r.rating, r.title, r.body, r.language, r.date],
    );
  }
}
