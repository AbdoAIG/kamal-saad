import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { variantSchema, validateBody } from '@/schemas';

// GET - Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const variants = await db.productVariant.findMany({
      where: { productId },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

// POST - Create a new variant
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
    const validationResult = validateBody(variantSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, nameAr, options, order } = validationResult.data;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    // Create variant with options
    const variant = await db.productVariant.create({
      data: {
        productId,
        name,
        nameAr,
        order: order || 0,
        options: options ? {
          create: options.map((opt, index) => ({
            value: opt.value,
            valueAr: opt.valueAr,
            colorCode: opt.colorCode,
            image: opt.image,
            order: index
          }))
        } : undefined
      },
      include: {
        options: true
      }
    });

    // Update product to indicate it has variants
    await db.product.update({
      where: { id: productId },
      data: { hasVariants: true }
    });

    return NextResponse.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create variant' },
      { status: 500 }
    );
  }
}
