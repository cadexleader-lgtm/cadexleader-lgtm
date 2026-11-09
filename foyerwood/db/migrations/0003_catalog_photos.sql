-- Foyerwood — one photo per species × packaging, shared by the three markets.
-- Set from Administration → Photos du catalogue; a product's own photos still
-- take precedence.
create table if not exists catalog_photos (
  species text not null,
  packaging text not null,
  url text not null,
  updated_at timestamptz not null default now(),
  primary key (species, packaging)
);

alter table catalog_photos enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table catalog_photos from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table catalog_photos from authenticated;
  end if;
end $$;
