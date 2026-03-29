/**
 * ═══════════════════════════════════════════════════════════════
 *  Local Storage Adapter — تخزين محلي مجاني
 * ═══════════════════════════════════════════════════════════════
 * 
 * يخزن الصور في public/uploads/ — مناسب للتطوير والخوادم الصغيرة.
 * الصور تُخدَم مباشرة من مجلد public عبر Next.js.
 * 
 * التكلفة: $0 (لكن يحتاج مساحة على الخادم)
 */

import { writeFile, mkdir, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { UploadedFile, generateFilePath, sanitizeFileName } from './storage';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * التأكد من وجود مجلد الرفع
 */
async function ensureUploadDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * رفع صورة إلى التخزين المحلي
 */
export async function uploadToLocal(
  buffer: Buffer,
  originalName: string,
  folder: string = 'products'
): Promise<UploadedFile> {
  const fileName = sanitizeFileName(originalName);
  const relativePath = generateFilePath(folder, fileName);
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  // إنشاء المجلدات
  await ensureUploadDir(path.dirname(fullPath));

  // كتابة الملف
  await writeFile(fullPath, buffer);

  // قراءة أبعاد الصورة
  const sharp = await import('sharp');
  const metadata = await sharp.default(buffer).metadata();

  return {
    url: `/uploads/${relativePath}`,
    key: relativePath,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
    format: metadata.format || 'jpg',
  };
}

/**
 * حذف صورة من التخزين المحلي
 */
export async function deleteFromLocal(key: string): Promise<void> {
  const fullPath = path.join(UPLOADS_DIR, key);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}
