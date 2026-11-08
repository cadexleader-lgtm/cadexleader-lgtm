// Newsletter, contact messages, heating calculations, users.
import { json, query, queryOne } from "../db/client";
import type { Lang, MarketId } from "../markets";
import { camelize, camelizeAll } from "./util";

// ---------------------------------------------------------------- newsletter
export interface Subscriber {
  id: string;
  email: string;
  marketId: MarketId;
  language: Lang;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
}

export async function subscribeNewsletter(email: string, market: MarketId, lang: Lang) {
  await query(
    `insert into newsletter_subscribers (email, market_id, language) values (lower($1), $2, $3)
     on conflict (email, market_id) do update set status = 'subscribed', language = excluded.language, consent_at = now()`,
    [email.trim(), market, lang],
  );
}

export async function listSubscribers(market?: MarketId): Promise<Subscriber[]> {
  return camelizeAll<Subscriber>(
    await query(
      `select * from newsletter_subscribers where ($1::text is null or market_id = $1) order by created_at desc`,
      [market ?? null],
    ),
  );
}

export async function setSubscriberStatus(id: string, status: Subscriber["status"]) {
  await query(`update newsletter_subscribers set status = $2 where id = $1`, [id, status]);
}

// ---------------------------------------------------------------- contact
export interface ContactMessage {
  id: string;
  marketId: MarketId;
  language: Lang;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  orderReference: string | null;
  status: "new" | "handled";
  createdAt: Date;
}

export async function createContactMessage(m: Omit<ContactMessage, "id" | "status" | "createdAt">) {
  await query(
    `insert into contact_messages (market_id, language, name, email, phone, subject, message, order_reference)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [m.marketId, m.language, m.name, m.email, m.phone, m.subject, m.message, m.orderReference],
  );
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  return camelizeAll<ContactMessage>(await query(`select * from contact_messages order by created_at desc limit 300`));
}

export async function setContactStatus(id: string, status: ContactMessage["status"]) {
  await query(`update contact_messages set status = $2 where id = $1`, [id, status]);
}

// ---------------------------------------------------------------- calculations
export async function saveCalculation(market: MarketId, lang: Lang, postalPrefix: string, inputs: unknown, results: unknown) {
  const [row] = await query<{ id: string }>(
    `insert into heating_calculations (market_id, language, postal_prefix, inputs, results)
     values ($1,$2,$3,$4::jsonb,$5::jsonb) returning id`,
    [market, lang, postalPrefix, json(inputs), json(results)],
  );
  return row.id;
}

export async function calculationExists(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  return !!(await queryOne(`select 1 from heating_calculations where id = $1`, [id]));
}

// ---------------------------------------------------------------- users
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "admin" | "staff";
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne(`select * from users where email = lower($1)`, [email.trim()]);
  return row ? camelize<User>(row) : null;
}

export async function getUser(id: string): Promise<User | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = await queryOne(`select * from users where id = $1 and active`, [id]);
  return row ? camelize<User>(row) : null;
}

export async function touchLogin(id: string) {
  await query(`update users set last_login_at = now() where id = $1`, [id]);
}

export async function listUsers(): Promise<User[]> {
  return camelizeAll<User>(await query(`select * from users order by created_at`));
}

export async function createUser(email: string, name: string, passwordHash: string, role: User["role"]) {
  await query(`insert into users (email, name, password_hash, role) values (lower($1), $2, $3, $4)`, [email.trim(), name, passwordHash, role]);
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await query(`update users set password_hash = $2 where id = $1`, [id, passwordHash]);
}

export async function setUserActive(id: string, active: boolean) {
  await query(`update users set active = $2 where id = $1`, [id, active]);
}
