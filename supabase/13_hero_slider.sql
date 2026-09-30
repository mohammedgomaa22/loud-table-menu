-- ============================================================
-- MMC Central — Hero Slider multiple images and interval
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_slider_interval INTEGER DEFAULT 5;

-- Optional: If you already have a single hero_image_url set,
-- initialize hero_images with that image if it's empty.
UPDATE public.site_settings
SET
  hero_images = jsonb_build_array(hero_image_url),
  hero_slider_interval = 5
WHERE id = 1
  AND hero_image_url IS NOT NULL
  AND hero_image_url <> ''
  AND (hero_images IS NULL OR jsonb_array_length(hero_images) = 0);
