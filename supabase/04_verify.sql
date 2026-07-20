-- ============================================================
-- MMC Central — Verification queries
-- Run after completing all setup steps
-- ============================================================

SELECT 'categories' AS table_name, COUNT(*) AS total FROM public.categories
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'site_settings', COUNT(*) FROM public.site_settings
UNION ALL
SELECT 'admin_profiles', COUNT(*) FROM public.admin_profiles;

SELECT id, name, slug, sort_order FROM public.categories ORDER BY sort_order;

SELECT * FROM public.site_settings;

SELECT u.email, p.role
FROM public.admin_profiles AS p
JOIN auth.users AS u ON u.id = p.id;

-- Sample menu view (same shape as menu.json)
SELECT slug, json_array_length(products::json) AS product_count
FROM public.menu_with_products
ORDER BY sort_order;
