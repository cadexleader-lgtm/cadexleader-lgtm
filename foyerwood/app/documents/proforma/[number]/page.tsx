import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProformaForCustomer } from "@/lib/data/orders";
import { proformaContext } from "@/lib/proforma";
import { ProformaDocument } from "@/components/proforma/ProformaDocument";
import { PrintButton } from "@/components/proforma/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Facture pro forma", robots: { index: false, follow: false } };

export default async function CustomerProformaPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  const { t } = await searchParams;
  const data = await getProformaForCustomer(decodeURIComponent(number), t ?? "");
  if (!data) notFound();
  const ctx = await proformaContext(data);
  return (
    <div className="min-h-dvh bg-cream-200 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <PrintButton label={data.order.language === "en" ? "Download PDF / Print" : "Télécharger en PDF / Imprimer"} />
      </div>
      <ProformaDocument {...data} company={ctx.company} billing={ctx.billing} market={ctx.market} termsUrl={ctx.termsUrl} />
    </div>
  );
}
