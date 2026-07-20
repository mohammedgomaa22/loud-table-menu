-- ============================================================
-- MMC Central — Supabase Setup (Part 3)
-- Run this AFTER creating your admin user in Authentication
-- ============================================================
--
-- STEP 1 (Dashboard):
--   Authentication → Users → Add user → Create new user
--   - Email: your admin email (example: admin@mmccentral.com)
--   - Password: strong password
--   - Auto Confirm User: ON
--
-- STEP 2:
--   Replace the email below with YOUR admin email, then run this query.
-- ============================================================

INSERT INTO public.admin_profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'
FROM auth.users AS u
WHERE u.email = 'admin@mmccentral.com'  -- ← غيّر الإيميل هنا
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify admin was linked
SELECT
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.admin_profiles AS p
JOIN auth.users AS u ON u.id = p.id;
