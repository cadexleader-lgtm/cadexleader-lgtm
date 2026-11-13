import Link from "next/link";
import { Star } from "lucide-react";
import { Flash, PageTitle, TabLinks, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { adminListReviews } from "@/lib/data/reviews";
import { MARKETS } from "@/lib/markets";
import { formatDateTime } from "@/lib/format";
import { addReviewAction, moderateReviewAction } from "@/app/admin/actions";
import { Field, Panel, Select, TextArea, SubmitButton } from "@/components/admin/AdminUi";
import { MARKET_IDS } from "@/lib/markets";

const LABEL = { pending: "En attente", approved: "Publié", rejected: "Refusé" } as const;
const TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;
const SOURCE_LABEL = {
  site: "Déposé sur le site",
  whatsapp: "Reçu par WhatsApp",
  email: "Reçu par e-mail",
  google: "Avis Google",
  facebook: "Avis Facebook",
  phone: "Par téléphone",
  in_person: "En personne",
  other: "Autre provenance",
} as const;

export default async function ReviewsAdminPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" || sp.status === "pending" ? sp.status : undefined;
  const reviews = await adminListReviews(status);
  return (
    <>
      <PageTitle
        title="Avis clients"
        subtitle="Les clients livrés déposent leur avis sur le site (référence + e-mail). Vous pouvez aussi ajouter ici les avis reçus d'un vrai client par WhatsApp, e-mail, Google… Ne publiez jamais de faux avis : c'est interdit et il serait affiché avec sa provenance."
      />
      <Flash ok={sp.ok} error={sp.error} />

      <Panel id="add" title="Ajouter un avis reçu d'un client" className="mb-8">
        <form action={addReviewAction} className="grid gap-4 md:grid-cols-2">
          <Select label="Pays du client" name="marketId" defaultValue="ca" options={MARKET_IDS.map((m) => ({ value: m, label: `${MARKETS[m].flag} ${MARKETS[m].names.fr}` }))} />
          <Select
            label="Provenance"
            name="source"
            defaultValue="whatsapp"
            options={[
              { value: "whatsapp", label: "Reçu par WhatsApp" },
              { value: "email", label: "Reçu par e-mail" },
              { value: "google", label: "Avis Google" },
              { value: "facebook", label: "Avis Facebook" },
              { value: "phone", label: "Recueilli par téléphone" },
              { value: "in_person", label: "Recueilli en personne" },
              { value: "other", label: "Autre" },
            ]}
          />
          <Field label="Nom affiché (prénom + initiale, ex. Marie T.)" name="authorName" required minLength={2} />
          <Field label="Ville (facultatif)" name="city" />
          <Select label="Note" name="rating" defaultValue="5" options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n}/5)` }))} />
          <Select label="Langue de l'avis" name="language" defaultValue="fr" options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} />
          <Field label="Titre (facultatif)" name="title" className="md:col-span-2" />
          <TextArea label="Avis du client (copiez son message tel quel)" name="body" required minLength={10} rows={4} className="md:col-span-2" />
          <Field label="Référence de commande (facultatif)" name="orderReference" placeholder="FW-CA-2026-000001" hint="Si la commande a été livrée, l'avis est marqué « Commande livrée vérifiée »." />
          <Field label="Date de l'avis (facultatif)" name="date" type="date" />
          <label className="flex items-start gap-2 text-sm text-charcoal md:col-span-2">
            <input type="checkbox" name="authentic" required className="mt-0.5 accent-pine" />
            Je confirme que cet avis a été écrit par un vrai client et que j'ai son accord pour le publier.
          </label>
          <div className="md:col-span-2">
            <SubmitButton>Publier l'avis</SubmitButton>
          </div>
        </form>
      </Panel>
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
        <p className="card p-8 text-stone">Aucun avis pour le moment. Ajoutez ceux que vos clients vous ont envoyés avec le formulaire ci-dessus, ou attendez les premiers avis déposés sur le site après livraison.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex text-wood">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-25"}`} />)}</span>
                  <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                  {r.verified ? <Badge tone="info">Commande livrée vérifiée</Badge> : r.source !== "site" ? <Badge tone="neutral">{SOURCE_LABEL[r.source]}</Badge> : null}
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
