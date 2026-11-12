import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, MapPinned, PackageOpen, ClipboardCheck, Truck } from "lucide-react";
import { PageHero } from "@/components/ui";
import { DeliveryChecker } from "@/components/site/DeliveryChecker";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { listZones } from "@/lib/data/zones";
import { legalPath, routePath } from "@/lib/sites";
import { fmt, loc, money } from "@/lib/format";
import { regionName } from "@/lib/regions";
import { AMBIANCE } from "@/lib/illustrations";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.deliveryPage.title, description: t.deliveryPage.intro, alternates: { canonical: routePath(site, "delivery") } };
}

const PLACEHOLDER = { fr: "75011", ca: "H2X 1Y4", us: "10001" } as const;

export default async function DeliveryPage({ params }: SiteParams) {
  const { site, t, market } = await loadSite((await params).site);
  const zones = await listZones(site.market, true);
  const howIcons = [CalendarClock, MapPinned, PackageOpen, ClipboardCheck];
  return (
    <>
      <PageHero kicker={t.deliveryPage.kicker} title={t.deliveryPage.title} intro={t.deliveryPage.intro} image={AMBIANCE.crateDriveway} imagePosition="55% 60%" />
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-3xl text-forest">{t.deliveryPage.zonesTitle}</h2>
            {zones.length === 0 ? (
              <p className="mt-4 rounded-xl bg-white p-5 text-stone ring-1 ring-line">{t.deliveryPage.noZones}</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {zones.map((z) => (
                  <div key={z.id} className="card p-6">
                    <p className="flex items-center gap-2 font-display text-xl text-forest">
                      <Truck className="h-5 w-5 text-wood" /> {z.name}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-charcoal/85">{z.regionCodes.map((r) => regionName(site.market, r)).join(" · ")}</p>
                    <ul className="mt-4 space-y-1.5 text-sm text-stone">
                      {z.freeDelivery && (
                        <li className="font-medium text-success">
                          {z.freeDeliveryMinCents > 0 ? fmt(t.deliveryPage.freeFrom, { amount: money(site, z.freeDeliveryMinCents, market.currency) }) : t.deliveryPage.freeAlways}
                        </li>
                      )}
                      {z.leadTimeDaysMin != null && z.leadTimeDaysMax != null && <li>{fmt(t.deliveryPage.lead, { min: z.leadTimeDaysMin, max: z.leadTimeDaysMax })}</li>}
                      {z.excludedPostalPrefixes.length > 0 && <li>{fmt(t.deliveryPage.excluded, { list: z.excludedPostalPrefixes.join(", ") })}</li>}
                      {loc(z.remoteAreaNote, site.lang) && <li>{loc(z.remoteAreaNote, site.lang)}</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line sm:aspect-[21/9]">
              <Image src="/images/photos/delivery-trailer.webp" alt={t.deliveryPage.howTitle} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-[50%_45%]" />
            </div>
            <h2 className="text-3xl text-forest">{t.deliveryPage.howTitle}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {t.deliveryPage.how.map((h, i) => {
                const Icon = howIcons[i];
                return (
                  <div key={h.title} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                    <Icon className="h-6 w-6 text-wood" />
                    <h3 className="mt-3 text-xl text-forest">{h.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-stone">{h.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl bg-wood-100/60 p-6 ring-1 ring-wood/20">
            <h2 className="text-2xl text-forest">{t.deliveryPage.remoteTitle}</h2>
            <p className="mt-2 text-charcoal/85">{t.deliveryPage.remoteText}</p>
            <Link href={legalPath(site, "shipping")} className="mt-3 inline-block font-medium text-pine underline underline-offset-2">{t.nav.delivery} →</Link>
          </section>
        </div>
        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-forest">{t.deliveryPage.checkerTitle}</h2>
          <p className="mb-5 mt-2 text-sm text-stone">{t.deliveryPage.checkerText}</p>
          <DeliveryChecker siteId={site.id} placeholder={PLACEHOLDER[site.market]} labels={{ postal: t.preorder.fields.postalCode, check: t.deliveryPage.check }} />
        </aside>
      </div>
    </>
  );
}
