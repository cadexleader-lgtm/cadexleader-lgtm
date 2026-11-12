import { headers } from "next/headers";
import { getDict } from "@/lib/i18n";
import { getSite } from "@/lib/sites";
import { ButtonLink } from "@/components/ui";

export default async function SiteNotFound() {
  const h = await headers();
  const site = getSite(h.get("x-foyerwood-site") ?? "") ;
  const t = getDict(site?.lang ?? "fr");
  return (
    <section className="container-page grid items-center gap-10 py-20 md:grid-cols-2">
      <div>
        <p className="kicker mb-4">404</p>
        <h1 className="text-4xl text-forest sm:text-5xl">{t.notFound.title}</h1>
        <p className="mt-4 text-lg text-stone">{t.notFound.text}</p>
        <ButtonLink href={site?.prefix ?? "/"} className="mt-8">
          {t.notFound.cta}
        </ButtonLink>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/foyo.svg" alt="" className="mx-auto h-72 w-auto" />
    </section>
  );
}
