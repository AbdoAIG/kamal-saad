import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncItemInput {
  productId: string;
  skuId?: string;
  quantity: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          category: true,
        },
      },
      sku: {
        include: {
          values: {
            include: {
              variant: true,
              option: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

// ─── POST /api/cart/sync ──────────────────────────────────────────────────────
// Replaces the entire DB cart with the provided items list.
// Body: { items: [{ productId, skuId?, quantity }] }
// Used to push the localStorage cart to the DB after login.

export async function POST(request: NextRequest) {
  try {
    const user = await optionalAuth(request);

    if (!user) {
      return NextResponse.json(
        { cart: null, message: 'Not authenticated' },
        { status: 200 },
      );
    }

    const body = await request.json();
    const items: SyncItemInput[] = body?.items ?? [];

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 },
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid productId and positive quantity' },
          { status: 400 },
        );
      }
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.id },
      });
    }

    // 1. Delete ALL existing cart items (full replacement)
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // 2. Create new items
    for (const item of items) {
      // Verify product exists
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        console.warn(`[POST /api/cart/sync] Skipping missing product: ${item.productId}`);
        continue;
      }

      // If skuId provided, verify SKU exists and belongs to product
      if (item.skuId) {
        const sku = await db.productVariantSKU.findUnique({
          where: { id: item.skuId },
        });
        if (!sku || sku.productId !== item.productId) {
          console.warn(
            `[POST /api/cart/sync] Skipping invalid SKU: ${item.skuId} for product ${item.productId}`,
          );
          continue;
        }
      }

      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          skuId: item.skuId ?? null,
          quantity: item.quantity,
        },
      });
    }

    // 3. Return the synced cart
    const syncedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({
      cart: syncedCart,
      synced: true,
      itemCount: syncedCart?.items.length ?? 0,
      totalItems: syncedCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  } catch (error) {
    console.error('[POST /api/cart/sync] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart', details: String(error) },
      { status: 500 },
    );
  }
}
