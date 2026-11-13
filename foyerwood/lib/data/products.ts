import { json, query, queryOne, tx } from "../db/client";
import type { MarketId, Lang } from "../markets";
import type { CategoryKey } from "../sites";
import { energyPerUnitKwh, unitLabel, type Packing, type SaleUnit, type SpeciesKey } from "../energy";
import { loc, type LText } from "../format";
import { camelize } from "./util";
import { autoProductPhotos } from "../product-photos";

export interface Product {
  id: string;
  marketId: MarketId;
  categoryId: CategoryKey;
  supplierId: string | null;
  slug: string;
  sku: string | null;
  name: LText;
  shortDescription: LText;
  description: LText;
  deliveryInfo: LText;
  /** Photos to display: the product's own photos, else the catalogue photo for its species × packaging. */
  images: string[];
  /** Photos uploaded on this product only (what the admin product form edits). */
  ownImages: string[];
  /** Where images[0] comes from. */
  photoSource: "own" | "catalog" | "file" | null;
  art: string | null;
  species: SpeciesKey | null;
  moisturePct: number | null;
  lengthCm: number | null;
  packaging: "pallet" | "big_bag" | "net_bag" | "bag" | "bulk" | "box" | "bundle" | "crate" | "none";
  unit: SaleUnit;
  unitVolumeM3: number | null;
  unitWeightKg: number | null;
  packing: Packing;
  energyKwhOverride: number | null;
  minQty: number;
  maxQty: number | null;
  priceCents: number;
  compareAtCents: number | null;
  costCents: number | null;
  isAvailable: boolean;
  active: boolean;
  featured: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}

export type Availability = "available" | "limited" | "out_of_stock" | "unavailable";

export function availabilityOf(p: Pick<Product, "isAvailable" | "trackStock" | "stockQuantity" | "minQty" | "lowStockThreshold">): Availability {
  if (!p.isAvailable) return "unavailable";
  if (p.trackStock && p.stockQuantity < p.minQty) return "out_of_stock";
  if (p.trackStock && p.lowStockThreshold > 0 && p.stockQuantity <= p.lowStockThreshold) return "limited";
  return "available";
}

export function canOrder(a: Availability): boolean {
  return a === "available" || a === "limited";
}

export function productEnergyKwh(p: Product): number | null {
  if (p.energyKwhOverride) return p.energyKwhOverride;
  return energyPerUnitKwh({
    category: p.categoryId,
    unit: p.unit,
    species: p.species,
    moisture: p.moisturePct != null ? p.moisturePct / 100 : null,
    lengthCm: p.lengthCm,
    unitVolumeM3: p.unitVolumeM3,
    unitWeightKg: p.unitWeightKg,
    packing: p.packing,
  });
}

/** Data safe to send to the browser (no purchase cost, no supplier). */
export interface PublicProduct {
  id: string;
  slug: string;
  categoryId: CategoryKey;
  name: string;
  shortDescription: string;
  image: string | null;
  art: string | null;
  species: SpeciesKey | null;
  unit: SaleUnit;
  unitLabel: string;
  unitLabelPlural: string;
  minQty: number;
  maxQty: number | null;
  priceCents: number;
  compareAtCents: number | null;
  availability: Availability;
  energyKwh: number | null;
  supplierId?: never;
}

export function toPublicProduct(p: Product, lang: Lang): PublicProduct {
  return {
    id: p.id,
    slug: p.slug,
    categoryId: p.categoryId,
    name: loc(p.name, lang),
    shortDescription: loc(p.shortDescription, lang),
    image: p.images[0] ?? null,
    art: p.art,
    species: p.species,
    unit: p.unit,
    unitLabel: unitLabel(p.unit, lang, 1),
    unitLabelPlural: unitLabel(p.unit, lang, 2),
    minQty: p.minQty,
    maxQty: p.maxQty,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    availability: availabilityOf(p),
    energyKwh: productEnergyKwh(p),
  };
}

const SELECT = `
  select p.*, coalesce(i.track_stock, false) as track_stock, coalesce(i.quantity, 0) as stock_quantity,
         coalesce(i.low_stock_threshold, 0) as low_stock_threshold, cp.url as catalog_photo
  from products p
  left join inventory i on i.product_id = p.id
  left join catalog_photos cp on cp.species = p.species and cp.packaging = p.packaging`;

// Photo precedence: the product's own photos (admin product form), then the
// species × packaging photo from Administration → Photos du catalogue, then a
// file in public/images/products/ (see lib/product-photos.ts).
function map(row: Record<string, unknown>): Product {
  const { catalogPhoto, ...rest } = camelize<Product & { catalogPhoto: string | null }>(row);
  const p = rest as Product;
  p.ownImages = Array.isArray(p.images) ? p.images : [];
  p.images = p.ownImages;
  p.photoSource = p.ownImages.length > 0 ? "own" : null;
  if (p.images.length === 0 && catalogPhoto) {
    p.images = [catalogPhoto];
    p.photoSource = "catalog";
  }
  if (p.images.length === 0) {
    const files = autoProductPhotos(p.species, p.packaging, p.categoryId, p.slug);
    if (files.length) {
      p.images = files;
      p.photoSource = "file";
    }
  }
  return p;
}

export interface ProductFilters {
  category?: CategoryKey;
  q?: string;
  species?: string;
  packaging?: string;
  availableOnly?: boolean;
  sort?: "featured" | "price_asc" | "price_desc" | "name";
}

export async function listProducts(market: MarketId, lang: Lang, f: ProductFilters = {}): Promise<Product[]> {
  const rows = await query(`${SELECT} where p.market_id = $1 and p.active = true order by p.featured desc, p.position, p.created_at`, [market]);
  let list = rows.map(map);
  if (f.category) list = list.filter((p) => p.categoryId === f.category);
  if (f.species) list = list.filter((p) => p.species === f.species);
  if (f.packaging) list = list.filter((p) => p.packaging === f.packaging);
  if (f.availableOnly) list = list.filter((p) => canOrder(availabilityOf(p)));
  if (f.q) {
    const needle = normalize(f.q);
    list = list.filter((p) =>
      normalize(`${loc(p.name, lang)} ${loc(p.shortDescription, lang)} ${loc(p.description, lang)} ${p.species ?? ""}`).includes(needle),
    );
  }
  switch (f.sort) {
    case "price_asc":
      list.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price_desc":
      list.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "name":
      list.sort((a, b) => loc(a.name, lang).localeCompare(loc(b.name, lang), lang));
      break;
  }
  return list;
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function getProductBySlug(market: MarketId, slug: string): Promise<Product | null> {
  const row = await queryOne(`${SELECT} where p.market_id = $1 and p.slug = $2 and p.active = true`, [market, slug]);
  return row ? map(row) : null;
}

export async function getProductsByIds(market: MarketId, ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const rows = await query(
    `${SELECT} where p.market_id = $1 and p.id in (select jsonb_array_elements_text($2::text::jsonb)::uuid)`,
    [market, json(ids)],
  );
  return rows.map(map);
}

// ---------------------------------------------------------------- admin

export async function adminListProducts(market?: MarketId): Promise<Product[]> {
  const rows = market
    ? await query(`${SELECT} where p.market_id = $1 order by p.market_id, p.category_id, p.position`, [market])
    : await query(`${SELECT} order by p.market_id, p.category_id, p.position`);
  return rows.map(map);
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const row = await queryOne(`${SELECT} where p.id = $1`, [id]);
  return row ? map(row) : null;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "position" | "ownImages" | "photoSource"> & { id?: string };

export async function saveProduct(input: ProductInput): Promise<string> {
  return tx(async (q) => {
    const params = [
      input.marketId,
      input.categoryId,
      input.supplierId,
      input.slug,
      input.sku,
      json(input.name),
      json(input.shortDescription),
      json(input.description),
      json(input.deliveryInfo),
      json(input.images),
      input.art,
      input.species,
      input.moisturePct,
      input.lengthCm,
      input.packaging,
      input.unit,
      input.unitVolumeM3,
      input.unitWeightKg,
      input.packing,
      input.energyKwhOverride,
      input.minQty,
      input.maxQty,
      input.priceCents,
      input.compareAtCents,
      input.costCents,
      input.isAvailable,
      input.active,
      input.featured,
    ];
    let id = input.id;
    if (id) {
      await q.query(
        `update products set market_id=$1, category_id=$2, supplier_id=$3, slug=$4, sku=$5, name=$6::text::jsonb,
           short_description=$7::text::jsonb, description=$8::text::jsonb, delivery_info=$9::text::jsonb, images=$10::text::jsonb, art=$11,
           species=$12, moisture_pct=$13, length_cm=$14, packaging=$15, unit=$16, unit_volume_m3=$17, unit_weight_kg=$18,
           packing=$19, energy_kwh_override=$20, min_qty=$21, max_qty=$22, price_cents=$23, compare_at_cents=$24,
           cost_cents=$25, is_available=$26, active=$27, featured=$28, updated_at=now()
         where id=$29`,
        [...params, id],
      );
    } else {
      const [row] = await q.query<{ id: string }>(
        `insert into products (market_id, category_id, supplier_id, slug, sku, name, short_description, description,
           delivery_info, images, art, species, moisture_pct, length_cm, packaging, unit, unit_volume_m3, unit_weight_kg,
           packing, energy_kwh_override, min_qty, max_qty, price_cents, compare_at_cents, cost_cents, is_available, active,
           featured, position)
         values ($1,$2,$3,$4,$5,$6::text::jsonb,$7::text::jsonb,$8::text::jsonb,$9::text::jsonb,$10::text::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,
           $20,$21,$22,$23,$24,$25,$26,$27,$28, (select coalesce(max(position),0)+1 from products))
         returning id`,
        params,
      );
      id = row.id;
    }
    await q.query(
      `insert into inventory (product_id, track_stock, quantity, low_stock_threshold, updated_at)
       values ($1,$2,$3,$4,now())
       on conflict (product_id) do update set track_stock=excluded.track_stock, quantity=excluded.quantity,
         low_stock_threshold=excluded.low_stock_threshold, updated_at=now()`,
      [id, input.trackStock, input.stockQuantity, input.lowStockThreshold],
    );
    return id!;
  });
}

export async function setProductActive(id: string, active: boolean) {
  await query(`update products set active = $2, updated_at = now() where id = $1`, [id, active]);
}

export async function slugExists(market: MarketId, slug: string, exceptId?: string): Promise<boolean> {
  const row = await queryOne(
    `select 1 from products where market_id = $1 and slug = $2 and ($3::uuid is null or id <> $3::uuid)`,
    [market, slug, exceptId ?? null],
  );
  return !!row;
}

export async function updateStock(id: string, quantity: number) {
  await query(
    `insert into inventory (product_id, track_stock, quantity) values ($1, true, $2)
     on conflict (product_id) do update set quantity = excluded.quantity, track_stock = true, updated_at = now()`,
    [id, quantity],
  );
}
