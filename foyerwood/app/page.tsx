import type { Metadata } from "next";
import { headers } from "next/headers";
import { Logo } from "@/components/art/Logo";
import { HeroScene } from "@/components/art/HeroScene";
import { MarketChoice } from "@/components/chooser/MarketChoice";

export const metadata: Metadata = {
  title: "Foyerwood — Choisissez votre pays · Choose your country",
  description: "Bois de chauffage, granulés et combustibles au Canada, aux États-Unis et en France. Firewood, pellets and wood fuels in Canada, the United States and France.",
  alternates: {
    languages: { "fr-CA": "/ca", "en-CA": "/ca/en", "en-US": "/us", "fr-FR": "/fr", "x-default": "/" },
  },
};

function suggest(country: string | null, acceptLanguage: string): "ca" | "us" | "fr" {
  const c = (country ?? "").toUpperCase();
  if (c === "CA" || c === "US" || c === "FR") return c.toLowerCase() as "ca" | "us" | "fr";
  const al = acceptLanguage.toLowerCase();
  if (al.includes("-ca")) return "ca";
  if (al.startsWith("fr")) return "fr";
  return "us";
}

export default async function ChooserPage() {
  const h = await headers();
  const suggested = suggest(h.get("x-vercel-ip-country"), h.get("accept-language") ?? "");
  const markets = [
    {
      id: "ca" as const,
      flag: "🇨🇦",
      country: "Canada",
      currency: "CAD",
      detail: "Français · English",
      options: [
        { siteId: "ca", href: "/ca", label: "Continuer en français" },
        { siteId: "ca-en", href: "/ca/en", label: "Continue in English" },
      ],
    },
    {
      id: "us" as const,
      flag: "🇺🇸",
      country: "United States",
      currency: "USD",
      detail: "English",
      options: [{ siteId: "us", href: "/us", label: "Continue" }],
    },
    {
      id: "fr" as const,
      flag: "🇫🇷",
      country: "France",
      currency: "EUR",
      detail: "Français",
      options: [{ siteId: "fr", href: "/fr", label: "Continuer" }],
    },
  ];
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-forest-950 text-cream">
      <HeroScene className="absolute inset-0 h-full w-full opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950/30 via-forest-950/55 to-forest-950/90" aria-hidden />
      <div className="container-page relative flex flex-1 flex-col py-10">
        <Logo tone="light" />
        <div className="my-auto py-14">
          <p className="kicker text-wood-100">The warmth of nature, delivered.</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] sm:text-6xl">
            Choisissez votre pays
            <span className="block text-cream/60">Choose your country</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-cream/75">
            Catalogue, prix, devise et livraison sont propres à chaque pays. — Catalog, prices, currency and delivery are specific to each country.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {markets.map((m) => (
              <MarketChoice
                key={m.id}
                flag={m.flag}
                country={m.country}
                currency={m.currency}
                detail={m.detail}
                options={m.options}
                suggested={m.id === suggested}
                suggestedLabel={m.id === "us" ? "Suggested" : m.id === "fr" ? "Suggéré" : "Suggéré · Suggested"}
              />
            ))}
          </div>
          <p className="mt-8 text-sm text-cream/55">
            Vous pourrez changer de pays à tout moment depuis le menu. — You can switch country at any time from the menu.
          </p>
        </div>
      </div>
    </main>
  );
}
