import Link from "next/link";
import { Star } from "lucide-react";
import { Flash, PageTitle, TabLinks, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { adminListReviews } from "@/lib/data/reviews";
import { MARKETS } from "@/lib/markets";
import { formatDateTime } from "@/lib/format";
import { moderateReviewAction } from "@/app/admin/actions";

const LABEL = { pending: "En attente", approved: "Publié", rejected: "Refusé" } as const;
const TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;

export default async function ReviewsAdminPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" || sp.status === "pending" ? sp.status : undefined;
  const reviews = await adminListReviews(status);
  return (
    <>
      <PageTitle title="Avis clients" subtitle="Seuls les clients livrés peuvent déposer un avis (référence + e-mail). Relisez chaque avis avant publication ; ne publiez jamais de faux avis." />
      <Flash ok={sp.ok} error={sp.error} />
      <TabLinks
        current={status ?? ""}
        items={[
          { key: "", href: "/admin/reviews", label: "Tous" },
          { key: "pending", href: "/admin/reviews?status=pending", label: "En attente" },
          { key: "approved", href: "/admin/reviews?status=approved", label: "Publiés" },
          { key: "rejected", href: "/admin/reviews?status=rejected", label: "Refusés" },
        ]}
      />
      {reviews.length === 0 ? (
        <p className="card p-8 text-stone">Aucun avis pour le moment. Les avis apparaissent ici après les premières livraisons.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex text-wood">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-25"}`} />)}</span>
                  <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                  {r.verified && <Badge tone="info">Commande livrée vérifiée</Badge>}
                </div>
                <span className="text-xs text-stone">{MARKETS[r.marketId].flag} {formatDateTime(r.createdAt, "fr-FR")} {r.orderReference && r.orderId ? <>· <Link href={`/admin/orders/${r.orderId}`} className="font-mono text-pine hover:underline">{r.orderReference}</Link></> : null}</span>
              </div>
              {r.title && <p className="mt-3 font-medium text-forest">{r.title}</p>}
              <p className="mt-1 text-charcoal/85">{r.body}</p>
              <p className="mt-2 text-sm text-stone">{r.authorName}{r.city ? ` · ${r.city}` : ""} · {r.language.toUpperCase()}</p>
              <div className="mt-4 flex gap-2">
                {(["approved", "rejected", "pending"] as const).filter((s) => s !== r.status).map((s) => (
                  <form key={s} action={moderateReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className={`rounded-full px-4 py-1.5 text-sm ring-1 ${s === "approved" ? "bg-pine text-cream ring-pine" : "ring-line hover:bg-cream"}`}>
                      {s === "approved" ? "Publier" : s === "rejected" ? "Refuser" : "Remettre en attente"}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
