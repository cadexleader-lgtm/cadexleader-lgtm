import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { ensureAdmin } from "@/lib/db/seed";
import { hashPassword, verifyPassword } from "@/lib/auth";

// In-memory PostgreSQL behaving like the production driver ("postgres" kind).
function memoryDb(pg: PGlite): Db {
  return {
    kind: "postgres",
    query: async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params as never[])).rows,
    exec: async (sql: string) => {
      await pg.exec(sql);
    },
    tx: (fn) =>
      pg.transaction((t) =>
        fn({
          query: async <T,>(text: string, params: unknown[] = []) => (await t.query<T>(text, params as never[])).rows,
          exec: async (sql: string) => {
            await t.exec(sql);
          },
        }),
      ),
  };
}

const ENV = { ...process.env };
let db: Db;

async function login(email: string, password: string): Promise<boolean> {
  const [u] = await db.query<{ password_hash: string; active: boolean }>("select password_hash, active from users where email = lower($1)", [email]);
  return Boolean(u && u.active && verifyPassword(password, u.password_hash));
}

function setEnv(email: string, password: string) {
  process.env.ADMIN_EMAIL = email;
  process.env.ADMIN_PASSWORD = password;
}

describe("administrator from ADMIN_EMAIL / ADMIN_PASSWORD", () => {
  beforeAll(async () => {
    db = memoryDb(new PGlite());
    await migrate(db);
  });
  afterEach(() => {
    process.env = { ...ENV };
  });

  it("creates the account on first start", async () => {
    setEnv("Owner@Example.com ", "first-password-1");
    await ensureAdmin(db);
    expect(await login("owner@example.com", "first-password-1")).toBe(true);
  });

  it("applies a new password set in the host after a redeploy", async () => {
    setEnv("owner@example.com", "second-password-2");
    await ensureAdmin(db);
    expect(await login("owner@example.com", "second-password-2")).toBe(true);
    expect(await login("owner@example.com", "first-password-1")).toBe(false);
  });

  it("keeps a password changed in the administration while the variables stay the same", async () => {
    await db.query("update users set password_hash = $2 where email = $1", ["owner@example.com", hashPassword("changed-in-admin-3")]);
    setEnv("owner@example.com", "second-password-2");
    await ensureAdmin(db);
    expect(await login("owner@example.com", "changed-in-admin-3")).toBe(true);
  });

  it("creates a new account when the e-mail changes, even if users already exist", async () => {
    setEnv('"new-owner@example.com"', "'third-password-3'");
    await ensureAdmin(db);
    expect(await login("new-owner@example.com", "third-password-3")).toBe(true);
  });

  it("re-enables a disabled account when the variables change", async () => {
    await db.query("update users set active = false where email = $1", ["owner@example.com"]);
    setEnv("owner@example.com", "fourth-password-4");
    await ensureAdmin(db);
    expect(await login("owner@example.com", "fourth-password-4")).toBe(true);
  });

  it("refuses a password shorter than 10 characters", async () => {
    setEnv("short@example.com", "short");
    await ensureAdmin(db);
    expect(await login("short@example.com", "short")).toBe(false);
  });
});
