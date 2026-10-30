-- The rest timer that starts when a set is ticked off: whether it's on, and how long it runs, in seconds.
ALTER TABLE public.user_settings
  ADD COLUMN rest_timer_on BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN rest_timer_seconds INTEGER NOT NULL DEFAULT 90 CHECK (rest_timer_seconds IN (60, 90, 120, 180));
