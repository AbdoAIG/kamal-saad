import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItemInput {
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

/** Get or create a cart for the given userId. */
async function getOrCreateCart(userId: string) {
  let cart = await db.cart.findUnique({
    where: { userId },
    include: CART_INCLUDE,
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId },
      include: CART_INCLUDE,
    });
  }

  return cart;
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await optionalAuth(request);

    if (!user) {
      return NextResponse.json(
        { cart: null, message: 'Not authenticated' },
        { status: 200 },
      );
    }

    const cart = await getOrCreateCart(user.id);

    return NextResponse.json({
      cart,
      synced: true,
      itemCount: cart.items.length,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('[GET /api/cart] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: String(error) },
      { status: 500 },
    );
  }
}

// ─── POST /api/cart ───────────────────────────────────────────────────────────
// Syncs the entire cart state to the database (upsert – create / update / delete)
// Body: { items: [{ productId, skuId?, quantity }] }

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
    const items: CartItemInput[] = body?.items ?? [];

    // Validate input
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid productId and positive quantity' },
          { status: 400 },
        );
      }
    }

    const cart = await getOrCreateCart(user.id);

    // 1. Build a map of incoming items keyed by `${productId}:${skuId || ''}`
    const incomingMap = new Map<string, CartItemInput>();
    for (const item of items) {
      const key = `${item.productId}:${item.skuId ?? ''}`;
      incomingMap.set(key, item);
    }

    // 2. Upsert incoming items, track IDs we keep
    const keptIds = new Set<string>();

    for (const item of items) {
      // Verify product exists
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 },
        );
      }

      // If skuId provided, verify SKU exists and belongs to product
      if (item.skuId) {
        const sku = await db.productVariantSKU.findUnique({
          where: { id: item.skuId },
        });
        if (!sku || sku.productId !== item.productId) {
          return NextResponse.json(
            { error: `Invalid SKU: ${item.skuId} for product ${item.productId}` },
            { status: 400 },
          );
        }
      }

      // Find existing cart item with same product + sku combo
      const existing = await db.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: item.productId,
          skuId: item.skuId ?? null,
        },
      });

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity: item.quantity },
        });
        keptIds.add(existing.id);
      } else {
        const created = await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            skuId: item.skuId ?? null,
            quantity: item.quantity,
          },
        });
        keptIds.add(created.id);
      }
    }

    // 3. Delete any DB items that were NOT in the incoming list
    const allDbItems = await db.cartItem.findMany({
      where: { cartId: cart.id },
      select: { id: true },
    });

    for (const dbItem of allDbItems) {
      if (!keptIds.has(dbItem.id)) {
        await db.cartItem.delete({ where: { id: dbItem.id } });
      }
    }

    // 4. Return the final synced cart
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
    console.error('[POST /api/cart] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart', details: String(error) },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
// Clear all items from the user's cart (no query params = clear all)

export async function DELETE(request: NextRequest) {
  try {
    const user = await optionalAuth(request);

    if (!user) {
      return NextResponse.json(
        { cart: null, message: 'Not authenticated' },
        { status: 200 },
      );
    }

    const cart = await db.cart.findUnique({
      where: { userId: user.id },
    });

    if (cart) {
      // Delete all items in the cart
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
      cart: cart
        ? { ...cart, items: [] }
        : null,
    });
  } catch (error) {
    console.error('[DELETE /api/cart] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart', details: String(error) },
      { status: 500 },
    );
  }
}
