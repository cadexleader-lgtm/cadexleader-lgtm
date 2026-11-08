import Link from "next/link";
import { Plus } from "lucide-react";
import { Flash, PageTitle, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { adminListArticles } from "@/lib/data/blog";
import { MARKETS } from "@/lib/markets";
import { formatDate } from "@/lib/format";

export default async function BlogAdminPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const articles = await adminListArticles();
  return (
    <>
      <PageTitle
        title="Articles et conseils"
        subtitle="Contenus de la rubrique Conseils / Advice, publiés par langue et par marché."
        actions={<Link href="/admin/blog/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-pine px-5 text-sm font-medium text-cream hover:bg-forest"><Plus className="h-4 w-4" /> Nouvel article</Link>}
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-stone">
            <tr><th className="px-5 py-3">Titre</th><th className="px-5 py-3">Langue</th><th className="px-5 py-3">Marchés</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Publication</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-cream/60">
                <td className="px-5 py-3"><Link href={`/admin/blog/${a.id}`} className="font-medium text-forest hover:underline">{a.title}</Link></td>
                <td className="px-5 py-3">{a.language.toUpperCase()}</td>
                <td className="px-5 py-3">{a.markets.map((m) => MARKETS[m].flag).join(" ")}</td>
                <td className="px-5 py-3"><Badge tone={a.status === "published" ? "success" : "neutral"}>{a.status === "published" ? "Publié" : "Brouillon"}</Badge></td>
                <td className="px-5 py-3 text-stone">{a.publishedAt ? formatDate(a.publishedAt, "fr-FR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
