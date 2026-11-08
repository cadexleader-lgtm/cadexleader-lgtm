import { getDb } from "../lib/db/client";
import { migrate } from "../lib/db/migrate";
import { seedIfEmpty } from "../lib/db/seed";

async function main() {
  const db = await getDb();
  if (db.kind === "postgres") await migrate(db, console.log);
  const inserted = await seedIfEmpty(db, console.log);
  console.log(inserted ? "Starter data inserted." : "Database already contains data: nothing inserted.");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
