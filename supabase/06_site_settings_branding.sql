-- ============================================================
-- MMC Central — Site Settings: Add favicon_url column
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Clear any local file paths that were set as defaults.
-- The site keeps its built-in files until a real image is
-- uploaded via the admin panel (must start with https://).
UPDATE public.site_settings
SET
  logo_url       = NULL,
  favicon_url    = NULL,
  hero_image_url = NULL
WHERE id = 1;
