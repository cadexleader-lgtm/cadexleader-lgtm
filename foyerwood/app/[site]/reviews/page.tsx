import type { Metadata } from "next";
import { ShieldCheck, Star } from "lucide-react";
import { ReviewForm } from "@/components/forms/SiteForms";
import { PageHero } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listApprovedReviews, reviewStats } from "@/lib/data/reviews";
import { reviewSourceLabel } from "@/components/site/ReviewsProof";
import { fmt, formatDate, formatNumber } from "@/lib/format";
import { routePath } from "@/lib/sites";
import { AMBIANCE } from "@/lib/illustrations";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.home.reviews.title, description: t.home.reviews.subtitle, alternates: { canonical: routePath(site, "reviews") } };
}

export default async function ReviewsPage({ params }: SiteParams) {
  const { site, t, market } = await loadSite((await params).site);
  const [reviews, stats] = await Promise.all([listApprovedReviews(site.market, 60), reviewStats(site.market)]);
  return (
    <>
      <PageHero
        image={AMBIANCE.livingRoom}
        kicker={t.home.reviews.kicker}
        title={t.home.reviews.title}
        intro={stats.count && stats.average ? fmt(t.home.reviews.average, { avg: formatNumber(stats.average, site.locale), n: stats.count }) : t.home.reviews.subtitle}
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_460px]">
        <section>
          {reviews.length === 0 ? (
            <div className="card p-8">
              <ShieldCheck className="h-10 w-10 text-wood" />
              <p className="mt-4 font-display text-2xl text-forest">{t.home.reviews.emptyTitle}</p>
              <p className="mt-2 text-stone">{t.home.reviews.emptyText}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <figure key={r.id} className="card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-0.5 text-wood" aria-label={fmt(t.reviews.stars, { n: r.rating })}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-25"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-stone">{formatDate(r.createdAt, site.locale, market.timeZone)}</span>
                  </div>
                  {r.title && <p className="mt-3 font-display text-xl text-forest">{r.title}</p>}
                  <blockquote className="mt-2 leading-relaxed text-charcoal/85">{r.body}</blockquote>
                  <figcaption className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium">{r.authorName}{r.city ? <span className="font-normal text-stone"> · {r.city}</span> : null}</span>
                    <span className="flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3.5 w-3.5" /> {reviewSourceLabel(r, t)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
        <aside className="card h-fit p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest">{t.reviews.title}</h2>
          <p className="mb-6 mt-2 text-sm text-stone">{t.reviews.subtitle}</p>
          <ReviewForm
            site={site.id}
            labels={{
              reference: t.reviews.reference,
              email: t.reviews.email,
              name: t.reviews.name,
              city: t.reviews.city,
              rating: t.reviews.rating,
              titleField: t.reviews.titleField,
              body: t.reviews.body,
              submit: t.reviews.submit,
              stars: t.reviews.stars,
            }}
          />
        </aside>
      </div>
    </>
  );
}
