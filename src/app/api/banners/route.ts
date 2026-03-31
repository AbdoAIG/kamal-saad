import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all banners (active and inactive) for admin management
    const banners = await db.banner.findMany({
      orderBy: [{ section: 'asc' }, { order: 'asc' }]
    });
    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/banners - Request body:', body);
    
    const {
      title, titleAr, subtitle, subtitleAr, image, link,
      section, width, height, hotspotX, hotspotY, hotspotW, hotspotH,
      active, order
    } = body;

    // Validation
    if (!title?.trim() || !titleAr?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'العنوان بالعربية والإنجليزية مطلوب' 
      }, { status: 400 });
    }
    
    if (!image?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'يرجى رفع صورة للبانر' 
      }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title: title.trim(),
        titleAr: titleAr.trim(),
        subtitle: subtitle?.trim() || null,
        subtitleAr: subtitleAr?.trim() || null,
        image: image.trim(),
        link: link?.trim() || null,
        section: section || 'hero',
        width: Number(width) || 0,
        height: Number(height) || 0,
        hotspotX: Number(hotspotX) || 0,
        hotspotY: Number(hotspotY) || 0,
        hotspotW: Number(hotspotW) || 0,
        hotspotH: Number(hotspotH) || 0,
        active: active !== false,
        order: Number(order) || 0
      }
    });
    
    console.log('Created banner:', banner.id);
    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to create banner' 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    // Convert numeric fields
    const updateData: any = { ...data };
    if (updateData.width !== undefined) updateData.width = parseInt(updateData.width) || 0;
    if (updateData.height !== undefined) updateData.height = parseInt(updateData.height) || 0;
    if (updateData.hotspotX !== undefined) updateData.hotspotX = parseFloat(updateData.hotspotX) || 0;
    if (updateData.hotspotY !== undefined) updateData.hotspotY = parseFloat(updateData.hotspotY) || 0;
    if (updateData.hotspotW !== undefined) updateData.hotspotW = parseFloat(updateData.hotspotW) || 0;
    if (updateData.hotspotH !== undefined) updateData.hotspotH = parseFloat(updateData.hotspotH) || 0;
    if (updateData.order !== undefined) updateData.order = parseInt(updateData.order) || 0;
    delete updateData.id;

    const banner = await db.banner.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }
    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete banner' }, { status: 500 });
  }
}
