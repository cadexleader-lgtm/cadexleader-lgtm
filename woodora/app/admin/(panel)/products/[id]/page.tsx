import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Flash, PageTitle } from "@/components/admin/AdminUi";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminGetProduct } from "@/lib/data/products";
import { listCategories } from "@/lib/data/settings";
import { listSuppliers } from "@/lib/data/suppliers";
import { MARKETS } from "@/lib/markets";
import { productPath, siteFor } from "@/lib/sites";
import { loc } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, categories, suppliers] = await Promise.all([adminGetProduct(id), listCategories(), listSuppliers()]);
  if (!product) notFound();
  const site = siteFor(product.marketId);
  return (
    <>
      <Link href={`/admin/products?m=${product.marketId}`} className="text-sm text-stone hover:text-forest">← Produits</Link>
      <PageTitle
        title={loc(product.name, MARKETS[product.marketId].defaultLang)}
        subtitle={`${MARKETS[product.marketId].flag} ${MARKETS[product.marketId].names.fr} · ${product.sku ?? ""}`}
        actions={
          product.active ? (
            <Link href={productPath(site, product.slug)} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm ring-1 ring-line hover:bg-cream">
              <ExternalLink className="h-4 w-4" /> Voir sur le site
            </Link>
          ) : undefined
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <ProductForm product={product} categories={categories} suppliers={suppliers} />
    </>
  );
}
