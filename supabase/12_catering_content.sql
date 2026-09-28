-- ============================================================
-- MMC Central — Catering & Orders section content fields
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS catering_eyebrow        TEXT,
  ADD COLUMN IF NOT EXISTS catering_title          TEXT,
  ADD COLUMN IF NOT EXISTS catering_title_accent   TEXT,
  ADD COLUMN IF NOT EXISTS catering_description    TEXT,
  ADD COLUMN IF NOT EXISTS catering_cta_primary    TEXT,
  ADD COLUMN IF NOT EXISTS catering_cta_secondary  TEXT;

UPDATE public.site_settings
SET
  catering_eyebrow       = COALESCE(catering_eyebrow, 'Catering & Orders'),
  catering_title         = COALESCE(catering_title, 'Taste the'),
  catering_title_accent  = COALESCE(catering_title_accent, 'Difference.'),
  catering_description   = COALESCE(catering_description, 'Elevate your next event with our bold, uncompromising pastries and catering menu.'),
  catering_cta_primary   = COALESCE(catering_cta_primary, 'Place an Order'),
  catering_cta_secondary = COALESCE(catering_cta_secondary, 'View Menu')
WHERE id = 1;
