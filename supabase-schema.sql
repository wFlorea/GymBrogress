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

-- Exercises the user wants for each split (ordered exercise ids from src/lib/exercises-data.ts).
-- A split without a row uses the app's default routine.
CREATE TABLE routine_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  split TEXT NOT NULL CHECK (split IN ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest',
                                       'Back', 'Shoulders', 'Cardio & Core', 'Full Body')),
  exercise_ids TEXT[] NOT NULL DEFAULT '{}',
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

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

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
