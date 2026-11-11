# GymBrogress

Fitness PWA: a workout schedule, a routine per workout type (split), a set-by-set workout tracker
with a rest timer, streaks, gym history, a food log with barcode scanning and calorie and macro goals, and body stats (BMI, body fat, sex, activity level)
with a goal weight and weekly weigh-ins; the body stats set the daily calorie and macro goals (Mifflin–St Jeor BMR × activity level).
Settings: rest timer on/off and length, kg or lb (weights are always stored in kg), a Monday weigh-in push reminder, data export, removing body data, account deletion.
Planned: photo scanning of meals (v1.7), weight goals with a deadline.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/postcss, no tailwind.config); theme tokens live in `@theme` in `src/app/globals.css`
- Supabase (auth + DB) via @supabase/ssr — clients in `src/utils/supabase/` (client.ts, server.ts, auth-user.ts;
  admin.ts = service-role client, server-only, for the crons and account deletion)
- Push reminders via web-push; `public/sw.js` = service worker; `src/app/api/cron/weight-reminder` runs on a Monday Vercel cron
- `src/app/api/cron/cleanup` runs on a Sunday Vercel cron and deletes old unused data (see `retention.ts`)
- Tests: vitest (`*.test.ts` next to the code)
- Icons: lucide-react
- Package manager: **pnpm** (not npm/yarn)

## Structure
- `src/app/<route>/page.tsx` = server component; `*Client.tsx` = interactive UI; `actions.ts` = server actions
- Routes: dashboard, schedule, plan, tracker, food, exercises, progress, profile, settings, password, login, welcome, privacy, terms,
  auth/confirm (email links), api/account/export, api/cron/weight-reminder, api/cron/cleanup
- `src/app/tracker/outbox.ts` = queues set changes in localStorage so the tracker works offline; `hooks.ts` = rest timer and set saving
- `src/app/food/BarcodeScan.tsx` = barcode screen; `scanner.ts` = camera + barcode-detector (the phone's own reader, or ZXing WebAssembly loaded from jsDelivr);
  `AddProductForm.tsx` + `photos.ts` = sends in a product whose barcode wasn't found (photos go straight from the browser to the private `product-photos` bucket)
- `src/app/admin/products` = review page for sent-in products, only for the `ADMIN_EMAIL` account; approved ones land in `shared_products` and are found by every user's scan
- `src/lib/types.ts` = shared types; feature constants and helpers sit next to it:
  `splits.ts`, `routines.ts`, `exercises-data.ts` (static exercise list), `date.ts`, `schedule.ts`, `streak.ts`, `sets.ts` (set limits, rest timer options, 1RM), `format.ts`, `site.ts` (the live URL),
  `units.ts` (kg/lb conversion), `push.ts` (push endpoints, reminder timing),
  `nutrition.ts` (meals, macros, calorie maths, macro split from calories, weight plans and paces), `body.ts` (BMI, body stat limits, sex, activity levels, BMR and daily calories), `foods-data.ts` (built-in common foods per 100 g, from USDA FoodData Central), `barcode.ts` (barcode validation), `products.ts` (sent-in product validation), `legal.ts` (operator details, policy dates and version, the body-data consent key), `retention.ts` (how long unused data is kept)
- `src/lib/data/` = server-only data access (session, plans, workouts, food, settings, weight, progress, `open-food-facts.ts` product search and barcode lookup, `products.ts` products added through the app, `consent.ts` body-data consent, kept in the auth `user_metadata`)
  and `ActionResult` helpers for server actions
- `src/components/ui/` = shared UI (Page, Card, Alert, Modal, SubmitButton, Switch, MenuLink, LineChart, Meter, button/input styles);
  `WeightForm.tsx` = weigh-in form; `LegalPage.tsx` = layout of the Privacy and Terms pages and the links to them; `HealthConsent.tsx` = body-data consent box;
  `ExerciseBrowser.tsx` = searchable exercise list; `BottomNav.tsx` = bottom navigation (mobile-first);
  `GoalsForm.tsx` = goals sheet, with `PlanSlider.tsx` (cut/maintain/bulk) and `PaceDial.tsx` (circle slider for the pace)
- `src/proxy.ts` = refreshes the Supabase session and protects routes (Next 16 replacement for middleware)
- `supabase-schema.sql` = current DB schema; `supabase/migrations/` = changes to apply (update both when tables change)

## Commands
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`

## Working rules
- Don't read `node_modules/`, `.next/`, `pnpm-lock.yaml`, and never read `.env.local`.
- Read only the files relevant to the task; don't explore the whole project.
- Follow the existing page.tsx → *Client.tsx → actions.ts pattern when adding features.
- Reuse the types from `src/lib/types.ts` instead of redefining them.
- Server actions return `ActionResult` and validate their input; dates are `YYYY-MM-DD` strings, and "today" comes from `getToday()`.
- Mobile-first design; keep the existing visual style and use the theme tokens (`bg-surface`, `text-muted`, `text-primary`…) instead of hex colours. White text goes on `bg-primary-solid`, not `bg-primary`, and inputs get `border-control`, so the contrast stays readable.
- The UI is in English.
- Weights are kept in kg; show and read them in the user's unit with `formatWeight`/`weightText`/`toKg` (`settings.weightUnit`).
- After changes: run `pnpm lint` and `pnpm test` (and `pnpm build` for big changes).
- Versions: each release bumps `version` in `package.json` (features → `1.1.0`, fixes only → `1.1.1`) and gets an
  entry in `CHANGELOG.md`; the release commit is tagged `v1.1` / `v1.1.1`. The version shows on the Profile page (`src/lib/version.ts`).
- Keep answers short: show what changed, don't rewrite whole files without need.
