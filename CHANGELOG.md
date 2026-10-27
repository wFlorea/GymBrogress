# Changelog

Every release of GymBrogress, newest first. The version number lives in `package.json` and shows at the
bottom of the Profile page.

- **New features** raise the middle number: v1.1, v1.2, …
- **Fixes only** raise the last number: v1.1.1, v1.1.2, …
- **A big overhaul** raises the first number: v2.0

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
