-- Supabase gives signed-in users every permission on new tables by default. Row level security already blocks the rest;
-- this leaves only what the app uses. The review page and the cleanup job use the service role key.
REVOKE ALL ON public.shared_products, public.product_submissions FROM authenticated;
GRANT SELECT ON public.shared_products TO authenticated;
GRANT SELECT, INSERT ON public.product_submissions TO authenticated;
