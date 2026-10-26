-- Run only after the app version that reads `split` / `routine_templates` is deployed.
-- Drops the columns the old app versions used; their data was converted by
-- 20261026161633_cleanup_data_model.sql.

alter table public.workout_logs drop column workout_name;
alter table public.weekly_plans drop column workout_name;
alter table public.workout_sets
  drop column target_reps,
  drop column target_weight;
