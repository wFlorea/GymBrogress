-- Web push subscriptions for the weekly check-in reminder: one row per device a user turned reminders on for.
-- The reminder itself is sent by /api/cron/weight-reminder with the service role key.

CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  -- Only the browsers' push services (as in src/lib/push.ts): users can write rows directly, and the cron posts to these.
  endpoint TEXT NOT NULL CHECK (
    length(endpoint) <= 2048
    AND endpoint ~ '^https://[A-Za-z0-9.-]+\.(googleapis\.com|mozilla\.com|push\.apple\.com|notify\.windows\.com)/'
  ),
  p256dh TEXT NOT NULL CHECK (length(p256dh) <= 256),
  auth TEXT NOT NULL CHECK (length(auth) <= 256),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
