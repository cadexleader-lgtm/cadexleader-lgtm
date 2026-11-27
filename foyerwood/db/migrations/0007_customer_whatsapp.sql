-- Foyerwood — optional WhatsApp number left by the customer at pre-order time
-- (the shop may use it to reach them while the order is in progress).
alter table orders add column if not exists customer_whatsapp text;
