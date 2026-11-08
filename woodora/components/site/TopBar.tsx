import { Truck, PackageCheck, Headset, MessageCircle } from "lucide-react";
import type { SiteContext } from "@/lib/site-context";
import { fmt, loc, money } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

export function TopBar({ ctx }: { ctx: SiteContext }) {
  const { t, site, settings, freeThresholdCents, market } = ctx;
  const wa = whatsappLink(settings.whatsappNumber);
  const free = freeThresholdCents
    ? fmt(t.topbar.freeDeliveryFrom, { amount: money(site, freeThresholdCents, market.currency) })
    : t.topbar.freeDelivery;
  const hours = loc(settings.businessHours, site.lang);
  return (
    <div className="bg-forest-950 text-[0.8rem] text-cream/80">
      <div className="container-page flex h-9 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-6">
          <span className="flex items-center gap-2 truncate font-medium text-cream">
            <Truck className="h-3.5 w-3.5 shrink-0 text-wood" />
            <span className="uppercase tracking-wider">{free}</span>
          </span>
          <span className="hidden items-center gap-2 md:flex">
            <PackageCheck className="h-3.5 w-3.5 text-wood" /> {t.topbar.available}
          </span>
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          {hours && (
            <span className="hidden items-center gap-2 lg:flex">
              <Headset className="h-3.5 w-3.5 text-wood" /> {t.topbar.support} · {hours}
            </span>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-cream">
              <MessageCircle className="h-3.5 w-3.5 text-wood" /> {t.topbar.whatsapp}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <span>{market.flag}</span> {market.names[site.lang]} · {market.currency}
          </span>
        </div>
      </div>
    </div>
  );
}
