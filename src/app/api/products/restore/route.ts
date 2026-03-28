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

    // Permanently delete
    await db.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المنتج نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting product:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to permanently delete product' 
    }, { status: 500 });
  }
}
