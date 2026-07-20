# MMC Central — Supabase SQL Setup

انسخ الملفات التالية بالترتيب في **Supabase Dashboard → SQL Editor**.

## ترتيب التنفيذ

| # | الملف | الوصف |
|---|--------|--------|
| 1 | `01_schema.sql` | الجداول + RLS + Storage + الإعدادات الافتراضية |
| 1b | `01b_products_legacy_id.sql` | **فقط إذا نفّذت 01_schema سابقاً** — إضافة `legacy_id` |
| 2 | `02_seed_data.sql` | 7 تصنيفات + 118 منتج من `menu.json` |
| 3 | — | إنشاء مستخدم Admin من لوحة Supabase (يدوياً) |
| 4 | `03_create_admin.sql` | ربط المستخدم بجدول `admin_profiles` |
| 5 | `04_verify.sql` | التحقق من نجاح الإعداد |
| 6 | `05_site_settings_update.sql` | حقول إضافية لإعدادات الموقع |
| 7 | `06_site_settings_branding.sql` | شعار / favicon / hero |
| 8 | `07_categories_image.sql` | صورة التصنيف |
| 9 | `08_products_fields.sql` | حقول التكلفة للمنتجات |
| 10 | `09_partners.sql` | جدول الشركاء (Partners) |

---

## الخطوة 3: إنشاء مستخدم Admin (من Dashboard)

1. افتح **Authentication → Users**
2. **Add user → Create new user**
3. أدخل:
   - **Email:** إيميل الأدمن (مثال: `admin@mmccentral.com`)
   - **Password:** كلمة مرور قوية
   - **Auto Confirm User:** ✅ مفعّل
4. احفظ الإيميل — ستحتاجه في `03_create_admin.sql`

> لا يمكن إنشاء كلمة مرور مشفّرة للمستخدم عبر SQL بأمان. لذلك تُنشأ من Dashboard.

---

## بعد التنفيذ — ماذا ستحصل؟

> **مهم:** مشاريع Free بتتوقف بعد أيام بدون نشاط. راجع [`KEEPALIVE.md`](./KEEPALIVE.md) وفعّل الـ GitHub Action قبل تسليم أي موقع للعميل.

### الجداول
- `categories` — التصنيفات
- `products` — المنتجات
- `messages` — رسائل نموذج التواصل
- `partners` — شعارات الشركاء
- `site_settings` — إعدادات الموقع (صف واحد)
- `admin_profiles` — ربط مستخدمي Auth بالصلاحيات

### View جاهزة للفرونت
- `menu_with_products` — نفس شكل `menu.json` تقريباً

### Storage Buckets
- `product-images` — صور المنتجات
- `site-assets` — الشعار وصورة الهيرو

### الصلاحيات (RLS)
- **الزوار:** قراءة القائمة والإعدادات + إرسال رسائل
- **الأدمن:** إدارة كاملة (CRUD) + رفع الصور

---

## إعدادات Auth في Supabase (مهم)

من **Authentication → Providers → Email**:
- ✅ Enable Email provider
- ✅ Confirm email: يمكن تعطيله للتطوير

من **Authentication → URL Configuration** (عند ربط الموقع لاحقاً):
- **Site URL:** رابط موقعك
- **Redirect URLs:** أضف `http://localhost:*` للتطوير وروابط الإنتاج

---

## المعلومات المطلوبة لربط الموقع لاحقاً

بعد إتمام SQL، أرسل/احفظ من **Project Settings → API**:
- `Project URL`
- `anon public` key

> **لا تشارك** `service_role` key في الفرونت.

---

## Website integration

The site reads menu data from Supabase view `menu_with_products`.
Config lives in `src/js/supabase-config.js` (copy from `supabase-config.example.js`).

### Local testing

Run the site through a local server (not `file://`) so Supabase requests work:

```bash
npx serve .
```

### Admin panel

- Login: `admin/login.html`
- Requires a user in Supabase Auth **and** a row in `admin_profiles` (see `03_create_admin.sql`)


إذا عدّلت `src/data/menu.json`:

```bash
node supabase/generate-seed.js
```

ثم نفّذ `02_seed_data.sql` مرة أخرى في SQL Editor.
