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

export default async function TrackPage({ params }: SiteParams) {
  const { site, t } = await loadSite((await params).site);
  return (
    <>
      <PageHero kicker={t.nav.track} title={t.track.title} intro={t.track.subtitle} image={AMBIANCE.crates} />
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
          }}
        />
        <p className="mt-10 text-stone">
          {t.track.help}{" "}
          <Link href={routePath(site, "contact")} className="font-medium text-pine underline underline-offset-2">{t.nav.contact}</Link>
        </p>
      </div>
    </>
  );
}
