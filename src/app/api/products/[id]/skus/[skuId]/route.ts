import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get a single SKU
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skuId: string }> }
) {
  try {
    const { skuId } = await params;

    const sku = await db.productVariantSKU.findUnique({
      where: { id: skuId },
      include: {
        values: {
          include: {
            variant: true,
            option: true
          }
        }
      }
    });

    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'SKU not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sku
    });
  } catch (error) {
    console.error('Error fetching SKU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SKU' },
      { status: 500 }
    );
  }
}

// PUT - Update an SKU
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skuId: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { skuId } = await params;
    const body = await request.json();
    const { sku: newSku, price, discountPrice, stock, image, isActive, optionValues } = body;

    // Check if SKU exists
    const existingSku = await db.productVariantSKU.findUnique({
      where: { id: skuId }
    });

    if (!existingSku) {
      return NextResponse.json(
        { success: false, error: 'SKU not found' },
        { status: 404 }
      );
    }

    // If SKU code is being changed, check for duplicates
    if (newSku && newSku !== existingSku.sku) {
      const duplicateSku = await db.productVariantSKU.findUnique({
        where: { sku: newSku }
      });

      if (duplicateSku) {
        return NextResponse.json(
          { success: false, error: 'SKU code already exists' },
          { status: 400 }
        );
      }
    }

    // Update SKU
    const updatedSku = await db.productVariantSKU.update({
      where: { id: skuId },
      data: {
        sku: newSku || existingSku.sku,
        price: price !== undefined ? price : existingSku.price,
        discountPrice: discountPrice !== undefined ? discountPrice : existingSku.discountPrice,
        stock: stock !== undefined ? stock : existingSku.stock,
        image: image !== undefined ? image : existingSku.image,
        isActive: isActive !== undefined ? isActive : existingSku.isActive
      }
    });

    // Update option values if provided
    if (optionValues) {
      // Delete existing values
      await db.productVariantSKUValue.deleteMany({
        where: { skuId }
      });

      // Create new values
      await db.productVariantSKUValue.createMany({
        data: optionValues.map((ov: any) => ({
          skuId,
          variantId: ov.variantId,
          optionId: ov.optionId
        }))
      });
    }

    // Fetch updated SKU with relations
    const finalSku = await db.productVariantSKU.findUnique({
      where: { id: skuId },
      include: {
        values: {
          include: {
            variant: true,
            option: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: finalSku
    });
  } catch (error) {
    console.error('Error updating SKU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SKU' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an SKU
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skuId: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { skuId } = await params;

    // Delete SKU (cascade will delete values)
    await db.productVariantSKU.delete({
      where: { id: skuId }
    });

    return NextResponse.json({
      success: true,
      message: 'SKU deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete SKU' },
      { status: 500 }
    );
  }
}
