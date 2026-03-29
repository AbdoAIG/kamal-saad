import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';

// GET - Get soft deleted products (trash)
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get soft deleted products
    const where = {
      deletedAt: { not: null }
    };

    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy: { deletedAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasMore: page < totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching trash products:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch trash products' 
    }, { status: 500 });
  }
}
