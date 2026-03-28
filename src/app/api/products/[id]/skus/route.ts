import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { skuSchema, validateBody } from '@/schemas';

// GET - Get all SKUs for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const skus = await db.productVariantSKU.findMany({
      where: { productId },
      include: {
        values: {
          include: {
            variant: {
              select: { id: true, name: true, nameAr: true }
            },
            option: {
              select: { id: true, value: true, valueAr: true, colorCode: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: skus
    });
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SKUs' },
      { status: 500 }
    );
  }
}

// POST - Create a new SKU
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { id: productId } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(skuSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { sku, price, discountPrice, stock, image, isActive, optionValues } = validationResult.data;

    // Check if SKU already exists
    const existingSku = await db.productVariantSKU.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json(
        { success: false, error: 'رمز SKU موجود بالفعل' },
        { status: 400 }
      );
    }

    // Create SKU with option values
    const newSku = await db.productVariantSKU.create({
      data: {
        productId,
        sku,
        price: price || null,
        discountPrice: discountPrice || null,
        stock: stock || 0,
        image,
        isActive: isActive ?? true,
        values: optionValues ? {
          create: optionValues.map((ov) => ({
            variantId: ov.variantId,
            optionId: ov.optionId
          }))
        } : undefined
      },
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
      data: newSku
    });
  } catch (error) {
    console.error('Error creating SKU:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SKU' },
      { status: 500 }
    );
  }
}
