import { Download } from "lucide-react";
import { PageTitle, TabLinks, MARKET_TABS, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { listSubscribers } from "@/lib/data/misc";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { formatDateTime } from "@/lib/format";
import { subscriberStatusAction } from "@/app/admin/actions";

export default async function NewsletterPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const market = isMarketId(sp.m) ? (sp.m as MarketId) : undefined;
  const subs = await listSubscribers(market);
  const active = subs.filter((s) => s.status === "subscribed").length;
  return (
    <>
      <PageTitle
        title="Newsletter"
        subtitle={`${active} abonné(s) actif(s)`}
        actions={
          <a href={`/admin/newsletter/export${market ? `?m=${market}` : ""}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm ring-1 ring-line hover:bg-cream">
            <Download className="h-4 w-4" /> Exporter en CSV
          </a>
        }
      />
      <TabLinks items={MARKET_TABS("/admin/newsletter")} current={market ?? ""} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
            <tr><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Marché</th><th className="px-5 py-3">Langue</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Inscription</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {subs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-stone">Aucun abonné pour le moment.</td></tr>}
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3">{s.email}</td>
                <td className="px-5 py-3">{MARKETS[s.marketId].flag}</td>
                <td className="px-5 py-3">{s.language.toUpperCase()}</td>
                <td className="px-5 py-3"><Badge tone={s.status === "subscribed" ? "success" : "neutral"}>{s.status === "subscribed" ? "Abonné" : "Désinscrit"}</Badge></td>
                <td className="px-5 py-3 text-stone">{formatDateTime(s.createdAt, "fr-FR")}</td>
                <td className="px-5 py-3 text-right">
                  <form action={subscriberStatusAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value={s.status === "subscribed" ? "unsubscribed" : "subscribed"} />
                    <button className="rounded-full px-3 py-1 text-xs ring-1 ring-line hover:bg-cream">{s.status === "subscribed" ? "Désinscrire" : "Réinscrire"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
