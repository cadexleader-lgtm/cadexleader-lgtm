import { json, query, queryOne } from "../db/client";
import type { Currency, Lang, MarketId } from "../markets";
import type { LText } from "../format";
import type { CategoryKey } from "../sites";
import { camelize, camelizeAll } from "./util";

export interface MarketSettings {
  id: MarketId;
  name: string;
  currency: Currency;
  defaultLanguage: Lang;
  languages: Lang[];
  timezone: string;
  active: boolean;
  whatsappNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  businessHours: LText;
  pricesIncludeTax: boolean;
  taxNote: LText;
  freeDeliveryNote: LText;
}

export async function getMarketSettings(id: MarketId): Promise<MarketSettings> {
  const row = await queryOne(`select * from markets where id = $1`, [id]);
  if (!row) throw new Error(`Market ${id} is missing from the database`);
  return camelize<MarketSettings>(row);
}

export async function listMarketSettings(): Promise<MarketSettings[]> {
  return camelizeAll<MarketSettings>(await query(`select * from markets order by id`));
}

export async function updateMarketSettings(
  id: MarketId,
  s: Pick<MarketSettings, "whatsappNumber" | "contactEmail" | "contactPhone" | "businessHours" | "pricesIncludeTax" | "taxNote" | "freeDeliveryNote" | "active">,
) {
  await query(
    `update markets set whatsapp_number=$2, contact_email=$3, contact_phone=$4, business_hours=$5::jsonb,
       prices_include_tax=$6, tax_note=$7::jsonb, free_delivery_note=$8::jsonb, active=$9, updated_at=now()
     where id=$1`,
    [id, s.whatsappNumber, s.contactEmail, s.contactPhone, json(s.businessHours), s.pricesIncludeTax, json(s.taxNote), json(s.freeDeliveryNote), s.active],
  );
}

// ----------------------------------------------------------- key/value settings

export interface CompanySettings {
  tradeName: string;
  legalName: string;
  address: string;
  registration: string;
  vatNumber: string;
  publisher: string;
  host: string;
  mediator: string;
  email: string;
}

export interface SocialSettings {
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
}

const DEFAULTS = {
  company: {
    tradeName: "Woodora",
    legalName: "",
    address: "",
    registration: "",
    vatNumber: "",
    publisher: "",
    host: "",
    mediator: "",
    email: "",
  } as CompanySettings,
  social: { instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "" } as SocialSettings,
};

type SettingKey = keyof typeof DEFAULTS;

export async function getSetting<K extends SettingKey>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const row = await queryOne<{ value: unknown }>(`select value from site_settings where key = $1`, [key]);
  return { ...DEFAULTS[key], ...((row?.value as object) ?? {}) } as (typeof DEFAULTS)[K];
}

export async function setSetting<K extends SettingKey>(key: K, value: (typeof DEFAULTS)[K]) {
  await query(
    `insert into site_settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, json(value)],
  );
}

// ----------------------------------------------------------- categories

export interface Category {
  id: CategoryKey;
  position: number;
  name: LText;
  description: LText;
  imageUrl: string | null;
  active: boolean;
}

export async function listCategories(): Promise<Category[]> {
  return camelizeAll<Category>(await query(`select * from product_categories order by position`));
}

export async function updateCategory(id: CategoryKey, c: Pick<Category, "name" | "description" | "imageUrl" | "active">) {
  await query(
    `update product_categories set name=$2::jsonb, description=$3::jsonb, image_url=$4, active=$5 where id=$1`,
    [id, json(c.name), json(c.description), c.imageUrl, c.active],
  );
}
