"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createSessionToken, hashPassword, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { createUser, findUserByEmail, setContactStatus, setSubscriberStatus, setUserActive, touchLogin, updateUserPassword, updateUserProfile } from "@/lib/data/misc";
import { saveProduct, setProductActive, slugExists, adminGetProduct, type ProductInput } from "@/lib/data/products";
import { saveSupplier } from "@/lib/data/suppliers";
import { deleteZone, saveZone } from "@/lib/data/zones";
import {
  addOrderNote,
  changeOrderStatus,
  createQuotation,
  getOrderDetail,
  OrderRuleError,
  recordPayment,
  saveDelivery,
  setPaymentStatus,
  setQuotationStatus,
  updateInternalNotes,
} from "@/lib/data/orders";
import { createManualReview, deliveredOrderByReference, isReviewSource, moderateReview } from "@/lib/data/reviews";
import { articleSlugExists, deleteArticle, saveArticle } from "@/lib/data/blog";
import { setSetting, updateCategory, updateMarketSettings } from "@/lib/data/settings";
import { isMarketId, MARKETS, type MarketId } from "@/lib/markets";
import { isCategoryKey, type CategoryKey } from "@/lib/sites";
import { isSaleUnit, isSpeciesKey, MARKET_UNITS } from "@/lib/energy";
import { isOrderStatus } from "@/lib/order-status";
import { slugify } from "@/lib/format";
import { uploadImage, UploadError } from "@/lib/storage";
import { deleteCatalogPhoto, setCatalogPhoto } from "@/lib/data/catalog-photos";
import { CATALOG_PACKAGINGS, CATALOG_SPECIES, type CatalogPackaging, type CatalogSpecies } from "@/lib/db/seed-species-catalog";
import { PACKAGING_GUIDE, SPECIES_GUIDE } from "@/lib/photo-guide";
import { rateLimit } from "@/lib/rate-limit";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const nOrNull = (fd: FormData, k: string) => {
  const raw = s(fd, k).replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};
const centsOrNull = (fd: FormData, k: string) => {
  const n = nOrNull(fd, k);
  return n == null ? null : Math.round(n * 100);
};
const intOr = (fd: FormData, k: string, d: number) => {
  const n = nOrNull(fd, k);
  return n == null ? d : Math.round(n);
};
const on = (fd: FormData, k: string) => fd.get(k) === "on";
const lt = (fd: FormData, k: string) => {
  const fr = s(fd, `${k}_fr`);
  const en = s(fd, `${k}_en`);
  return { ...(fr ? { fr } : {}), ...(en ? { en } : {}) };
};
const back = (path: string, params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString();
  return `${path}${path.includes("?") ? "&" : "?"}${q}`;
};
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

// ---------------------------------------------------------------- session

export async function loginAction(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  if (!(await rateLimit("admin-login", 8, 15 * 60_000))) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  const email = s(fd, "email");
  const password = String(fd.get("password") ?? "");
  const user = email ? await findUserByEmail(email) : null;
  // Always run a hash comparison to keep timing similar.
  const ok = user ? verifyPassword(password, user.passwordHash) : verifyPassword(password, hashPassword("dummy-password"));
  if (!user || !ok || !user.active) return { error: "Identifiants incorrects." };
  const { token, maxAge } = createSessionToken(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  await touchLogin(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products

export async function saveProductAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const market = s(fd, "marketId");
  const category = s(fd, "categoryId");
  const path = id ? `/admin/products/${id}` : "/admin/products/new";
  if (!isMarketId(market) || !isCategoryKey(category)) redirect(back(path, { error: "Marché ou catégorie invalide." }));
  const m = market as MarketId;
  const name = lt(fd, "name");
  for (const l of MARKETS[m].languages) {
    if (!name[l]) redirect(back(path, { error: `Le nom (${l.toUpperCase()}) est obligatoire pour ce marché.` }));
  }
  const unit = s(fd, "unit");
  if (!isSaleUnit(unit) || !MARKET_UNITS[m].includes(unit)) redirect(back(path, { error: "Cette unité de vente n'est pas proposée sur ce marché." }));
  const price = centsOrNull(fd, "price");
  if (price == null || price < 0) redirect(back(path, { error: "Prix invalide." }));
  const slug = slugify(s(fd, "slug") || name.fr || name.en || "");
  if (!slug) redirect(back(path, { error: "Identifiant d'URL (slug) invalide." }));
  if (await slugExists(m, slug, id || undefined)) redirect(back(path, { error: "Ce slug est déjà utilisé sur ce marché." }));
  const species = s(fd, "species");
  const supplierId = s(fd, "supplierId");

  // Photos: keep the ones not removed, add uploads and URLs.
  const existing = id ? (await adminGetProduct(id))?.ownImages ?? [] : [];
  const removed = new Set(fd.getAll("removeImage").map(String));
  const images = existing.filter((u) => !removed.has(u));
  const imageUrl = s(fd, "imageUrl");
  if (imageUrl) {
    if (!/^(https:\/\/|\/uploads\/)/.test(imageUrl)) redirect(back(path, { error: "L'URL de l'image doit commencer par https://" }));
    images.push(imageUrl);
  }
  try {
    for (const f of fd.getAll("images")) {
      if (f instanceof File && f.size > 0) images.push(await uploadImage(f, "products"));
    }
  } catch (e) {
    redirect(back(path, { error: e instanceof UploadError ? e.message : "Échec de l'envoi de l'image." }));
  }
  const cover = s(fd, "coverImage");
  if (cover && images.includes(cover)) images.splice(images.indexOf(cover), 1), images.unshift(cover);

  const input: ProductInput = {
    id: id || undefined,
    marketId: m,
    categoryId: category as CategoryKey,
    supplierId: isUuid(supplierId) ? supplierId : null,
    slug,
    sku: s(fd, "sku") || null,
    name,
    shortDescription: lt(fd, "short"),
    description: lt(fd, "description"),
    deliveryInfo: lt(fd, "delivery"),
    images: images.slice(0, 12),
    art: s(fd, "art") || null,
    species: isSpeciesKey(species) ? species : null,
    moisturePct: nOrNull(fd, "moisturePct"),
    lengthCm: nOrNull(fd, "lengthCm"),
    packaging: (["pallet", "big_bag", "net_bag", "bag", "bulk", "box", "bundle", "crate", "none"].includes(s(fd, "packaging")) ? s(fd, "packaging") : "none") as ProductInput["packaging"],
    unit,
    unitVolumeM3: nOrNull(fd, "unitVolumeM3"),
    unitWeightKg: nOrNull(fd, "unitWeightKg"),
    packing: s(fd, "packing") === "loose" ? "loose" : "stacked",
    energyKwhOverride: nOrNull(fd, "energyKwhOverride"),
    minQty: Math.max(1, intOr(fd, "minQty", 1)),
    maxQty: nOrNull(fd, "maxQty") ? Math.max(1, intOr(fd, "maxQty", 1)) : null,
    priceCents: price!,
    compareAtCents: centsOrNull(fd, "compareAt"),
    costCents: centsOrNull(fd, "cost"),
    isAvailable: on(fd, "isAvailable"),
    active: on(fd, "active"),
    featured: on(fd, "featured"),
    trackStock: on(fd, "trackStock"),
    stockQuantity: intOr(fd, "stockQuantity", 0),
    lowStockThreshold: Math.max(0, intOr(fd, "lowStockThreshold", 0)),
  };
  const savedId = await saveProduct(input);
  redirect(`/admin/products/${savedId}?ok=${encodeURIComponent("Produit enregistré.")}`);
}

export async function toggleProductAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id)) await setProductActive(id, s(fd, "active") === "1");
  redirect(s(fd, "redirect") || "/admin/products");
}

// ---------------------------------------------------------------- catalogue photos

const isCatalogSpecies = (v: string): v is CatalogSpecies => (CATALOG_SPECIES as readonly string[]).includes(v);
const isCatalogPackaging = (v: string): v is CatalogPackaging => (CATALOG_PACKAGINGS as readonly string[]).includes(v);

export async function uploadCatalogPhotoAction(fd: FormData) {
  await requireAdmin();
  const species = s(fd, "species");
  const packaging = s(fd, "packaging");
  if (!isCatalogSpecies(species) || !isCatalogPackaging(packaging)) redirect(back("/admin/photos", { error: "Combinaison inconnue." }));
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect(back("/admin/photos", { error: "Choisissez une photo." }));
  let url: string;
  try {
    url = await uploadImage(file, "catalog");
  } catch (e) {
    redirect(back("/admin/photos", { error: e instanceof UploadError ? e.message : "Échec de l'envoi de la photo." }));
  }
  await setCatalogPhoto(species, packaging, url);
  const label = `${SPECIES_GUIDE[species].fr} · ${PACKAGING_GUIDE[packaging].fr}`;
  redirect(`${back("/admin/photos", { ok: `Photo enregistrée : ${label}. Elle s'affiche dans les 3 pays.` })}#${species}-${packaging}`);
}

export async function removeCatalogPhotoAction(fd: FormData) {
  await requireAdmin();
  const species = s(fd, "species");
  const packaging = s(fd, "packaging");
  if (isCatalogSpecies(species) && isCatalogPackaging(packaging)) await deleteCatalogPhoto(species, packaging);
  redirect(`${back("/admin/photos", { ok: "Photo retirée." })}#${species}-${packaging}`);
}

// ---------------------------------------------------------------- suppliers

export async function saveSupplierAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const market = s(fd, "marketId");
  const path = id ? `/admin/suppliers/${id}` : "/admin/suppliers/new";
  if (!isMarketId(market)) redirect(back(path, { error: "Marché invalide." }));
  if (s(fd, "name").length < 2) redirect(back(path, { error: "Le nom est obligatoire." }));
  const savedId = await saveSupplier({
    id: id || undefined,
    marketId: market as MarketId,
    name: s(fd, "name"),
    contactName: s(fd, "contactName") || null,
    email: s(fd, "email") || null,
    phone: s(fd, "phone") || null,
    whatsapp: s(fd, "whatsapp") || null,
    address: s(fd, "address") || null,
    city: s(fd, "city") || null,
    region: s(fd, "region") || null,
    postalCode: s(fd, "postalCode") || null,
    leadTimeDaysMin: nOrNull(fd, "leadMin"),
    leadTimeDaysMax: nOrNull(fd, "leadMax"),
    notes: s(fd, "notes") || null,
    active: on(fd, "active"),
  });
  redirect(`/admin/suppliers/${savedId}?ok=${encodeURIComponent("Fournisseur enregistré.")}`);
}

// ---------------------------------------------------------------- zones

export async function saveZoneAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const market = s(fd, "marketId");
  const path = id ? `/admin/zones/${id}` : "/admin/zones/new";
  if (!isMarketId(market)) redirect(back(path, { error: "Marché invalide." }));
  const list = (k: string) => s(fd, k).split(/[\s,;]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
  const supplierId = s(fd, "supplierId");
  const savedId = await saveZone({
    id: id || undefined,
    marketId: market as MarketId,
    supplierId: isUuid(supplierId) ? supplierId : null,
    name: s(fd, "name") || "Zone",
    regionCodes: fd.getAll("regionCodes").map(String),
    excludedPostalPrefixes: list("excludedPostalPrefixes"),
    excludedProductIds: fd.getAll("excludedProductIds").map(String).filter(isUuid),
    freeDelivery: on(fd, "freeDelivery"),
    freeDeliveryMinCents: centsOrNull(fd, "freeDeliveryMin") ?? 0,
    leadTimeDaysMin: nOrNull(fd, "leadMin"),
    leadTimeDaysMax: nOrNull(fd, "leadMax"),
    remoteAreaNote: lt(fd, "remote"),
    active: on(fd, "active"),
  });
  redirect(`/admin/zones/${savedId}?ok=${encodeURIComponent("Zone enregistrée.")}`);
}

export async function deleteZoneAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id)) await deleteZone(id);
  redirect(`/admin/zones?ok=${encodeURIComponent("Zone supprimée.")}`);
}

// ---------------------------------------------------------------- orders

async function orderAction(fd: FormData, fn: (orderId: string, userId: string) => Promise<void>, okMsg: string) {
  const user = await requireAdmin();
  const orderId = s(fd, "orderId");
  if (!isUuid(orderId)) redirect("/admin/orders");
  const path = `/admin/orders/${orderId}`;
  try {
    await fn(orderId, user.id);
  } catch (e) {
    if (e instanceof OrderRuleError) redirect(back(path, { error: e.message }));
    throw e;
  }
  redirect(back(path, { ok: okMsg }));
}

export async function changeStatusAction(fd: FormData) {
  const to = s(fd, "status");
  await orderAction(
    fd,
    async (id, uid) => {
      if (!isOrderStatus(to)) throw new OrderRuleError("Statut invalide.");
      await changeOrderStatus(id, to, uid, s(fd, "note") || undefined);
    },
    "Statut mis à jour.",
  );
}

export async function addNoteAction(fd: FormData) {
  await orderAction(
    fd,
    async (id, uid) => {
      const note = s(fd, "note");
      if (!note) throw new OrderRuleError("La note est vide.");
      await addOrderNote(id, note, uid);
    },
    "Note ajoutée.",
  );
}

export async function saveInternalNotesAction(fd: FormData) {
  await orderAction(fd, async (id) => updateInternalNotes(id, s(fd, "internalNotes")), "Notes internes enregistrées.");
}

export async function createQuotationAction(fd: FormData) {
  await orderAction(
    fd,
    async (id, uid) => {
      const amount = centsOrNull(fd, "amount");
      if (amount == null || amount <= 0) throw new OrderRuleError("Montant du devis invalide.");
      await createQuotation(
        id,
        {
          amountCents: amount,
          deliveryCents: centsOrNull(fd, "delivery") ?? 0,
          taxCents: centsOrNull(fd, "tax") ?? 0,
          validUntil: /^\d{4}-\d{2}-\d{2}$/.test(s(fd, "validUntil")) ? s(fd, "validUntil") : null,
          notes: s(fd, "notes") || null,
        },
        uid,
      );
    },
    "Facture pro forma créée.",
  );
}

export async function quotationStatusAction(fd: FormData) {
  await orderAction(
    fd,
    async () => {
      const qid = s(fd, "quotationId");
      const st = s(fd, "status") as "draft" | "sent" | "accepted" | "expired" | "cancelled";
      if (!isUuid(qid) || !["draft", "sent", "accepted", "expired", "cancelled"].includes(st)) throw new OrderRuleError("Action invalide.");
      await setQuotationStatus(qid, st);
    },
    "Devis mis à jour.",
  );
}

export async function recordPaymentAction(fd: FormData) {
  await orderAction(
    fd,
    async (id, uid) => {
      const received = centsOrNull(fd, "received");
      const status = s(fd, "status") as "awaiting" | "verified" | "rejected" | "refunded";
      if (!["awaiting", "verified", "rejected", "refunded"].includes(status)) throw new OrderRuleError("Statut de paiement invalide.");
      if (received == null || received < 0) throw new OrderRuleError("Montant reçu invalide.");
      await recordPayment(
        id,
        {
          expectedCents: centsOrNull(fd, "expected"),
          receivedCents: received,
          transferDate: /^\d{4}-\d{2}-\d{2}$/.test(s(fd, "transferDate")) ? s(fd, "transferDate") : null,
          bankReference: s(fd, "bankReference") || null,
          status,
          notes: s(fd, "notes") || null,
        },
        uid,
      );
    },
    "Paiement enregistré.",
  );
}

export async function paymentStatusAction(fd: FormData) {
  await orderAction(
    fd,
    async (_, uid) => {
      const pid = s(fd, "paymentId");
      const st = s(fd, "status") as "awaiting" | "verified" | "rejected" | "refunded";
      if (!isUuid(pid) || !["awaiting", "verified", "rejected", "refunded"].includes(st)) throw new OrderRuleError("Action invalide.");
      await setPaymentStatus(pid, st, uid);
    },
    "Paiement mis à jour.",
  );
}

export async function saveDeliveryAction(fd: FormData) {
  await orderAction(
    fd,
    async (id) => {
      const st = s(fd, "status") as "pending" | "scheduled" | "in_transit" | "delivered" | "failed";
      if (!["pending", "scheduled", "in_transit", "delivered", "failed"].includes(st)) throw new OrderRuleError("Statut de livraison invalide.");
      const detail = await getOrderDetail(id);
      await saveDelivery(
        id,
        {
          status: st,
          scheduledDate: /^\d{4}-\d{2}-\d{2}$/.test(s(fd, "scheduledDate")) ? s(fd, "scheduledDate") : null,
          carrier: s(fd, "carrier") || null,
          trackingInfo: s(fd, "trackingInfo") || null,
          notes: s(fd, "notes") || null,
        },
        detail?.items[0]?.supplierId ?? null,
      );
    },
    "Livraison enregistrée.",
  );
}

// ---------------------------------------------------------------- reviews, messages, newsletter

export async function moderateReviewAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const st = s(fd, "status") as "pending" | "approved" | "rejected";
  if (isUuid(id) && ["pending", "approved", "rejected"].includes(st)) await moderateReview(id, st);
  redirect(`/admin/reviews?ok=${encodeURIComponent("Avis mis à jour.")}`);
}

/** Adds a review received from a real customer outside the site (WhatsApp, e-mail, Google…). */
export async function addReviewAction(fd: FormData) {
  await requireAdmin();
  const fail = (m: string) => redirect(`/admin/reviews?error=${encodeURIComponent(m)}#add`);
  const market = s(fd, "marketId");
  const source = s(fd, "source");
  const rating = Number(s(fd, "rating"));
  const authorName = s(fd, "authorName");
  const body = s(fd, "body");
  const language = s(fd, "language") === "en" ? "en" : "fr";
  if (!isMarketId(market)) fail("Choisissez le pays du client.");
  if (!isReviewSource(source)) fail("Choisissez la provenance de l'avis.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail("La note doit être comprise entre 1 et 5.");
  if (authorName.length < 2) fail("Indiquez le nom (ou prénom) du client.");
  if (body.length < 10) fail("L'avis doit contenir au moins 10 caractères.");
  if (fd.get("authentic") !== "on") fail("Confirmez que cet avis a bien été écrit par un vrai client.");
  const ref = s(fd, "orderReference");
  let orderId: string | null = null;
  if (ref) {
    const order = await deliveredOrderByReference(ref, market as MarketId);
    if (!order) fail("Aucune commande livrée ne correspond à cette référence dans ce pays (laissez le champ vide si l'avis n'est pas lié à une commande du site).");
    orderId = order!.id;
  }
  const date = s(fd, "date");
  const createdAt = date && !Number.isNaN(Date.parse(date)) ? new Date(date) : null;
  await createManualReview({
    market: market as MarketId,
    orderId,
    authorName: authorName.slice(0, 80),
    city: s(fd, "city").slice(0, 80) || null,
    rating,
    title: s(fd, "title").slice(0, 120) || null,
    body: body.slice(0, 2000),
    language,
    source: source as "whatsapp",
    createdAt,
  });
  redirect(`/admin/reviews?ok=${encodeURIComponent("Avis publié. Il apparaît maintenant sur le site.")}`);
}

export async function contactStatusAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id)) await setContactStatus(id, s(fd, "status") === "handled" ? "handled" : "new");
  redirect("/admin/messages");
}

export async function subscriberStatusAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id)) await setSubscriberStatus(id, s(fd, "status") === "unsubscribed" ? "unsubscribed" : "subscribed");
  redirect("/admin/newsletter");
}

// ---------------------------------------------------------------- blog

export async function saveArticleAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const path = id ? `/admin/blog/${id}` : "/admin/blog/new";
  const language = s(fd, "language") === "en" ? "en" : "fr";
  const title = s(fd, "title");
  if (title.length < 3) redirect(back(path, { error: "Le titre est obligatoire." }));
  const slug = slugify(s(fd, "slug") || title);
  if (await articleSlugExists(language, slug, id || undefined)) redirect(back(path, { error: "Ce slug existe déjà pour cette langue." }));
  const markets = fd.getAll("markets").map(String).filter(isMarketId);
  if (markets.length === 0) redirect(back(path, { error: "Choisissez au moins un marché." }));
  let coverImage = s(fd, "coverImage") || null;
  try {
    const file = fd.get("coverFile");
    if (file instanceof File && file.size > 0) coverImage = await uploadImage(file, "blog");
  } catch (e) {
    redirect(back(path, { error: e instanceof UploadError ? e.message : "Échec de l'envoi de l'image." }));
  }
  const content = s(fd, "content");
  const status = s(fd, "status") === "published" ? "published" : "draft";
  const publishedAt = s(fd, "publishedAt");
  const savedId = await saveArticle({
    id: id || undefined,
    language,
    markets: markets as MarketId[],
    slug,
    title,
    excerpt: s(fd, "excerpt"),
    content,
    coverArt: s(fd, "coverArt") || "logs",
    coverImage,
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).length / 200)),
    status,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    author: s(fd, "author") || "Foyerwood",
    seoTitle: s(fd, "seoTitle") || null,
    seoDescription: s(fd, "seoDescription") || null,
  });
  redirect(`/admin/blog/${savedId}?ok=${encodeURIComponent("Article enregistré.")}`);
}

export async function deleteArticleAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id)) await deleteArticle(id);
  redirect(`/admin/blog?ok=${encodeURIComponent("Article supprimé.")}`);
}

// ---------------------------------------------------------------- settings

export async function saveMarketSettingsAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (!isMarketId(id)) redirect("/admin/settings");
  const wa = s(fd, "whatsappNumber").replace(/[^\d+]/g, "");
  if (wa && wa.replace(/\D/g, "").length < 8) redirect(`/admin/settings?error=${encodeURIComponent("Numéro WhatsApp invalide (format international, ex. +15145550100).")}`);
  const email = s(fd, "contactEmail");
  if (email && !z.email().safeParse(email).success) redirect(`/admin/settings?error=${encodeURIComponent("E-mail de contact invalide.")}`);
  await updateMarketSettings(id as MarketId, {
    whatsappNumber: wa || null,
    contactEmail: email || null,
    contactPhone: s(fd, "contactPhone") || null,
    businessHours: lt(fd, "hours"),
    pricesIncludeTax: on(fd, "pricesIncludeTax"),
    taxNote: lt(fd, "tax"),
    freeDeliveryNote: lt(fd, "freeNote"),
    active: true,
  });
  redirect(`/admin/settings?ok=${encodeURIComponent(`Réglages ${MARKETS[id as MarketId].names.fr} enregistrés.`)}#market-${id}`);
}

export async function saveCompanyAction(fd: FormData) {
  await requireAdmin();
  await setSetting("company", {
    tradeName: s(fd, "tradeName") || "Foyerwood",
    legalName: s(fd, "legalName"),
    address: s(fd, "address"),
    registration: s(fd, "registration"),
    vatNumber: s(fd, "vatNumber"),
    publisher: s(fd, "publisher"),
    host: s(fd, "host"),
    mediator: s(fd, "mediator"),
    email: s(fd, "email"),
  });
  await setSetting("social", {
    instagram: s(fd, "instagram"),
    facebook: s(fd, "facebook"),
    linkedin: s(fd, "linkedin"),
    youtube: s(fd, "youtube"),
    tiktok: s(fd, "tiktok"),
  });
  redirect(`/admin/settings?ok=${encodeURIComponent("Informations de l'entreprise enregistrées.")}#company`);
}

export async function saveCategoryAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (!isCategoryKey(id)) redirect("/admin/settings");
  let imageUrl = s(fd, "imageUrl") || null;
  try {
    const file = fd.get("imageFile");
    if (file instanceof File && file.size > 0) imageUrl = await uploadImage(file, "categories");
  } catch (e) {
    redirect(`/admin/settings?error=${encodeURIComponent(e instanceof UploadError ? e.message : "Échec de l'envoi.")}`);
  }
  await updateCategory(id as CategoryKey, { name: lt(fd, "name"), description: lt(fd, "description"), imageUrl, active: on(fd, "active") });
  redirect(`/admin/settings?ok=${encodeURIComponent("Catégorie enregistrée.")}#categories`);
}

export async function createUserAction(fd: FormData) {
  await requireAdmin();
  const email = s(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!z.email().safeParse(email).success) redirect(`/admin/settings?error=${encodeURIComponent("E-mail invalide.")}#users`);
  if (password.length < 12) redirect(`/admin/settings?error=${encodeURIComponent("Mot de passe trop court (12 caractères minimum).")}#users`);
  if (await findUserByEmail(email)) redirect(`/admin/settings?error=${encodeURIComponent("Cet utilisateur existe déjà.")}#users`);
  await createUser(email, s(fd, "name") || email, hashPassword(password), s(fd, "role") === "staff" ? "staff" : "admin");
  redirect(`/admin/settings?ok=${encodeURIComponent("Utilisateur créé.")}#users`);
}

export async function changePasswordAction(fd: FormData) {
  const user = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!verifyPassword(current, user.passwordHash)) redirect(`/admin/settings?error=${encodeURIComponent("Mot de passe actuel incorrect.")}#users`);
  if (next.length < 12) redirect(`/admin/settings?error=${encodeURIComponent("Nouveau mot de passe trop court (12 caractères minimum).")}#users`);
  await updateUserPassword(user.id, hashPassword(next));
  redirect(`/admin/settings?ok=${encodeURIComponent("Mot de passe modifié.")}#users`);
}

export async function changeProfileAction(fd: FormData) {
  const user = await requireAdmin();
  const done = (k: "ok" | "error", m: string) => redirect(`/admin/settings?${k}=${encodeURIComponent(m)}#users`);
  const current = String(fd.get("current") ?? "");
  const email = s(fd, "email").toLowerCase();
  const name = s(fd, "name") || user.name;
  if (!verifyPassword(current, user.passwordHash)) done("error", "Mot de passe actuel incorrect.");
  if (!z.email().safeParse(email).success) done("error", "Adresse e-mail invalide.");
  const other = await findUserByEmail(email);
  if (other && other.id !== user.id) done("error", "Cette adresse e-mail est déjà utilisée par un autre compte.");
  await updateUserProfile(user.id, email, name);
  done("ok", "E-mail et nom mis à jour. Utilisez la nouvelle adresse à votre prochaine connexion.");
}

export async function toggleUserAction(fd: FormData) {
  const user = await requireAdmin();
  const id = s(fd, "id");
  if (isUuid(id) && id !== user.id) await setUserActive(id, s(fd, "active") === "1");
  redirect("/admin/settings#users");
}
