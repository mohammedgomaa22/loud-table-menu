-- ============================================================
-- MMC Central — Add banner_url to categories
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
