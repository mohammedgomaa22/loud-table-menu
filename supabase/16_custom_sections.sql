-- ============================================================
-- MMC Central — Two Custom Sections (Replacing About & Delivery)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  -- Custom Section 1
  ADD COLUMN IF NOT EXISTS section1_visible         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS section1_bg_image        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_title           TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_subtitle        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_text            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_btn1_text       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_btn1_url        TEXT    DEFAULT '#contact',
  ADD COLUMN IF NOT EXISTS section1_btn2_text       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section1_btn2_url        TEXT    DEFAULT '#menu',

  -- Custom Section 2
  ADD COLUMN IF NOT EXISTS section2_visible         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS section2_bg_image        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_title           TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_subtitle        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_text            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_btn1_text       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_btn1_url        TEXT    DEFAULT '#contact',
  ADD COLUMN IF NOT EXISTS section2_btn2_text       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS section2_btn2_url        TEXT    DEFAULT '#menu';

-- Set sensible defaults on existing row
UPDATE public.site_settings
SET
  section1_visible   = COALESCE(section1_visible, true),
  section1_btn1_url  = COALESCE(section1_btn1_url, '#contact'),
  section1_btn2_url  = COALESCE(section1_btn2_url, '#menu'),
  section2_visible   = COALESCE(section2_visible, true),
  section2_btn1_url  = COALESCE(section2_btn1_url, '#contact'),
  section2_btn2_url  = COALESCE(section2_btn2_url, '#menu')
WHERE id = 1;
