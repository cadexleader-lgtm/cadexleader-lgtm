import { query } from "../db/client";
import { camelize } from "./util";

export interface CatalogPhoto {
  species: string;
  packaging: string;
  url: string;
  updatedAt: Date;
}

export async function listCatalogPhotos(): Promise<CatalogPhoto[]> {
  const rows = await query<Record<string, unknown>>(`select species, packaging, url, updated_at from catalog_photos`);
  return rows.map((r) => camelize<CatalogPhoto>(r));
}

export async function setCatalogPhoto(species: string, packaging: string, url: string): Promise<void> {
  await query(
    `insert into catalog_photos (species, packaging, url, updated_at) values ($1, $2, $3, now())
     on conflict (species, packaging) do update set url = excluded.url, updated_at = now()`,
    [species, packaging, url],
  );
}

export async function deleteCatalogPhoto(species: string, packaging: string): Promise<void> {
  await query(`delete from catalog_photos where species = $1 and packaging = $2`, [species, packaging]);
}
