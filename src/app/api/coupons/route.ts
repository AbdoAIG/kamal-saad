import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { couponSchema, validateCouponSchema, validateBody } from '@/schemas';

// GET - Get all coupons (admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST - Create a new coupon (admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(couponSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { code, type, value, minOrder, maxDiscount, usageLimit, validFrom, validUntil, isActive } = validationResult.data;

    // Check if coupon code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'كود الخصم موجود بالفعل' },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minOrder: minOrder || null,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
