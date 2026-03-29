/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام العلامة المائية — شعار KMS
 * ═══════════════════════════════════════════════════════════════
 *
 * يقرأ شعار KMS من public/watermark.png ويضعه على الصور
 * الشعار يحافظ على نسبة العرض/الارتفاع الأصلية
 */

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ذاكرة مؤقتة
let cachedWm: Buffer | null = null;
let cachedWmMeta: { width: number; height: number; ratio: number } | null = null;

/**
 * قراءة ملف شعار العلامة المائية
 */
function loadWatermark(): Buffer | null {
  if (cachedWm) return cachedWm;

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'watermark.png'),
    path.join(process.cwd(), '.next', 'server', 'watermark.png'),
    path.join(__dirname, '..', '..', 'public', 'watermark.png'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      console.log(`[Watermark] Found at: ${p}`);
      cachedWm = readFileSync(p);
      return cachedWm;
    }
  }

  console.error('[Watermark] NOT FOUND — checked:', possiblePaths.map(p => p.replace(process.cwd(), '...')));
  return null;
}

/**
 * قراءة أبعاد العلامة المائية (مع cache)
 */
async function getWatermarkMeta(): Promise<{ width: number; height: number; ratio: number } | null> {
  if (cachedWmMeta) return cachedWmMeta;

  const wm = loadWatermark();
  if (!wm) return null;

  const meta = await sharp(wm).metadata();
  const w = meta.width || 300;
  const h = meta.height || 100;

  cachedWmMeta = { width: w, height: h, ratio: h / w };
  return cachedWmMeta;
}

/**
 * وضع شعار KMS كعلامة مائية على صورة
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const wmSource = loadWatermark();
    if (!wmSource) {
      console.error('[Watermark] No watermark file — skipping');
      return imageBuffer;
    }

    const wmMeta = await getWatermarkMeta();
    if (!wmMeta) return imageBuffer;

    // أبعاد الصورة
    const imgMeta = await sharp(imageBuffer).metadata();
    const imgW = imgMeta.width || 800;
    const imgH = imgMeta.height || 800;

    // حجم الشعار: 22% من عرض الصورة (حد أدنى 80px، حد أقصى 250px)
    const wmTargetW = Math.min(250, Math.max(80, Math.round(imgW * 0.22)));
    const wmTargetH = Math.round(wmTargetW * wmMeta.ratio);

    // تغيير حجم الشعار مع الحفاظ على النسبة
    const resizedWm = await sharp(wmSource)
      .resize(wmTargetW, wmTargetH, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // حساب المسافة من الحواف
    const padding = Math.max(10, Math.round(imgW * 0.02));

    // دمج الشعار مع الصورة (أسفل اليمين)
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWm,
          gravity: 'southeast',
          offset: [padding, padding],
        },
      ])
      .toBuffer();

    const worked = result.length > imageBuffer.length;
    console.log(`[Watermark] ${worked ? 'APPLIED ✓' : 'SKIPPED ✗'} — img: ${imgW}x${imgH}, logo: ${wmTargetW}x${wmTargetH}px`);

    return result;
  } catch (error) {
    console.error('[Watermark] ERROR:', error);
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
  const { maxWidth = 1920, quality = 85, format = 'webp' } = options || {};

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
 * تحسين + علامة مائية
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
  const { maxWidth = 1920, quality = 85, format = 'webp', skipWatermark = false } = options || {};

  // 1) تحسين الصورة
  const optimized = await optimizeImage(imageBuffer, { maxWidth, quality, format });

  // 2) علامة مائية
  if (skipWatermark) return optimized;

  return addWatermark(optimized);
}
