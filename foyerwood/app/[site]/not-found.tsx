import { headers } from "next/headers";
import { getDict } from "@/lib/i18n";
import { getSite } from "@/lib/sites";
import { ButtonLink } from "@/components/ui";
import Image from "next/image";
import { AMBIANCE } from "@/lib/illustrations";

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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card)]">
        <Image src={AMBIANCE.logEnds} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}
