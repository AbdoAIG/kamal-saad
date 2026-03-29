import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { active: true },
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
    const {
      title, titleAr, subtitle, subtitleAr, image, link,
      section, width, height, hotspotX, hotspotY, hotspotW, hotspotH,
      active, order
    } = body;

    if (!title || !titleAr || !image) {
      return NextResponse.json({ success: false, error: 'title, titleAr, image required' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title,
        titleAr: titleAr || title,
        subtitle: subtitle || null,
        subtitleAr: subtitleAr || null,
        image,
        link: link || null,
        section: section || 'hero',
        width: parseInt(width) || 0,
        height: parseInt(height) || 0,
        hotspotX: parseFloat(hotspotX) || 0,
        hotspotY: parseFloat(hotspotY) || 0,
        hotspotW: parseFloat(hotspotW) || 0,
        hotspotH: parseFloat(hotspotH) || 0,
        active: active !== undefined ? active : true,
        order: parseInt(order) || 0
      }
    });
    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to create banner' }, { status: 500 });
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
