import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get a single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'الفئة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reassignToCategoryId = body.reassignToCategoryId as string | undefined;

    // Count only ACTIVE (non-soft-deleted) products in this category
    const activeProductsCount = await db.product.count({
      where: { categoryId: id, deletedAt: null }
    });

    // Count soft-deleted products in this category
    const trashedProductsCount = await db.product.count({
      where: { categoryId: id, deletedAt: { not: null } }
    });

    if (activeProductsCount > 0 && !reassignToCategoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `لا يمكن حذف الفئة لأنها تحتوي على ${activeProductsCount} منتج نشط`,
          hasProducts: true,
          productsCount: activeProductsCount
        },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      // If there are active products and a reassign target was provided,
      // move all active products to the new category
      if (activeProductsCount > 0 && reassignToCategoryId) {
        // Verify the target category exists
        const targetCategory = await tx.category.findUnique({
          where: { id: reassignToCategoryId }
        });

        if (!targetCategory) {
          throw new Error('الفئة المستهدفة غير موجودة');
        }

        await tx.product.updateMany({
          where: { categoryId: id, deletedAt: null },
          data: { categoryId: reassignToCategoryId }
        });
      }

      // For any remaining soft-deleted products in this category,
      // permanently delete them since they're already in the trash
      if (trashedProductsCount > 0) {
        // Get IDs of trashed products in this category
        const trashedProductIds = await tx.product.findMany({
          where: { categoryId: id, deletedAt: { not: null } },
          select: { id: true }
        });

        if (trashedProductIds.length > 0) {
          const ids = trashedProductIds.map(p => p.id);

          // Clean up their relations
          await tx.stockNotification.deleteMany({
            where: { productId: { in: ids } }
          });
          await tx.review.deleteMany({
            where: { productId: { in: ids } }
          });
          await tx.orderItem.deleteMany({
            where: { productId: { in: ids } }
          });
          await tx.productVariantSKUValue.deleteMany({
            where: { sku: { productId: { in: ids } } }
          });
          await tx.productVariantSKU.deleteMany({
            where: { productId: { in: ids } }
          });
          await tx.variantOption.deleteMany({
            where: { variant: { productId: { in: ids } } }
          });
          await tx.productVariant.deleteMany({
            where: { productId: { in: ids } }
          });

          // Delete the trashed products
          await tx.product.deleteMany({
            where: { id: { in: ids } }
          });
        }
      }

      // Now safely delete the category
      await tx.category.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الفئة بنجاح',
      reassigned: !!reassignToCategoryId,
      trashedProductsDeleted: trashedProductsCount > 0
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
