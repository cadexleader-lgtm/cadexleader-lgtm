import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageTitle, Panel, Field, TextArea, Select, SubmitButton } from "@/components/admin/AdminUi";
import { adminGetArticle } from "@/lib/data/blog";
import { MARKETS, MARKET_IDS } from "@/lib/markets";
import { saveArticleAction, deleteArticleAction } from "@/app/admin/actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const ARTS = [["logs", "Bûches"], ["kiln", "Bois séché"], ["pellets-bag", "Granulés"], ["briquettes", "Bûches compressées"], ["kindling", "Allumage"], ["meter", "Humidimètre"]];

export default async function ArticleEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const a = id === "new" ? null : /^[0-9a-f-]{36}$/i.test(id) ? await adminGetArticle(id) : null;
  if (id !== "new" && !a) notFound();
  const pub = a?.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "";
  return (
    <>
      <Link href="/admin/blog" className="text-sm text-stone hover:text-forest">← Articles</Link>
      <PageTitle title={a ? a.title : "Nouvel article"} />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveArticleAction} className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {a && <input type="hidden" name="id" value={a.id} />}
        <Panel title="Contenu">
          <div className="space-y-4">
            <Field label="Titre" name="title" required defaultValue={a?.title ?? ""} />
            <TextArea label="Chapô / résumé" name="excerpt" rows={2} defaultValue={a?.excerpt ?? ""} />
            <TextArea
              label="Contenu (Markdown)"
              name="content"
              rows={22}
              defaultValue={a?.content ?? ""}
              className="font-mono"
              hint="## Titre de section · **gras** · - liste · | tableau | — Le HTML n'est pas interprété."
            />
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Publication">
            <div className="space-y-4">
              <Select label="Statut" name="status" defaultValue={a?.status ?? "draft"} options={[{ value: "draft", label: "Brouillon" }, { value: "published", label: "Publié" }]} />
              <Field label="Date de publication" name="publishedAt" type="datetime-local" defaultValue={pub} hint="Vide = maintenant lors de la publication." />
              <Select label="Langue" name="language" defaultValue={a?.language ?? "fr"} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} />
              <div>
                <p className="field-label">Marchés</p>
                <div className="flex gap-4">
                  {MARKET_IDS.map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="markets" value={m} defaultChecked={a ? a.markets.includes(m) : true} className="accent-pine" /> {MARKETS[m].flag} {MARKETS[m].names.fr}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Slug (URL)" name="slug" defaultValue={a?.slug ?? ""} hint="Généré depuis le titre si vide." />
              <Field label="Auteur" name="author" defaultValue={a?.author ?? "Woodora"} />
            </div>
          </Panel>
          <Panel title="Visuel">
            <div className="space-y-4">
              <Select label="Illustration par défaut" name="coverArt" defaultValue={a?.coverArt ?? "logs"} options={ARTS.map(([value, label]) => ({ value, label }))} />
              <Field label="URL de l'image de couverture" name="coverImage" defaultValue={a?.coverImage ?? ""} placeholder="https://…" />
              <div>
                <label className="field-label" htmlFor="coverFile">…ou envoyer une image</label>
                <input id="coverFile" name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-cream" />
              </div>
            </div>
          </Panel>
          <Panel title="Référencement">
            <div className="space-y-4">
              <Field label="Titre SEO" name="seoTitle" defaultValue={a?.seoTitle ?? ""} />
              <TextArea label="Description SEO" name="seoDescription" rows={2} defaultValue={a?.seoDescription ?? ""} />
            </div>
          </Panel>
          <SubmitButton>{a ? "Enregistrer" : "Créer l'article"}</SubmitButton>
        </div>
      </form>
      {a && (
        <form action={deleteArticleAction} className="mt-8">
          <input type="hidden" name="id" value={a.id} />
          <SubmitButton variant="danger">Supprimer l'article</SubmitButton>
        </form>
      )}
    </>
  );
}
