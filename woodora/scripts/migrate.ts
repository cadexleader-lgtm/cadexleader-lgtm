import { getDb } from "../lib/db/client";
import { migrate } from "../lib/db/migrate";

async function main() {
  const db = await getDb();
  if (db.kind === "pglite") {
    console.log("DATABASE_URL is not set: the embedded database is migrated automatically.");
    return;
  }
  const applied = await migrate(db, console.log);
  console.log(applied.length ? `Applied ${applied.length} migration(s).` : "Database is up to date.");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
