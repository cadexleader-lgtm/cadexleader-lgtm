import fs from "node:fs";
import path from "node:path";
import type { Db } from "./client";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/** Applies every db/migrations/*.sql file that has not been applied yet. */
export async function migrate(db: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  await db.exec(
    "create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set(
    (await db.query<{ id: string }>("select id from schema_migrations")).map((r) => r.id),
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    log(`Applying ${file}…`);
    // One transaction per migration; the advisory lock serializes concurrent
    // cold starts and the re-check inside the lock makes re-runs harmless.
    const ran = await db.tx(async (q) => {
      await q.query("select pg_advisory_xact_lock(7364201)");
      const already = await q.query("select 1 from schema_migrations where id = $1", [file]);
      if (already.length) return false;
      await q.exec!(sql);
      await q.query("insert into schema_migrations (id) values ($1)", [file]);
      return true;
    });
    if (!ran) continue;
    applied.push(file);
  }
  return applied;
}
