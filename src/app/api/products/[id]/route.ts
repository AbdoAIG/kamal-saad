import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';
import { productIdSchema, updateProductSchema, validateBody, validateParams } from '@/schemas';
import {
  cacheGetOrSet,
  cacheDel,
  cacheDelPattern,
  CacheKeys,
  CacheTTL,
} from '@/lib/cache';
import { RESOURCES, ACTIONS } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to get from cache
    const product = await cacheGetOrSet(
      CacheKeys.products.detail(id),
      async () => {
        return db.product.findUnique({
          where: { id },
          include: {
            category: true,
            variants: {
              include: {
                options: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            },
            variantSKUs: {
              where: { isActive: true },
              include: {
                values: {
                  include: {
                    variant: { select: { id: true, name: true, nameAr: true } },
                    option: { select: { id: true, value: true, valueAr: true, colorCode: true } }
                  }
                }
              }
            }
          }
        });
      },
      { ttl: CacheTTL.MEDIUM, prefix: 'api' }
    );

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'المنتج غير موجود'
      }, { status: 404 });
    }

    // Don't show soft deleted products to public
    if (product.deletedAt) {
      return NextResponse.json({
        success: false,
        error: 'المنتج غير موجود'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch product'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const authResult = await requirePermission(request, RESOURCES.PRODUCTS, ACTIONS.UPDATE);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = validateBody(updateProductSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, nameAr, description, descriptionAr, price, discountPrice, images, stock, categoryId, featured, hasVariants } = validationResult.data;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'المنتج غير موجود'
      }, { status: 404 });
    }

    // Check if category exists (if changing category)
    if (categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        return NextResponse.json({
          success: false,
          error: 'الفئة غير موجودة'
        }, { status: 400 });
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        price: price !== undefined ? price : existingProduct.price,
        discountPrice: discountPrice !== undefined ? discountPrice : existingProduct.discountPrice,
        images: images ? JSON.stringify(images) : existingProduct.images,
        stock: stock !== undefined ? stock : existingProduct.stock,
        categoryId: categoryId || existingProduct.categoryId,
        featured: featured !== undefined ? featured : existingProduct.featured,
        hasVariants: hasVariants !== undefined ? hasVariants : existingProduct.hasVariants
      },
      include: {
        category: true,
        variants: {
          include: { options: true }
        }
      }
    });

    // Invalidate cache
    await cacheDel(CacheKeys.products.detail(id), { prefix: 'api' });
    await cacheDelPattern('products:list:*', { prefix: 'api' });

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update product'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const authResult = await requirePermission(request, RESOURCES.PRODUCTS, ACTIONS.DELETE);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'المنتج غير موجود'
      }, { status: 404 });
    }

    // Soft delete - set deletedAt timestamp
    await db.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Invalidate cache
    await cacheDel(CacheKeys.products.detail(id), { prefix: 'api' });
    await cacheDelPattern('products:*', { prefix: 'api' });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete product'
    }, { status: 500 });
  }
}
