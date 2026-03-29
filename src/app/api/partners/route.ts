import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

const defaultPartners = [
  { id: '1', name: 'Clio', nameAr: 'كليو', logo: '/partners/clio.png', url: null, order: 0, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Faber-Castell', nameAr: 'فابر كاستل', logo: '/partners/faber-castell.png', url: null, order: 1, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Casio', nameAr: 'كاسيو', logo: '/partners/casio.png', url: null, order: 2, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Rotring', nameAr: 'روترينج', logo: '/partners/rotring.png', url: null, order: 3, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'MG', nameAr: 'إم جي', logo: '/partners/mg.png', url: null, order: 4, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', name: 'Uni-ball', nameAr: 'يوني بال', logo: '/partners/uniball.png', url: null, order: 5, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Check if Partner table exists and is usable
async function dbAvailable(): Promise<boolean> {
  try {
    await db.partner?.count();
    return true;
  } catch {
    return false;
  }
}

// GET - Fetch all partners (public)
export async function GET(request: NextRequest) {
  try {
    if (await dbAvailable()) {
      const isAdmin = request.headers.get('x-admin-request') === 'true';
      const partners = await db.partner!.findMany({
        where: isAdmin ? {} : { active: true },
        orderBy: { order: 'asc' },
      });
      if (partners.length > 0) {
        return NextResponse.json({ success: true, data: partners });
      }
    }

    // Fallback
    const isAdmin = request.headers.get('x-admin-request') === 'true';
    return NextResponse.json({
      success: true,
      data: isAdmin ? defaultPartners : defaultPartners.filter(p => p.active),
    });
  } catch {
    return NextResponse.json({ success: true, data: defaultPartners });
  }
}

// POST - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, logo, url, order, active } = body;

    if (!name || !logo) {
      return NextResponse.json(
        { success: false, error: 'اسم الشريك والشعار مطلوبان' },
        { status: 400 }
      );
    }

    if (await dbAvailable()) {
      const partner = await db.partner!.create({
        data: {
          name,
          nameAr: nameAr || name,
          logo,
          url: url || null,
          order: order ?? 0,
          active: active ?? true,
        },
      });
      return NextResponse.json({ success: true, data: partner });
    }

    // Fallback - add to default list (won't persist, but allows UI to work)
    const newPartner = {
      id: `local-${Date.now()}`,
      name,
      nameAr: nameAr || name,
      logo,
      url: url || null,
      order: order ?? 0,
      active: active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: newPartner, fallback: true });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
