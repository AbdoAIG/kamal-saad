import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get a single variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { variantId } = await params;

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'المتغير غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variant' },
      { status: 500 }
    );
  }
}

// PUT - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { variantId } = await params;
    const body = await request.json();
    const { name, nameAr, order, options } = body;

    // Update variant
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: {
        name,
        nameAr,
        order
      },
      include: {
        options: true
      }
    });

    // Update options if provided
    if (options) {
      // Delete existing options
      await db.variantOption.deleteMany({
        where: { variantId }
      });

      // Create new options
      await db.variantOption.createMany({
        data: options.map((opt: any, index: number) => ({
          variantId,
          value: opt.value,
          valueAr: opt.valueAr,
          colorCode: opt.colorCode,
          image: opt.image,
          order: index
        }))
      });
    }

    // Fetch updated variant
    const updatedVariant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update variant' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { id: productId, variantId } = await params;

    // Delete variant (cascade will delete options)
    await db.productVariant.delete({
      where: { id: variantId }
    });

    // Check if product still has variants
    const remainingVariants = await db.productVariant.count({
      where: { productId }
    });

    // Update product if no variants left
    if (remainingVariants === 0) {
      await db.product.update({
        where: { id: productId },
        data: { hasVariants: false }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المتغير بنجاح'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
