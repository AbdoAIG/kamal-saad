/**
 * ═══════════════════════════════════════════════════════════════
 *  Cloudflare R2 Storage Adapter
 * ═══════════════════════════════════════════════════════════════
 * 
 * التكلفة التقديرية لـ 10,000 منتج:
 *  - التخزين: 5GB × $0.015 = $0.075/شهر
 *  - العمليات (رفع): 10K × $4.50/مليون = $0.045/شهر  
 *  - العمليات (قراءة): 1M × $0.36/مليون = $0.36/شهر
 *  - CDN (Cloudflare): $0 (مجاني غير محدود!)
 *  ─────────────────────────────────
 *  المجموع: ~$0.50/شهر  (مقابل $89 لـ Cloudinary Pro!)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { UploadedFile, generateFilePath, sanitizeFileName } from './storage';

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT, // مثال: https://xxx.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

/**
 * رفع صورة إلى Cloudflare R2
 */
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  folder: string = 'products'
): Promise<UploadedFile> {
  const client = getR2Client();
  const fileName = sanitizeFileName(originalName);
  const key = generateFilePath(folder, fileName);
  const bucket = process.env.R2_BUCKET!;

  // تحديد نوع الملف
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  }[ext] || 'image/jpeg';

  // رفع إلى R2
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  // بناء URL العام
  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${bucket}.r2.dev/${key}`;

  // قراءة أبعاد الصورة
  const sharp = await import('sharp');
  const metadata = await sharp.default(buffer).metadata();

  return {
    url: publicUrl,
    key,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
    format: metadata.format || ext,
  };
}

/**
 * حذف صورة من Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  }));
}
