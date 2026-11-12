import Link from "next/link";
import { AlertTriangle, ArrowRight, Calculator, CheckCircle2, ClipboardList, FileText, Landmark, PackageCheck, Sun, Truck, Wallet, TrendingUp } from "lucide-react";
import { Panel, PageTitle, StatusBadge, TabLinks, MARKET_TABS, type SearchProps } from "@/components/admin/AdminUi";
import { getDashboardStats, ordersPerDay } from "@/lib/data/dashboard";
import { listOrders } from "@/lib/data/orders";
import { listMarketSettings, getSetting } from "@/lib/data/settings";
import { adminListProducts } from "@/lib/data/products";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/order-status";
import { formatDateTime, formatMoney } from "@/lib/format";

export default async function DashboardPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const market = isMarketId(sp.m) ? (sp.m as MarketId) : undefined;
  const [stats, perDay, recent, markets, company, products] = await Promise.all([
    getDashboardStats(market),
    ordersPerDay(30, market),
    listOrders({ market, limit: 8 }),
    listMarketSettings(),
    getSetting("company"),
    adminListProducts(market),
  ]);
  const max = Math.max(1, ...perDay.map((d) => d.n));
  const money = (cents: number, currency: string) => formatMoney(cents, currency, "fr-FR");

  const alerts: Array<{ text: string; href: string }> = [];
  for (const m of markets) {
    if (market && m.id !== market) continue;
    if (!m.whatsappNumber) alerts.push({ text: `${MARKETS[m.id].flag} Numéro WhatsApp commercial non configuré (${MARKETS[m.id].names.fr}) : le bouton de confirmation WhatsApp est masqué.`, href: `/admin/settings#market-${m.id}` });
    if (!m.contactEmail) alerts.push({ text: `${MARKETS[m.id].flag} E-mail de contact non configuré (${MARKETS[m.id].names.fr}).`, href: `/admin/settings#market-${m.id}` });
  }
  if (!company.legalName || !company.address || !company.registration) alerts.push({ text: "Informations légales de l'entreprise incomplètes (mentions légales, CGV).", href: "/admin/settings#company" });
  const noPhoto = products.filter((p) => p.active && p.images.length === 0).length;
  if (noPhoto) alerts.push({ text: `${noPhoto} produit(s) actif(s) sans photo réelle (« Photo à venir » affiché).`, href: "/admin/photos" });
  const noCost = products.filter((p) => p.active && p.costCents == null).length;
  if (noCost) alerts.push({ text: `${noCost} produit(s) sans tarif d'achat : la marge estimée sera incomplète.`, href: "/admin/products" });
  if (stats.pendingReviews) alerts.push({ text: `${stats.pendingReviews} avis en attente de modération.`, href: "/admin/reviews" });
  if (stats.newMessages) alerts.push({ text: `${stats.newMessages} message(s) de contact non traité(s).`, href: "/admin/messages" });

  const kpis = [
    { label: "Précommandes", value: stats.totalOrders, Icon: ClipboardList, href: "/admin/orders" },
    { label: "Aujourd'hui", value: stats.todayOrders, Icon: Sun, href: "/admin/orders" },
    { label: "Devis envoyés", value: stats.quotesSent, Icon: FileText, href: "/admin/orders?status=quote_sent" },
    { label: "Paiements vérifiés", value: stats.paymentsVerified, Icon: Landmark, href: "/admin/orders?status=payment_received" },
    { label: "Commandes confirmées", value: stats.confirmedOrders, Icon: PackageCheck, href: "/admin/orders?status=confirmed" },
    { label: "Commandes livrées", value: stats.deliveredOrders, Icon: Truck, href: "/admin/orders?status=delivered" },
  ];

  return (
    <>
      <PageTitle title="Tableau de bord" subtitle="Vue d'ensemble de l'activité commerciale." />
      <TabLinks items={MARKET_TABS("/admin")} current={market ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map(({ label, value, Icon, href }) => (
          <Link key={label} href={market ? `${href}${href.includes("?") ? "&" : "?"}m=${market}` : href} className="card p-5 transition hover:ring-pine/40">
            <Icon className="h-5 w-5 text-wood" />
            <p className="mt-3 text-3xl font-semibold tabular-nums text-forest">{value}</p>
            <p className="text-sm text-stone">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-forest"><Wallet className="h-4 w-4 text-wood" /> Chiffre d'affaires confirmé</p>
          <p className="mt-1 text-xs text-stone">Somme des virements vérifiés (commandes non annulées), par devise.</p>
          <div className="mt-4 flex flex-wrap gap-6">
            {stats.revenueByCurrency.length === 0 ? (
              <p className="text-2xl font-semibold text-stone">—</p>
            ) : (
              stats.revenueByCurrency.map((r) => (
                <p key={r.currency} className="text-2xl font-semibold tabular-nums text-forest">{money(r.cents, r.currency)}</p>
              ))
            )}
          </div>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-forest"><TrendingUp className="h-4 w-4 text-wood" /> Marge commerciale estimée</p>
          <p className="mt-1 text-xs text-stone">Prix de vente − tarif d'achat fournisseur, sur les commandes payées (hors frais de livraison et taxes).</p>
          <div className="mt-4 flex flex-wrap gap-6">
            {stats.marginByCurrency.length === 0 ? (
              <p className="text-2xl font-semibold text-stone">—</p>
            ) : (
              stats.marginByCurrency.map((r) => (
                <p key={r.currency} className="text-2xl font-semibold tabular-nums text-forest">
                  {money(r.cents, r.currency)}
                  <span className="ml-2 text-sm font-normal text-stone">{r.revenueCents ? Math.round((r.cents / r.revenueCents) * 100) : 0} %</span>
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Précommandes — 30 derniers jours">
            <div className="flex h-36 items-end gap-1" role="img" aria-label="Nombre de précommandes par jour">
              {perDay.map((d) => (
                <div key={d.day} className="group relative flex-1">
                  <div className="rounded-t bg-pine/80 transition group-hover:bg-wood" style={{ height: `${Math.max(2, (d.n / max) * 132)}px` }} />
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-forest px-1.5 py-0.5 text-[0.65rem] text-cream group-hover:block">
                    {d.day.slice(5)} · {d.n}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Dernières précommandes" actions={<Link href="/admin/orders" className="text-sm font-medium text-pine">Tout voir →</Link>}>
            {recent.rows.length === 0 ? (
              <p className="text-sm text-stone">Aucune précommande pour le moment. Elles apparaîtront ici dès leur envoi depuis le site.</p>
            ) : (
              <div className="-mx-5 -my-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
                    <tr><th className="px-5 py-2.5">Référence</th><th className="px-5 py-2.5">Client</th><th className="px-5 py-2.5">Montant</th><th className="px-5 py-2.5">Statut</th><th className="px-5 py-2.5">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recent.rows.map((o) => (
                      <tr key={o.id} className="hover:bg-cream/60">
                        <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-forest hover:underline">{o.reference}</Link></td>
                        <td className="px-5 py-3">{o.customerName}<span className="block text-xs text-stone">{o.city}</span></td>
                        <td className="px-5 py-3 tabular-nums">{money(o.subtotalCents, o.currency)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-5 py-3 text-stone">{formatDateTime(o.createdAt, "fr-FR", MARKETS[o.marketId].timeZone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Pipeline des commandes">
            <ul className="space-y-1.5 text-sm">
              {ORDER_STATUSES.map((st) => (
                <li key={st}>
                  <Link href={`/admin/orders?status=${st}${market ? `&m=${market}` : ""}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-cream">
                    <span className="text-charcoal">{STATUS_LABELS[st].fr}</span>
                    <span className="min-w-8 rounded-full bg-cream-200 px-2 text-center font-semibold tabular-nums text-forest">{stats.byStatus[st] ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="À faire">
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Tout est en ordre.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.text}>
                    <Link href={a.href} className="flex items-start gap-2 rounded-lg p-2 text-sm text-charcoal hover:bg-cream">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span className="flex-1">{a.text}</span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <div className="card flex items-center gap-4 p-5">
            <Calculator className="h-8 w-8 text-wood" />
            <div>
              <p className="text-2xl font-semibold tabular-nums text-forest">{stats.calculations30d}</p>
              <p className="text-sm text-stone">estimations du calculateur (30 jours)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
