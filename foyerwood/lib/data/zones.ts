import { json, query, queryOne } from "../db/client";
import type { MarketId } from "../markets";
import { normalizePostalCode, regionFromPostalCode, isValidPostalCode } from "../regions";
import type { LText } from "../format";
import { camelize, camelizeAll } from "./util";

export interface DeliveryZone {
  id: string;
  marketId: MarketId;
  supplierId: string | null;
  name: string;
  regionCodes: string[];
  excludedPostalPrefixes: string[];
  excludedProductIds: string[];
  freeDelivery: boolean;
  freeDeliveryMinCents: number;
  leadTimeDaysMin: number | null;
  leadTimeDaysMax: number | null;
  remoteAreaNote: LText;
  active: boolean;
}

export async function listZones(market?: MarketId, activeOnly = false): Promise<DeliveryZone[]> {
  const rows = await query(
    `select * from delivery_zones where ($1::text is null or market_id = $1) and ($2::boolean = false or active)
     order by market_id, name`,
    [market ?? null, activeOnly],
  );
  return camelizeAll<DeliveryZone>(rows);
}

export async function getZone(id: string): Promise<DeliveryZone | null> {
  const row = await queryOne(`select * from delivery_zones where id = $1`, [id]);
  return row ? camelize<DeliveryZone>(row) : null;
}

export async function saveZone(z: Omit<DeliveryZone, "id"> & { id?: string }): Promise<string> {
  const params = [
    z.marketId,
    z.supplierId,
    z.name,
    json(z.regionCodes),
    json(z.excludedPostalPrefixes),
    json(z.excludedProductIds),
    z.freeDelivery,
    z.freeDeliveryMinCents,
    z.leadTimeDaysMin,
    z.leadTimeDaysMax,
    json(z.remoteAreaNote),
    z.active,
  ];
  if (z.id) {
    await query(
      `update delivery_zones set market_id=$1, supplier_id=$2, name=$3, region_codes=$4::text::jsonb,
         excluded_postal_prefixes=$5::text::jsonb, excluded_product_ids=$6::text::jsonb, free_delivery=$7, free_delivery_min_cents=$8,
         lead_time_days_min=$9, lead_time_days_max=$10, remote_area_note=$11::text::jsonb, active=$12, updated_at=now()
       where id=$13`,
      [...params, z.id],
    );
    return z.id;
  }
  const [row] = await query<{ id: string }>(
    `insert into delivery_zones (market_id, supplier_id, name, region_codes, excluded_postal_prefixes, excluded_product_ids,
       free_delivery, free_delivery_min_cents, lead_time_days_min, lead_time_days_max, remote_area_note, active)
     values ($1,$2,$3,$4::text::jsonb,$5::text::jsonb,$6::text::jsonb,$7,$8,$9,$10,$11::text::jsonb,$12) returning id`,
    params,
  );
  return row.id;
}

export async function deleteZone(id: string) {
  await query(`delete from delivery_zones where id = $1`, [id]);
}

// ---------------------------------------------------------------- coverage

export type DeliveryFailure = "invalid_postal" | "region_not_served" | "postal_excluded" | "product_excluded";

export interface DeliveryCheck {
  ok: boolean;
  region: string | null;
  reason?: DeliveryFailure;
  /** Products that cannot be delivered to this address. */
  blockedProductIds: string[];
  zones: DeliveryZone[];
  freeDelivery: boolean;
  freeDeliveryMinCents: number;
  leadTimeDaysMin: number | null;
  leadTimeDaysMax: number | null;
  remoteNote: LText | null;
}

function zoneCovers(zone: DeliveryZone, region: string, postal: string): "ok" | "region" | "excluded" {
  if (!zone.regionCodes.includes(region)) return "region";
  if (zone.excludedPostalPrefixes.some((p) => p && postal.startsWith(normalizePostalCode(zone.marketId, p)))) return "excluded";
  return "ok";
}

/**
 * Checks that every product of a pre-order can be delivered to a postal code,
 * using the zones of each product's supplier. With no items, checks that at
 * least one zone of the market covers the address.
 */
export function evaluateDelivery(
  market: MarketId,
  postalCode: string,
  zones: DeliveryZone[],
  items: Array<{ productId: string; supplierId: string | null }> = [],
  subtotalCents = 0,
): DeliveryCheck {
  const empty = {
    blockedProductIds: [] as string[],
    zones: [] as DeliveryZone[],
    freeDelivery: false,
    freeDeliveryMinCents: 0,
    leadTimeDaysMin: null,
    leadTimeDaysMax: null,
    remoteNote: null,
  };
  if (!isValidPostalCode(market, postalCode)) return { ok: false, region: null, reason: "invalid_postal", ...empty };
  const region = regionFromPostalCode(market, postalCode);
  if (!region) return { ok: false, region: null, reason: "region_not_served", ...empty };
  const postal = normalizePostalCode(market, postalCode);
  const active = zones.filter((z) => z.active && z.marketId === market);

  const regionZones = active.filter((z) => z.regionCodes.includes(region));
  if (regionZones.length === 0) return { ok: false, region, reason: "region_not_served", ...empty };
  const covering = regionZones.filter((z) => zoneCovers(z, region, postal) === "ok");
  if (covering.length === 0) {
    return { ok: false, region, reason: "postal_excluded", ...empty, remoteNote: regionZones[0].remoteAreaNote };
  }

  const used = new Map<string, DeliveryZone>();
  const blocked: string[] = [];
  for (const item of items) {
    const zone = covering.find(
      (z) => (z.supplierId === null || z.supplierId === item.supplierId) && !z.excludedProductIds.includes(item.productId),
    );
    if (zone) used.set(zone.id, zone);
    else blocked.push(item.productId);
  }
  const zonesUsed = items.length ? [...used.values()] : covering;
  const freeMin = Math.max(0, ...zonesUsed.map((z) => z.freeDeliveryMinCents));
  const leadMins = zonesUsed.map((z) => z.leadTimeDaysMin).filter((v): v is number => v != null);
  const leadMaxs = zonesUsed.map((z) => z.leadTimeDaysMax).filter((v): v is number => v != null);
  return {
    ok: blocked.length === 0,
    region,
    reason: blocked.length ? "product_excluded" : undefined,
    blockedProductIds: blocked,
    zones: zonesUsed,
    freeDelivery: zonesUsed.length > 0 && zonesUsed.every((z) => z.freeDelivery) && subtotalCents >= freeMin,
    freeDeliveryMinCents: freeMin,
    leadTimeDaysMin: leadMins.length ? Math.max(...leadMins) : null,
    leadTimeDaysMax: leadMaxs.length ? Math.max(...leadMaxs) : null,
    remoteNote: zonesUsed.find((z) => Object.keys(z.remoteAreaNote ?? {}).length)?.remoteAreaNote ?? null,
  };
}

export async function checkDelivery(
  market: MarketId,
  postalCode: string,
  items: Array<{ productId: string; supplierId: string | null }> = [],
  subtotalCents = 0,
): Promise<DeliveryCheck> {
  return evaluateDelivery(market, postalCode, await listZones(market, true), items, subtotalCents);
}

/** Lowest free-delivery threshold of a market (for the banners). */
export async function freeDeliveryThreshold(market: MarketId): Promise<number | null> {
  const row = await queryOne<{ m: number | null }>(
    `select min(free_delivery_min_cents)::int as m from delivery_zones where market_id = $1 and active and free_delivery`,
    [market],
  );
  return row?.m ?? null;
}
