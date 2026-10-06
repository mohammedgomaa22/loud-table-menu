-- ============================================================
-- MMC Central — Section Links & Visibility Toggle Controls
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_visible               BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_cta_primary_url       TEXT DEFAULT '#menu',
  ADD COLUMN IF NOT EXISTS hero_cta_secondary_url     TEXT DEFAULT '#contact',
  ADD COLUMN IF NOT EXISTS catering_visible           BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS catering_cta_primary_url   TEXT DEFAULT '#contact',
  ADD COLUMN IF NOT EXISTS catering_cta_secondary_url TEXT DEFAULT '#menu',
  ADD COLUMN IF NOT EXISTS menu_visible               BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_visible            BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS about_visible              BOOLEAN DEFAULT true;

-- Update row 1 with sensible defaults if null
UPDATE public.site_settings
SET
  hero_visible               = COALESCE(hero_visible, true),
  hero_cta_primary_url       = COALESCE(hero_cta_primary_url, '#menu'),
  hero_cta_secondary_url     = COALESCE(hero_cta_secondary_url, '#contact'),
  catering_visible           = COALESCE(catering_visible, true),
  catering_cta_primary_url   = COALESCE(catering_cta_primary_url, '#contact'),
  catering_cta_secondary_url = COALESCE(catering_cta_secondary_url, '#menu'),
  menu_visible               = COALESCE(menu_visible, true),
  contact_visible            = COALESCE(contact_visible, true),
  about_visible              = COALESCE(about_visible, true)
WHERE id = 1;
