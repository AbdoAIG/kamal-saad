import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';

// POST /api/favorites/sync - Sync favorites with client-side list
// Body: { productIds: string[] }
// Adds any missing favorites, removes any extra ones, returns current list
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productIds } = body as { productIds: string[] };

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'productIds must be an array' },
        { status: 400 }
      );
    }

    // Fetch current favorites for this user
    const currentFavorites = await db.favorite.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });

    const currentProductIds = new Set(currentFavorites.map((f) => f.productId));
    const incomingProductIds = new Set(productIds);

    // Find product IDs to add (in incoming but not in current)
    const toAdd: string[] = [];
    for (const productId of incomingProductIds) {
      if (!currentProductIds.has(productId)) {
        toAdd.push(productId);
      }
    }

    // Find product IDs to remove (in current but not in incoming)
    const toRemove: string[] = [];
    for (const productId of currentProductIds) {
      if (!incomingProductIds.has(productId)) {
        toRemove.push(productId);
      }
    }

    // Execute add and remove in parallel
    await Promise.all([
      // Add missing favorites
      toAdd.length > 0
        ? db.favorite.createMany({
            data: toAdd.map((productId) => ({
              userId: user.id,
              productId,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
      // Remove extra favorites
      toRemove.length > 0
        ? db.favorite.deleteMany({
            where: {
              userId: user.id,
              productId: { in: toRemove },
            },
          })
        : Promise.resolve(),
    ]);

    // Return the full updated favorites list
    const updatedFavorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: updatedFavorites,
      synced: {
        added: toAdd.length,
        removed: toRemove.length,
      },
    });
  } catch (error) {
    console.error('Error syncing favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync favorites' },
      { status: 500 }
    );
  }
}
