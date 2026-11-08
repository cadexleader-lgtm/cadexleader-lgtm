// Usage: npm run admin:create -- admin@example.com "a long password" "Display name"
import { getDb } from "../lib/db/client";
import { hashPassword } from "../lib/auth";

async function main() {
  const [email, password, name = "Administrateur"] = process.argv.slice(2);
  if (!email || !password) throw new Error('Usage: npm run admin:create -- <email> "<password>" ["Name"]');
  if (password.length < 12) throw new Error("Use a password of at least 12 characters.");
  const db = await getDb();
  await db.query(
    `insert into users (email, name, password_hash, role) values ($1, $2, $3, 'admin')
     on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name, active = true`,
    [email.toLowerCase(), name, hashPassword(password)],
  );
  console.log(`Administrator ${email} saved.`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
