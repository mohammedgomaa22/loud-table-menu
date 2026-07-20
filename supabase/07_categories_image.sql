-- ============================================================
-- MMC Central — Categories: Add image_url column
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;
