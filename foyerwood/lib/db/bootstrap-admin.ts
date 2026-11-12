// Starting administrator account, created automatically on the first start
// that runs this code (once: it is never recreated or overwritten afterwards,
// so a password or e-mail changed in Administration → Réglages is kept).
// Only the scrypt hash of the password is stored here, never the password.
import type { Queryable } from "./client";

export const BOOTSTRAP_ADMIN = {
  id: "6f0e7a52-4c1d-4b8e-9f3a-2d5c8b1e7a90",
  email: "admin@foyerwood.com",
  name: "Administrateur",
  passwordHash: "scrypt$7zLrElV4Pix1YSS7Gu2uow==$NL+bD/ldydACGIicQdcke5FkM0apC0L9SUObHbo5SJqUvzhbgC0gL2XfQSYf5QB8H+lCbLXMpR+VfC5Hiljn7g==",
} as const;

const FLAG = "bootstrap_admin_v1";

export async function ensureBootstrapAdmin(db: Queryable, log: (m: string) => void = () => {}) {
  const [done] = await db.query("select 1 from site_settings where key = $1", [FLAG]);
  if (done) return;
  const [taken] = await db.query("select 1 from users where id = $1 or email = $2", [BOOTSTRAP_ADMIN.id, BOOTSTRAP_ADMIN.email]);
  if (!taken) {
    await db.query(
      "insert into users (id, email, name, password_hash, role) values ($1, $2, $3, $4, 'admin') on conflict do nothing",
      [BOOTSTRAP_ADMIN.id, BOOTSTRAP_ADMIN.email, BOOTSTRAP_ADMIN.name, BOOTSTRAP_ADMIN.passwordHash],
    );
    log(`Starting administrator ${BOOTSTRAP_ADMIN.email} created.`);
  }
  await db.query(
    "insert into site_settings (key, value) values ($1, $2::text::jsonb) on conflict (key) do nothing",
    [FLAG, JSON.stringify(new Date().toISOString())],
  );
}
