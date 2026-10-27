-- GymBrogress database schema (state after all migrations in supabase/migrations/).
-- Every table is private to its owner through RLS.

-- Repeating weekly plan: which split each weekday (0 = Monday … 6 = Sunday) defaults to.
CREATE TABLE weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  split TEXT NOT NULL CHECK (split IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest',
                                       'Back', 'Shoulders', 'Cardio & Core', 'Full Body', 'Rest Day')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, day_of_week)
);

-- Exercises the user wants for each split (ordered exercise ids from src/lib/exercises-data.ts)
-- and the sets planned for each ({"ex-001": 3, ...}; missing ids use the default of 3).
-- A split without a row uses the app's default routine.
CREATE TABLE routine_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  split TEXT NOT NULL CHECK (split IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest',
                                       'Back', 'Shoulders', 'Cardio & Core', 'Full Body')),
  exercise_ids TEXT[] NOT NULL DEFAULT '{}',
  exercise_sets JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(exercise_sets) = 'object'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, split)
);

-- One row per user per day: the split planned for that date (overrides weekly_plans)
-- and, once training starts, the session its sets belong to.
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  split TEXT NOT NULL CHECK (split IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest',
                                       'Back', 'Shoulders', 'Cardio & Core', 'Full Body', 'Rest Day')),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, date)
);

CREATE TABLE workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL, -- snapshot, in case the exercise leaves the library
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  actual_reps INTEGER NOT NULL DEFAULT 0 CHECK (actual_reps BETWEEN 0 AND 1000),
  actual_weight DECIMAL NOT NULL DEFAULT 0 CHECK (actual_weight BETWEEN 0 AND 1000),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX workout_sets_workout_log_id_idx ON workout_sets (workout_log_id);
CREATE INDEX workout_sets_exercise_id_idx ON workout_sets (exercise_id);

-- Per-user preferences: the order of the routines in Plan, the exercises pinned on Progress,
-- the daily food goals, and body stats with a goal weight (NULL = not set).
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  split_order TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(split_order) <= 20),
  tracked_exercise_ids TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tracked_exercise_ids) <= 30),
  calorie_goal INTEGER CHECK (calorie_goal BETWEEN 500 AND 10000),
  protein_goal INTEGER CHECK (protein_goal BETWEEN 0 AND 1000),
  carbs_goal INTEGER CHECK (carbs_goal BETWEEN 0 AND 1000),
  fat_goal INTEGER CHECK (fat_goal BETWEEN 0 AND 1000),
  weight_kg DECIMAL CHECK (weight_kg BETWEEN 20 AND 400),
  height_cm DECIMAL CHECK (height_cm BETWEEN 100 AND 250),
  age INTEGER CHECK (age BETWEEN 13 AND 120),
  goal_weight_kg DECIMAL CHECK (goal_weight_kg BETWEEN 20 AND 400),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Food log: one row per food eaten. Macros are in grams.
CREATE TABLE food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  calories INTEGER NOT NULL CHECK (calories BETWEEN 0 AND 10000),
  protein DECIMAL NOT NULL DEFAULT 0 CHECK (protein BETWEEN 0 AND 1000),
  carbs DECIMAL NOT NULL DEFAULT 0 CHECK (carbs BETWEEN 0 AND 1000),
  fat DECIMAL NOT NULL DEFAULT 0 CHECK (fat BETWEEN 0 AND 1000),
  -- How much was eaten, for foods picked from the food database; NULL for foods typed in by hand.
  grams DECIMAL CHECK (grams > 0 AND grams <= 5000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX food_entries_user_id_date_idx ON food_entries (user_id, date);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weekly plans" ON weekly_plans
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their own routine templates" ON routine_templates
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their own workout logs" ON workout_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their own workout sets" ON workout_sets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM workout_logs l
                 WHERE l.id = workout_sets.workout_log_id AND l.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_logs l
                      WHERE l.id = workout_sets.workout_log_id AND l.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their own food entries" ON food_entries
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON user_settings, food_entries FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings, food_entries TO authenticated;

-- Progress page. security_invoker keeps the RLS of the underlying tables.
-- Heaviest completed set of each exercise per month.
CREATE VIEW exercise_monthly_bests WITH (security_invoker = true) AS
SELECT l.user_id,
       s.exercise_id,
       to_char(l.date, 'YYYY-MM') AS month,
       max(s.actual_weight) AS max_weight
FROM workout_sets s
JOIN workout_logs l ON l.id = s.workout_log_id
WHERE s.is_completed
GROUP BY l.user_id, s.exercise_id, to_char(l.date, 'YYYY-MM');

-- Every exercise with a completed set: its latest name, best weight and last date.
CREATE VIEW exercise_history WITH (security_invoker = true) AS
SELECT l.user_id,
       s.exercise_id,
       (array_agg(s.exercise_name ORDER BY l.date DESC))[1] AS exercise_name,
       max(s.actual_weight) AS best_weight,
       max(l.date) AS last_date
FROM workout_sets s
JOIN workout_logs l ON l.id = s.workout_log_id
WHERE s.is_completed
GROUP BY l.user_id, s.exercise_id;

REVOKE ALL ON exercise_monthly_bests, exercise_history FROM anon;
GRANT SELECT ON exercise_monthly_bests, exercise_history TO authenticated;
