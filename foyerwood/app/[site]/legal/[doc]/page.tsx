import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { legalLabel } from "@/components/site/Footer";
import { loadSite } from "@/lib/site-context";
import { LEGAL_DOCS, isLegalDoc, legalPath } from "@/lib/sites";
import { legalDoc, LEGAL_UPDATED } from "@/lib/content/legal";
import { PARTNER_CREDIT, PHOTO_CREDITS } from "@/lib/photo-credits";
import { fmt, formatDate, money } from "@/lib/format";

type Props = { params: Promise<{ site: string; doc: string }> };

async function build(id: string, doc: string) {
  const ctx = await loadSite(id);
  if (!isLegalDoc(doc)) notFound();
  const { site, t, company, settings, freeThresholdCents, market } = ctx;
  const content = legalDoc(doc, site.market, site.lang, {
    company,
    contactEmail: settings.contactEmail,
    whatsapp: settings.whatsappNumber,
    freeFrom: freeThresholdCents ? money(site, freeThresholdCents, market.currency) : null,
    missing: t.legal.toComplete,
  });
  return { ctx, content, doc };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site, doc } = await params;
  const { content, ctx } = await build(site, doc);
  return { title: content.title, alternates: { canonical: legalPath(ctx.site, doc as never) } };
}

export default async function LegalPage({ params }: Props) {
  const { site: id, doc: docParam } = await params;
  const { ctx, content, doc } = await build(id, docParam);
  const { site, t, market } = ctx;
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[260px_1fr]">
      <nav className="lg:sticky lg:top-28 lg:self-start" aria-label={t.footer.legal}>
        <p className="kicker mb-3">{t.footer.legal}</p>
        <ul className="space-y-1 text-sm">
          {LEGAL_DOCS.map((d) => (
            <li key={d}>
              <Link href={legalPath(site, d)} aria-current={d === doc ? "page" : undefined} className={`block rounded-lg px-3 py-2 ${d === doc ? "bg-white font-medium text-forest ring-1 ring-line" : "text-stone hover:text-forest"}`}>
                {legalLabel(d, site.lang)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="card p-6 sm:p-10">
        <h1 className="text-4xl text-forest">{content.title}</h1>
        <p className="mt-2 text-sm text-stone">
          {market.flag} {market.names[site.lang]} · {fmt(t.legal.updated, { date: formatDate(LEGAL_UPDATED, site.locale, market.timeZone) })}
        </p>
        <div className="mt-6">
          <Markdown>{content.body}</Markdown>
        </div>
        {doc === "notice" && (
          <section className="mt-10 border-t border-line pt-8">
            <h2 className="font-display text-2xl text-forest">{site.lang === "fr" ? "Crédits photos" : "Photo credits"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone">
              {site.lang === "fr"
                ? `Photos de produits et d'ambiance fournies par notre partenaire ${PARTNER_CREDIT}, utilisées avec son autorisation. Illustrations et mascotte : Foyerwood. Les photos suivantes viennent de Wikimedia Commons, sous licence libre ; elles ont été redimensionnées pour le site et restent sous la même licence :`
                : `Product and ambiance photos supplied by our partner ${PARTNER_CREDIT}, used with their permission. Illustrations and mascot: Foyerwood. The following photos come from Wikimedia Commons under free licences; they were resized for the site and remain under the same licence:`}
            </p>
            {PHOTO_CREDITS.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-charcoal">
                {PHOTO_CREDITS.map((c) => (
                  <li key={c.source}>
                    <span className="font-medium">{c.usedFor[site.lang]}</span> — « {c.title} », {c.author},{" "}
                    <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline">
                      {c.license}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
