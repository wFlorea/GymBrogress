-- The first tables never had their default permissions for logged-out visitors removed. Row level security already blocked them.
REVOKE ALL ON public.routine_templates, public.weekly_plans, public.workout_logs, public.workout_sets FROM anon;
