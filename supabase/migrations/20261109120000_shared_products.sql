-- Packaged foods people add when a barcode isn't found. All nutrition is per 100 g.

-- Approved products, used by everyone. They hold no personal data, so they outlive the account that sent them.
-- Only the review page writes here, with the service role key.
CREATE TABLE public.shared_products (
  barcode TEXT PRIMARY KEY CHECK (barcode ~ '^([0-9]{8}|[0-9]{13})$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  calories NUMERIC NOT NULL CHECK (calories BETWEEN 0 AND 900),
  protein NUMERIC NOT NULL CHECK (protein BETWEEN 0 AND 100),
  carbs NUMERIC NOT NULL CHECK (carbs BETWEEN 0 AND 100),
  fat NUMERIC NOT NULL CHECK (fat BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products waiting for review. Reviewing removes the row and its photos, so everything here is still waiting.
CREATE TABLE public.product_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL CHECK (barcode ~ '^([0-9]{8}|[0-9]{13})$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  calories NUMERIC NOT NULL CHECK (calories BETWEEN 0 AND 900),
  protein NUMERIC NOT NULL CHECK (protein BETWEEN 0 AND 100),
  carbs NUMERIC NOT NULL CHECK (carbs BETWEEN 0 AND 100),
  fat NUMERIC NOT NULL CHECK (fat BETWEEN 0 AND 100),
  -- Paths in the product-photos bucket.
  front_photo TEXT NOT NULL,
  label_photo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, barcode)
);

ALTER TABLE public.shared_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read shared products" ON public.shared_products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can read their own product submissions" ON public.product_submissions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can add their own product submissions" ON public.product_submissions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.shared_products, public.product_submissions FROM anon;
GRANT SELECT ON public.shared_products TO authenticated;
GRANT SELECT, INSERT ON public.product_submissions TO authenticated;

-- The photos: private, and only read through short-lived links on the review page.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-photos', 'product-photos', false, 1048576, ARRAY['image/jpeg']);

CREATE POLICY "Users can upload product photos to their own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
