-- =========================================================
-- Sensual Luxembourg — base de données (Supabase / Postgres)
-- Table des praticiennes + stockage des photos + compte administrateur.
-- À appliquer une seule fois sur un projet Supabase vide.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

-- Schéma privé : jamais exposé par l'API publique.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------- Administrateurs ----------
create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- ---------- Praticiennes ----------
create table public.praticiennes (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(btrim(prenom)) between 1 and 40),
  accroche text not null default '' check (char_length(accroche) <= 160),
  specialites text not null default '' check (char_length(specialites) <= 120),
  langues text not null default '' check (char_length(langues) <= 80),
  photo_path text,
  -- L'accord écrit de la personne est obligatoire pour enregistrer une photo.
  accord_ecrit boolean not null default false,
  publie boolean not null default false,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photo_exige_accord check (photo_path is null or accord_ecrit)
);
create index praticiennes_ordre_idx on public.praticiennes (ordre, created_at);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger praticiennes_touch before update on public.praticiennes
  for each row execute function private.touch_updated_at();

alter table public.praticiennes enable row level security;

-- Le public ne voit que les profils publiés ; l'administrateur voit tout.
create policy "lecture des profils publies" on public.praticiennes
  for select to anon, authenticated
  using (publie or (select private.is_admin()));
create policy "ajout par admin" on public.praticiennes
  for insert to authenticated
  with check ((select private.is_admin()));
create policy "modification par admin" on public.praticiennes
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "suppression par admin" on public.praticiennes
  for delete to authenticated
  using ((select private.is_admin()));

grant select on public.praticiennes to anon;
grant select, insert, update, delete on public.praticiennes to authenticated;

-- ---------- Photos (stockage) ----------
-- Bucket public en lecture par URL ; 3 Mo max, images uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('praticiennes', 'praticiennes', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "photos : lecture admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'praticiennes' and (select private.is_admin()));
create policy "photos : envoi admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'praticiennes' and (select private.is_admin()));
create policy "photos : remplacement admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'praticiennes' and (select private.is_admin()))
  with check (bucket_id = 'praticiennes' and (select private.is_admin()));
create policy "photos : suppression admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'praticiennes' and (select private.is_admin()));

-- ---------- Création du compte administrateur (une seule fois) ----------
-- Un code d'installation à usage unique protège la création du premier compte.
create table private.setup (
  id boolean primary key default true check (id),
  code_hash text not null,
  tentatives integer not null default 0
);

create or replace function public.admin_existe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins);
$$;
revoke all on function public.admin_existe() from public;
grant execute on function public.admin_existe() to anon, authenticated;

-- Renvoie : 'ok', 'deja_configure', 'bloque', 'code_invalide', 'email_invalide' ou 'mot_de_passe_trop_court'.
create or replace function public.creer_admin(p_code text, p_email text, p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_setup private.setup%rowtype;
  v_id uuid := gen_random_uuid();
  v_email text := lower(btrim(p_email));
begin
  if exists (select 1 from private.admins) then
    return 'deja_configure';
  end if;
  select * into v_setup from private.setup where id for update;
  if not found then
    return 'deja_configure';
  end if;
  if v_setup.tentatives >= 10 then
    return 'bloque';
  end if;
  if v_setup.code_hash <> extensions.crypt(coalesce(p_code, ''), v_setup.code_hash) then
    update private.setup set tentatives = tentatives + 1 where id;
    return 'code_invalide';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or exists (select 1 from auth.users where email = v_email) then
    return 'email_invalide';
  end if;
  if char_length(coalesce(p_password, '')) < 10 then
    return 'mot_de_passe_trop_court';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );
  insert into private.admins (user_id) values (v_id);
  delete from private.setup;
  return 'ok';
end;
$$;
revoke all on function public.creer_admin(text, text, text) from public;
grant execute on function public.creer_admin(text, text, text) to anon;

-- Après avoir appliqué ce fichier, enregistrer le code d'installation (remplacer LE-CODE) :
--   insert into private.setup (code_hash) values (extensions.crypt('LE-CODE', extensions.gen_salt('bf')));

-- Permet à la page d'administration de vérifier que le compte connecté est bien administrateur.
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;
revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to authenticated;
