-- Woodora — initial schema (PostgreSQL 15+ / Supabase)
--
-- Security model: the web application talks to the database only from the
-- server (DATABASE_URL, Supabase "postgres" role). Row Level Security is enabled
-- on every table WITHOUT any policy for the "anon" and "authenticated" roles, so
-- the public Supabase API (anon key) cannot read or write any row: customers'
-- orders, contact details and payment records are never exposed to visitors.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists markets (
  id text primary key check (id in ('ca', 'us', 'fr')),
  name text not null,
  currency text not null check (currency in ('CAD', 'USD', 'EUR')),
  default_language text not null,
  languages jsonb not null,
  timezone text not null,
  active boolean not null default true,
  whatsapp_number text,
  contact_email text,
  contact_phone text,
  business_hours jsonb not null default '{}'::jsonb,
  prices_include_tax boolean not null default false,
  tax_note jsonb not null default '{}'::jsonb,
  free_delivery_note jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  name text not null,
  contact_name text,
  email text,
  phone text,
  whatsapp text,
  address text,
  city text,
  region text,
  postal_code text,
  lead_time_days_min integer,
  lead_time_days_max integer,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suppliers_market_idx on suppliers(market_id);

create table if not exists product_categories (
  id text primary key,
  position integer not null default 0,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  image_url text,
  active boolean not null default true
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  category_id text not null references product_categories(id),
  supplier_id uuid references suppliers(id) on delete set null,
  slug text not null,
  sku text,
  name jsonb not null,
  short_description jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  delivery_info jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  art text,
  species text,
  moisture_pct real check (moisture_pct is null or (moisture_pct >= 0 and moisture_pct <= 60)),
  length_cm real,
  packaging text not null default 'none' check (packaging in ('pallet', 'bag', 'bulk', 'box', 'bundle', 'crate', 'none')),
  unit text not null,
  unit_volume_m3 real,
  unit_weight_kg real,
  packing text not null default 'stacked' check (packing in ('stacked', 'loose')),
  energy_kwh_override real,
  min_qty integer not null default 1 check (min_qty >= 1),
  max_qty integer,
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer,
  cost_cents integer,
  is_available boolean not null default true,
  active boolean not null default true,
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, slug)
);
create index if not exists products_market_idx on products(market_id, active, category_id);

create table if not exists inventory (
  product_id uuid primary key references products(id) on delete cascade,
  track_stock boolean not null default false,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  full_name text not null,
  email text not null,
  phone text not null,
  address_line text,
  postal_code text,
  city text,
  region text,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, email)
);

create table if not exists order_sequences (
  market_id text not null references markets(id),
  year integer not null,
  last_value integer not null default 0,
  primary key (market_id, year)
);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  supplier_id uuid references suppliers(id) on delete cascade,
  name text not null,
  region_codes jsonb not null default '[]'::jsonb,
  excluded_postal_prefixes jsonb not null default '[]'::jsonb,
  excluded_product_ids jsonb not null default '[]'::jsonb,
  free_delivery boolean not null default true,
  free_delivery_min_cents integer not null default 0,
  lead_time_days_min integer,
  lead_time_days_max integer,
  remote_area_note jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists delivery_zones_market_idx on delivery_zones(market_id, active);

create table if not exists heating_calculations (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  language text not null,
  postal_prefix text,
  inputs jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  access_token text not null,
  market_id text not null references markets(id),
  language text not null,
  currency text not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line text not null,
  postal_code text not null,
  city text not null,
  region text,
  delivery_instructions text,
  status text not null default 'new' check (status in (
    'new', 'verifying', 'quote_to_prepare', 'quote_sent', 'awaiting_payment',
    'payment_received', 'confirmed', 'preparing_delivery', 'in_delivery', 'delivered', 'cancelled'
  )),
  subtotal_cents integer not null,
  estimated_cost_cents integer,
  delivery_zone_id uuid references delivery_zones(id) on delete set null,
  calculation_id uuid references heating_calculations(id) on delete set null,
  internal_notes text,
  stock_committed boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_market_idx on orders(market_id, created_at desc);
create index if not exists orders_status_idx on orders(status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  product_name text not null,
  unit text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  unit_cost_cents integer,
  line_total_cents integer not null,
  position integer not null default 0
);
create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text,
  note text,
  user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events(order_id, created_at);

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  number text not null unique,
  amount_cents integer not null check (amount_cents >= 0),
  delivery_cents integer not null default 0,
  tax_cents integer not null default 0,
  currency text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'expired', 'cancelled')),
  sent_at timestamptz,
  valid_until date,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotations_order_idx on quotations(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  quotation_id uuid references quotations(id) on delete set null,
  expected_cents integer,
  received_cents integer not null default 0 check (received_cents >= 0),
  currency text not null,
  transfer_date date,
  bank_reference text,
  -- 'awaiting': announced by the customer, NOT received.
  -- 'verified': amount seen on the bank account and checked by an administrator.
  status text not null default 'awaiting' check (status in ('awaiting', 'verified', 'rejected', 'refunded')),
  verified_by uuid references users(id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on payments(order_id);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'in_transit', 'delivered', 'failed')),
  scheduled_date date,
  delivered_at timestamptz,
  carrier text,
  tracking_info text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  order_id uuid references orders(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  author_name text not null,
  city text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  language text not null,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);
create index if not exists reviews_market_idx on reviews(market_id, status);

create table if not exists blog_articles (
  id uuid primary key default gen_random_uuid(),
  language text not null check (language in ('fr', 'en')),
  markets jsonb not null default '["ca","us","fr"]'::jsonb,
  slug text not null,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_art text,
  cover_image text,
  reading_minutes integer not null default 3,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, slug)
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  market_id text not null references markets(id),
  language text not null,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (email, market_id)
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references markets(id),
  language text not null,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  order_reference text,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

-- Row Level Security: enabled everywhere, no public policy (see header).
do $$
declare t text;
begin
  foreach t in array array[
    'users', 'markets', 'suppliers', 'product_categories', 'products', 'inventory', 'customers',
    'order_sequences', 'delivery_zones', 'heating_calculations', 'orders', 'order_items', 'order_events',
    'quotations', 'payments', 'deliveries', 'reviews', 'blog_articles', 'site_settings',
    'newsletter_subscribers', 'contact_messages'
  ] loop
    execute format('alter table %I enable row level security', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table %I from anon', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on table %I from authenticated', t);
    end if;
  end loop;
end $$;
