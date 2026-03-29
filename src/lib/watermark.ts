/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام العلامة المائية — باستخدام sharp (مجاني 100%)
 * ═══════════════════════════════════════════════════════════════
 * 
 * بدلاً من دفع $89/شهر لـ Cloudinary Pro لوضع العلامة المائية،
 * نستخدم sharp (مثبّت مسبقاً) لإنشاء العلامة محلياً.
 * 
 * التكلفة: $0 — يتم المعالجة على خادمك (مرة واحدة عند الرفع فقط)
 */

import sharp from 'sharp';

// إعدادات العلامة المائية
const WATERMARK_CONFIG = {
  text: 'KMS',
  fontSize: 28,
  opacity: 50, // 50% شفافية
  position: 'south_east' as const,
  padding: 20,
};

// ذاكرة مؤقتة لشعار SVG
let cachedWatermarkSvg: Buffer | null = null;

/**
 * توليد SVG للعلامة المائية النصية
 */
function generateWatermarkSvg(): Buffer {
  if (cachedWatermarkSvg) return cachedWatermarkSvg;

  const { text, fontSize, opacity } = WATERMARK_CONFIG;
  
  // نستخدم SVG لرسم النص (أفضل من overlay صورة)
  const svg = `
    <svg width="160" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          text {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: rgba(255, 255, 255, ${opacity / 100});
            text-anchor: middle;
          }
        </style>
      </defs>
      <rect width="160" height="60" rx="8" ry="8" fill="rgba(0,0,0,0.15)" />
      <text x="80" y="38">${text}</text>
    </svg>
  `.trim();

  cachedWatermarkSvg = Buffer.from(svg);
  return cachedWatermarkSvg;
}

/**
 * وضع العلامة المائية على صورة
 * يعيد Buffer جديد يحتوي الصورة مع العلامة المائية
 */
export async function addWatermark(
  imageBuffer: Buffer,
  options?: {
    text?: string;
    opacity?: number;
    position?: 'south_east' | 'south_west' | 'center';
  }
): Promise<Buffer> {
  try {
    const watermarkSvg = generateWatermarkSvg();
    const position = options?.position || WATERMARK_CONFIG.position;

    // حجم العلامة المائية نسبة لحجم الصورة
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 800;
    const watermarkSize = Math.max(80, Math.round(imgWidth * 0.12));

    // تحويل SVG إلى Buffer مع الحجم المناسب
    const resizedWatermark = await sharp(watermarkSvg)
      .resize(watermarkSize)
      .png()
      .toBuffer();

    const padding = WATERMARK_CONFIG.padding;

    // تحديد الإحداثيات
    const gravityOptions: Record<string, sharp.Gravity> = {
      'south_east': 'southeast',
      'south_west': 'southwest',
      'center': 'center',
    };

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWatermark,
          gravity: gravityOptions[position] || 'southeast',
          offset: padding > 0 ? padding : undefined,
        },
      ])
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Watermark error:', error);
    // في حالة الخطأ، نرجع الصورة الأصلية بدون علامة مائية
    return imageBuffer;
  }
}

/**
 * تحسين الصورة قبل الرفع:
 * 1. تحويل إلى WebP (توفير 30-50% من الحجم)
 * 2. تصغير الأبعاد إذا كانت كبيرة
 * 3. ضبط الجودة
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'webp',
  } = options || {};

  let pipeline = sharp(imageBuffer);

  // قراءة الأبعاد الحالية
  const metadata = await pipeline.metadata();
  let width = metadata.width || maxWidth;
  let height = metadata.height || maxHeight;

  // تصغير إذا تجاوز الحد الأقصى
  if (width > maxWidth || height > maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);
  }

  // تحويل إلى الصيغة المطلوبة
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * تحسين + علامة مائية في خطوة واحدة
 */
export async function processImage(
  imageBuffer: Buffer,
  options?: {
    maxWidth?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    skipWatermark?: boolean;
  }
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    quality = 85,
    format = 'webp',
    skipWatermark = false,
  } = options || {};

  // الخطوة 1: تحسين الصورة
  const optimized = await optimizeImage(imageBuffer, { maxWidth, quality, format });

  // الخطوة 2: العلامة المائية
  if (skipWatermark) return optimized;
  return addWatermark(optimized);
}
