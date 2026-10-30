# GymBrogress

**Just your (above) average gym app.**

GymBrogress is a mobile-first fitness app for people who train on a split. You plan which workout you do on each
day, build a routine for every split, and log your workouts set by set with a rest timer. Streaks, a gym-history
calendar and per-exercise progress charts show how you're doing over time. It installs on your phone's home screen
as a PWA and works like a native app.

## Features

### Plan your training
- **Schedule:** pick a split for each weekday (Push, Pull, Legs, Upper, Lower, Full Body, Rest Day and more).
  The week repeats on its own, and you can change any single date without touching the rest.
- **Routines:** build a routine for every split from the exercise library. Set how many sets each exercise
  gets, and drag routines and exercises into the order you want.
- **Exercise library:** 130+ exercises you can search by name or filter by muscle group, each with a
  short description of how to do it.

### Log your workouts
- **Workout tracker:** today's routine opens ready to go. Every set is prefilled with the reps and weight
  you lifted last time, so you only change what's different.
- **Rest timer:** ticking off a set starts a rest timer (90 seconds unless you pick 1 to 3 minutes in Settings, or
  turn it off), and your phone vibrates when it's done.
- **Works without signal:** sets you log in a basement gym are kept on your phone and sent once you're back online.
- **Personal bests:** a note pops up when a set beats the heaviest weight you've lifted on that exercise.
- **Stays in sync with your plan:** if you edit a routine, "Sync with plan" adds or removes exercises and
  sets in today's workout to match it.
- **Workout summary:** when you finish a workout, you see how many sets you completed and your total volume.

### Track what you eat
- **Food search:** search for what you ate, type in how many grams you had, and the calories and macros are
  filled in. Everyday foods (160+ staples like oats, rice, chicken and eggs) come built in from
  [USDA FoodData Central](https://fdc.nal.usda.gov/); packaged and branded products come from
  [Open Food Facts](https://world.openfoodfacts.org/).
- **Food log:** add foods to breakfast, lunch, dinner or snacks, or type one in by hand with its calories, protein,
  carbs and fat (leave the calories empty and they're worked out from the macros). Recent foods can be added again
  in a tap, and earlier days can be filled in later.
- **Meals again:** copy a meal from the day before in one tap, or save a meal under a name and log it again later.
- **Water:** log glasses of water against a daily goal from your weight.
- **Goals:** your daily calories are worked out from your body (Mifflin–St Jeor BMR times your activity level), and a
  plan to cut, maintain or bulk at one of four paces moves them up or down. The macros fill in by themselves (2 g of
  protein per kg you weigh, 25% of the calories from fat, the rest from carbs); change a macro and the calories
  follow. The food log shows what you have left for the day.
- **Body and BMI:** add your weight, height and age on the dashboard to see your BMI next to your goal weight.
  Set your body fat on a dial with a figure that fills out as it goes up, and pick one of five activity levels.
- **Weekly weigh-in:** log your weight once a week, with an optional Monday reminder on your phone. After a month,
  the dashboard and Profile chart it against your goal weight.

### See your progress
- **Dashboard:** a greeting, your current streak, a chart of the sets you've done this week, today's workout,
  today's calories, and your BMI and goal.
- **Streaks:** every day you train adds to your streak. Rest days don't break it, and each month you get
  3 automatic "restores" for workouts you miss.
- **Gym history:** a monthly calendar that marks every day you trained, plus your total workouts and sets.
- **Progress charts:** for each exercise, a chart of the heaviest set from every workout, your personal
  best, your estimated one-rep max, and how much you've gained since your first workout. Pin the lifts you care
  about most so they appear at the top.
- **Sets per muscle group:** how many sets each muscle group got in the last 7 days, and which got none.

### Settings
- Turn the rest timer off or change its length, show weights in kg or lb, and turn on the Monday weigh-in reminder.
- Change your password, download all your data as a JSON file, or delete your account.

### Getting started in the app
- New visitors see a few welcome slides before they create an account or sign in.
- Accounts use email and password; a forgotten password can be reset by email.

## Planned
- Barcode scanning for packaged foods
- Photo scanning of meals, with grams you can correct
- Weight goals with a deadline

## Tech stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, with the theme tokens in `src/app/globals.css` |
| Backend | [Supabase](https://supabase.com) for auth and the Postgres database, with row-level security on every table |
| UI | lucide-react icons, @dnd-kit for drag and drop |
| Notifications | Web Push (web-push) with a service worker, sent by a weekly Vercel cron |
| Tests | Vitest |
| Package manager | pnpm |

## Running it locally

**Prerequisites:** Node.js 20+, pnpm, and a Supabase project.

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Add your Supabase keys.** Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   These are optional; without them the app still runs:
   ```
   # Deleting an account and the weekly reminder (Supabase → Project Settings → API keys). Server-only.
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # The Monday weigh-in reminder: keys from `pnpm exec web-push generate-vapid-keys`
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   # Any long random string; Vercel sends it to the cron route
   CRON_SECRET=your-cron-secret
   ```

3. **Set up the database.** For a new project, run `supabase-schema.sql` in the Supabase SQL editor.
   If your database was set up with an older schema, apply the files in `supabase/migrations/` in order instead.

4. **Start the dev server**
   ```bash
   pnpm dev
   ```
   Then open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the development server |
| `pnpm build` | Builds the app for production |
| `pnpm start` | Serves the production build |
| `pnpm lint` | Runs ESLint |
| `pnpm test` | Runs the tests (Vitest) |

## Project structure

```
src/
├── app/                 # One folder per screen: page.tsx (server), *Client.tsx (interactive UI), actions.ts (server actions)
│   ├── welcome/         # Welcome slides for new visitors
│   ├── login/           # Sign in, sign up and forgotten passwords
│   ├── password/        # Set a new password
│   ├── auth/confirm/    # Opens the links in Supabase's emails
│   ├── dashboard/       # Home: streak, weekly chart, today's workout, BMI and goals
│   ├── schedule/        # Which split you train on each day
│   ├── plan/            # Routines for each split
│   ├── tracker/         # Set-by-set workout logging and rest timer
│   ├── exercises/       # Exercise library
│   ├── progress/        # Per-exercise progress charts
│   ├── food/            # Food log, food search and daily calorie and macro goals
│   ├── profile/         # Stats, weigh-ins, gym-history calendar, sign out
│   ├── settings/        # Rest timer, units, reminder, password, data export, account deletion
│   └── api/             # Data export and the weekly reminder cron
├── components/          # Bottom navigation, exercise browser and shared UI (cards, modals, buttons, sortable lists)
├── lib/                 # Shared types and logic (dates, streaks, splits, routines, exercise list)
│   └── data/            # Server-only data access
├── utils/supabase/      # Supabase clients for the browser and the server, and a server-only admin client
└── proxy.ts             # Refreshes the session and protects signed-in pages
public/sw.js             # Service worker for the push reminder
```
