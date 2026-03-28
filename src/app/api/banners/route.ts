import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all active banners
export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: banners 
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch banners' 
    }, { status: 500 });
  }
}

// POST - Create a new banner
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, titleAr, subtitle, subtitleAr, image, link, buttonText, buttonTextAr, active, order } = body;
    
    const banner = await db.banner.create({
      data: {
        title,
        titleAr: titleAr || title,
        subtitle,
        subtitleAr,
        image,
        link,
        buttonText,
        buttonTextAr,
        active: active !== undefined ? active : true,
        order: order || 0
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: banner 
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create banner' 
    }, { status: 500 });
  }
}

// PUT - Update a banner
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, titleAr, subtitle, subtitleAr, image, link, buttonText, buttonTextAr, active, order } = body;
    
    const banner = await db.banner.update({
      where: { id },
      data: {
        title,
        titleAr,
        subtitle,
        subtitleAr,
        image,
        link,
        buttonText,
        buttonTextAr,
        active,
        order
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: banner 
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update banner' 
    }, { status: 500 });
  }
}

// DELETE - Delete a banner
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Banner ID is required' 
      }, { status: 400 });
    }
    
    await db.banner.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Banner deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete banner' 
    }, { status: 500 });
  }
}
