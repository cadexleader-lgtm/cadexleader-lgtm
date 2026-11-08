import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageTitle } from "@/components/admin/AdminUi";
import { ZoneForm } from "@/components/admin/ZoneForm";
import { getZone } from "@/lib/data/zones";
import { listSuppliers } from "@/lib/data/suppliers";
import { adminListProducts } from "@/lib/data/products";
import { isMarketId, type MarketId } from "@/lib/markets";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function ZonePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const zone = id === "new" ? null : /^[0-9a-f-]{36}$/i.test(id) ? await getZone(id) : null;
  if (id !== "new" && !zone) notFound();
  const market = (zone?.marketId ?? (isMarketId(sp.m) ? sp.m : "fr")) as MarketId;
  const [suppliers, products] = await Promise.all([listSuppliers(market), adminListProducts(market)]);
  return (
    <>
      <Link href="/admin/zones" className="text-sm text-stone hover:text-forest">← Zones de livraison</Link>
      <PageTitle title={zone ? zone.name : "Nouvelle zone"} />
      <Flash ok={sp.ok} error={sp.error} />
      <ZoneForm market={market} zone={zone} suppliers={suppliers} products={products} />
    </>
  );
}
