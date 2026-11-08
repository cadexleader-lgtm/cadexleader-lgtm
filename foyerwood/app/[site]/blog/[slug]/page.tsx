import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "lucide-react";
import { Breadcrumbs, ButtonLink } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { ProductArt } from "@/components/art/ProductArt";
import { ProductVisual } from "@/components/site/ProductVisual";
import { loadSite } from "@/lib/site-context";
import { getPublishedArticle, listPublishedArticles } from "@/lib/data/blog";
import { blogPath, routePath } from "@/lib/sites";
import { fmt, formatDate } from "@/lib/format";

type Props = { params: Promise<{ site: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: id, slug } = await params;
  const { site } = await loadSite(id);
  const a = await getPublishedArticle(site.lang, site.market, decodeURIComponent(slug));
  if (!a) return {};
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt,
    alternates: { canonical: blogPath(site, a.slug) },
    openGraph: { type: "article", images: a.coverImage ? [a.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { site: id, slug } = await params;
  const { site, t, market } = await loadSite(id);
  const a = await getPublishedArticle(site.lang, site.market, decodeURIComponent(slug));
  if (!a) notFound();
  const related = (await listPublishedArticles(site.lang, site.market, 4)).filter((x) => x.id !== a.id).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    dateModified: new Date(a.updatedAt).toISOString(),
    author: { "@type": "Organization", name: a.author || "Foyerwood" },
    publisher: { "@type": "Organization", name: "Foyerwood" },
  };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="bg-forest text-cream">
        <div className="container-page max-w-4xl py-12 sm:py-16">
          <div className="[&_a]:text-cream/70 [&_a:hover]:text-cream [&_span]:text-cream/80 [&_li>span]:text-cream/40">
            <Breadcrumbs items={[{ label: t.common.home, href: site.prefix }, { label: t.nav.blog, href: blogPath(site) }, { label: a.title }]} />
          </div>
          <h1 className="mt-6 text-4xl leading-[1.1] sm:text-5xl">{a.title}</h1>
          <p className="mt-4 text-lg text-cream/75">{a.excerpt}</p>
          <p className="mt-6 text-sm text-cream/60">
            {fmt(t.blog.by, { author: a.author || "Foyerwood" })} · {formatDate(a.publishedAt, site.locale, market.timeZone)} · {fmt(t.common.minutes, { n: a.readingMinutes })}
          </p>
        </div>
      </header>
      <div className="container-page max-w-4xl">
        <div className="-mt-px overflow-hidden rounded-b-[var(--radius-card)]">
          {a.coverImage ? (
            <ProductVisual image={a.coverImage} art={null} species={null} seed={a.slug} alt={a.title} className="aspect-[21/9] w-full" priority />
          ) : (
            <ProductArt art={a.coverArt} seed={a.slug} className="aspect-[21/9] w-full" />
          )}
        </div>
        <div className="py-10">
          <Markdown>{a.content}</Markdown>
        </div>
        <div className="mb-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest p-6 text-cream sm:p-8">
          <div>
            <p className="font-display text-2xl">{t.blog.ctaTitle}</p>
            <p className="mt-1 text-cream/75">{t.blog.ctaText}</p>
          </div>
          <ButtonLink href={routePath(site, "calculator")} variant="wood">
            <Calculator className="h-4 w-4" /> {t.home.calculator.cta}
          </ButtonLink>
        </div>
      </div>
      {related.length > 0 && (
        <section className="border-t border-line bg-cream-200/50 py-14">
          <div className="container-page">
            <h2 className="mb-6 text-3xl text-forest">{t.blog.related}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={blogPath(site, r.slug)} className="group card p-6">
                  <p className="text-xs uppercase tracking-wider text-wood-600">{fmt(t.common.minutes, { n: r.readingMinutes })}</p>
                  <h3 className="mt-2 text-xl leading-snug text-forest group-hover:text-pine">{r.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
