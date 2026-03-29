import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateItemBody {
  itemId?: string;
  productId?: string;
  skuId?: string;
  quantity: number;
}

interface DeleteItemParams {
  itemId?: string;
  productId?: string;
  skuId?: string;
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

/** Fetch full cart by userId. */
async function fetchFullCart(userId: string) {
  return db.cart.findUnique({
    where: { userId },
    include: CART_INCLUDE,
  });
}

// ─── PUT /api/cart/item ───────────────────────────────────────────────────────
// Update item quantity. If quantity <= 0, remove the item.
// Body: { itemId, quantity }  OR  { productId, skuId?, quantity }

export async function PUT(request: NextRequest) {
  try {
    const user = await optionalAuth(request);

    if (!user) {
      return NextResponse.json(
        { cart: null, message: 'Not authenticated' },
        { status: 200 },
      );
    }

    const body: UpdateItemBody = await request.json();
    const { itemId, productId, skuId, quantity } = body;

    // Validate
    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'quantity is required and must be a number' },
        { status: 400 },
      );
    }

    if (!itemId && !productId) {
      return NextResponse.json(
        { error: 'Either itemId or productId must be provided' },
        { status: 400 },
      );
    }

    const cart = await db.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 },
      );
    }

    // Find the cart item
    let cartItem;
    if (itemId) {
      cartItem = await db.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
      });
    } else {
      cartItem = await db.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId!,
          skuId: skuId ?? null,
        },
      });
    }

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 },
      );
    }

    // If quantity <= 0, remove the item
    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id: cartItem.id } });
    } else {
      await db.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    }

    const updatedCart = await fetchFullCart(user.id);

    return NextResponse.json({
      cart: updatedCart,
      success: true,
      itemCount: updatedCart?.items.length ?? 0,
      totalItems: updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  } catch (error) {
    console.error('[PUT /api/cart/item] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item', details: String(error) },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/cart/item ────────────────────────────────────────────────────
// Remove a specific item from the cart.
// Query: ?itemId=xxx   OR   Body: { itemId }  OR  { productId, skuId? }

export async function DELETE(request: NextRequest) {
  try {
    const user = await optionalAuth(request);

    if (!user) {
      return NextResponse.json(
        { cart: null, message: 'Not authenticated' },
        { status: 200 },
      );
    }

    // Try query param first, then body
    const { searchParams } = new URL(request.url);
    const queryItemId = searchParams.get('itemId');

    let itemId: string | undefined;
    let productId: string | undefined;
    let skuId: string | undefined;

    if (queryItemId) {
      itemId = queryItemId;
    } else {
      // Try parsing body
      let body: DeleteItemParams = {};
      try {
        const raw = await request.json();
        body = raw;
      } catch {
        // No body – that's fine if itemId was in query
      }
      itemId = body.itemId;
      productId = body.productId;
      skuId = body.skuId;
    }

    if (!itemId && !productId) {
      return NextResponse.json(
        { error: 'Either itemId or productId must be provided' },
        { status: 400 },
      );
    }

    const cart = await db.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 },
      );
    }

    // Find and delete the item
    if (itemId) {
      // Verify item belongs to this user's cart
      const existing = await db.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 },
        );
      }
      await db.cartItem.delete({ where: { id: itemId } });
    } else {
      // Delete by productId (+ skuId)
      const whereClause: Record<string, unknown> = {
        cartId: cart.id,
        productId: productId!,
      };
      if (skuId) {
        whereClause.skuId = skuId;
      } else {
        whereClause.skuId = null;
      }

      const result = await db.cartItem.deleteMany({ where: whereClause });
      if (result.count === 0) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 },
        );
      }
    }

    const updatedCart = await fetchFullCart(user.id);

    return NextResponse.json({
      cart: updatedCart,
      success: true,
      itemCount: updatedCart?.items.length ?? 0,
      totalItems: updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  } catch (error) {
    console.error('[DELETE /api/cart/item] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item', details: String(error) },
      { status: 500 },
    );
  }
}
