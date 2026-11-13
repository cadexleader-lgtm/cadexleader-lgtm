import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProformaById } from "@/lib/data/orders";
import { proformaContext, proformaMessage } from "@/lib/proforma";
import { whatsappLink } from "@/lib/whatsapp";
import { ProformaDocument } from "@/components/proforma/ProformaDocument";
import { ProformaToolbar } from "@/components/proforma/ProformaToolbar";
import { markProformaSentAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Facture pro forma", robots: { index: false, follow: false } };

export default async function AdminProformaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await getProformaById(id);
  if (!data) notFound();
  const ctx = await proformaContext(data);
  const msg = proformaMessage(data, ctx.publicUrl, ctx.company.tradeName || "Foyerwood");
  const warnings = [
    !ctx.company.legalName && "raison sociale",
    !ctx.company.address && "adresse de l'entreprise",
    !ctx.company.registration && "numéro d'immatriculation",
    !(ctx.billing?.bankDetails) && "coordonnées bancaires du pays",
  ].filter(Boolean) as string[];
  const markSent = markProformaSentAction.bind(null, data.quotation.id);
  return (
    <div className="min-h-dvh bg-cream-200 print:bg-white">
      <ProformaToolbar
        backHref={`/admin/orders/${data.order.id}`}
        publicUrl={ctx.publicUrl}
        whatsappHref={whatsappLink(data.order.customerPhone, msg.body)}
        mailtoHref={`mailto:${data.order.customerEmail}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`}
        markSent={markSent}
        status={data.quotation.status}
        warnings={warnings}
      />
      <div className="px-4 py-8 print:p-0">
        <ProformaDocument {...data} company={ctx.company} billing={ctx.billing} market={ctx.market} termsUrl={ctx.termsUrl} />
      </div>
    </div>
  );
}
