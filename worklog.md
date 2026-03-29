---
Task ID: 1
Agent: Main Agent
Task: تصميم وتنفيذ نظام تخزين الصور الأوفر والأسرع

Work Log:
- تحليل البنية الحالية: Cloudinary فقط (25 رصيد/يوم مجاناً، $89/شهر Pro)
- تصميم نظام تخزين ذكي يدعم 3 خلفيات (R2 + Local + Cloudinary)
- تثبيت @aws-sdk/client-s3 للتوافق مع Cloudflare R2
- إنشاء src/lib/storage.ts — طبقة تجريد التخزين مع كشف تلقائي
- إنشاء src/lib/storage-r2.ts — محول Cloudflare R2 (S3 compatible)
- إنشاء src/lib/storage-local.ts — محول التخزين المحلي (مجاني)
- إنشاء src/lib/watermark.ts — نظام العلامة المائية بـ sharp (مجاني 100%)
- إعادة كتابة src/app/api/upload/route.ts بالكامل لدعم الخلفيات الثلاثة
- تحديث next.config.ts لدعم R2 CDN + Cloudinary + external URLs
- تحديث .env.example بتوثيق كامل لكل خيار
- إنشاء مجلد public/uploads/ وإضافته لـ .gitignore
- التحقق: 0 أخطاء TypeScript جديدة، 0 أخطاء lint جديدة

Stage Summary:
- نظام تخزين متعدد الخلفيات جاهز (R2 ~$0.50/شهر أو Local $0)
- العلامة المائية تُنتج بـ sharp محلياً بدلاً من Cloudinary ($0 بدلاً من $89/شهر)
- كل صورة تُحسّن تلقائياً → WebP مع تصغير أبعاد
- الصور القديمة (Cloudinary) لا تزال تعمل بدون تغيير
- التبديل بين الخلفيات يتم بمتغيرات بيئة فقط (بدون تغيير كود)
