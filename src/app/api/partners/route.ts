import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

const fallbackPartners = [
  { id: '1', name: 'Clio', nameAr: 'كليو', logo: '/partners/clio.png', url: null, order: 0, active: true },
  { id: '2', name: 'Faber-Castell', nameAr: 'فابر كاستل', logo: '/partners/faber-castell.png', url: null, order: 1, active: true },
  { id: '3', name: 'Casio', nameAr: 'كاسيو', logo: '/partners/casio.png', url: null, order: 2, active: true },
  { id: '4', name: 'Rotring', nameAr: 'روترينج', logo: '/partners/rotring.png', url: null, order: 3, active: true },
  { id: '5', name: 'MG', nameAr: 'إم جي', logo: '/partners/mg.png', url: null, order: 4, active: true },
  { id: '6', name: 'Uni-ball', nameAr: 'يوني بال', logo: '/partners/uniball.png', url: null, order: 5, active: true },
];

export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.headers.get('x-admin-request') === 'true';

    let partners;
    try {
      partners = await db.partner?.findMany({
        where: isAdmin ? {} : { active: true },
        orderBy: { order: 'asc' },
      });
    } catch {
      partners = null;
    }

    // If DB query failed or returned empty, use fallback
    if (!partners || partners.length === 0) {
      return NextResponse.json({
        success: true,
        data: isAdmin ? fallbackPartners : fallbackPartners.filter(p => p.active),
        fromFallback: true,
      });
    }

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({
      success: true,
      data: fallbackPartners,
      fromFallback: true,
    });
  }
}
