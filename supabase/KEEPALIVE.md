# Supabase Free Tier — Pause Prevention

## المشكلة

مشاريع **Supabase Free** بتتوقف (Paused) بعد حوالي **7 أيام بدون نشاط**.
لما المشروع متوقف:
- الموقع مش بيقدر يجيب الداتا
- لازم تدخل Dashboard وتعمل Restore
- بعد تكرار الإيقاف، الاستعادة ممكن تتأخر أو تحتاج ترقية

## الحلول (من الأفضل للأضعف)

### 1) للمواقع الحقيقية للعملاء (الأفضل)
ارفع الخطة لـ **Supabase Pro** — المشاريع المدفوعة **ما بتتوقفش**.

### 2) Keep-Alive تلقائي (مجاني — للموقع ده)
تم إضافة GitHub Action:
`.github/workflows/supabase-keepalive.yml`

يعمل كل 3 أيام طلب خفيف على الـ API عشان المشروع يفضل Active.

**التفعيل مرة واحدة:**
1. ارفع المشروع على GitHub
2. Settings → Secrets and variables → Actions → New repository secret:
   - `SUPABASE_URL` = `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY` = الـ anon public key
3. Actions → شغّل workflow اسمه **Supabase Keep-Alive** يدوياً مرة للتأكد

### 3) بديل بدون GitHub
من [cron-job.org](https://cron-job.org) أو أي cron مجاني:
- URL: `https://YOUR_REF.supabase.co/rest/v1/site_settings?select=id&limit=1`
- Headers:
  - `apikey: YOUR_ANON_KEY`
  - `Authorization: Bearer YOUR_ANON_KEY`
- Schedule: كل 2–3 أيام

## قاعدة للمشاريع القادمة
أي موقع production على Supabase Free لازم يتضمن Keep-Alive من اليوم الأول،
أو يُنصح العميل بـ Pro من البداية.
