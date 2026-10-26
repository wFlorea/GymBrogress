# GymBrogress

Fitness PWA: a workout schedule, a routine per workout type (split), a set-by-set workout tracker
with a rest timer, streaks and gym history.
Planned: BMR calculator, weight goals with a deadline, calorie and macro recommendations.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/postcss, no tailwind.config); theme tokens live in `@theme` in `src/app/globals.css`
- Supabase (auth + DB) via @supabase/ssr — clients in `src/utils/supabase/` (client.ts, server.ts, auth-user.ts)
- Icons: lucide-react
- Package manager: **pnpm** (not npm/yarn)

## Structure
- `src/app/<route>/page.tsx` = server component; `*Client.tsx` = interactive UI; `actions.ts` = server actions
- Routes: dashboard, schedule, plan, tracker, exercises, profile, login
- `src/lib/types.ts` = shared types; feature constants and helpers sit next to it:
  `splits.ts`, `routines.ts`, `exercises-data.ts` (static exercise list), `date.ts`, `schedule.ts`, `streak.ts`, `sets.ts`, `format.ts`
- `src/lib/data/` = server-only data access (session, plans, workouts) and `ActionResult` helpers for server actions
- `src/components/ui/` = shared UI (Page, Card, Alert, Modal, SubmitButton, button/input styles);
  `ExerciseBrowser.tsx` = searchable exercise list; `BottomNav.tsx` = bottom navigation (mobile-first)
- `src/proxy.ts` = refreshes the Supabase session and protects routes (Next 16 replacement for middleware)
- `supabase-schema.sql` = current DB schema; `supabase/migrations/` = changes to apply (update both when tables change)

## Commands
- `pnpm dev`, `pnpm build`, `pnpm lint`

## Working rules
- Don't read `node_modules/`, `.next/`, `pnpm-lock.yaml`, and never read `.env.local`.
- Read only the files relevant to the task; don't explore the whole project.
- Follow the existing page.tsx → *Client.tsx → actions.ts pattern when adding features.
- Reuse the types from `src/lib/types.ts` instead of redefining them.
- Server actions return `ActionResult` and validate their input; dates are `YYYY-MM-DD` strings, and "today" comes from `getToday()`.
- Mobile-first design; keep the existing visual style and use the theme tokens (`bg-surface`, `text-muted`, `text-primary`…) instead of hex colours.
- The UI is in English.
- After changes: run `pnpm lint` (and `pnpm build` for big changes).
- Keep answers short: show what changed, don't rewrite whole files without need.
