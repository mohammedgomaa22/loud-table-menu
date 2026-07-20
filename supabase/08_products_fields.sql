-- ============================================================
-- Migration 08: Add cost & detail fields to products table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS food_cost              NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS packaging_cost         NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS cogs_percent           NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS margin_percent         NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS price_without_packaging NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS comments               TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'products'
  AND column_name IN (
    'food_cost', 'packaging_cost', 'cogs_percent',
    'margin_percent', 'price_without_packaging', 'comments'
  )
ORDER BY ordinal_position;
