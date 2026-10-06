-- ========================================================
-- 17_custom_sections_colors.sql
-- Add limited/curated background and text color controls
-- for Custom Section 1 and Custom Section 2 in site_settings
-- ========================================================

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS section1_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS section1_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS section2_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS section2_text_color TEXT DEFAULT '#ffffff';

-- Update existing row with default colors if null
UPDATE site_settings
SET 
  section1_bg_color = COALESCE(section1_bg_color, '#000000'),
  section1_text_color = COALESCE(section1_text_color, '#ffffff'),
  section2_bg_color = COALESCE(section2_bg_color, '#000000'),
  section2_text_color = COALESCE(section2_text_color, '#ffffff')
WHERE id = 1;
