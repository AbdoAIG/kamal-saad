import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';

// GET /api/favorites/check?productIds=id1,id2,id3
// Returns { favorites: { [productId]: boolean } } for batch checking
// Useful for product listing pages to show which products are favorited
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { success: false, error: 'productIds query parameter is required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { favorites: {} },
      });
    }

    // Batch query: find all favorites matching any of the provided product IDs
    const userFavorites = await db.favorite.findMany({
      where: {
        userId: user.id,
        productId: { in: productIds },
      },
      select: { productId: true },
    });

    // Build a lookup map: { [productId]: true }
    const favoriteMap: Record<string, boolean> = {};
    for (const fav of userFavorites) {
      favoriteMap[fav.productId] = true;
    }

    // Ensure all requested product IDs are in the response (false if not favorited)
    for (const productId of productIds) {
      if (!(productId in favoriteMap)) {
        favoriteMap[productId] = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: { favorites: favoriteMap },
    });
  } catch (error) {
    console.error('Error checking favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check favorites' },
      { status: 500 }
    );
  }
}
