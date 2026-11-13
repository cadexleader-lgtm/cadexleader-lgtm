import Link from "next/link";
import { Search } from "lucide-react";
import { PageTitle, StatusBadge, TabLinks, MARKET_TABS, type SearchProps } from "@/components/admin/AdminUi";
import { listOrders } from "@/lib/data/orders";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { isOrderStatus, ORDER_STATUSES, STATUS_LABELS } from "@/lib/order-status";
import { formatDateTime, formatMoney } from "@/lib/format";

export default async function OrdersPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const market = isMarketId(sp.m) ? (sp.m as MarketId) : undefined;
  const status = isOrderStatus(sp.status) ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").slice(0, 80);
  const { rows, total } = await listOrders({ market, status, q: q || undefined, limit: 30, offset: (page - 1) * 30 });
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const all = { m: market, status, q: q || undefined, ...extra };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
    return `/admin/orders${p.toString() ? `?${p}` : ""}`;
  };
  return (
    <>
      <PageTitle title="Précommandes" subtitle={`${total} précommande(s)`} />
      <TabLinks items={MARKET_TABS("/admin/orders", status ? `status=${status}` : "")} current={market ?? ""} />
      <form className="card mb-6 flex flex-wrap items-end gap-3 p-4" action="/admin/orders">
        {market && <input type="hidden" name="m" value={market} />}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input name="q" defaultValue={q} placeholder="Référence, nom, e-mail, téléphone, ville…" className="field h-10 pl-9 text-sm" />
        </div>
        <select name="status" defaultValue={status ?? ""} className="field h-10 w-auto py-0 text-sm">
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s].fr}</option>
          ))}
        </select>
        <button className="h-10 rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest">Filtrer</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
            <tr>
              <th className="px-5 py-3">Référence</th>
              <th className="px-5 py-3">Marché</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Téléphone</th>
              <th className="px-5 py-3 text-right">Montant estimé</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Reçue le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-stone">Aucune précommande ne correspond à ces critères.</td></tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-cream/60">
                <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-forest hover:underline">{o.reference}</Link></td>
                <td className="px-5 py-3">{MARKETS[o.marketId].flag} {o.language.toUpperCase()}</td>
                <td className="px-5 py-3">{o.customerName}<span className="block text-xs text-stone">{o.postalCode} {o.city}</span></td>
                <td className="px-5 py-3 text-stone">{o.customerPhone}</td>
                <td className="px-5 py-3 text-right tabular-nums">{formatMoney(o.subtotalCents - (o.discountCents ?? 0), o.currency, "fr-FR")}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-stone">{formatDateTime(o.createdAt, "fr-FR", MARKETS[o.marketId].timeZone)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 30 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="font-medium text-pine">← Précédent</Link> : <span />}
          <span className="text-stone">Page {page} / {Math.ceil(total / 30)}</span>
          {page * 30 < total ? <Link href={qs({ page: String(page + 1) })} className="font-medium text-pine">Suivant →</Link> : <span />}
        </div>
      )}
    </>
  );
}
