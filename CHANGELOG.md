# Changelog

Every release of GymBrogress, newest first. The version number lives in `package.json` and shows at the
bottom of the Profile page.

- **New features** raise the middle number: v1.1, v1.2, …
- **Fixes only** raise the last number: v1.1.1, v1.1.2, …
- **A big overhaul** raises the first number: v2.0

## v1.4 (2026-10-30)

A weekly weigh-in, a Settings page, a tracker that works without signal, and more for your food log and progress.

- **Weekly weigh-in:** a card on the dashboard asks for this week's weight (one tap if it hasn't changed). It becomes
  your current weight, so your BMI and daily goals follow it. Profile shows every weigh-in, with a chart.
- **Monday reminder:** turn on a push notification in Settings and you get a nudge on Monday while the week's weight
  isn't in. It only arrives in the daytime where you are, never at night.
- **Weight trend:** after 4 weigh-ins, the dashboard charts your weight with your goal as a dashed line, and shows how
  much of the way to the goal you've come.
- **Settings:** a new page behind the gear on Profile.
  - **Rest timer:** turn it off, or pick 1, 1½, 2 or 3 minutes.
  - **Units:** show every weight in kg or lb, for lifts and body weight alike.
  - **Account:** change your password, download all your data as a JSON file, or delete your account.
- **Forgot password:** the sign-in page emails you a link to set a new one.
- **Tracker without signal:** sets you log, change or tick off are kept on your phone and sent once you're back
  online, even if you closed the app in between. A banner shows how many are waiting.
- **Personal bests:** the tracker pops up a note when a set beats the heaviest weight you've lifted on that exercise.
- **Estimated 1RM:** each exercise's progress page shows your estimated one-rep max (Epley, from sets of 12 reps or
  fewer), for every workout too.
- **Sets per muscle group:** Progress shows the sets each muscle group got in the last 7 days, and which got none.
- **Food:** copy a meal from the day before in one tap, save a meal under a name to log it again in one tap, and track
  your water against a goal from your weight, a 250 ml glass at a time.
- **Exercise library:** 64 more exercises, 132 in all.

## v1.3.2 (2026-10-27)

- **Body fat figure:** pick Female in your details and the figure in the body fat dial turns into a woman, with
  shoulder-length hair, a waist and wider hips; it still fills out as the % goes up.

## v1.3.1 (2026-10-27)

- **Weight plan:** when your maintenance can't be worked out yet (no sex picked, say), the goals sheet now says
  exactly what's missing, with a button to add it, instead of leaving the calories as they were without a word.

## v1.3 (2026-10-27)

Daily calories worked out from your body, and a plan to cut, maintain or bulk.

- **Sex:** pick male or female in your details.
- **Daily calories:** once your weight, height, age, sex and activity level are in, your details show the calories
  you burn in a day: your BMR (Mifflin–St Jeor: 10 × kg + 6.25 × cm − 5 × age, +5 for men, −161 for women) times
  your activity level (1.2 sedentary, 1.375 lightly, 1.55 moderately, 1.725 very, 1.9 extra active), to the
  nearest 100 kcal.
- **Goals set for you:** saving your details sets that as your daily calorie goal, with the macros from it: 2 g of
  protein per kg you weigh, 25% of the calories from fat and the rest from carbs. You can still change them under Goal.
- **Weight plan:** under Goal, slide between Cut, Maintain and Bulk. Maintain eats your maintenance; Cut and Bulk open
  a pace dial with four speeds (snail 5%, fox 10%, rabbit 15%, cheetah 20% under or over your maintenance), which
  fills in the calories and macros and shows about how many kg a week you'd lose or gain.

## v1.2.1 (2026-10-27)

- **Search engines:** the site now has a robots.txt and a sitemap, a clearer title and description, and tells
  Google its name (GymBrogress, also known as Gym Florea), so it can show up when people search for it.
- **Link previews:** sharing the link in a chat shows the app's name, description and icon.

## v1.2 (2026-10-27)

More about your body, ready for calorie recommendations later.

- **Body fat:** set your body fat (5–50%) by dragging a dot around a ring. The figure in the middle fills out as
  the number goes up, with its arms always beside the body. Arrow keys work too, and Clear removes it.
- **Activity level:** pick how active you are, from Sedentary (desk job, minimal movement) to Extra active
  (intense daily training or a physical job).
- **BMI card:** now shows your body fat next to your weight, height and age, plus your activity level.

## v1.1 (2026-10-27)

The food log, the first step towards calorie tracking.

- **Food search:** search for a food, type in exactly how many grams you had, and its calories and macros are
  worked out for you.
  - 160+ everyday foods are built in, from USDA FoodData Central, so they show up instantly.
  - Packaged and branded products come from Open Food Facts.
- **Food tab:** log foods to breakfast, lunch, dinner or snacks. A food that isn't in the database can be typed in
  by hand; leave the calories empty and they're counted from the macros (4 kcal per gram of protein and carbs, 9 per gram of fat).
- **Recent foods:** foods you've logged before are at the top of the search, with the amount you had last time.
- **Edit and delete:** tap a food to change the amount, move it to another meal or delete it.
- **Other days:** step back through earlier days to see or fill them in.
- **Goals:** pick a goal weight and a daily calorie goal. Type in the calories and the macros fill in by themselves:
  2 g of protein per kg you weigh, 25% of the calories from fat and the rest from carbs. Change a macro and the
  calories follow. The bars on the Food tab show what you have left.
- **Body and BMI:** add your weight, height and age on the dashboard to see your BMI and where it sits on the scale,
  next to your goal weight.
- **Dashboard:** a card with today's calories that opens the food log.

## v1.0 (2026-10-27)

The first numbered version: everything in the app when it went out to testers.

- **Welcome and accounts:** welcome slides for new visitors, then sign up or sign in with email and password.
- **Schedule:** a split for each weekday that repeats every week, with one-off changes to single dates.
- **Routines:** a routine for every split, with sets per exercise and drag-and-drop ordering.
- **Exercise library:** 60+ exercises with search, muscle-group filters and technique tips.
- **Workout tracker:** set-by-set logging prefilled from your last workout, a rest timer that vibrates when
  it's done, syncing with the plan, and a summary when you finish.
- **Dashboard:** streak, this week's sets and today's workout.
- **Progress:** pinned lifts and a chart of the heaviest set from every workout.
- **Profile:** workout stats and a gym-history calendar.
- **Feel:** installs as an app on your phone (PWA), with page transitions and springy animations.
