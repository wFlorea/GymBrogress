-- Body fat percentage and activity level, next to the other body stats (NULL = not set).
ALTER TABLE public.user_settings
  ADD COLUMN body_fat DECIMAL CHECK (body_fat BETWEEN 5 AND 50),
  ADD COLUMN activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very', 'extra'));
