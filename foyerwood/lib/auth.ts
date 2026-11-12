// Administrator authentication: scrypt password hashes + HMAC-signed,
// HTTP-only session cookie. All admin pages and server actions call
// requireAdmin(), so access never relies on client-side checks.

import crypto from "node:crypto";
import { databaseUrl } from "./db/url";

export const SESSION_COOKIE = "foyerwood_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(actual, expected);
}

let fallbackSecret: string | null = null;

/**
 * Key signing the administration session cookie: SESSION_SECRET when it is
 * set (32+ characters). Otherwise a key derived from the (secret) database
 * connection string, so a missing variable never blocks the login; without a
 * database in production, a random key for this server process.
 */
function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s && s.length >= 32) return s;
  if (fallbackSecret) return fallbackSecret;
  const db = databaseUrl();
  if (db) {
    fallbackSecret = crypto.createHash("sha256").update(`foyerwood-session:${db}`).digest("base64url");
  } else if (process.env.NODE_ENV === "production") {
    fallbackSecret = crypto.randomBytes(32).toString("base64url");
  } else {
    fallbackSecret = "foyerwood-development-secret-change-me-please-0001";
  }
  if (process.env.NODE_ENV === "production") console.warn("[foyerwood] SESSION_SECRET is missing or shorter than 32 characters: using a fallback key.");
  return fallbackSecret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface SessionPayload {
  uid: string;
  exp: number;
}

export function createSessionToken(userId: string): { token: string; maxAge: number } {
  const payload: SessionPayload = { uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body)}`, maxAge: SESSION_TTL_SECONDS };
}

export function readSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.uid !== "string" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
