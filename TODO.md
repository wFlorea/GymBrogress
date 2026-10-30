# TODO

What's next for GymBrogress, most important first. Tick items off as they land; shipped work goes in `CHANGELOG.md`.

## Next release: weekly weigh-in (v1.4)

The weigh-in, the Monday reminder and the bigger exercise library are built but not released. The live database
already has `weight_logs` and `push_subscriptions`.

- [ ] Apply the new migrations to the live database, in order, before deploying (the app's code needs them):
      `20261030120000_push_time_zone.sql`, `20261030130000_rest_timer.sql`,
      `20261030140000_saved_meals_water.sql`, `20261030150000_weight_unit.sql`
- [ ] Set the env vars on Vercel: `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase Auth → URL Configuration: add `https://gym.florea.lol/**` and `http://localhost:3000/**` to the
      redirect URLs (password reset links)
- [ ] Supabase Auth → Email Templates → Reset Password: link to
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/password`, so the link also works
      when the email opens in another browser than the app
- [ ] Try the reminder on a phone: Android Chrome, and an iPhone with the app added to the Home Screen
- [ ] Bump `version` in `package.json` to `1.4.0` and add a `CHANGELOG.md` entry
- [ ] README: add the weigh-in, the reminder and the new env vars; say 130+ exercises; drop the shipped items
      (BMR calculator, calorie recommendations) from Planned
- [x] CLAUDE.md: add `src/lib/data/weight.ts`, `src/lib/push.ts`, `src/utils/supabase/admin.ts`, `src/app/api/cron/`
      and `public/sw.js`; move barcode scanning to v1.5 and photo scanning to v1.6
- [ ] Commit and tag `v1.4`

## Fixes

- [x] **Forgot password:** add a reset link on the login page (Supabase `resetPasswordForEmail`) and a page to set a
      new password
- [x] **Theme tokens:** replace the `zinc-*` colours with tokens in `PushReminder`, `BodyForm`, `PlanClient`,
      `loading.tsx`, `GymHistoryCalendar`, `WeightHistory` and the dashboard page
- [x] **Migration history:** check that `20261026170000_drop_legacy_columns.sql` is applied on the live database;
      it's missing from its migration list (done: the columns are gone, it just wasn't recorded)
- [ ] **Leaked passwords:** turn on leaked password protection in Supabase (Auth settings); needs the Pro plan (on Free now)
- [x] **Reminder time:** the reminder goes out at 07:00 UTC for everyone; send it in the morning of each user's own
      time zone (done for Hobby: each device's time zone is saved, and the Monday run skips devices where it's night
      or not Monday yet; a second Monday cron, around 15:00 UTC, would also reach the Americas)

## Planned features

- [ ] **Barcode scanning** (v1.5): scan a packaged food and look it up on Open Food Facts
- [ ] **Photo scanning of meals** (v1.6): recognise the food in a photo, with grams you can correct
- [ ] **Weight goals with a deadline:** reach the goal weight by a date, and the pace follows from it

## Upgrades

- [x] **Rest timer:** turn it off, or pick how long it runs, on a new Settings page (gear on Profile), which also
      holds the weekly reminder and a Change password link
- [x] **Offline tracker:** keep logging sets without signal and sync them when back online (done: set changes wait
      on the phone and go out in order; adding a new exercise, syncing with the plan and finishing still need signal,
      and the tracker page itself still needs signal to open)
- [x] **Account:** delete your account and export your data (Settings; deleting needs `SUPABASE_SERVICE_ROLE_KEY`)
- [x] **Weight trend:** a chart of the weigh-ins and how far you are from the goal weight, on the dashboard (after 4 check-ins, like Profile; the goal is a dashed line)
- [x] **Progress:** estimated 1RM, volume per muscle group, and a celebration for a new PR (1RM on each exercise page; sets per muscle group over 7 days on Progress; a note in the tracker when a set beats the heaviest weight so far)
- [x] **Food:** copy yesterday's meals, saved meals, water tracking
- [x] **Units:** a kg/lbs toggle (in Settings; weights are still stored in kg)
- [x] **Tests:** start with the maths in `nutrition.ts`, `body.ts`, `streak.ts` and `date.ts` (vitest, `pnpm test`; also `units.ts`, `sets.ts`, `push.ts` and the tracker outbox)
