-- Foyerwood — where a review comes from. Reviews left on the site after a
-- delivered order are "site" (verified); reviews from real customers received
-- elsewhere (WhatsApp, e-mail, Google…) are entered by the administrator with
-- their source, and shown with it.
alter table reviews add column if not exists source text not null default 'site';
alter table reviews drop constraint if exists reviews_source_check;
alter table reviews add constraint reviews_source_check
  check (source in ('site', 'whatsapp', 'email', 'google', 'facebook', 'phone', 'in_person', 'other'));
