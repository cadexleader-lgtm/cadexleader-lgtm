import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import type { Dict } from "@/lib/i18n/fr";
import type { Review } from "@/lib/data/reviews";
import { fmt, formatNumber } from "@/lib/format";

type Stats = { count: number; average: number | null };
const COLS: Record<number, string> = { 1: "md:grid-cols-1 md:max-w-xl", 2: "md:grid-cols-2", 3: "md:grid-cols-3" };

/** Label shown under a review: verified order, or where the review was received. */
export function reviewSourceLabel(r: Pick<Review, "verified" | "source">, t: Dict): string {
  return r.verified ? t.reviewsProof.sources.verified : t.reviewsProof.sources[r.source] ?? t.reviewsProof.sources.other;
}

export function Stars({ value, size = "h-4 w-4", label }: { value: number; size?: string; label?: string }) {
  return (
    <span className="flex gap-0.5 text-wood" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < Math.floor(value + 0.25) ? "fill-current" : "opacity-25"}`} />
      ))}
    </span>
  );
}

/**
 * Real customer reviews shown along the purchase path. Renders nothing while
 * no review has been published: reviews are never invented.
 */
export function ReviewsProof({
  reviews,
  stats,
  t,
  locale,
  href,
  variant = "grid",
  className = "",
}: {
  reviews: Review[];
  stats: Stats;
  t: Dict;
  locale: string;
  href: string;
  variant?: "grid" | "aside";
  className?: string;
}) {
  if (stats.count === 0 || stats.average == null || reviews.length === 0) return null;
  const summary = fmt(stats.count === 1 ? t.marketing.reviewsOne : t.marketing.reviews, { avg: formatNumber(stats.average, locale, 1), n: stats.count });
  const head = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Stars value={stats.average} size="h-4 w-4" />
        <span className="text-sm font-semibold text-charcoal">{summary}</span>
      </div>
      <Link href={href} className="text-sm font-semibold text-wood-600 underline decoration-wood/30 underline-offset-4 hover:decoration-wood-600">
        {t.reviewsProof.seeAll}
      </Link>
    </div>
  );

  if (variant === "aside") {
    return (
      <section className={`rounded-[var(--radius-card)] bg-cream p-4 ring-1 ring-line ${className}`} aria-label={t.reviewsProof.title}>
        {head}
        <ul className="mt-3 space-y-3">
          {reviews.slice(0, 2).map((r) => (
            <li key={r.id} className="text-sm">
              <p className="line-clamp-3 leading-relaxed text-charcoal">“{r.body}”</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-stone">
                <Stars value={r.rating} size="h-3 w-3" />
                <span className="font-semibold text-charcoal">{r.authorName}</span>
                {r.city && <span>· {r.city}</span>}
                <span className="flex items-center gap-1 text-success">
                  <ShieldCheck className="h-3 w-3" /> {reviewSourceLabel(r, t)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className={className} aria-label={t.reviewsProof.title}>
      <h2 className="text-2xl text-forest sm:text-3xl">{t.reviewsProof.title}</h2>
      <div className="mt-3">{head}</div>
      <div className={`mt-5 grid gap-px bg-line ring-1 ring-line ${COLS[Math.min(reviews.length, 3)]}`}>
        {reviews.slice(0, 3).map((r) => (
          <figure key={r.id} className="flex flex-col bg-white p-6">
            <Stars value={r.rating} size="h-3.5 w-3.5" label={fmt(t.reviews.stars, { n: r.rating })} />
            {r.title && <p className="mt-3 font-semibold text-forest">{r.title}</p>}
            <blockquote className="mt-2 flex-1 leading-relaxed text-charcoal/90">“{r.body}”</blockquote>
            <figcaption className="mt-4 text-sm text-stone">
              <span className="font-semibold text-charcoal">{r.authorName}</span>
              {r.city ? ` · ${r.city}` : ""}
              <span className="mt-1 flex items-center gap-1 text-xs text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> {reviewSourceLabel(r, t)}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
