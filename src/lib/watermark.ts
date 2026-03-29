/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام العلامة المائية — مضمون يعمل على Vercel
 * ═══════════════════════════════════════════════════════════════
 *
 * العلامة المائية PNG مُولّدة مسبقاً ومضمّنة كـ base64.
 * لا يحتاج أي خطوط أو SVG rendering — يعمل على أي خادم.
 */

import sharp from 'sharp';

// العلامة المائية PNG (مُولّدة مسبقاً — لا تحتاج خطوط)
const WATERMARK_PNG_BASE64 = "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";

// Buffer مُخزّن مؤقتاً
let watermarkBuffer: Buffer | null = null;

/**
 * الحصول على العلامة المائية كـ PNG Buffer
 */
function getWatermarkPng(): Buffer {
  if (!watermarkBuffer) {
    watermarkBuffer = Buffer.from(WATERMARK_PNG_BASE64, 'base64');
  }
  return watermarkBuffer;
}

/**
 * وضع العلامة المائية على صورة
 * يعمل 100% على أي خادم (Vercel, Docker, etc.)
 */
export async function addWatermark(
  imageBuffer: Buffer,
): Promise<Buffer> {
  try {
    const sourceWm = getWatermarkPng();

    // قراءة أبعاد الصورة
    const meta = await sharp(imageBuffer).metadata();
    const imgW = meta.width || 800;

    // حجم العلامة المائية نسبي لحجم الصورة (18% من العرض)
    const targetWmWidth = Math.max(80, Math.round(imgW * 0.18));

    // تغيير حجم العلامة المائية لتناسب الصورة
    const resizedWm = await sharp(sourceWm)
      .resize(targetWmWidth)
      .png()
      .toBuffer();

    // دمج العلامة المائية
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWm,
          gravity: 'southeast',
          offset: [12, 12],
        },
      ])
      .toBuffer();

    console.log(`[Watermark] OK — ${imgW}px wide, wm: ${targetWmWidth}px`);

    return result;
  } catch (error) {
    console.error('[Watermark] FAILED:', error);
    return imageBuffer;
  }
}

/**
 * تحسين الصورة: تحويل صيغة + تصغير أبعاد
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options?: {
    maxWidth?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    quality = 85,
    format = 'webp',
  } = options || {};

  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || maxWidth;
  const h = meta.height || maxWidth;

  let pipeline = sharp(imageBuffer);

  if (w > maxWidth || h > maxWidth) {
    pipeline = pipeline.resize(maxWidth, maxWidth, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

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
 * تحسين + علامة مائية معاً
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

  // 1) تحسين الصورة
  const optimized = await optimizeImage(imageBuffer, { maxWidth, quality, format });

  // 2) علامة مائية
  if (skipWatermark) return optimized;

  return addWatermark(optimized);
}
