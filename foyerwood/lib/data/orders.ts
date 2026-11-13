import { query, queryOne, tx, type Queryable } from "../db/client";
import { MARKETS, type Currency, type Lang, type MarketId } from "../markets";
import { randomToken } from "../auth";
import { isPaidStatus, type OrderStatus } from "../order-status";
import { camelize, camelizeAll } from "./util";

export interface Order {
  id: string;
  reference: string;
  accessToken: string;
  marketId: MarketId;
  language: Lang;
  currency: Currency;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine: string;
  postalCode: string;
  city: string;
  region: string | null;
  deliveryInstructions: string | null;
  status: OrderStatus;
  subtotalCents: number;
  /** Volume discount granted at pre-order time (subtracted from subtotalCents). */
  discountCents: number;
  /** Stored as numeric: may come back as a string, use Number(). */
  discountPercent: number | string;
  estimatedCostCents: number | null;
  deliveryZoneId: string | null;
  calculationId: string | null;
  internalNotes: string | null;
  stockCommitted: boolean;
  consentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  supplierId: string | null;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number | null;
  lineTotalCents: number;
  /** Free accessory offered by a promotion (price 0). */
  isGift: boolean;
}

/** Amount the customer is expected to pay for the products (before delivery and taxes). */
export function orderProductsTotal(o: Pick<Order, "subtotalCents" | "discountCents">): number {
  return o.subtotalCents - (o.discountCents ?? 0);
}

export interface OrderEvent {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  note: string | null;
  userName: string | null;
  createdAt: Date;
}

export interface Quotation {
  id: string;
  orderId: string;
  number: string;
  amountCents: number;
  deliveryCents: number;
  taxCents: number;
  currency: Currency;
  status: "draft" | "sent" | "accepted" | "expired" | "cancelled";
  sentAt: Date | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  quotationId: string | null;
  expectedCents: number | null;
  receivedCents: number;
  currency: Currency;
  transferDate: string | null;
  bankReference: string | null;
  status: "awaiting" | "verified" | "rejected" | "refunded";
  verifiedAt: Date | null;
  verifiedByName: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface Delivery {
  id: string;
  orderId: string;
  supplierId: string | null;
  status: "pending" | "scheduled" | "in_transit" | "delivered" | "failed";
  scheduledDate: string | null;
  deliveredAt: Date | null;
  carrier: string | null;
  trackingInfo: string | null;
  notes: string | null;
}

export function quotationTotal(q: Pick<Quotation, "amountCents" | "deliveryCents" | "taxCents">): number {
  return q.amountCents + q.deliveryCents + q.taxCents;
}

// ---------------------------------------------------------------- creation

function yearIn(timeZone: string): number {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone }).format(new Date()));
}

export async function nextReference(q: Queryable, market: MarketId): Promise<string> {
  const year = yearIn(MARKETS[market].timeZone);
  const [row] = await q.query<{ last_value: number }>(
    `insert into order_sequences (market_id, year, last_value) values ($1, $2, 1)
     on conflict (market_id, year) do update set last_value = order_sequences.last_value + 1
     returning last_value`,
    [market, year],
  );
  return `FW-${MARKETS[market].refCode}-${year}-${String(row.last_value).padStart(6, "0")}`;
}

export interface NewPreorder {
  market: MarketId;
  language: Lang;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    addressLine: string;
    postalCode: string;
    city: string;
    region: string | null;
    instructions: string | null;
  };
  items: Array<{
    productId: string;
    supplierId: string | null;
    name: string;
    unit: string;
    quantity: number;
    unitPriceCents: number;
    unitCostCents: number | null;
    isGift?: boolean;
  }>;
  deliveryZoneId: string | null;
  calculationId: string | null;
  discountCents?: number;
  discountPercent?: number;
}

export async function createPreorder(input: NewPreorder): Promise<{ id: string; reference: string; accessToken: string }> {
  const currency = MARKETS[input.market].currency;
  const subtotal = input.items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  // Gifts cost us their purchase price too: they are part of the estimated cost.
  const costKnown = input.items.every((i) => i.unitCostCents != null);
  const cost = costKnown ? input.items.reduce((s, i) => s + (i.unitCostCents ?? 0) * i.quantity, 0) : null;
  const discount = Math.max(0, Math.min(subtotal, Math.round(input.discountCents ?? 0)));
  const c = input.customer;
  const email = c.email.trim().toLowerCase();

  return tx(async (q) => {
    const [customer] = await q.query<{ id: string }>(
      `insert into customers (market_id, full_name, email, phone, address_line, postal_code, city, region, language)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (market_id, email) do update set full_name=excluded.full_name, phone=excluded.phone,
         address_line=excluded.address_line, postal_code=excluded.postal_code, city=excluded.city,
         region=excluded.region, language=excluded.language, updated_at=now()
       returning id`,
      [input.market, c.fullName, email, c.phone, c.addressLine, c.postalCode, c.city, c.region, input.language],
    );
    const reference = await nextReference(q, input.market);
    const accessToken = randomToken();
    const [order] = await q.query<{ id: string }>(
      `insert into orders (reference, access_token, market_id, language, currency, customer_id, customer_name,
         customer_email, customer_phone, address_line, postal_code, city, region, delivery_instructions,
         subtotal_cents, estimated_cost_cents, delivery_zone_id, calculation_id, consent_at, discount_cents, discount_percent)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now(),$19,$20)
       returning id`,
      [
        reference,
        accessToken,
        input.market,
        input.language,
        currency,
        customer.id,
        c.fullName,
        email,
        c.phone,
        c.addressLine,
        c.postalCode,
        c.city,
        c.region,
        c.instructions,
        subtotal,
        cost,
        input.deliveryZoneId,
        input.calculationId,
        discount,
        input.discountPercent ?? 0,
      ],
    );
    let pos = 0;
    for (const i of input.items) {
      await q.query(
        `insert into order_items (order_id, product_id, supplier_id, product_name, unit, quantity, unit_price_cents,
           unit_cost_cents, line_total_cents, position, is_gift)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [order.id, i.productId, i.supplierId, i.name, i.unit, i.quantity, i.unitPriceCents, i.unitCostCents, i.unitPriceCents * i.quantity, pos++, i.isGift === true],
      );
    }
    await q.query(`insert into order_events (order_id, from_status, to_status, note) values ($1, null, 'new', $2)`, [
      order.id,
      "Précommande envoyée depuis le site",
    ]);
    return { id: order.id, reference, accessToken };
  });
}

// ---------------------------------------------------------------- customer access

export async function getOrderForCustomer(reference: string, token: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const row = await queryOne(`select * from orders where reference = $1`, [reference]);
  if (!row) return null;
  const order = camelize<Order>(row);
  if (!token || !safeEqual(order.accessToken, token)) return null;
  return { order, items: await orderItems(order.id) };
}

export async function findOrderForTracking(reference: string, email: string): Promise<Order | null> {
  const row = await queryOne(`select * from orders where upper(reference) = upper($1) and lower(customer_email) = lower($2)`, [
    reference.trim(),
    email.trim(),
  ]);
  return row ? camelize<Order>(row) : null;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function orderItems(orderId: string): Promise<OrderItem[]> {
  return camelizeAll<OrderItem>(await query(`select * from order_items where order_id = $1 order by position`, [orderId]));
}

// ---------------------------------------------------------------- admin

export interface OrderListFilters {
  market?: MarketId;
  status?: OrderStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listOrders(f: OrderListFilters = {}): Promise<{ rows: Order[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.market) {
    params.push(f.market);
    where.push(`market_id = $${params.length}`);
  }
  if (f.status) {
    params.push(f.status);
    where.push(`status = $${params.length}`);
  }
  if (f.q) {
    params.push(`%${f.q.trim()}%`);
    const n = params.length;
    where.push(`(reference ilike $${n} or customer_name ilike $${n} or customer_email ilike $${n} or customer_phone ilike $${n} or city ilike $${n})`);
  }
  const w = where.length ? `where ${where.join(" and ")}` : "";
  const [{ n }] = await query<{ n: number }>(`select count(*)::int as n from orders ${w}`, params);
  params.push(f.limit ?? 50, f.offset ?? 0);
  const rows = await query(
    `select * from orders ${w} order by created_at desc limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { rows: camelizeAll<Order>(rows), total: n };
}

export interface OrderDetail {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
  quotations: Quotation[];
  payments: Payment[];
  delivery: Delivery | null;
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const row = await queryOne(`select * from orders where id = $1`, [id]);
  if (!row) return null;
  const [items, events, quotations, payments, delivery] = await Promise.all([
    orderItems(id),
    query(
      `select e.*, u.name as user_name from order_events e left join users u on u.id = e.user_id
       where e.order_id = $1 order by e.created_at desc`,
      [id],
    ),
    query(`select * from quotations where order_id = $1 order by created_at desc`, [id]),
    query(
      `select p.*, u.name as verified_by_name from payments p left join users u on u.id = p.verified_by
       where p.order_id = $1 order by p.created_at desc`,
      [id],
    ),
    queryOne(`select * from deliveries where order_id = $1`, [id]),
  ]);
  return {
    order: camelize<Order>(row),
    items,
    events: camelizeAll<OrderEvent>(events),
    quotations: camelizeAll<Quotation>(quotations).map(fixDate),
    payments: camelizeAll<Payment>(payments).map(fixDate),
    delivery: delivery ? fixDate(camelize<Delivery>(delivery)) : null,
  };
}

/** `date` columns come back as Date objects: keep them as YYYY-MM-DD strings. */
function fixDate<T extends object>(o: T): T {
  const r = o as Record<string, unknown>;
  for (const k of ["validUntil", "transferDate", "scheduledDate"]) {
    if (r[k] instanceof Date) r[k] = (r[k] as Date).toISOString().slice(0, 10);
  }
  return o;
}

export class OrderRuleError extends Error {}

/**
 * Changes the status of an order, enforcing the business rules:
 *  - a pro forma invoice must exist before "quote sent";
 *  - "payment received" and later statuses require payments VERIFIED by an
 *    administrator covering the quotation total (a customer's claim is never enough);
 *  - stock is committed on confirmation and released on cancellation.
 */
export async function changeOrderStatus(orderId: string, to: OrderStatus, userId: string | null, note?: string) {
  await tx(async (q) => {
    const [o] = await q.query<{ status: OrderStatus; stock_committed: boolean }>(
      `select status, stock_committed from orders where id = $1 for update`,
      [orderId],
    );
    if (!o) throw new OrderRuleError("Commande introuvable.");
    if (o.status === to) return;

    const quotes = camelizeAll<Quotation>(
      await q.query(`select * from quotations where order_id = $1 and status <> 'cancelled' order by created_at desc`, [orderId]),
    );

    if (to === "quote_sent" || to === "awaiting_payment") {
      if (quotes.length === 0) throw new OrderRuleError("Créez d'abord la facture pro forma (devis) de cette commande.");
      await q.query(`update quotations set status = 'sent', sent_at = coalesce(sent_at, now()), updated_at = now() where id = $1 and status = 'draft'`, [
        quotes[0].id,
      ]);
    }

    if (isPaidStatus(to)) {
      if (quotes.length === 0) throw new OrderRuleError("Aucun devis : impossible de considérer la commande comme payée.");
      const [{ total }] = await q.query<{ total: number }>(
        `select coalesce(sum(received_cents), 0)::float8 as total from payments where order_id = $1 and status = 'verified'`,
        [orderId],
      );
      const due = quotationTotal(quotes[0]);
      if (total < due) {
        throw new OrderRuleError(
          `Paiement vérifié insuffisant (${(total / 100).toFixed(2)} sur ${(due / 100).toFixed(2)}). Enregistrez et vérifiez le virement sur le compte bancaire avant de changer le statut.`,
        );
      }
    }

    let stockCommitted = o.stock_committed;
    const commitStatuses: OrderStatus[] = ["confirmed", "preparing_delivery", "in_delivery", "delivered"];
    if (commitStatuses.includes(to) && !stockCommitted) {
      await q.query(
        `update inventory i set quantity = i.quantity - oi.quantity, updated_at = now()
         from order_items oi where oi.order_id = $1 and oi.product_id = i.product_id and i.track_stock`,
        [orderId],
      );
      stockCommitted = true;
    }
    if (to === "cancelled" && stockCommitted) {
      await q.query(
        `update inventory i set quantity = i.quantity + oi.quantity, updated_at = now()
         from order_items oi where oi.order_id = $1 and oi.product_id = i.product_id and i.track_stock`,
        [orderId],
      );
      stockCommitted = false;
    }
    if (to === "delivered") {
      await q.query(
        `insert into deliveries (order_id, status, delivered_at) values ($1, 'delivered', now())
         on conflict (order_id) do update set status = 'delivered', delivered_at = coalesce(deliveries.delivered_at, now()), updated_at = now()`,
        [orderId],
      );
    }
    if (to === "in_delivery") {
      await q.query(
        `insert into deliveries (order_id, status) values ($1, 'in_transit')
         on conflict (order_id) do update set status = 'in_transit', updated_at = now()`,
        [orderId],
      );
    }

    await q.query(`update orders set status = $2, stock_committed = $3, updated_at = now() where id = $1`, [orderId, to, stockCommitted]);
    await q.query(`insert into order_events (order_id, from_status, to_status, note, user_id) values ($1,$2,$3,$4,$5)`, [
      orderId,
      o.status,
      to,
      note || null,
      userId,
    ]);
  });
}

export async function addOrderNote(orderId: string, note: string, userId: string | null) {
  await query(`insert into order_events (order_id, note, user_id) values ($1, $2, $3)`, [orderId, note, userId]);
}

export async function updateInternalNotes(orderId: string, notes: string) {
  await query(`update orders set internal_notes = $2, updated_at = now() where id = $1`, [orderId, notes || null]);
}

export async function createQuotation(
  orderId: string,
  data: { amountCents: number; deliveryCents: number; taxCents: number; validUntil: string | null; notes: string | null },
  userId: string | null,
): Promise<string> {
  return tx(async (q) => {
    const [o] = await q.query<{ reference: string; currency: string }>(`select reference, currency from orders where id = $1`, [orderId]);
    if (!o) throw new OrderRuleError("Commande introuvable.");
    const [{ n }] = await q.query<{ n: number }>(`select count(*)::int as n from quotations where order_id = $1`, [orderId]);
    const number = `PF-${o.reference.replace(/^FW-/, "")}-${n + 1}`;
    await q.query(`update quotations set status = 'cancelled', updated_at = now() where order_id = $1 and status in ('draft','sent')`, [orderId]);
    const [created] = await q.query<{ id: string }>(
      `insert into quotations (order_id, number, amount_cents, delivery_cents, tax_cents, currency, valid_until, notes, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [orderId, number, data.amountCents, data.deliveryCents, data.taxCents, o.currency, data.validUntil, data.notes, userId],
    );
    await q.query(`insert into order_events (order_id, note, user_id) values ($1, $2, $3)`, [
      orderId,
      `Facture pro forma ${number} créée (${((data.amountCents + data.deliveryCents + data.taxCents) / 100).toFixed(2)} ${o.currency}).`,
      userId,
    ]);
    return created.id;
  });
}

export async function setQuotationStatus(quotationId: string, status: Quotation["status"]) {
  await query(
    `update quotations set status = $2, sent_at = case when $2 = 'sent' then coalesce(sent_at, now()) else sent_at end, updated_at = now() where id = $1`,
    [quotationId, status],
  );
}

export async function recordPayment(
  orderId: string,
  data: {
    expectedCents: number | null;
    receivedCents: number;
    transferDate: string | null;
    bankReference: string | null;
    status: Payment["status"];
    notes: string | null;
  },
  userId: string | null,
) {
  await tx(async (q) => {
    const [o] = await q.query<{ currency: string }>(`select currency from orders where id = $1`, [orderId]);
    if (!o) throw new OrderRuleError("Commande introuvable.");
    if (data.status === "verified" && (!data.bankReference || !data.transferDate || data.receivedCents <= 0)) {
      throw new OrderRuleError("Pour marquer un paiement comme vérifié, indiquez le montant reçu, la date et la référence du virement.");
    }
    const [quote] = await q.query<{ id: string }>(
      `select id from quotations where order_id = $1 and status <> 'cancelled' order by created_at desc limit 1`,
      [orderId],
    );
    await q.query(
      `insert into payments (order_id, quotation_id, expected_cents, received_cents, currency, transfer_date, bank_reference,
         status, verified_by, verified_at, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        orderId,
        quote?.id ?? null,
        data.expectedCents,
        data.receivedCents,
        o.currency,
        data.transferDate,
        data.bankReference,
        data.status,
        data.status === "verified" ? userId : null,
        data.status === "verified" ? new Date().toISOString() : null,
        data.notes,
      ],
    );
    await q.query(`insert into order_events (order_id, note, user_id) values ($1, $2, $3)`, [
      orderId,
      `Paiement enregistré : ${(data.receivedCents / 100).toFixed(2)} ${o.currency} — statut « ${data.status} ».`,
      userId,
    ]);
  });
}

export async function setPaymentStatus(paymentId: string, status: Payment["status"], userId: string | null) {
  await tx(async (q) => {
    const [p] = await q.query<{ order_id: string; bank_reference: string | null; transfer_date: string | null; received_cents: number }>(
      `select order_id, bank_reference, transfer_date, received_cents from payments where id = $1`,
      [paymentId],
    );
    if (!p) throw new OrderRuleError("Paiement introuvable.");
    if (status === "verified" && (!p.bank_reference || !p.transfer_date || p.received_cents <= 0)) {
      throw new OrderRuleError("Complétez le montant reçu, la date et la référence du virement avant de le vérifier.");
    }
    await q.query(
      `update payments set status = $2, verified_by = case when $2 = 'verified' then $3::uuid else verified_by end,
         verified_at = case when $2 = 'verified' then now() else verified_at end, updated_at = now() where id = $1`,
      [paymentId, status, userId],
    );
    await q.query(`insert into order_events (order_id, note, user_id) values ($1, $2, $3)`, [
      p.order_id,
      `Paiement passé au statut « ${status} ».`,
      userId,
    ]);
  });
}

export async function saveDelivery(
  orderId: string,
  d: Pick<Delivery, "status" | "scheduledDate" | "carrier" | "trackingInfo" | "notes">,
  supplierId: string | null,
) {
  await query(
    `insert into deliveries (order_id, supplier_id, status, scheduled_date, carrier, tracking_info, notes, delivered_at)
     values ($1,$2,$3,$4,$5,$6,$7, case when $3 = 'delivered' then now() else null end)
     on conflict (order_id) do update set supplier_id = coalesce(excluded.supplier_id, deliveries.supplier_id),
       status = excluded.status, scheduled_date = excluded.scheduled_date, carrier = excluded.carrier,
       tracking_info = excluded.tracking_info, notes = excluded.notes,
       delivered_at = case when excluded.status = 'delivered' then coalesce(deliveries.delivered_at, now()) else deliveries.delivered_at end,
       updated_at = now()`,
    [orderId, supplierId, d.status, d.scheduledDate, d.carrier, d.trackingInfo, d.notes],
  );
}

// ---------------------------------------------------------------- pro forma

export interface ProformaData {
  order: Order;
  items: OrderItem[];
  quotation: Quotation;
}

export async function getProformaById(quotationId: string): Promise<ProformaData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(quotationId)) return null;
  const qrow = await queryOne(`select * from quotations where id = $1`, [quotationId]);
  if (!qrow) return null;
  const quotation = fixDate(camelize<Quotation>(qrow));
  const orow = await queryOne(`select * from orders where id = $1`, [quotation.orderId]);
  if (!orow) return null;
  return { order: camelize<Order>(orow), items: await orderItems(quotation.orderId), quotation };
}

/** Customer access: the pro forma number plus the order's private token. */
export async function getProformaForCustomer(number: string, token: string): Promise<ProformaData | null> {
  const qrow = await queryOne(`select id from quotations where number = $1 and status <> 'cancelled'`, [number]);
  if (!qrow) return null;
  const data = await getProformaById(String((qrow as { id: string }).id));
  if (!data || !token || !safeEqual(data.order.accessToken, token)) return null;
  return data;
}

export async function getProformaOrderMarket(orderId: string): Promise<MarketId | null> {
  const row = await queryOne<{ market_id: MarketId }>(`select market_id from orders where id = $1`, [orderId]);
  return row?.market_id ?? null;
}
