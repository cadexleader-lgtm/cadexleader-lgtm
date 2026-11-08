import { PageTitle } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { listContactMessages } from "@/lib/data/misc";
import { MARKETS } from "@/lib/markets";
import { formatDateTime } from "@/lib/format";
import { contactStatusAction } from "@/app/admin/actions";

export default async function MessagesPage() {
  const messages = await listContactMessages();
  return (
    <>
      <PageTitle title="Messages de contact" subtitle="Demandes reçues via le formulaire de contact." />
      {messages.length === 0 ? (
        <p className="card p-8 text-stone">Aucun message pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`card p-5 ${m.status === "handled" ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-forest">{m.subject}</p>
                <span className="flex items-center gap-2 text-xs text-stone">
                  {MARKETS[m.marketId].flag} {formatDateTime(m.createdAt, "fr-FR")}
                  <Badge tone={m.status === "new" ? "warning" : "success"}>{m.status === "new" ? "Nouveau" : "Traité"}</Badge>
                </span>
              </div>
              <p className="mt-1 text-sm text-stone">
                {m.name} · <a href={`mailto:${m.email}`} className="text-pine hover:underline">{m.email}</a>
                {m.phone ? ` · ${m.phone}` : ""}
                {m.orderReference ? ` · ${m.orderReference}` : ""}
              </p>
              <p className="mt-3 whitespace-pre-line text-charcoal/85">{m.message}</p>
              <form action={contactStatusAction} className="mt-4">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="status" value={m.status === "new" ? "handled" : "new"} />
                <button className="rounded-full px-4 py-1.5 text-sm ring-1 ring-line hover:bg-cream">{m.status === "new" ? "Marquer comme traité" : "Marquer comme nouveau"}</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
