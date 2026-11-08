import Link from "next/link";
import { Flash, PageTitle, type SearchProps } from "@/components/admin/AdminUi";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/data/settings";
import { listSuppliers } from "@/lib/data/suppliers";

export default async function NewProductPage({ searchParams }: SearchProps) {
  const sp = await searchParams;
  const [categories, suppliers] = await Promise.all([listCategories(), listSuppliers()]);
  return (
    <>
      <Link href="/admin/products" className="text-sm text-stone hover:text-forest">← Produits</Link>
      <PageTitle title="Nouveau produit" />
      <Flash ok={sp.ok} error={sp.error} />
      <ProductForm categories={categories} suppliers={suppliers} />
    </>
  );
}
