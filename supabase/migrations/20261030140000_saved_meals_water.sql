-- Saved meals: foods saved together under a name, to log again in one tap.
CREATE TABLE public.saved_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  -- The foods as they go into food_entries: [{ name, calories, protein, carbs, fat, grams }].
  foods JSONB NOT NULL CHECK (
    CASE WHEN jsonb_typeof(foods) = 'array' THEN jsonb_array_length(foods) BETWEEN 1 AND 30 ELSE false END
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX saved_meals_user_id_idx ON public.saved_meals (user_id);

-- Water drunk each day, in ml.
CREATE TABLE public.water_logs (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  ml INTEGER NOT NULL CHECK (ml BETWEEN 0 AND 10000),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved meals" ON public.saved_meals
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their own water logs" ON public.water_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.saved_meals, public.water_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_meals, public.water_logs TO authenticated;
