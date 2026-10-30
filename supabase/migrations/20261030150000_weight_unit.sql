-- How weights are shown and typed (kg or lb); they're always stored in kg.
ALTER TABLE public.user_settings
  ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb'));
