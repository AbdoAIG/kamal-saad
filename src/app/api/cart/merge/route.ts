import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { optionalAuth } from '@/lib/auth-utils';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MergeItemInput {
  productId: string;
  skuId?: string;
  quantity: number;
  product?: Record<string, unknown>; // Full product object from client – not stored, just for validation
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

// ─── POST /api/cart/merge ─────────────────────────────────────────────────────
// Merges localStorage cart items into the DB cart.
// For each incoming item:
//   - If the same product+sku combo exists in DB → add quantities
//   - If it doesn't exist → create it
// Body: { items: [{ productId, skuId?, quantity, product? }] }
// Called after login to merge the client-side cart with the persisted DB cart.

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
    const items: MergeItemInput[] = body?.items ?? [];

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 },
      );
    }

    // Filter out items with invalid quantity
    const validItems = items.filter(
      (item) => item.productId && typeof item.quantity === 'number' && item.quantity > 0,
    );

    if (validItems.length === 0) {
      // Nothing to merge, just return current cart
      const cart = await db.cart.findUnique({
        where: { userId: user.id },
        include: CART_INCLUDE,
      });
      return NextResponse.json({
        cart,
        merged: false,
        message: 'No valid items to merge',
        itemCount: cart?.items.length ?? 0,
        totalItems: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      });
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

    // Build a map of existing DB items by `${productId}:${skuId}`
    const existingItems = await db.cartItem.findMany({
      where: { cartId: cart.id },
    });
    const existingMap = new Map<string, (typeof existingItems)[number]>();
    for (const item of existingItems) {
      const key = `${item.productId}:${item.skuId ?? ''}`;
      existingMap.set(key, item);
    }

    // Merge: upsert each incoming item
    for (const item of validItems) {
      const key = `${item.productId}:${item.skuId ?? ''}`;
      const existing = existingMap.get(key);

      // Verify product exists
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        console.warn(`[POST /api/cart/merge] Skipping missing product: ${item.productId}`);
        continue;
      }

      // If skuId provided, verify SKU exists and belongs to product
      if (item.skuId) {
        const sku = await db.productVariantSKU.findUnique({
          where: { id: item.skuId },
        });
        if (!sku || sku.productId !== item.productId) {
          console.warn(
            `[POST /api/cart/merge] Skipping invalid SKU: ${item.skuId} for product ${item.productId}`,
          );
          continue;
        }
      }

      if (existing) {
        // Add quantities together
        const newQuantity = existing.quantity + item.quantity;
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Create new item
        await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            skuId: item.skuId ?? null,
            quantity: item.quantity,
          },
        });
      }
    }

    // Return the merged cart
    const mergedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({
      cart: mergedCart,
      merged: true,
      mergedItemCount: validItems.length,
      itemCount: mergedCart?.items.length ?? 0,
      totalItems: mergedCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  } catch (error) {
    console.error('[POST /api/cart/merge] Error:', error);

    // Handle specific Prisma errors gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referenced product or SKU not found', details: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to merge cart', details: String(error) },
      { status: 500 },
    );
  }
}
