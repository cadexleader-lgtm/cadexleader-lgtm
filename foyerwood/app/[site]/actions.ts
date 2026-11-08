"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSite, routePath, type Site } from "@/lib/sites";
import { getDict } from "@/lib/i18n";
import { MARKETS } from "@/lib/markets";
import { isValidPostalCode, normalizePostalCode, formatPostalCode, regionName } from "@/lib/regions";
import { estimateHeatingNeeds, fuelsForAppliance, suggestedUnits, type CalcInput, type CalcResult } from "@/lib/calculator";
import { fuelKindForCategory, SOFTWOODS } from "@/lib/energy";
import { availabilityOf, canOrder, getProductsByIds, listProducts, productEnergyKwh, toPublicProduct, type PublicProduct } from "@/lib/data/products";
import { checkDelivery, evaluateDelivery, listZones } from "@/lib/data/zones";
import { createPreorder, findOrderForTracking } from "@/lib/data/orders";
import { calculationExists, createContactMessage, saveCalculation, subscribeNewsletter } from "@/lib/data/misc";
import { createReview, findDeliveredOrder, hasReviewForOrder } from "@/lib/data/reviews";
import { rateLimit } from "@/lib/rate-limit";
import { fmt, formatDate, loc } from "@/lib/format";
import { CUSTOMER_STEPS, STATUS_LABELS, customerStepIndex } from "@/lib/order-status";

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

function siteFromForm(fd: FormData): Site {
  const site = getSite(String(fd.get("site") ?? ""));
  if (!site) throw new Error("Unknown site");
  return site;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const isBot = (fd: FormData) => str(fd, "company").length > 0;

// ---------------------------------------------------------------- newsletter

export async function subscribeAction(_: FormState, fd: FormData): Promise<FormState> {
  const site = siteFromForm(fd);
  const t = getDict(site.lang);
  if (isBot(fd)) return { status: "success", message: t.footer.subscribed };
  const email = z.email().safeParse(str(fd, "email"));
  if (!email.success) return { status: "error", message: t.footer.newsletterError };
  if (!(await rateLimit("newsletter", 5, 10 * 60_000))) return { status: "error", message: t.preorder.errors.rate };
  await subscribeNewsletter(email.data, site.market, site.lang);
  return { status: "success", message: t.footer.subscribed };
}

// ---------------------------------------------------------------- contact

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  const site = siteFromForm(fd);
  const t = getDict(site.lang);
  if (isBot(fd)) return { status: "success", message: t.contact.success };
  const schema = z.object({
    name: z.string().min(2).max(120),
    email: z.email(),
    phone: z.string().max(40),
    subject: z.string().min(2).max(120),
    order: z.string().max(40),
    message: z.string().min(10).max(4000),
  });
  const parsed = schema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    subject: str(fd, "subject"),
    order: str(fd, "order"),
    message: str(fd, "message"),
  });
  if (!parsed.success) return { status: "error", message: t.contact.invalid };
  if (!(await rateLimit("contact", 5, 10 * 60_000))) return { status: "error", message: t.preorder.errors.rate };
  const d = parsed.data;
  await createContactMessage({
    marketId: site.market,
    language: site.lang,
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    subject: d.subject,
    message: d.message,
    orderReference: d.order || null,
  });
  return { status: "success", message: t.contact.success };
}

// ---------------------------------------------------------------- reviews

export async function reviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const site = siteFromForm(fd);
  const t = getDict(site.lang);
  if (isBot(fd)) return { status: "success", message: t.reviews.success };
  const parsed = z
    .object({
      reference: z.string().min(6).max(40),
      email: z.email(),
      name: z.string().min(2).max(60),
      city: z.string().max(80),
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().max(120),
      body: z.string().min(20).max(2000),
    })
    .safeParse({
      reference: str(fd, "reference"),
      email: str(fd, "email"),
      name: str(fd, "name"),
      city: str(fd, "city"),
      rating: str(fd, "rating"),
      title: str(fd, "title"),
      body: str(fd, "body"),
    });
  if (!parsed.success) return { status: "error", message: t.reviews.invalid };
  if (!(await rateLimit("review", 5, 30 * 60_000))) return { status: "error", message: t.preorder.errors.rate };
  const d = parsed.data;
  const order = await findDeliveredOrder(d.reference, d.email, site.market);
  if (!order) return { status: "error", message: t.reviews.notEligible };
  if (await hasReviewForOrder(order.id)) return { status: "error", message: t.reviews.already };
  await createReview({
    market: site.market,
    orderId: order.id,
    authorName: d.name,
    city: d.city || order.city,
    rating: d.rating,
    title: d.title || null,
    body: d.body,
    language: site.lang,
  });
  return { status: "success", message: t.reviews.success };
}

// ---------------------------------------------------------------- delivery check

export interface DeliveryCheckResult {
  ok: boolean;
  message: string;
  details: string[];
  blockedProductIds: string[];
  free: boolean;
}

export async function checkDeliveryAction(siteId: string, postalCode: string, productIds: string[] = [], subtotalCents = 0): Promise<DeliveryCheckResult> {
  const site = getSite(siteId);
  if (!site) throw new Error("Unknown site");
  const t = getDict(site.lang);
  const ids = productIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 50);
  const products = ids.length ? await getProductsByIds(site.market, ids) : [];
  const check = await checkDelivery(
    site.market,
    postalCode,
    products.map((p) => ({ productId: p.id, supplierId: p.supplierId })),
    subtotalCents,
  );
  const currency = MARKETS[site.market].currency;
  if (!check.ok) {
    const details: string[] = [];
    const note = check.remoteNote ? loc(check.remoteNote, site.lang) : "";
    if (note) details.push(note);
    return {
      ok: false,
      message: t.preorder.delivery.reasons[check.reason ?? "region_not_served"],
      details,
      blockedProductIds: check.blockedProductIds,
      free: false,
    };
  }
  const details: string[] = [];
  if (check.freeDeliveryMinCents > 0 && !check.freeDelivery) {
    details.push(fmt(t.preorder.delivery.freeFrom, { amount: new Intl.NumberFormat(site.locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(check.freeDeliveryMinCents / 100) }));
  } else if (check.freeDelivery || ids.length === 0) {
    details.push(check.freeDeliveryMinCents > 0 && ids.length === 0
      ? fmt(t.preorder.delivery.freeFrom, { amount: new Intl.NumberFormat(site.locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(check.freeDeliveryMinCents / 100) })
      : t.preorder.delivery.free);
  }
  if (check.leadTimeDaysMin != null && check.leadTimeDaysMax != null) {
    details.push(fmt(t.preorder.delivery.lead, { min: check.leadTimeDaysMin, max: check.leadTimeDaysMax }));
  }
  return {
    ok: true,
    message: fmt(t.preorder.delivery.ok, { region: regionName(site.market, check.region ?? "") }),
    details,
    blockedProductIds: [],
    free: check.freeDelivery,
  };
}

// ---------------------------------------------------------------- pre-order

const PHONE = /^[+()\d\s.-]{8,24}$/;

export async function submitPreorderAction(_: FormState, fd: FormData): Promise<FormState> {
  const site = siteFromForm(fd);
  const t = getDict(site.lang);
  const e = t.preorder.errors;
  if (isBot(fd)) return { status: "error", message: t.common.error };

  let lines: Array<{ id: string; qty: number }> = [];
  try {
    const raw = JSON.parse(str(fd, "lines"));
    if (Array.isArray(raw)) {
      lines = raw
        .filter((l) => typeof l?.id === "string" && /^[0-9a-f-]{36}$/i.test(l.id) && Number.isInteger(l?.qty) && l.qty > 0 && l.qty < 10000)
        .slice(0, 50);
    }
  } catch {
    /* handled below */
  }
  if (lines.length === 0) return { status: "error", message: e.empty };

  const fieldErrors: Record<string, string> = {};
  const fullName = str(fd, "fullName");
  const email = str(fd, "email");
  const phone = str(fd, "phone");
  const address = str(fd, "address");
  const postalCode = str(fd, "postalCode");
  const city = str(fd, "city");
  const instructions = str(fd, "instructions").slice(0, 1000);
  if (fullName.length < 2 || fullName.length > 120) fieldErrors.fullName = e.fullName;
  if (!z.email().safeParse(email).success) fieldErrors.email = e.email;
  if (!PHONE.test(phone) || phone.replace(/\D/g, "").length < 8) fieldErrors.phone = e.phone;
  if (address.length < 4 || address.length > 200) fieldErrors.address = e.address;
  if (!isValidPostalCode(site.market, postalCode)) fieldErrors.postalCode = e.postalCode;
  if (city.length < 2 || city.length > 80) fieldErrors.city = e.city;
  if (fd.get("consent") !== "on") fieldErrors.consent = e.consent;
  if (Object.keys(fieldErrors).length) return { status: "error", message: Object.values(fieldErrors)[0], fieldErrors };

  if (!(await rateLimit("preorder", 6, 10 * 60_000))) return { status: "error", message: e.rate };

  // Prices, minimums and availability are always re-checked on the server.
  const products = await getProductsByIds(site.market, lines.map((l) => l.id));
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = [];
  for (const l of lines) {
    const p = byId.get(l.id);
    if (!p || !p.active) return { status: "error", message: t.preorder.removed };
    const a = availabilityOf(p);
    if (!canOrder(a)) return { status: "error", message: `${loc(p.name, site.lang)} — ${t.preorder.unavailable}` };
    if (l.qty < p.minQty || (p.maxQty != null && l.qty > p.maxQty)) return { status: "error", message: e.cart };
    if (p.trackStock && l.qty > p.stockQuantity) return { status: "error", message: `${loc(p.name, site.lang)} — ${t.availability.limited}` };
    items.push({
      productId: p.id,
      supplierId: p.supplierId,
      name: loc(p.name, site.lang),
      unit: p.unit,
      quantity: l.qty,
      unitPriceCents: p.priceCents,
      unitCostCents: p.costCents,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const delivery = evaluateDelivery(
    site.market,
    postalCode,
    await listZones(site.market, true),
    items.map((i) => ({ productId: i.productId, supplierId: i.supplierId })),
    subtotal,
  );
  if (!delivery.ok) {
    return {
      status: "error",
      message: `${e.delivery} ${t.preorder.delivery.reasons[delivery.reason ?? "region_not_served"]}`,
      fieldErrors: { postalCode: t.preorder.delivery.reasons[delivery.reason ?? "region_not_served"] },
    };
  }

  const calcId = str(fd, "calculationId");
  const order = await createPreorder({
    market: site.market,
    language: site.lang,
    customer: {
      fullName,
      email,
      phone,
      addressLine: address,
      postalCode: formatPostalCode(site.market, postalCode),
      city,
      region: delivery.region,
      instructions: instructions || null,
    },
    items,
    deliveryZoneId: delivery.zones[0]?.id ?? null,
    calculationId: calcId && (await calculationExists(calcId)) ? calcId : null,
  });

  redirect(`${routePath(site, "preorder", "confirmation", order.reference)}?t=${order.accessToken}`);
}

// ---------------------------------------------------------------- tracking

export interface TrackState extends FormState {
  order?: {
    reference: string;
    statusLabel: string;
    cancelled: boolean;
    stepIndex: number;
    steps: string[];
    placedOn: string;
  };
}

export async function trackAction(_: TrackState, fd: FormData): Promise<TrackState> {
  const site = siteFromForm(fd);
  const t = getDict(site.lang);
  if (!(await rateLimit("track", 15, 10 * 60_000))) return { status: "error", message: t.preorder.errors.rate };
  const order = await findOrderForTracking(str(fd, "reference"), str(fd, "email"));
  if (!order || order.marketId !== site.market) return { status: "error", message: t.track.notFound };
  return {
    status: "success",
    order: {
      reference: order.reference,
      statusLabel: STATUS_LABELS[order.status][site.lang],
      cancelled: order.status === "cancelled",
      stepIndex: customerStepIndex(order.status),
      steps: CUSTOMER_STEPS.map((s) => s.label[site.lang]),
      placedOn: fmt(t.track.placedOn, { date: formatDate(order.createdAt, site.locale, MARKETS[site.market].timeZone) }),
    },
  };
}

// ---------------------------------------------------------------- calculator

const calcSchema = z.object({
  postalCode: z.string().min(3).max(12),
  altitude: z.enum(["low", "mid", "high", "mountain"]).optional(),
  area: z.number().positive().max(100000),
  housing: z.enum(["house", "chalet", "apartment", "other"]),
  insulation: z.enum(["excellent", "good", "average", "poor"]),
  appliance: z.enum(["open_fireplace", "wood_stove", "insert", "pellet_stove", "wood_boiler", "other"]),
  fuel: z.enum(["hardwood", "mixed", "softwood", "kiln_dried", "briquettes", "pellets"]),
  usage: z.enum(["occasional", "few_hours", "daily", "main"]),
  months: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal("season")]),
});

export interface Recommendation {
  product: PublicProduct;
  suggestedQty: number;
  coversPct: number | null;
}

export interface CalculatorResponse {
  ok: boolean;
  result?: CalcResult;
  recommendations?: Recommendation[];
  complements?: PublicProduct[];
  calculationId?: string | null;
  error?: string;
}

export async function calculateAction(siteId: string, raw: Omit<CalcInput, "market">): Promise<CalculatorResponse> {
  const site = getSite(siteId);
  if (!site) return { ok: false, error: "site" };
  const parsed = calcSchema.safeParse(raw);
  if (!parsed.success || !isValidPostalCode(site.market, parsed.data.postalCode)) return { ok: false, error: "input" };
  const fuel = fuelsForAppliance(parsed.data.appliance).includes(parsed.data.fuel) ? parsed.data.fuel : fuelsForAppliance(parsed.data.appliance)[0];
  const input: CalcInput = { ...parsed.data, fuel, market: site.market };
  const result = estimateHeatingNeeds(input);

  const all = await listProducts(site.market, site.lang);
  const orderable = all.filter((p) => canOrder(availabilityOf(p)));
  const wantedCategories =
    result.fuelKind === "pellets" ? ["pellets"] : result.fuelKind === "briquettes" ? ["briquettes"] : fuel === "kiln_dried" ? ["kiln-dried", "firewood"] : ["firewood", "kiln-dried"];
  const need = result.fuelEnergyKwh.central;

  const speciesOk = (sp: string | null) =>
    fuel === "softwood" ? !!sp && SOFTWOODS.includes(sp as never) : fuel === "hardwood" || fuel === "kiln_dried" ? !sp || !SOFTWOODS.includes(sp as never) : true;
  const ranked = orderable
    .filter((p) => wantedCategories.includes(p.categoryId) && fuelKindForCategory(p.categoryId) === result.fuelKind && speciesOk(p.species))
    .map((p) => {
      const kwh = productEnergyKwh(p);
      const qty = kwh ? suggestedUnits(need, kwh, p.minQty) : p.minQty;
      const capped = p.maxQty ? Math.min(qty, p.maxQty) : qty;
      return { p, qty: capped, kwh, covers: kwh ? (capped * kwh) / need : null };
    })
    .sort((a, b) => {
      const cat = wantedCategories.indexOf(a.p.categoryId) - wantedCategories.indexOf(b.p.categoryId);
      if (cat !== 0) return cat;
      const score = (x: typeof a) => Math.abs((x.covers ?? 2) - 1) + (x.qty > 25 ? 1 : 0);
      return score(a) - score(b);
    });
  // Prefer three different packagings (e.g. bulk, pallet, big bag) over three species of the same format.
  const picked: typeof ranked = [];
  for (const r of ranked) if (picked.length < 3 && !picked.some((x) => x.p.packaging === r.p.packaging)) picked.push(r);
  for (const r of ranked) if (picked.length < 3 && !picked.includes(r)) picked.push(r);
  const recommendations: Recommendation[] = picked.map(({ p, qty, covers }) => ({
    product: toPublicProduct(p, site.lang),
    suggestedQty: qty,
    coversPct: covers ? Math.round(covers * 100) : null,
  }));

  const complements = orderable
    .filter((p) => (result.fuelKind === "logs" ? ["kindling", "accessories"] : ["accessories"]).includes(p.categoryId))
    .filter((p) => result.fuelKind !== "pellets" || p.art !== "meter")
    .slice(0, 2)
    .map((p) => toPublicProduct(p, site.lang));

  let calculationId: string | null = null;
  try {
    calculationId = await saveCalculation(
      site.market,
      site.lang,
      normalizePostalCode(site.market, input.postalCode).slice(0, 3),
      { ...input, postalCode: undefined },
      { fuelEnergyKwh: result.fuelEnergyKwh, quantities: result.quantities, uncertainty: result.uncertainty },
    );
  } catch {
    calculationId = null;
  }

  return { ok: true, result, recommendations, complements, calculationId };
}
