-- Sets per exercise in routines, per-user settings (routine order, tracked exercises),
-- and the views behind the Progress page.

-- Number of sets planned for each exercise of a routine: {"ex-001": 3, ...}.
-- Exercises missing from it use the app default (3 sets).
ALTER TABLE public.routine_templates
  ADD COLUMN exercise_sets JSONB NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(exercise_sets) = 'object');

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  split_order TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(split_order) <= 20),
  tracked_exercise_ids TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tracked_exercise_ids) <= 30),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.user_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Previous sets of an exercise (tracker prefill, progress views).
CREATE INDEX workout_sets_exercise_id_idx ON public.workout_sets (exercise_id);

-- Heaviest completed set of each exercise per month. security_invoker keeps the RLS of the
-- underlying tables, so users only ever see their own rows.
CREATE VIEW public.exercise_monthly_bests WITH (security_invoker = true) AS
SELECT l.user_id,
       s.exercise_id,
       to_char(l.date, 'YYYY-MM') AS month,
       max(s.actual_weight) AS max_weight
FROM public.workout_sets s
JOIN public.workout_logs l ON l.id = s.workout_log_id
WHERE s.is_completed
GROUP BY l.user_id, s.exercise_id, to_char(l.date, 'YYYY-MM');

-- Every exercise with a completed set: its latest name, best weight and last date.
CREATE VIEW public.exercise_history WITH (security_invoker = true) AS
SELECT l.user_id,
       s.exercise_id,
       (array_agg(s.exercise_name ORDER BY l.date DESC))[1] AS exercise_name,
       max(s.actual_weight) AS best_weight,
       max(l.date) AS last_date
FROM public.workout_sets s
JOIN public.workout_logs l ON l.id = s.workout_log_id
WHERE s.is_completed
GROUP BY l.user_id, s.exercise_id;

REVOKE ALL ON public.exercise_monthly_bests, public.exercise_history FROM anon;
GRANT SELECT ON public.exercise_monthly_bests, public.exercise_history TO authenticated;
