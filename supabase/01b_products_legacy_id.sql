-- ============================================================
-- MMC Central — Fix products table (run if 01_schema already applied)
-- Adds legacy_id: per-category product id (matches menu.json + site URLs)
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER;

-- Backfill legacy_id from old global id if column was just added
UPDATE public.products
SET legacy_id = id
WHERE legacy_id IS NULL;

ALTER TABLE public.products
  ALTER COLUMN legacy_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_category_legacy_unique
  ON public.products (category_id, legacy_id);

CREATE OR REPLACE VIEW public.menu_with_products AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.icon,
  c.description,
  c.sort_order,
  COALESCE(
    json_agg(
      json_build_object(
        'id', p.legacy_id,
        'name', p.name,
        'price', p.price,
        'weight', p.weight,
        'image', p.image,
        'hoverImage', p.hover_image,
        'description', p.description,
        'available', p.available
      )
      ORDER BY p.sort_order, p.legacy_id
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) AS products
FROM public.categories c
LEFT JOIN public.products p ON p.category_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.slug, c.icon, c.description, c.sort_order
ORDER BY c.sort_order, c.id;

GRANT SELECT ON public.menu_with_products TO anon, authenticated;
