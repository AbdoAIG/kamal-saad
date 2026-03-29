/**
 * ═══════════════════════════════════════════════════════════════
 *  API — رفع وحذف الصور
 * ═══════════════════════════════════════════════════════════════
 * 
 * يدعم 3 خلفيات تخزين (يُكتشف تلقائياً):
 *  1. Cloudflare R2     ← الأوفر (~$0.50/شهر)
 *  2. Local Storage     ← مجاني ($0)
 *  3. Cloudinary        ← للصور القديمة (توافقية)
 * 
 * كل صورة تمر بـ:
 *  1. التحقق من النوع والحجم
 *  2. تحسين الصورة (sharp → WebP)
 *  3. إضافة العلامة المائية (sharp)
 *  4. رفع إلى الخلفية المُفعّلة
 */

import { NextResponse } from 'next/server';
import { detectStorageBackend, UploadedFile } from '@/lib/storage';
import { uploadToR2, deleteFromR2 } from '@/lib/storage-r2';
import { uploadToLocal, deleteFromLocal } from '@/lib/storage-local';
import { processImage } from '@/lib/watermark';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * استخراج مفتاح الحذف من URL
 * يدعم: R2 URL, Local URL, Cloudinary URL
 */
function extractKeyFromUrl(url: string, backend: string): string | null {
  if (backend === 'r2') {
    // https://assets.domain.com/products/2025/01/file.webp → products/2025/01/file.webp
    try {
      const urlObj = new URL(url);
      const publicUrl = process.env.R2_PUBLIC_URL;
      if (publicUrl) {
        return url.replace(`${publicUrl}/`, '');
      }
      // Fallback: R2 public bucket URL
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }

  if (backend === 'local') {
    // /uploads/products/2025/01/file.webp → products/2025/01/file.webp
    return url.replace('/uploads/', '');
  }

  if (backend === 'cloudinary') {
    // https://res.cloudinary.com/xxx/image/upload/v123/folder/file.jpg
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const uploadIdx = pathParts.indexOf('upload');
      if (uploadIdx !== -1) {
        // إزالة version number (v1234567890) والtransformations
        const afterUpload = pathParts.slice(uploadIdx + 1);
        const cleanParts = afterUpload.filter(p => !p.startsWith('v') && !/^[a-z_]\d/.test(p));
        return cleanParts.join('/');
      }
      return null;
    } catch {
      return null;
    }
  }

  return null;
}

// ═══════════════════════════════════════
//  POST — رفع صورة جديدة
// ═══════════════════════════════════════
export async function POST(request: Request) {
  try {
    const storage = detectStorageBackend();
    console.log(`[Upload] Using backend: ${storage.backend}`);

    // ─── الخطوة 1: استقبال الملف ───
    let fileBuffer: Buffer;
    let originalName: string;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // رفع من رابط URL
      const body = await request.json();
      const { url } = body;

      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }

      console.log('[Upload] Fetching from URL:', url.substring(0, 80));

      const response = await fetch(url);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
      }

      fileBuffer = Buffer.from(await response.arrayBuffer());
      const fetchedType = response.headers.get('content-type') || 'image/jpeg';

      if (!ALLOWED_TYPES.includes(fetchedType) && !fetchedType.includes('image/')) {
        return NextResponse.json({ error: 'Invalid file type from URL' }, { status: 400 });
      }

      // استخراج اسم الملف من URL
      try {
        const urlPath = new URL(url).pathname;
        originalName = urlPath.split('/').pop() || 'image.jpg';
      } catch {
        originalName = 'image.jpg';
      }
    } else {
      // رفع مباشر (multipart/form-data)
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF` },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` }, { status: 400 });
      }

      fileBuffer = Buffer.from(await file.arrayBuffer());
      originalName = file.name;
    }

    console.log(`[Upload] File: ${originalName}, Size: ${(fileBuffer.length / 1024).toFixed(1)}KB`);

    // ─── الخطوة 2: تحسين + علامة مائية ───
    console.log('[Upload] Processing image (optimize + watermark)...');
    let processedBuffer: Buffer;
    let watermarkApplied = false;

    try {
      processedBuffer = await processImage(fileBuffer, {
        maxWidth: 1920,
        quality: 85,
        format: 'webp',
      });
      // التحقق: إذا حجم الصورة تغيّر = العلامة المائية نجحت
      watermarkApplied = processedBuffer.length !== fileBuffer.length;
      console.log(`[Upload] Processed: ${(fileBuffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB, watermark: ${watermarkApplied ? 'YES' : 'NO'}`);
    } catch (err) {
      console.error('[Upload] processImage failed, using original:', err);
      processedBuffer = fileBuffer;
      watermarkApplied = false;
    }

    // ─── الخطوة 3: رفع إلى الخلفية ───
    let result: UploadedFile;

    switch (storage.backend) {
      case 'r2':
        result = await uploadToR2(processedBuffer, `${originalName.split('.')[0]}.webp`, 'products');
        break;

      case 'local':
        result = await uploadToLocal(processedBuffer, `${originalName.split('.')[0]}.webp`, 'products');
        break;

      default:
        return NextResponse.json(
          { error: `No storage backend configured. Set R2_* env vars or use STORAGE_BACKEND=local` },
          { status: 500 }
        );
    }

    console.log(`[Upload] Success! URL: ${result.url}`);

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      backend: storage.backend,
      width: result.width,
      height: result.height,
      size: result.size,
      format: result.format,
      watermarkApplied,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════
//  DELETE — حذف صورة
// ═══════════════════════════════════════
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const key = searchParams.get('key');

    if (!url && !key) {
      return NextResponse.json({ error: 'Provide url or key parameter' }, { status: 400 });
    }

    const storage = detectStorageBackend();
    const deleteKey = key || extractKeyFromUrl(url!, storage.backend);

    if (!deleteKey) {
      return NextResponse.json({ error: 'Could not extract file key from URL' }, { status: 400 });
    }

    console.log(`[Delete] Backend: ${storage.backend}, Key: ${deleteKey}`);

    switch (storage.backend) {
      case 'r2':
        await deleteFromR2(deleteKey);
        break;
      case 'local':
        await deleteFromLocal(deleteKey);
        break;
      default:
        return NextResponse.json({ error: 'Delete not supported for this backend' }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: deleteKey });
  } catch (error: any) {
    console.error('[Delete] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete image' }, { status: 500 });
  }
}

// ═══════════════════════════════════════
//  GET — معلومات نظام التخزين
// ═══════════════════════════════════════
export async function GET() {
  const storage = detectStorageBackend();
  return NextResponse.json({
    backend: storage.backend,
    configured: storage.backend !== 'local' || process.env.STORAGE_BACKEND === 'local',
    message: storage.backend === 'r2'
      ? 'Using Cloudflare R2 (recommended)'
      : storage.backend === 'cloudinary'
        ? 'Using Cloudinary (legacy mode)'
        : 'Using Local Storage (free)',
  });
}
