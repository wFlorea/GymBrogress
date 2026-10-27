-- The weight plan (cut, maintain or bulk) and how far a cut or bulk moves the daily calories, in % (NULL = not set).
ALTER TABLE public.user_settings
  ADD COLUMN weight_plan TEXT CHECK (weight_plan IN ('cut', 'maintain', 'bulk')),
  ADD COLUMN plan_pace INTEGER CHECK (plan_pace IN (5, 10, 15, 20));
