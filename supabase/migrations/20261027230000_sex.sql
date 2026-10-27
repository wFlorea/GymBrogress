-- Sex, for the BMR behind the recommended daily calories (NULL = not set).
ALTER TABLE public.user_settings
  ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));
