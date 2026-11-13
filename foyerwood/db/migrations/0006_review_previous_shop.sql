-- Foyerwood — reviews received on the owner's previous online store.
alter table reviews drop constraint if exists reviews_source_check;
alter table reviews add constraint reviews_source_check
  check (source in ('site', 'whatsapp', 'email', 'google', 'facebook', 'phone', 'in_person', 'previous_shop', 'other'));
