-- GymBrogress: normalize the data model.
--
-- * workout_logs      one row per user per day, with a typed `split` column
--                     (was JSON / free text in workout_name) and `finished_at`
-- * weekly_plans      only the repeating Mon–Sun defaults (day_of_week 0–6), typed `split`
-- * routine_templates per-split exercise lists (were weekly_plans rows with day_of_week 100–110)
-- * exercise ids/names in history and templates remapped to the current exercise library
-- * unique constraints, indexes, cascading deletes and faster RLS policies
--
-- Legacy columns (workout_name, target_*) are kept nullable here and dropped by the
-- follow-up migration 20261026170000_drop_legacy_columns.sql once the new app is deployed.

-- ---------------------------------------------------------------------------
-- Helpers (session-scoped, removed at the end)
-- ---------------------------------------------------------------------------

-- Maps legacy values ('{"split":"Pull","workStatus":"off"}', 'Pull | work:none', 'Back day', 'Rest', ...)
-- to a split id. Returns null when the value carries no split.
create function pg_temp.normalize_split(raw text) returns text
language plpgsql immutable as $$
declare
  s text := raw;
  k text;
begin
  if s is null or btrim(s) = '' then
    return null;
  end if;

  if left(btrim(s), 1) = '{' then
    begin
      s := (s::jsonb) ->> 'split';
    exception when others then
      null;
    end;
  elsif position('|' in s) > 0 then
    s := split_part(s, '|', 1);
  end if;

  if s is null or btrim(s) = '' then
    return null;
  end if;

  k := lower(btrim(s));
  return case
    when k in ('upper', 'lower', 'push', 'pull', 'legs', 'arms', 'chest', 'back', 'shoulders',
               'cardio & core', 'full body', 'rest day') then initcap(k)
    when k like '%rest%' or k like '%odihn%' or k like '%pauz%' then 'Rest Day'
    when k like 'push%' then 'Push'
    when k like 'pull%' then 'Pull'
    when k like 'leg%' then 'Legs'
    when k like 'upper%' then 'Upper'
    when k like 'lower%' then 'Lower'
    when k like 'arm%' then 'Arms'
    when k like 'chest%' then 'Chest'
    when k like 'back%' then 'Back'
    when k like 'shoulder%' then 'Shoulders'
    when k like 'cardio%' or k like 'core%' then 'Cardio & Core'
    else 'Full Body' -- e.g. 'Antrenament Ad-hoc'
  end;
end;
$$;

-- Older app versions stored ids from a different numbering, so the same id could mean
-- different exercises. Map every (id, name) pair seen in production to the current library.
create temp table exercise_remap (old_id text, old_name text, new_id text, new_name text);
insert into exercise_remap (old_id, old_name, new_id, new_name) values
  ('ex-001', 'Bench Press',                           'ex-001', 'Barbell Bench Press'),
  ('ex-001', 'Barbell Bench Press',                   'ex-001', 'Barbell Bench Press'),
  ('ex-002', 'Incline Dumbbell Press',                'ex-002', 'Incline Dumbbell Press'),
  ('ex-003', 'Incline Barbell Bench Press',           'ex-003', 'Incline Barbell Bench Press'),
  ('ex-003', 'Cable Flyes',                           'ex-006', 'Cable Flyes (Cross-over)'),
  ('ex-006', 'Cable Flyes (Cross-over)',              'ex-006', 'Cable Flyes (Cross-over)'),
  ('ex-008', 'Barbell Row',                           'ex-013', 'Barbell Bent-Over Row'),
  ('ex-008', 'Chest Dips (Flotări la paralele)',      'ex-008', 'Chest Dips'),
  ('ex-010', 'Push-ups (Flotări la sol)',             'ex-010', 'Push-ups'),
  ('ex-012', 'Lat Pulldown (Tracțiuni la scripete)',  'ex-012', 'Lat Pulldown'),
  ('ex-013', 'Barbell Bent-Over Row',                 'ex-013', 'Barbell Bent-Over Row'),
  ('ex-015', 'Seated Cable Row',                      'ex-015', 'Seated Cable Row'),
  ('ex-018', 'Triceps Pushdown',                      'ex-047', 'Straight Bar Triceps Pushdown'),
  ('ex-021', 'Barbell Back Squat',                    'ex-021', 'Barbell Back Squat'),
  ('ex-021', 'Overhead Press',                        'ex-033', 'Overhead Press (OHP)'),
  ('ex-022', 'Romanian Deadlift (RDL)',               'ex-023', 'Romanian Deadlift (RDL)'),
  ('ex-022', 'Lateral Raise',                         'ex-035', 'Dumbbell Lateral Raises'),
  ('ex-023', 'Leg Press (Presa de picioare)',         'ex-022', 'Leg Press'),
  ('ex-024', 'Bulgarian Split Squat',                 'ex-024', 'Bulgarian Split Squat'),
  ('ex-025', 'Lying Leg Curl (Flexia picioarelor)',   'ex-026', 'Lying Leg Curl'),
  ('ex-026', 'Leg Extension (Extensia picioarelor)',  'ex-025', 'Leg Extension'),
  ('ex-028', 'Standing Calf Raises',                  'ex-030', 'Standing Calf Raises'),
  ('ex-031', 'Overhead Barbell Press (OHP)',          'ex-033', 'Overhead Press (OHP)'),
  ('ex-032', 'Dumbbell Shoulder Press',               'ex-034', 'Seated Dumbbell Shoulder Press'),
  ('ex-033', 'Dumbbell Lateral Raises',               'ex-035', 'Dumbbell Lateral Raises'),
  ('ex-034', 'Face Pulls',                            'ex-037', 'Face Pulls'),
  ('ex-037', 'Dumbbell Rear Delt Fly',                'ex-038', 'Reverse Pec Deck'),
  ('ex-041', 'Barbell Bicep Curl',                    'ex-041', 'Barbell Bicep Curl'),
  ('ex-042', 'Incline Dumbbell Curl',                 'ex-042', 'Incline Dumbbell Curl'),
  ('ex-043', 'Hammer Curls',                          'ex-043', 'Hammer Curl'),
  ('ex-045', 'Preacher Curl',                         'ex-044', 'Preacher Curl'),
  ('ex-047', 'Tricep Rope Pushdown',                  'ex-046', 'Triceps Rope Pushdown'),
  ('ex-048', 'Skull Crushers (Extensii franceze)',    'ex-048', 'Skull Crushers'),
  ('ex-049', 'Close-Grip Bench Press',                'ex-049', 'Close-Grip Bench Press'),
  ('ex-051', 'Hanging Leg Raises',                    'ex-051', 'Hanging Leg Raise'),
  ('ex-053', 'Plank (Scândura)',                      'ex-054', 'Plank'),
  ('ex-061', 'Treadmill Incline Walk / Run',          'ex-057', 'Incline Treadmill Walk');

-- ---------------------------------------------------------------------------
-- weekly_plans: repeating Mon–Sun defaults + routine templates move out
-- ---------------------------------------------------------------------------

create table public.routine_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  split text not null check (split in ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest',
                                       'Back', 'Shoulders', 'Cardio & Core', 'Full Body')),
  exercise_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, split)
);

-- Template rows were keyed by day_of_week 100–110; the JSON also carries the split name.
insert into public.routine_templates (user_id, split, exercise_ids, updated_at)
select distinct on (wp.user_id, t.split)
  wp.user_id,
  t.split,
  coalesce(
    (
      select array_agg(x.id order by x.ord)
      from (
        select distinct on (coalesce(m.new_id, e ->> 'id')) coalesce(m.new_id, e ->> 'id') as id, ord
        from jsonb_array_elements(
               case when left(btrim(wp.workout_name), 1) = '{'
                    then coalesce((wp.workout_name::jsonb) -> 'exercises', '[]'::jsonb)
                    else '[]'::jsonb end
             ) with ordinality as el (e, ord)
        left join exercise_remap m on m.old_id = e ->> 'id' and m.old_name = e ->> 'name'
        where e ->> 'id' is not null
        order by coalesce(m.new_id, e ->> 'id'), ord
      ) x
    ),
    '{}'
  ),
  coalesce(wp.created_at, now())
from public.weekly_plans wp
cross join lateral (
  select coalesce(
    pg_temp.normalize_split(wp.workout_name),
    (array['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Chest', 'Back', 'Shoulders',
           'Cardio & Core', 'Full Body'])[wp.day_of_week - 99]
  ) as split
) t
where wp.day_of_week between 100 and 110
  and t.split is not null
  and t.split <> 'Rest Day'
order by wp.user_id, t.split, wp.created_at desc nulls last;

delete from public.weekly_plans where day_of_week not between 0 and 6;

alter table public.weekly_plans add column split text;
update public.weekly_plans set split = coalesce(pg_temp.normalize_split(workout_name), 'Rest Day');

-- Keep the newest row per (user, day)
delete from public.weekly_plans wp
using public.weekly_plans newer
where newer.user_id = wp.user_id
  and newer.day_of_week = wp.day_of_week
  and (newer.created_at, newer.id) > (wp.created_at, wp.id);

alter table public.weekly_plans
  alter column split set not null,
  alter column workout_name drop not null,
  add constraint weekly_plans_split_check check (split in ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms',
    'Chest', 'Back', 'Shoulders', 'Cardio & Core', 'Full Body', 'Rest Day')),
  add constraint weekly_plans_day_of_week_check check (day_of_week between 0 and 6),
  add constraint weekly_plans_user_day_key unique (user_id, day_of_week);

-- ---------------------------------------------------------------------------
-- workout_logs: one typed row per user per day
-- ---------------------------------------------------------------------------

alter table public.workout_logs
  add column split text,
  add column finished_at timestamptz;

-- Rows without a split of their own (e.g. '{"split":null,...}') follow that weekday's default.
update public.workout_logs l
set split = coalesce(
  pg_temp.normalize_split(l.workout_name),
  (select wp.split from public.weekly_plans wp
    where wp.user_id = l.user_id and wp.day_of_week = extract(isodow from l.date)::int - 1),
  'Rest Day'
);

-- Merge duplicate days: keep the row with the most sets, move the other rows' sets onto it.
create temp table log_keepers as
select l.id, first_value(l.id) over (
  partition by l.user_id, l.date
  order by (select count(*) from public.workout_sets s where s.workout_log_id = l.id) desc, l.created_at, l.id
) as keeper_id
from public.workout_logs l;

update public.workout_sets s
set workout_log_id = k.keeper_id
from log_keepers k
where s.workout_log_id = k.id and k.id <> k.keeper_id;

delete from public.workout_logs l
using log_keepers k
where l.id = k.id and k.id <> k.keeper_id;

alter table public.workout_logs
  alter column split set not null,
  alter column workout_name drop not null,
  add constraint workout_logs_split_check check (split in ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms',
    'Chest', 'Back', 'Shoulders', 'Cardio & Core', 'Full Body', 'Rest Day')),
  add constraint workout_logs_user_date_key unique (user_id, date);

-- ---------------------------------------------------------------------------
-- workout_sets: canonical exercises, clean numbering, sane values
-- ---------------------------------------------------------------------------

update public.workout_sets s
set exercise_id = m.new_id, exercise_name = m.new_name
from exercise_remap m
where s.exercise_id = m.old_id and s.exercise_name = m.old_name;

update public.workout_sets s
set set_number = r.rn
from (
  select id, row_number() over (partition by workout_log_id, exercise_id order by set_number, created_at, id) as rn
  from public.workout_sets
) r
where s.id = r.id and s.set_number is distinct from r.rn;

update public.workout_sets set is_completed = false where is_completed is null;
update public.workout_sets set actual_reps = 0 where actual_reps is null or actual_reps < 0;
update public.workout_sets set actual_weight = 0 where actual_weight is null or actual_weight < 0;

alter table public.workout_sets
  alter column is_completed set not null,
  alter column actual_reps set default 0,
  alter column actual_reps set not null,
  alter column actual_weight set default 0,
  alter column actual_weight set not null,
  add constraint workout_sets_set_number_check check (set_number > 0),
  add constraint workout_sets_actual_reps_check check (actual_reps between 0 and 1000),
  add constraint workout_sets_actual_weight_check check (actual_weight between 0 and 1000);

create index workout_sets_workout_log_id_idx on public.workout_sets (workout_log_id);

-- ---------------------------------------------------------------------------
-- Deleting a user removes their data
-- ---------------------------------------------------------------------------

alter table public.workout_logs
  drop constraint workout_logs_user_id_fkey,
  add constraint workout_logs_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.weekly_plans
  drop constraint weekly_plans_user_id_fkey,
  add constraint weekly_plans_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- RLS: `(select auth.uid())` is evaluated once per statement instead of once per row
-- ---------------------------------------------------------------------------

drop policy "Users can manage their own weekly plans" on public.weekly_plans;
create policy "Users can manage their own weekly plans" on public.weekly_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "Users can manage their own workout logs" on public.workout_logs;
create policy "Users can manage their own workout logs" on public.workout_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "Users can manage their own workout sets" on public.workout_sets;
create policy "Users can manage their own workout sets" on public.workout_sets
  for all to authenticated
  using (exists (select 1 from public.workout_logs l
                 where l.id = workout_sets.workout_log_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.workout_logs l
                      where l.id = workout_sets.workout_log_id and l.user_id = (select auth.uid())));

alter table public.routine_templates enable row level security;
create policy "Users can manage their own routine templates" on public.routine_templates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Cleanup
-- ---------------------------------------------------------------------------

drop table log_keepers;
drop table exercise_remap;
drop function pg_temp.normalize_split(text);
