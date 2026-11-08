import Link from "next/link";
import { Mail, Phone, MessageCircle, Landmark } from "lucide-react";
import { Instagram, Facebook, Linkedin, Youtube } from "@/components/art/SocialIcons";
import { Logo } from "@/components/art/Logo";
import { NewsletterForm } from "./NewsletterForm";
import type { SiteContext } from "@/lib/site-context";
import { categoryPath, legalPath, routePath, blogPath, type LegalDoc } from "@/lib/sites";
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

export function Footer({ ctx }: { ctx: SiteContext }) {
  const { site, t, settings, social, market, categories } = ctx;
  const wa = whatsappLink(settings.whatsappNumber);
  const socials = [
    { href: social.instagram, Icon: Instagram, label: "Instagram" },
    { href: social.facebook, Icon: Facebook, label: "Facebook" },
    { href: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { href: social.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s) => s.href);
  const col = "space-y-2.5 text-[0.93rem] text-cream/70";
  const link = "transition hover:text-cream";

  return (
    <footer className="relative mt-auto overflow-hidden bg-forest text-cream">
      <div className="grain absolute inset-0" aria-hidden />
      <div className="container-page relative">
        <div className="grid gap-10 border-b border-cream/10 py-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="font-display text-3xl leading-tight text-cream sm:text-4xl">{t.home.newsletter.title}</p>
            <p className="mt-3 max-w-md text-cream/70">{t.home.newsletter.text}</p>
          </div>
          <div className="self-center">
            <NewsletterForm site={site.id} labels={{ placeholder: t.footer.emailPlaceholder, subscribe: t.footer.subscribe, consent: t.footer.newsletterConsent }} />
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-[0.93rem] leading-relaxed text-cream/70">{t.home.transparency.text}</p>
            <ul className="mt-5 space-y-2 text-[0.93rem] text-cream/80">
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-cream">
                    <MessageCircle className="h-4 w-4 text-wood" /> {t.topbar.whatsapp}
                  </a>
                </li>
              )}
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-2 hover:text-cream">
                    <Mail className="h-4 w-4 text-wood" /> {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.contactPhone && (
                <li>
                  <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-cream">
                    <Phone className="h-4 w-4 text-wood" /> {settings.contactPhone}
                  </a>
                </li>
              )}
              <li className="inline-flex items-start gap-2 text-cream/60">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-wood" /> {t.footer.payment}
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-wood-100/80">{t.footer.shop}</p>
            <ul className={col}>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link className={link} href={categoryPath(site, c.id)}>{loc(c.name, site.lang)}</Link>
                </li>
              ))}
              <li>
                <Link className={link} href={routePath(site, "calculator")}>{t.nav.calculator}</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-wood-100/80">{t.footer.help}</p>
            <ul className={col}>
              <li><Link className={link} href={routePath(site, "delivery")}>{t.nav.delivery}</Link></li>
              <li><Link className={link} href={routePath(site, "faq")}>{t.nav.faq}</Link></li>
              <li><Link className={link} href={routePath(site, "track")}>{t.nav.track}</Link></li>
              <li><Link className={link} href={routePath(site, "contact")}>{t.nav.contact}</Link></li>
              <li><Link className={link} href={blogPath(site)}>{t.nav.blog}</Link></li>
              <li><Link className={link} href={routePath(site, "about")}>{t.nav.about}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-wood-100/80">{t.footer.legal}</p>
            <ul className={col}>
              {(["terms", "shipping", "cancellation", "returns", "privacy", "safety", "notice"] as LegalDoc[]).map((d) => (
                <li key={d}>
                  <Link className={link} href={legalPath(site, d)}>{legalLabel(d, site.lang)}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream/10 py-6 text-sm text-cream/55 md:flex-row md:items-center md:justify-between">
          <p>{fmt(t.footer.rights, { year: new Date().getFullYear() })}</p>
          <p>
            {market.flag} {fmt(t.footer.market, { country: market.names[site.lang], currency: market.currency })}
          </p>
          {socials.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="sr-only">{t.footer.follow}</span>
              {socials.map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-cream/15 hover:bg-cream/10 hover:text-cream">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
