import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/ui";
import { ContactForm } from "@/components/forms/SiteForms";
import { loadSite, type SiteParams } from "@/lib/site-context";
import { routePath } from "@/lib/sites";
import { loc } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: SiteParams): Promise<Metadata> {
  const { t, site } = await loadSite((await params).site);
  return { title: t.contact.kicker, description: t.contact.intro, alternates: { canonical: routePath(site, "contact") } };
}

export default async function ContactPage({ params }: SiteParams) {
  const { site, t, settings } = await loadSite((await params).site);
  const wa = whatsappLink(settings.whatsappNumber);
  const hours = loc(settings.businessHours, site.lang);
  return (
    <>
      <PageHero kicker={t.contact.kicker} title={t.contact.title} intro={t.contact.intro} />
      <div className="container-page grid gap-8 py-14 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-forest p-6 text-cream transition hover:bg-pine">
              <MessageCircle className="h-7 w-7 text-wood-100" />
              <p className="mt-4 font-display text-2xl">{t.contact.whatsapp}</p>
              <p className="mt-1 text-sm text-cream/75">{t.contact.whatsappText}</p>
              <span className="mt-4 inline-flex rounded-full bg-wood px-4 py-2 text-sm font-medium text-white">{t.contact.whatsappCta}</span>
            </a>
          )}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="card flex items-center gap-4 p-5 hover:ring-pine/40">
              <Mail className="h-6 w-6 text-wood" />
              <span>
                <span className="block text-sm text-stone">{t.contact.email}</span>
                <span className="font-medium text-forest">{settings.contactEmail}</span>
              </span>
            </a>
          )}
          {settings.contactPhone && (
            <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="card flex items-center gap-4 p-5 hover:ring-pine/40">
              <Phone className="h-6 w-6 text-wood" />
              <span>
                <span className="block text-sm text-stone">{t.contact.phone}</span>
                <span className="font-medium text-forest">{settings.contactPhone}</span>
              </span>
            </a>
          )}
          {hours && (
            <div className="card flex items-center gap-4 p-5">
              <Clock className="h-6 w-6 text-wood" />
              <span>
                <span className="block text-sm text-stone">{t.contact.hours}</span>
                <span className="font-medium text-forest">{hours}</span>
              </span>
            </div>
          )}
        </aside>
        <section className="card p-6 sm:p-8">
          <h2 className="mb-6 font-display text-3xl text-forest">{t.contact.formTitle}</h2>
          <ContactForm
            site={site.id}
            labels={t.contact.fields}
            subjects={Object.values(t.contact.subjects)}
            sendLabel={t.common.send}
            sendingLabel={t.common.sending}
            optional={t.common.optional}
          />
        </section>
      </div>
    </>
  );
}
