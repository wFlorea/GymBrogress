-- Food search (v1.1): foods picked from the food database remember how many grams were eaten,
-- so they can be edited by amount. NULL for foods typed in by hand.

ALTER TABLE public.food_entries
  ADD COLUMN grams DECIMAL CHECK (grams > 0 AND grams <= 5000);
