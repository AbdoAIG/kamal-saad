import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';

// GET - Fetch partners (public: active only; admin: all)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.headers.get('x-admin-request') === 'true';

    const partners = await db.partner.findMany({
      where: isAdmin ? {} : { active: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST - Create a new partner (admin only)
export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { name, nameAr, logo, url, order, active } = body;

    if (!name || !logo) {
      return NextResponse.json(
        { success: false, error: 'اسم الشريك والشعار مطلوبان' },
        { status: 400 }
      );
    }

    const partner = await db.partner.create({
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
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
