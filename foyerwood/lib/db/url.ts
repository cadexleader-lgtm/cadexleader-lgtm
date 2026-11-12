/**
 * Postgres connection string: DATABASE_URL (Supabase, Neon…) or POSTGRES_URL
 * (Vercel). Integrations connected with a custom prefix (e.g. STORAGE_DATABASE_URL)
 * are picked up too.
 */
export function databaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) return direct;
  for (const [key, value] of Object.entries(process.env)) {
    if (/(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(key) && value && /^postgres(ql)?:\/\//.test(value)) return value;
  }
  return undefined;
}
