-- ============================================================
-- MMC Central — Site Settings: Add missing columns
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS address          TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url     TEXT;

-- Set sensible defaults for existing row
UPDATE public.site_settings
SET
  meta_description = COALESCE(meta_description, 'Premium bakery & catering in Riyadh. Authentic ingredients, bold flavors — crafted to make a statement.'),
  address          = COALESCE(address,          'Based in Riyadh, we deliver the finest bakery items right to your door.'),
  facebook_url     = COALESCE(facebook_url,      NULL)
WHERE id = 1;
