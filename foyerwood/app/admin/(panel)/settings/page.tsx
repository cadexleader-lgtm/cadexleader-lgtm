import { ImageInput } from "@/components/admin/ImageInput";
import { Flash, PageTitle, Panel, Field, TextArea, Select, Check, SubmitButton, type SearchProps } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui";
import { listMarketSettings, getSetting, listCategories } from "@/lib/data/settings";
import { listUsers } from "@/lib/data/misc";
import { getCurrentUser } from "@/lib/admin-auth";
import { MARKETS } from "@/lib/markets";
import { formatDateTime } from "@/lib/format";
import {
  saveMarketSettingsAction, saveCompanyAction, saveCategoryAction, createUserAction, changePasswordAction, toggleUserAction,
} from "@/app/admin/actions";

export default async function SettingsPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const [markets, company, social, categories, users, me] = await Promise.all([
    listMarketSettings(),
    getSetting("company"),
    getSetting("social"),
    listCategories(),
    listUsers(),
    getCurrentUser(),
  ]);
  return (
    <>
      <PageTitle title="Réglages" subtitle="Marchés, coordonnées commerciales, informations légales, catégories et accès." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-3">
          {markets.map((m) => (
            <form key={m.id} action={saveMarketSettingsAction} id={`market-${m.id}`} className="scroll-mt-6">
              <input type="hidden" name="id" value={m.id} />
              <Panel title={`${MARKETS[m.id].flag} ${MARKETS[m.id].names.fr} — ${m.currency}`}>
                <div className="space-y-4">
                  <Field
                    label="Numéro WhatsApp commercial"
                    name="whatsappNumber"
                    defaultValue={m.whatsappNumber ?? ""}
                    placeholder={m.id === "fr" ? "+33 6 12 34 56 78" : "+1 514 555 0100"}
                    hint="Format international. Utilisé pour le message de confirmation prérempli."
                  />
                  <Field label="E-mail de contact" name="contactEmail" type="email" defaultValue={m.contactEmail ?? ""} />
                  <Field label="Téléphone" name="contactPhone" defaultValue={m.contactPhone ?? ""} />
                  {m.languages.includes("fr") && <Field label="Horaires (FR)" name="hours_fr" defaultValue={m.businessHours.fr ?? ""} />}
                  {m.languages.includes("en") && <Field label="Horaires (EN)" name="hours_en" defaultValue={m.businessHours.en ?? ""} />}
                  <Check label="Prix affichés toutes taxes comprises" name="pricesIncludeTax" defaultChecked={m.pricesIncludeTax} />
                  {m.languages.includes("fr") && <TextArea label="Mention taxes (FR)" name="tax_fr" rows={2} defaultValue={m.taxNote.fr ?? ""} />}
                  {m.languages.includes("en") && <TextArea label="Mention taxes (EN)" name="tax_en" rows={2} defaultValue={m.taxNote.en ?? ""} />}
                  <input type="hidden" name="freeNote_fr" value={m.freeDeliveryNote.fr ?? ""} />
                  <input type="hidden" name="freeNote_en" value={m.freeDeliveryNote.en ?? ""} />
                  <p className="text-xs text-stone">Conditions de livraison gratuite : voir « Zones de livraison ».</p>
                  <SubmitButton>Enregistrer</SubmitButton>
                </div>
              </Panel>
            </form>
          ))}
        </section>

        <form action={saveCompanyAction}>
          <Panel title="Entreprise et informations légales" id="company">
            <p className="mb-4 text-sm text-stone">Ces informations alimentent les mentions légales, les CGV et la politique de confidentialité. Faites valider les textes légaux par un professionnel dans chaque pays avant le lancement.</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Nom commercial" name="tradeName" defaultValue={company.tradeName} />
              <Field label="Raison sociale" name="legalName" defaultValue={company.legalName} />
              <Field label="E-mail général" name="email" type="email" defaultValue={company.email} />
              <Field label="Adresse du siège" name="address" defaultValue={company.address} className="md:col-span-2" />
              <Field label="Immatriculation (RCS, NEQ, EIN…)" name="registration" defaultValue={company.registration} />
              <Field label="Numéros de TVA / taxes" name="vatNumber" defaultValue={company.vatNumber} />
              <Field label="Directeur de la publication" name="publisher" defaultValue={company.publisher} />
              <Field label="Hébergeur" name="host" defaultValue={company.host} />
              <TextArea label="Médiateur de la consommation (France)" name="mediator" rows={2} defaultValue={company.mediator} className="md:col-span-2 xl:col-span-3" />
            </div>
            <p className="mb-3 mt-6 text-sm font-semibold text-forest">Réseaux sociaux (affichés dans le pied de page si renseignés)</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Instagram" name="instagram" defaultValue={social.instagram} placeholder="https://instagram.com/…" />
              <Field label="Facebook" name="facebook" defaultValue={social.facebook} placeholder="https://facebook.com/…" />
              <Field label="LinkedIn" name="linkedin" defaultValue={social.linkedin} />
              <Field label="YouTube" name="youtube" defaultValue={social.youtube} />
              <input type="hidden" name="tiktok" value={social.tiktok} />
            </div>
            <div className="mt-5"><SubmitButton>Enregistrer</SubmitButton></div>
          </Panel>
        </form>

        <Panel title="Catégories" id="categories">
          <div className="grid gap-5 lg:grid-cols-2">
            {categories.map((c) => (
              <form key={c.id} action={saveCategoryAction} className="rounded-xl bg-cream/60 p-4 ring-1 ring-line">
                <input type="hidden" name="id" value={c.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom (FR)" name="name_fr" defaultValue={c.name.fr ?? ""} />
                  <Field label="Nom (EN)" name="name_en" defaultValue={c.name.en ?? ""} />
                  <TextArea label="Description (FR)" name="description_fr" rows={2} defaultValue={c.description.fr ?? ""} />
                  <TextArea label="Description (EN)" name="description_en" rows={2} defaultValue={c.description.en ?? ""} />
                  <Field label="Image (URL)" name="imageUrl" defaultValue={c.imageUrl ?? ""} />
                  <div>
                    <label className="field-label" htmlFor={`cat-${c.id}`}>…ou envoyer une image</label>
                    <ImageInput id={`cat-${c.id}`} name="imageFile" compact />
                  </div>
                  <Check label="Catégorie active" name="active" defaultChecked={c.active} />
                </div>
                <div className="mt-3"><SubmitButton variant="secondary">Enregistrer</SubmitButton></div>
              </form>
            ))}
          </div>
        </Panel>

        <Panel title="Utilisateurs de l'administration" id="users">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-1">
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 rounded-xl p-3 ring-1 ring-line">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{u.name}</span>
                      <span className="block truncate text-xs text-stone">{u.email} · {u.lastLoginAt ? `dernière connexion ${formatDateTime(u.lastLoginAt, "fr-FR")}` : "jamais connecté"}</span>
                    </span>
                    {u.id === me?.id ? (
                      <Badge tone="info">Vous</Badge>
                    ) : (
                      <form action={toggleUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                        <button className="rounded-full px-3 py-1 text-xs ring-1 ring-line hover:bg-cream">{u.active ? "Désactiver" : "Réactiver"}</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <form action={createUserAction} className="space-y-3 rounded-xl bg-cream/60 p-4 ring-1 ring-line">
              <p className="text-sm font-semibold text-forest">Ajouter un utilisateur</p>
              <Field label="Nom" name="name" />
              <Field label="E-mail" name="email" type="email" required />
              <Field label="Mot de passe (12 caractères min.)" name="password" type="password" required minLength={12} autoComplete="new-password" />
              <Select label="Rôle" name="role" options={[{ value: "admin", label: "Administrateur" }, { value: "staff", label: "Équipe" }]} />
              <SubmitButton variant="secondary">Créer</SubmitButton>
            </form>
            <form action={changePasswordAction} className="space-y-3 rounded-xl bg-cream/60 p-4 ring-1 ring-line">
              <p className="text-sm font-semibold text-forest">Changer mon mot de passe</p>
              <Field label="Mot de passe actuel" name="current" type="password" required autoComplete="current-password" />
              <Field label="Nouveau mot de passe" name="next" type="password" required minLength={12} autoComplete="new-password" />
              <SubmitButton variant="secondary">Modifier</SubmitButton>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}
