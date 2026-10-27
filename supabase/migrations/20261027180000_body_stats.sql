-- Body stats and goal weight (v1.1): weight, height and age for the BMI on the dashboard, and the weight
-- the user is aiming for. NULL means not entered.

ALTER TABLE public.user_settings
  ADD COLUMN weight_kg DECIMAL CHECK (weight_kg BETWEEN 20 AND 400),
  ADD COLUMN height_cm DECIMAL CHECK (height_cm BETWEEN 100 AND 250),
  ADD COLUMN age INTEGER CHECK (age BETWEEN 13 AND 120),
  ADD COLUMN goal_weight_kg DECIMAL CHECK (goal_weight_kg BETWEEN 20 AND 400);
