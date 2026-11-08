import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageHero, ButtonLink } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { faqFor } from "@/lib/content/faq";
import { routePath } from "@/lib/sites";
import { money } from "@/lib/format";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.faq.title, description: t.faq.subtitle, alternates: { canonical: routePath(site, "faq") } };
}

export default async function FaqPage({ params }: SiteParams) {
  const { site, t, market, freeThresholdCents } = await loadSite((await params).site);
  const groups = faqFor(site.market, site.lang, {
    currency: market.currency,
    freeFrom: freeThresholdCents ? money(site, freeThresholdCents, market.currency) : null,
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero kicker={t.faq.kicker} title={t.faq.title} intro={t.faq.subtitle} />
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[240px_1fr]">
        <nav className="hidden lg:block" aria-label={t.faq.kicker}>
          <ul className="sticky top-28 space-y-1 text-sm">
            {groups.map((g, i) => (
              <li key={g.title}>
                <a href={`#faq-${i}`} className="block rounded-lg px-3 py-2 text-stone hover:bg-white hover:text-forest">{g.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-12">
          {groups.map((g, i) => (
            <section key={g.title} id={`faq-${i}`} className="scroll-mt-28">
              <h2 className="text-3xl text-forest">{g.title}</h2>
              <div className="mt-5 space-y-3">
                {g.items.map((item) => (
                  <details key={item.q} className="group card overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-medium text-charcoal">
                      {item.q}
                      <ChevronDown className="h-5 w-5 shrink-0 text-wood transition group-open:rotate-180" />
                    </summary>
                    <p className="border-t border-line px-6 py-4 leading-relaxed text-charcoal/85">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest p-6 text-cream">
            <p className="font-display text-2xl">{t.faq.stillQuestions}</p>
            <div className="flex gap-3">
              <ButtonLink href={routePath(site, "contact")} variant="wood">{t.nav.contact}</ButtonLink>
              <Link href={routePath(site, "calculator")} className="inline-flex items-center rounded-full px-4 text-sm font-medium text-cream ring-1 ring-cream/30 hover:bg-cream/10">{t.nav.calculator}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
