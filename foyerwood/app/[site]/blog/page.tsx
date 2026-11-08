import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { ProductArt } from "@/components/art/ProductArt";
import { ProductVisual } from "@/components/site/ProductVisual";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listPublishedArticles } from "@/lib/data/blog";
import { blogPath } from "@/lib/sites";
import { fmt, formatDate } from "@/lib/format";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.blog.title, description: t.blog.subtitle, alternates: { canonical: blogPath(site) } };
}

export default async function BlogPage({ params }: SiteParams) {
  const { site, t, market } = await loadSite((await params).site);
  const articles = await listPublishedArticles(site.lang, site.market);
  const [first, ...rest] = articles;
  return (
    <>
      <PageHero kicker={t.blog.kicker} title={t.blog.title} intro={t.blog.subtitle} />
      <div className="container-page py-14">
        {!first ? (
          <p className="card p-8 text-stone">{t.blog.empty}</p>
        ) : (
          <>
            <Link href={blogPath(site, first.slug)} className="group card grid overflow-hidden md:grid-cols-2">
              <div className="aspect-[16/10] overflow-hidden md:aspect-auto">
                {first.coverImage ? (
                  <ProductVisual image={first.coverImage} art={null} species={null} seed={first.slug} alt={first.title} className="h-full min-h-64 w-full" />
                ) : (
                  <ProductArt art={first.coverArt} seed={first.slug} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
                )}
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <p className="text-xs uppercase tracking-wider text-wood-600">
                  {formatDate(first.publishedAt, site.locale, market.timeZone)} · {fmt(t.common.minutes, { n: first.readingMinutes })}
                </p>
                <h2 className="mt-3 text-3xl leading-tight text-forest group-hover:text-pine sm:text-4xl">{first.title}</h2>
                <p className="mt-3 text-stone">{first.excerpt}</p>
                <span className="mt-6 font-medium text-pine">{t.common.readMore} →</span>
              </div>
            </Link>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {rest.map((a) => (
                <Link key={a.id} href={blogPath(site, a.slug)} className="group card overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden">
                    {a.coverImage ? (
                      <ProductVisual image={a.coverImage} art={null} species={null} seed={a.slug} alt={a.title} className="h-full w-full" />
                    ) : (
                      <ProductArt art={a.coverArt} seed={a.slug} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-wider text-wood-600">{fmt(t.common.minutes, { n: a.readingMinutes })}</p>
                    <h3 className="mt-2 text-xl leading-snug text-forest group-hover:text-pine">{a.title}</h3>
                    <p className="mt-2 line-clamp-3 text-[0.92rem] text-stone">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
