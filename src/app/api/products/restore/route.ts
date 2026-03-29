import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';

// POST - Restore a soft deleted product
export async function POST(request: NextRequest) {
  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: 'معرف المنتج مطلوب' 
      }, { status: 400 });
    }

    // Check if product exists and is soft deleted
    const product = await db.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ 
        success: false,
        error: 'المنتج غير موجود' 
      }, { status: 404 });
    }

    if (!product.deletedAt) {
      return NextResponse.json({ 
        success: false,
        error: 'المنتج غير محذوف' 
      }, { status: 400 });
    }

    // Restore product
    const restoredProduct = await db.product.update({
      where: { id },
      data: { deletedAt: null },
      include: { category: true }
    });

    return NextResponse.json({
      success: true,
      message: 'تم استعادة المنتج بنجاح',
      data: restoredProduct
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to restore product' 
    }, { status: 500 });
  }
}

// DELETE - Permanently delete a product
export async function DELETE(request: NextRequest) {
  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: 'معرف المنتج مطلوب' 
      }, { status: 400 });
    }

    // Check if product exists and is soft deleted
    const product = await db.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ 
        success: false,
        error: 'المنتج غير موجود' 
      }, { status: 404 });
    }

    if (!product.deletedAt) {
      return NextResponse.json({ 
        success: false,
        error: 'يجب حذف المنتج أولاً قبل الحذف النهائي' 
      }, { status: 400 });
    }

    // Permanently delete with a transaction to handle FK constraints
    // OrderItem has a FK reference that blocks direct deletion
    // We need to remove the OrderItem references first (keeping the order intact)
    await db.$transaction(async (tx) => {
      // Delete all stock notifications for this product
      await tx.stockNotification.deleteMany({ where: { productId: id } });
      
      // Delete all reviews for this product
      await tx.review.deleteMany({ where: { productId: id } });
      
      // Delete all variant-related records
      await tx.productVariantSKUValue.deleteMany({
        where: { sku: { productId: id } }
      });
      await tx.productVariantSKU.deleteMany({ where: { productId: id } });
      await tx.variantOption.deleteMany({
        where: { variant: { productId: id } }
      });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      
      // Delete all order items that reference this product
      // (This is safe because the product is already soft-deleted and the orders
      // still keep their other items and totals intact)
      await tx.orderItem.deleteMany({ where: { productId: id } });
      
      // CartItem will cascade automatically due to onDelete: Cascade in schema
      
      // Finally delete the product
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المنتج نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting product:', error);
    return NextResponse.json({ 
      success: false,
      error: 'فشل في حذف المنتج نهائياً. تأكد من عدم وجود طلبات معلقة مرتبطة بالمنتج.' 
    }, { status: 500 });
  }
}
