import Link from "next/link";
import { Landmark, Mail, MessageCircle, Phone, Clock } from "lucide-react";
import { Logo } from "@/components/art/Logo";
import { Instagram, Facebook, Linkedin, Youtube } from "@/components/art/SocialIcons";
import { NewsletterForm } from "./NewsletterForm";
import type { SiteContext } from "@/lib/site-context";
import type { Article } from "@/lib/data/blog";
import { blogPath, categoryPath, legalPath, routePath, type LegalDoc } from "@/lib/sites";
import { fmt, loc } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

const LEGAL_LABELS: Record<LegalDoc, { fr: string; en: string }> = {
  terms: { fr: "Conditions générales de vente", en: "Terms of sale" },
  privacy: { fr: "Politique de confidentialité", en: "Privacy policy" },
  shipping: { fr: "Politique de livraison", en: "Delivery policy" },
  cancellation: { fr: "Politique d'annulation", en: "Cancellation policy" },
  returns: { fr: "Retours et réclamations", en: "Returns & claims" },
  notice: { fr: "Mentions légales", en: "Legal notice" },
  safety: { fr: "Sécurité et utilisation", en: "Fuel safety" },
};

export function legalLabel(doc: LegalDoc, lang: "fr" | "en") {
  return LEGAL_LABELS[doc][lang];
}

/** Torn / mountain edge between the newsletter band and the dark footer. */
function TornEdge() {
  return (
    <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="block h-8 w-full text-[#131c18] sm:h-12" aria-hidden>
      <path
        fill="currentColor"
        d="M0 48V30l18-6 14 8 20-14 16 10 22-18 14 12 26-8 12 10 24-16 18 14 20-6 16 8 30-20 14 12 22-4 18 10 26-18 12 8 28-10 16 14 20-8 24 6 18-16 22 12 14-6 26 10 20-18 16 8 24-4 18 12 28-16 14 10 22-8 16 6 26-14 18 12 20-6 24 8 16-12 22 10 18-4 26-14 14 8 24-6 18 12 20-16 22 10 16-4 28 12 18-10 22 6 14-8 26 12 20-14 18 8 24-6 16 10 22-12 14 6 26-8 20 12 18-6 24 8 16-10 22 6 18 2V48Z"
      />
    </svg>
  );
}

export function Footer({ ctx, articles = [] }: { ctx: SiteContext; articles?: Article[] }) {
  const { site, t, settings, social, market, categories } = ctx;
  const wa = whatsappLink(settings.whatsappNumber);
  const hours = loc(settings.businessHours, site.lang);
  const socials = [
    { href: social.instagram, Icon: Instagram, label: "Instagram" },
    { href: social.facebook, Icon: Facebook, label: "Facebook" },
    { href: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { href: social.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s) => s.href);
  const heading = "mb-5 font-display text-xl text-wood";
  const list = "space-y-2.5 text-[0.92rem] text-cream/70";
  const bullet = "group flex items-center gap-2.5 transition hover:text-cream";
  const dot = <span className="h-1.5 w-1.5 rotate-45 bg-wood/70 transition group-hover:bg-wood" aria-hidden />;
  const month = (d: Date | null) =>
    d ? new Intl.DateTimeFormat(site.locale, { month: "short", timeZone: market.timeZone }).format(new Date(d)).replace(".", "") : "";
  const day = (d: Date | null) => (d ? new Intl.DateTimeFormat(site.locale, { day: "2-digit", timeZone: market.timeZone }).format(new Date(d)) : "");

  return (
    <footer className="mt-auto">
      {/* Newsletter row */}
      <div className="bg-cream">
        <div className="container-page grid items-center gap-6 py-12 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="font-display text-3xl text-forest sm:text-[2.2rem]">
              {t.home.newsletterTitle} <span className="text-wood">{t.home.newsletterAccent}</span>
            </p>
            <p className="mt-1.5 text-sm text-stone">{t.footer.newsletterText}</p>
          </div>
          <NewsletterForm site={site.id} tone="light" labels={{ placeholder: t.footer.emailPlaceholder, subscribe: t.footer.subscribe, consent: t.footer.newsletterConsent }} />
        </div>
      </div>

      <TornEdge />
      <div className="bg-[#131c18] text-cream">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={heading}>{t.nav.categories}</p>
            <ul className={list}>
              {categories
                .filter((c) => c.active)
                .map((c) => (
                  <li key={c.id}>
                    <Link className={bullet} href={categoryPath(site, c.id)}>
                      {dot} {loc(c.name, site.lang)}
                    </Link>
                  </li>
                ))}
              <li>
                <Link className={bullet} href={routePath(site, "calculator")}>
                  {dot} {t.nav.calculator}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={heading}>{t.footer.latest}</p>
            <ul className="space-y-4">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link href={blogPath(site, a.slug)} className="group flex gap-3">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-cream/10 text-cream ring-1 ring-cream/10 transition group-hover:bg-wood">
                      <span className="text-[0.6rem] uppercase leading-none text-cream/70 group-hover:text-white">{month(a.publishedAt)}</span>
                      <span className="text-lg font-semibold leading-tight">{day(a.publishedAt)}</span>
                    </span>
                    <span className="text-[0.88rem] leading-snug text-cream/70 transition group-hover:text-cream">
                      {a.title} <span className="text-wood">{t.footer.readMore}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>{t.footer.info}</p>
            <ul className={list}>
              {[
                [routePath(site, "about"), t.nav.about],
                [routePath(site, "delivery"), t.nav.delivery],
                [routePath(site, "faq"), t.nav.faq],
                [routePath(site, "track"), t.nav.track],
                [blogPath(site), t.nav.blog],
                [routePath(site, "reviews"), t.home.reviews.kicker],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link className={bullet} href={href}>
                    {dot} {label}
                  </Link>
                </li>
              ))}
              {(["terms", "privacy", "notice"] as LegalDoc[]).map((d) => (
                <li key={d}>
                  <Link className={bullet} href={legalPath(site, d)}>
                    {dot} {legalLabel(d, site.lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={heading}>{t.footer.contactTitle}</p>
            <ul className="space-y-3 text-[0.92rem] text-cream/75">
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2.5 text-wood-100 hover:text-cream">
                    <Mail className="h-4 w-4 text-wood" /> {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.contactPhone && (
                <li>
                  <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-cream">
                    <Phone className="h-4 w-4 text-wood" /> {settings.contactPhone}
                  </a>
                </li>
              )}
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-cream">
                    <MessageCircle className="h-4 w-4 text-wood" /> {t.topbar.whatsapp}
                  </a>
                </li>
              )}
              {hours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-wood" /> {hours}
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-wood" /> {t.footer.payment}
              </li>
              <li>
                <Link href={routePath(site, "contact")} className="inline-flex rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white hover:bg-wood-600">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <Logo tone="light" />
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-cream/50">{t.home.transparency.text}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10">
          <div className="container-page flex flex-col gap-4 py-5 text-sm text-cream/55 md:flex-row md:items-center md:justify-between">
            <p>
              {fmt(t.footer.rights, { year: new Date().getFullYear() })} · {market.flag} {fmt(t.footer.market, { country: market.names[site.lang], currency: market.currency })}
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="sr-only">{t.footer.follow}</span>
                {socials.map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-md bg-cream/10 text-cream transition hover:bg-wood">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
