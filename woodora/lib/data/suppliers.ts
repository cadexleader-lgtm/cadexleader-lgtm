import { query, queryOne } from "../db/client";
import type { MarketId } from "../markets";
import { camelize, camelizeAll } from "./util";

export interface Supplier {
  id: string;
  marketId: MarketId;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  leadTimeDaysMin: number | null;
  leadTimeDaysMax: number | null;
  notes: string | null;
  active: boolean;
  productCount?: number;
  stockValueCents?: number;
}

export async function listSuppliers(market?: MarketId): Promise<Supplier[]> {
  const rows = await query(
    `select s.*,
       (select count(*)::int from products p where p.supplier_id = s.id and p.active) as product_count,
       (select coalesce(sum(coalesce(p.cost_cents,0) * i.quantity), 0)::float8 from products p join inventory i on i.product_id = p.id
          where p.supplier_id = s.id and i.track_stock) as stock_value_cents
     from suppliers s where ($1::text is null or s.market_id = $1) order by s.market_id, s.name`,
    [market ?? null],
  );
  return camelizeAll<Supplier>(rows);
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const row = await queryOne(`select * from suppliers where id = $1`, [id]);
  return row ? camelize<Supplier>(row) : null;
}

export async function saveSupplier(s: Omit<Supplier, "id" | "productCount" | "stockValueCents"> & { id?: string }): Promise<string> {
  const params = [
    s.marketId, s.name, s.contactName, s.email, s.phone, s.whatsapp, s.address, s.city, s.region, s.postalCode,
    s.leadTimeDaysMin, s.leadTimeDaysMax, s.notes, s.active,
  ];
  if (s.id) {
    await query(
      `update suppliers set market_id=$1, name=$2, contact_name=$3, email=$4, phone=$5, whatsapp=$6, address=$7, city=$8,
         region=$9, postal_code=$10, lead_time_days_min=$11, lead_time_days_max=$12, notes=$13, active=$14, updated_at=now()
       where id=$15`,
      [...params, s.id],
    );
    return s.id;
  }
  const [row] = await query<{ id: string }>(
    `insert into suppliers (market_id, name, contact_name, email, phone, whatsapp, address, city, region, postal_code,
       lead_time_days_min, lead_time_days_max, notes, active)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
    params,
  );
  return row.id;
}
