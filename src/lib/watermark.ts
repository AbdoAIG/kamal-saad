/**
 * ═══════════════════════════════════════════════════════════════
 *  نظام العلامة المائية — باستخدام sharp (مجاني 100%)
 * ═══════════════════════════════════════════════════════════════
 * 
 * بسيط وموثوق — يعمل على Vercel serverless بدون مشاكل.
 * لا يعتمد على خطوط النظام.
 */

import sharp from 'sharp';

// إعدادات
const WM_TEXT = 'KMS';
const WM_PADDING = 15;

/**
 * بناء SVG العلامة المائية
 * inline styles فقط — بدون CSS classes أو @font-face
 */
function buildWatermarkSvg(targetWidth: number): string {
  const fontSize = Math.max(14, Math.round(targetWidth * 0.035));
  const charWidth = fontSize * 0.65;
  const textPixelWidth = fontSize * WM_TEXT.length * 0.7;
  const padH = fontSize;
  const padV = fontSize * 0.5;
  const boxW = Math.ceil(textPixelWidth + padH * 2);
  const boxH = Math.ceil(fontSize * 1.6 + padV * 2);
  const r = Math.ceil(fontSize * 0.25);
  const textX = Math.ceil(boxW / 2);
  const textY = Math.ceil(boxH / 2 + fontSize * 0.3);

  return [
    `<svg width="${boxW}" height="${boxH}" xmlns="http://www.w3.org/2000/svg">`,
    `  <rect width="${boxW}" height="${boxH}" rx="${r}" ry="${r}" fill="rgba(0,0,0,0.55)"/>`,
    `  <text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle"`,
    `        font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold"`,
    `        fill="rgba(255,255,255,0.85)" letter-spacing="2">${WM_TEXT}</text>`,
    `</svg>`,
  ].join('\n');
}

/**
 * وضع العلامة المائية على صورة
 */
export async function addWatermark(
  imageBuffer: Buffer,
): Promise<Buffer> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const imgW = meta.width || 800;
    const imgH = meta.height || 800;

    // حجم العلامة نسبة لحجم الصورة
    const wmWidth = Math.max(100, Math.round(imgW * 0.15));

    // بناء SVG وتحويله إلى PNG
    const svgStr = buildWatermarkSvg(wmWidth);
    const svgBuffer = Buffer.from(svgStr);
    const wmPng = await sharp(svgBuffer).png().toBuffer();

    console.log(`[Watermark] Image: ${imgW}x${imgH}, WM size: ${wmWidth}px, PNG: ${wmPng.length}B`);

    // دمج العلامة المائية مع الصورة
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: wmPng,
          gravity: 'southeast',
          offset: [WM_PADDING, WM_PADDING],
        },
      ])
      .toBuffer();

    const changed = result.length !== imageBuffer.length;
    console.log(`[Watermark] ${changed ? 'Applied OK' : 'WARNING: no change'} (${imageBuffer.length}B → ${result.length}B)`);
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

  const watermarked = await addWatermark(optimized);
  return watermarked;
}
