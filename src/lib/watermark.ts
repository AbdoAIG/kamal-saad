/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام العلامة المائية — مضمون يعمل على Vercel
 * ═══════════════════════════════════════════════════════════════
 *
 * يقرأ العلامة المائية من public/watermark.png
 * يمكنك استبدال هذا الملف بشعار KMS الخاص بك
 */

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ذاكرة مؤقتة
let cachedWm: Buffer | null = null;

/**
 * قراءة ملف العلامة المائية
 * يبحث في: public/watermark.png
 */
function loadWatermark(): Buffer | null {
  if (cachedWm) return cachedWm;

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'watermark.png'),
    path.join(process.cwd(), '.next', 'server', 'watermark.png'),
    path.join(__dirname, '..', '..', 'public', 'watermark.png'),
    path.join(__dirname, 'watermark.png'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      console.log(`[Watermark] Found at: ${p}`);
      cachedWm = readFileSync(p);
      return cachedWm;
    }
  }

  console.error('[Watermark] NOT FOUND in any path:', possiblePaths);
  return null;
}

/**
 * وضع العلامة المائية على صورة
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const wmSource = loadWatermark();
    if (!wmSource) {
      console.error('[Watermark] No watermark file found — skipping');
      return imageBuffer;
    }

    // قراءة أبعاد الصورة
    const meta = await sharp(imageBuffer).metadata();
    const imgW = meta.width || 800;

    // حجم العلامة نسبة لحجم الصورة (18% من العرض، حد أدنى 80px)
    const wmTargetW = Math.max(80, Math.round(imgW * 0.18));

    // تغيير حجم العلامة
    const resizedWm = await sharp(wmSource)
      .resize(wmTargetW)
      .png()
      .toBuffer();

    // دمج العلامة مع الصورة
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWm,
          gravity: 'southeast',
          offset: [12, 12],
        },
      ])
      .toBuffer();

    const worked = result.length > imageBuffer.length;
    console.log(`[Watermark] ${worked ? 'APPLIED ✓' : 'SKIPPED ✗'} — img: ${imgW}px, wm: ${wmTargetW}px, before: ${imageBuffer.length}B, after: ${result.length}B`);

    return result;
  } catch (error) {
    console.error('[Watermark] ERROR:', error);
    return imageBuffer;
  }
}

/**
 * تحسين الصورة
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

  const optimized = await optimizeImage(imageBuffer, { maxWidth, quality, format });
  if (skipWatermark) return optimized;

  return addWatermark(optimized);
}
