import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Watermark settings
const WATERMARK_PUBLIC_ID = 'kamal-saad:watermark';

export async function POST(request: Request) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary not configured');
      return NextResponse.json(
        { error: 'Image upload service not configured.' },
        { status: 500 }
      );
    }

    let fileBuffer: Buffer;
    let fileType: string;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // URL upload
      const body = await request.json();
      const { url } = body;

      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }

      console.log('Fetching image from URL:', url.substring(0, 50) + '...');

      const response = await fetch(url);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
      }

      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileType = response.headers.get('content-type') || 'image/jpeg';

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(fileType)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }
    } else {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File too large' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileType = file.type;
    }

    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${fileType};base64,${base64}`;

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'kamal-saad-products',
      resource_type: 'image',
    });

    console.log('Upload successful. Public ID:', result.public_id);

    // Generate URL with small watermark (120px - appropriate size)
    const watermarkedUrl = cloudinary.url(result.public_id, {
      secure: true,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        // Small watermark - bottom right (120px)
        {
          overlay: WATERMARK_PUBLIC_ID,
          gravity: 'south_east',
          x: 15,
          y: 15,
          width: 120,
          opacity: 70,
          crop: 'scale'
        }
      ]
    });

    console.log('Watermarked URL generated');

    return NextResponse.json({
      success: true,
      url: watermarkedUrl,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('public_id');

    if (!publicId) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete image' }, { status: 500 });
  }
}
