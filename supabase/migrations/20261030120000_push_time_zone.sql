-- The device's IANA time zone, so the weekly reminder only goes out on Monday daytime there.
-- Rows without one count as UTC.

ALTER TABLE public.push_subscriptions ADD COLUMN time_zone TEXT CHECK (length(time_zone) <= 64);
