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
    await db.exec(`begin;\n${sql}\ninsert into schema_migrations (id) values ('${file.replace(/'/g, "''")}');\ncommit;`);
    applied.push(file);
  }
  return applied;
}
