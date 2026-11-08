// Database access. Two drivers behind one tiny interface:
//  - DATABASE_URL set   → PostgreSQL through postgres.js (Supabase in production;
//    use the "transaction pooler" connection string on Vercel).
//  - DATABASE_URL unset → embedded PGlite (PostgreSQL compiled to WebAssembly),
//    stored in .data/pglite, migrated and seeded automatically. Ideal for local
//    development and demos; on read-only hosts it falls back to memory.

import fs from "node:fs";
import path from "node:path";

export type Params = unknown[];

export interface Queryable {
  query<T = Record<string, unknown>>(text: string, params?: Params): Promise<T[]>;
}

export interface Db extends Queryable {
  kind: "postgres" | "pglite";
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

type GlobalDb = { __woodoraDb?: Promise<Db> };
const g = globalThis as unknown as GlobalDb;

export function getDb(): Promise<Db> {
  if (!g.__woodoraDb) {
    g.__woodoraDb = createDb().catch((err) => {
      g.__woodoraDb = undefined;
      throw err;
    });
  }
  return g.__woodoraDb;
}

export async function query<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(text, params);
}

export async function queryOne<T = Record<string, unknown>>(text: string, params: Params = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.tx(fn);
}

/** Serialize a value for a `$n::jsonb` parameter. */
export function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function isDemoDatabase(): boolean {
  return !process.env.DATABASE_URL;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return createPostgres(url);
  const db = await createPglite();
  const { migrate } = await import("./migrate");
  await migrate(db);
  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(db);
  return db;
}

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    prepare: false, // required by the Supabase transaction pooler (pgBouncer)
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    idle_timeout: 20,
    onnotice: () => {},
  });
  const run = (s: typeof sql) =>
    async function <T>(text: string, params: Params = []) {
      const rows = await s.unsafe(text, params as never[]);
      return rows as unknown as T[];
    };
  return {
    kind: "postgres",
    query: run(sql),
    exec: async (text) => {
      await sql.unsafe(text);
    },
    tx: async (fn) =>
      (await sql.begin(async (t) => fn({ query: run(t as unknown as typeof sql) }))) as never,
  };
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  let dataDir: string | undefined = path.join(process.cwd(), ".data", "pglite");
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.accessSync(dataDir, fs.constants.W_OK);
  } catch {
    dataDir = undefined; // read-only filesystem (serverless demo): in-memory database
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[woodora] DATABASE_URL is not set: using the embedded demo database. Do not use in production.");
  }
  const pg = dataDir ? new PGlite(dataDir) : new PGlite();
  await pg.waitReady;
  const run = (q: { query: typeof pg.query }) =>
    async function <T>(text: string, params: Params = []) {
      const res = await q.query<T>(text, params as never[]);
      return res.rows;
    };
  // PGlite is single-connection: serialize transactions to avoid interleaving.
  let chain: Promise<unknown> = Promise.resolve();
  return {
    kind: "pglite",
    query: run(pg),
    exec: async (text) => {
      await pg.exec(text);
    },
    tx: (fn) => {
      const next = chain.then(() => pg.transaction(async (t) => fn({ query: run(t) })));
      chain = next.catch(() => undefined);
      return next;
    },
  };
}
