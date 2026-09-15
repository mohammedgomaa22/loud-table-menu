-- ============================================================
-- MMC Central — Hero section content fields
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_eyebrow        TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_line1    TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_line2    TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_accent   TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle       TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_primary    TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_secondary  TEXT;

UPDATE public.site_settings
SET
  hero_eyebrow       = COALESCE(hero_eyebrow, 'Premium Bakery & Catering'),
  hero_title_line1   = COALESCE(hero_title_line1, 'Quality'),
  hero_title_line2   = COALESCE(hero_title_line2, 'That'),
  hero_title_accent  = COALESCE(hero_title_accent, 'Echoes.'),
  hero_subtitle      = COALESCE(hero_subtitle, 'Authentic ingredients. Bold flavors. Crafted to make a statement on every table.'),
  hero_cta_primary   = COALESCE(hero_cta_primary, 'Explore Menu'),
  hero_cta_secondary = COALESCE(hero_cta_secondary, 'Get In Touch')
WHERE id = 1;
