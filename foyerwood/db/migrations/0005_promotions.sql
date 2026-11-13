-- Foyerwood — volume discount and free accessories on pre-orders.
alter table orders add column if not exists discount_cents integer not null default 0;
alter table orders add column if not exists discount_percent numeric(5,2) not null default 0;
alter table order_items add column if not exists is_gift boolean not null default false;
