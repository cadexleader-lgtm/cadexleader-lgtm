import { json, query, queryOne } from "../db/client";
import type { Lang, MarketId } from "../markets";
import { camelize, camelizeAll } from "./util";

export interface Article {
  id: string;
  language: Lang;
  markets: MarketId[];
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverArt: string | null;
  coverImage: string | null;
  readingMinutes: number;
  status: "draft" | "published";
  publishedAt: Date | null;
  author: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function listPublishedArticles(lang: Lang, market: MarketId, limit = 50): Promise<Article[]> {
  return camelizeAll<Article>(
    await query(
      `select * from blog_articles where language = $1 and status = 'published' and markets ? $2
         and (published_at is null or published_at <= now())
       order by published_at desc nulls last limit $3`,
      [lang, market, limit],
    ),
  );
}

export async function getPublishedArticle(lang: Lang, market: MarketId, slug: string): Promise<Article | null> {
  const row = await queryOne(
    `select * from blog_articles where language = $1 and slug = $2 and status = 'published' and markets ? $3`,
    [lang, slug, market],
  );
  return row ? camelize<Article>(row) : null;
}

export async function adminListArticles(): Promise<Article[]> {
  return camelizeAll<Article>(await query(`select * from blog_articles order by updated_at desc`));
}

export async function adminGetArticle(id: string): Promise<Article | null> {
  const row = await queryOne(`select * from blog_articles where id = $1`, [id]);
  return row ? camelize<Article>(row) : null;
}

export async function saveArticle(a: Omit<Article, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<string> {
  const params = [
    a.language, json(a.markets), a.slug, a.title, a.excerpt, a.content, a.coverArt, a.coverImage, a.readingMinutes,
    a.status, a.publishedAt ? new Date(a.publishedAt).toISOString() : a.status === "published" ? new Date().toISOString() : null,
    a.author, a.seoTitle, a.seoDescription,
  ];
  if (a.id) {
    await query(
      `update blog_articles set language=$1, markets=$2::jsonb, slug=$3, title=$4, excerpt=$5, content=$6, cover_art=$7,
         cover_image=$8, reading_minutes=$9, status=$10, published_at=$11, author=$12, seo_title=$13, seo_description=$14,
         updated_at=now() where id=$15`,
      [...params, a.id],
    );
    return a.id;
  }
  const [row] = await query<{ id: string }>(
    `insert into blog_articles (language, markets, slug, title, excerpt, content, cover_art, cover_image, reading_minutes,
       status, published_at, author, seo_title, seo_description)
     values ($1,$2::jsonb,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
    params,
  );
  return row.id;
}

export async function deleteArticle(id: string) {
  await query(`delete from blog_articles where id = $1`, [id]);
}

export async function articleSlugExists(lang: Lang, slug: string, exceptId?: string) {
  return !!(await queryOne(
    `select 1 from blog_articles where language = $1 and slug = $2 and ($3::uuid is null or id <> $3::uuid)`,
    [lang, slug, exceptId ?? null],
  ));
}
