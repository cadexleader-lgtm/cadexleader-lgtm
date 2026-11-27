import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/forms/SiteForms";
import { PageHero } from "@/components/ui";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath } from "@/lib/sites";
import { AMBIANCE } from "@/lib/illustrations";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t } = await loadSite((await params).site);
  return { title: t.track.title, robots: { index: false } };
}

export default async function TrackPage({ params, searchParams }: SiteParams & { searchParams: Promise<{ ref?: string }> }) {
  const { site, t } = await loadSite((await params).site);
  const sp = await searchParams;
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);
  return (
    <>
      <PageHero kicker={t.nav.track} title={t.track.title} intro={t.track.subtitle} image={AMBIANCE.trailer} imagePosition="50% 55%" />
      <div className="container-page max-w-4xl py-12">
        <TrackForm
          site={site.id}
          labels={{
            reference: t.track.reference,
            referencePlaceholder: t.track.referencePlaceholder,
            email: t.track.email,
            submit: t.track.submit,
            status: t.track.status,
            cancelled: t.track.cancelled,
            writeUs: t.track.writeUs,
          }}
          contactHref={routePath(site, "contact")}
          defaultReference={clip(sp.ref, 40)}
        />
        <p className="mt-10 text-stone">
          {t.track.help}{" "}
          <Link href={routePath(site, "contact")} className="font-medium text-pine underline underline-offset-2">{t.nav.contact}</Link>
        </p>
      </div>
    </>
  );
}
