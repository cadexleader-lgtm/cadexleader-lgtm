-- Foyerwood — new packagings (Big Bag, net bag) for the species × packaging catalogue.
alter table products drop constraint if exists products_packaging_check;
alter table products add constraint products_packaging_check
  check (packaging in ('bulk', 'pallet', 'big_bag', 'net_bag', 'bag', 'box', 'bundle', 'crate', 'none'));
