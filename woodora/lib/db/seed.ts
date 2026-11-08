import type { Db, Queryable } from "./client";
import { json } from "./client";
import { MARKETS, MARKET_IDS } from "../markets";
import { hashPassword } from "../auth";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SUPPLIERS, SEED_ZONES } from "./seed-catalog";
import { SEED_ARTICLES } from "./seed-articles";

const TAX_NOTES = {
  ca: {
    fr: "Prix avant taxes. La TPS/TVH et, au Québec, la TVQ s'appliquent selon votre province ; elles sont détaillées sur la facture pro forma.",
    en: "Prices before tax. GST/HST and, in Québec, QST apply according to your province and are detailed on the pro forma invoice.",
  },
  us: {
    fr: "Prix hors taxe de vente ; celle-ci dépend de votre État et figure sur la facture pro forma.",
    en: "Prices exclude sales tax, which depends on your state and is shown on the pro forma invoice.",
  },
  fr: {
    fr: "Prix TTC : TVA à 10 % sur les combustibles bois, 20 % sur les accessoires.",
    en: "Prices include VAT: 10% on wood fuels, 20% on accessories.",
  },
} as const;

const HOURS = {
  ca: { fr: "Lundi au samedi, 8 h – 19 h (heure de l'Est)", en: "Monday to Saturday, 8 a.m. – 7 p.m. (Eastern Time)" },
  us: { fr: "Lundi au samedi, 8 h – 19 h (heure de l'Est)", en: "Monday to Saturday, 8 a.m. – 7 p.m. (Eastern Time)" },
  fr: { fr: "Du lundi au samedi, 9 h – 19 h", en: "Monday to Saturday, 9 a.m. – 7 p.m. (Paris time)" },
} as const;

function deliveryInfo(packaging: string, market: string) {
  const fr: Record<string, string> = {
    bulk: "Livré en vrac par camion-benne et déchargé au plus près de votre accès. Le rangement n'est pas inclus.",
    pallet: "Livré sur palette par camion équipé d'un hayon ou d'un transpalette, déposé à un emplacement accessible.",
    bag: "Livré avec votre commande de combustible, déposé à un emplacement accessible.",
    box: "Livré avec votre commande de combustible ou par transporteur.",
    none: "Livré avec votre commande de combustible ou par transporteur.",
  };
  const en: Record<string, string> = {
    bulk: market === "us" ? "Delivered loose by dump truck, unloaded as close as possible to your access. Stacking not included." : "Delivered loose by dump truck, unloaded as close as possible to your access. Stacking not included.",
    pallet: "Delivered on a pallet by a truck with a liftgate or pallet jack, dropped at an accessible spot.",
    bag: "Delivered with your fuel order, dropped at an accessible spot.",
    box: "Delivered with your fuel order or by parcel carrier.",
    none: "Delivered with your fuel order or by parcel carrier.",
  };
  return { fr: fr[packaging] ?? fr.none, en: en[packaging] ?? en.none };
}

export async function seedIfEmpty(db: Db, log: (m: string) => void = () => {}): Promise<boolean> {
  const rows = await db.query<{ n: number }>("select count(*)::int as n from markets");
  if (rows[0]?.n > 0) {
    await ensureAdmin(db, log);
    return false;
  }
  await db.tx(async (q) => {
    await seedMarkets(q);
    await seedCategories(q);
    const suppliers = await seedSuppliers(q);
    await seedProducts(q, suppliers);
    await seedZones(q, suppliers);
    await seedArticles(q);
    await seedSettings(q);
  });
  await ensureAdmin(db, log);
  log("Seed data inserted.");
  return true;
}

async function seedMarkets(q: Queryable) {
  for (const id of MARKET_IDS) {
    const m = MARKETS[id];
    const envKey = id.toUpperCase();
    await q.query(
      `insert into markets (id, name, currency, default_language, languages, timezone, whatsapp_number, contact_email,
         contact_phone, business_hours, prices_include_tax, tax_note, free_delivery_note)
       values ($1,$2,$3,$4,$5::text::jsonb,$6,$7,$8,$9,$10::text::jsonb,$11,$12::text::jsonb,$13::text::jsonb)
       on conflict (id) do nothing`,
      [
        id,
        m.names.en,
        m.currency,
        m.defaultLang,
        json(m.languages),
        m.timeZone,
        process.env[`WHATSAPP_${envKey}`] || null,
        process.env[`CONTACT_EMAIL_${envKey}`] || process.env.CONTACT_EMAIL || null,
        process.env[`CONTACT_PHONE_${envKey}`] || null,
        json(HOURS[id]),
        id === "fr",
        json(TAX_NOTES[id]),
        json({}),
      ],
    );
  }
}

async function seedCategories(q: Queryable) {
  let pos = 0;
  for (const c of SEED_CATEGORIES) {
    await q.query(
      `insert into product_categories (id, position, name, description, image_url) values ($1,$2,$3::text::jsonb,$4::text::jsonb,$5)
       on conflict (id) do nothing`,
      [c.id, pos++, json(c.name), json(c.description), CATEGORY_PHOTOS[c.id] ?? null],
    );
  }
}

async function seedSuppliers(q: Queryable): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const s of SEED_SUPPLIERS) {
    const [row] = await q.query<{ id: string }>(
      `insert into suppliers (market_id, name, city, region, lead_time_days_min, lead_time_days_max, notes)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [
        s.market,
        s.name,
        s.city,
        s.region,
        s.leadMin,
        s.leadMax,
        "Fiche à compléter : raison sociale, contact, conditions d'achat et contrat de partenariat.",
      ],
    );
    ids[s.market] = row.id;
  }
  return ids;
}

// Category banners (editorial photos supplied for the launch). Product photos
// are resolved by species × packaging from public/images/products/.
export const CATEGORY_PHOTOS: Record<string, string> = {
  firewood: "/images/photos/firewood-crates-yard.webp",
  "kiln-dried": "/images/photos/kiln-dried-crate-covered.webp",
  briquettes: "/images/photos/compressed-logs-cages.webp",
};

const EXTRA_PRODUCT_PHOTOS: Record<string, string[]> = {
  "fr:buches-bois-compresse-palette": ["/images/photos/compressed-logs-cages.webp"],
};

async function seedProducts(q: Queryable, suppliers: Record<string, string>) {
  let pos = 0;
  for (const p of SEED_PRODUCTS) {
    const [row] = await q.query<{ id: string }>(
      `insert into products (market_id, category_id, supplier_id, slug, sku, name, short_description, description,
         delivery_info, art, species, moisture_pct, length_cm, packaging, unit, unit_volume_m3, unit_weight_kg, packing,
         min_qty, price_cents, cost_cents, featured, position, images, active, is_available)
       values ($1,$2,$3,$4,$5,$6::text::jsonb,$7::text::jsonb,$8::text::jsonb,$9::text::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24::text::jsonb,$25,$26)
       returning id`,
      [
        p.market,
        p.category,
        suppliers[p.market],
        p.slug,
        `WD-${p.market.toUpperCase()}-${String(++pos).padStart(3, "0")}`,
        json(p.name),
        json(p.short),
        json(p.desc),
        json(deliveryInfo(p.packaging, p.market)),
        p.art,
        p.species ?? null,
        p.moisture ?? null,
        p.lengthCm ?? null,
        p.packaging,
        p.unit,
        p.volumeM3 ?? null,
        p.weightKg ?? null,
        p.packing ?? "stacked",
        p.min,
        p.price,
        p.cost,
        p.featured ?? false,
        pos,
        json(EXTRA_PRODUCT_PHOTOS[`${p.market}:${p.slug}`] ?? []),
        p.active ?? true,
        p.available ?? true,
      ],
    );
    await q.query(
      `insert into inventory (product_id, track_stock, quantity, low_stock_threshold) values ($1, $2, $3, $4)`,
      [row.id, p.stock !== undefined, p.stock ?? 0, 0],
    );
  }
}

async function seedZones(q: Queryable, suppliers: Record<string, string>) {
  for (const z of SEED_ZONES) {
    await q.query(
      `insert into delivery_zones (market_id, supplier_id, name, region_codes, excluded_postal_prefixes, free_delivery,
         free_delivery_min_cents, lead_time_days_min, lead_time_days_max, remote_area_note)
       values ($1,$2,$3,$4::text::jsonb,$5::text::jsonb,true,$6,$7,$8,$9::text::jsonb)`,
      [z.market, suppliers[z.market], z.name, json(z.regions), json(z.excluded), z.freeMin, z.leadMin, z.leadMax, json(z.remote)],
    );
  }
}

async function seedArticles(q: Queryable) {
  const now = Date.now();
  let i = 0;
  for (const a of SEED_ARTICLES) {
    await q.query(
      `insert into blog_articles (language, markets, slug, title, excerpt, content, cover_art, reading_minutes, status,
         published_at, author)
       values ($1,$2::text::jsonb,$3,$4,$5,$6,$7,$8,'published',$9,'Woodora')
       on conflict (language, slug) do nothing`,
      [a.language, json(a.markets), a.slug, a.title, a.excerpt, a.content, a.art, a.minutes, new Date(now - (i++ % 6) * 86400000 * 9).toISOString()],
    );
  }
}

async function seedSettings(q: Queryable) {
  const settings: Record<string, unknown> = {
    company: {
      tradeName: "Woodora",
      legalName: process.env.COMPANY_LEGAL_NAME ?? "",
      address: process.env.COMPANY_ADDRESS ?? "",
      registration: "",
      vatNumber: "",
      publisher: "",
      host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA",
      mediator: "",
      email: process.env.CONTACT_EMAIL ?? "",
    },
    social: { instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "" },
  };
  for (const [key, value] of Object.entries(settings)) {
    await q.query(
      `insert into site_settings (key, value) values ($1, $2::text::jsonb) on conflict (key) do nothing`,
      [key, json(value)],
    );
  }
}

/**
 * Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Without them, a local demo account is created only for the embedded database
 * outside production.
 */
export async function ensureAdmin(db: Queryable & { kind?: string }, log: (m: string) => void = () => {}) {
  const [{ n }] = await db.query<{ n: number }>("select count(*)::int as n from users");
  if (n > 0) return;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    if (db.kind !== "pglite" || process.env.NODE_ENV === "production") {
      log("No administrator: set ADMIN_EMAIL and ADMIN_PASSWORD, or run `npm run admin:create`.");
      return;
    }
    email = "admin@woodora.local";
    password = "woodora-demo";
    console.info(`[woodora] Demo administrator created: ${email} / ${password} (local database only)`);
  }
  if (password.length < 10 && db.kind !== "pglite") {
    log("ADMIN_PASSWORD must contain at least 10 characters.");
    return;
  }
  await db.query(`insert into users (email, name, password_hash, role) values ($1, $2, $3, 'admin')`, [
    email.toLowerCase(),
    "Administrateur",
    hashPassword(password),
  ]);
  log(`Administrator ${email} created.`);
}
