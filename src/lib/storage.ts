/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام تخزين الصور — كمال سعد (KMS Image Storage)
 * ═══════════════════════════════════════════════════════════════
 * 
 * يدعم 3 خلفيات تخزين (يُكتشف تلقائياً حسب متغيرات البيئة):
 * 
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  1. Cloudflare R2  ← الأوفر والأسرع (مُوصى به)         │
 *  │     التكلفة: ~$0.50/شهر لـ 10,000 منتج                │
 *  │     CDN مجاني غير محدود + بدون رسوم بيانات خروج        │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  2. Local Storage  ← مجاني (للتطوير أو الخوادم الصغيرة) │
 *  │     التكلفة: $0                                         │
 *  │     تخزين في public/uploads/                             │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  3. Cloudinary     ← للتوافق مع الصور القديمة فقط       │
 *  │     التكلفة: مجاني (25 رصيد/يوم) أو $89/شهر Pro         │
 *  └─────────────────────────────────────────────────────────┘
 */

export type StorageBackend = 'r2' | 'local' | 'cloudinary';

export interface StorageConfig {
  backend: StorageBackend;
  bucket?: string;
  region?: string;
  publicUrl?: string;
}

export interface UploadedFile {
  url: string;
  key: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

/**
 * الكشف التلقائي عن خلفية التخزين المُفعّلة
 */
export function detectStorageBackend(): StorageConfig {
  // الأولوية: R2 (الأوفر والأسرع)
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    return {
      backend: 'r2',
      bucket: process.env.R2_BUCKET,
      region: process.env.R2_REGION || 'auto',
      publicUrl: process.env.R2_PUBLIC_URL, // مثال: https://assets.yourdomain.com
    };
  }

  // الثاني: Local Storage (مجاني)
  if (process.env.STORAGE_BACKEND === 'local' || (!process.env.R2_ACCESS_KEY_ID && !process.env.CLOUDINARY_CLOUD_NAME)) {
    return {
      backend: 'local',
      publicUrl: process.env.LOCAL_STORAGE_URL || '',
    };
  }

  // الثالث: Cloudinary (للصور القديمة)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return {
      backend: 'cloudinary',
    };
  }

  // الافتراضي: local
  return {
    backend: 'local',
  };
}

/**
 * تنظيف اسم الملف — إزالة الأحرف الخاصة وإضافة hash فريد
 */
export function sanitizeFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
  const hash = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  return `${cleanName}_${hash}.${ext}`;
}

/**
 * توليد المسار النسبي للملف داخل المجلد
 */
export function generateFilePath(folder: string, fileName: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${folder}/${year}/${month}/${fileName}`;
}
