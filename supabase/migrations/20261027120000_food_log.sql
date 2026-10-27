-- Food log (v1.1): every food the user logs, and their daily calorie and macro goals.

CREATE TABLE public.food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  calories INTEGER NOT NULL CHECK (calories BETWEEN 0 AND 10000),
  -- Grams.
  protein DECIMAL NOT NULL DEFAULT 0 CHECK (protein BETWEEN 0 AND 1000),
  carbs DECIMAL NOT NULL DEFAULT 0 CHECK (carbs BETWEEN 0 AND 1000),
  fat DECIMAL NOT NULL DEFAULT 0 CHECK (fat BETWEEN 0 AND 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX food_entries_user_id_date_idx ON public.food_entries (user_id, date);

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own food entries" ON public.food_entries
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.food_entries FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_entries TO authenticated;

-- Daily goals; NULL means the user hasn't set one.
ALTER TABLE public.user_settings
  ADD COLUMN calorie_goal INTEGER CHECK (calorie_goal BETWEEN 500 AND 10000),
  ADD COLUMN protein_goal INTEGER CHECK (protein_goal BETWEEN 0 AND 1000),
  ADD COLUMN carbs_goal INTEGER CHECK (carbs_goal BETWEEN 0 AND 1000),
  ADD COLUMN fat_goal INTEGER CHECK (fat_goal BETWEEN 0 AND 1000);
