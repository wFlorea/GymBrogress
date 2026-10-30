-- Weekly weigh-ins: one weight per user per week (Monday to Sunday). Checking in again the same week replaces it.

CREATE TABLE public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  -- The Monday of the week.
  week_start DATE NOT NULL CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  weight_kg DECIMAL NOT NULL CHECK (weight_kg BETWEEN 20 AND 400),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weight logs" ON public.weight_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.weight_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
