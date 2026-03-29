import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateCouponSchema, validateBody } from '@/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(validateCouponSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { code, total } = validationResult.data;

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'كود الخصم غير صالح' },
        { status: 400 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'كود الخصم غير مفعل' },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json(
        { success: false, error: 'كود الخصم منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'تم استخدام كود الخصم الحد الأقصى من المرات' },
        { status: 400 }
      );
    }

    // Check minimum order
    if (coupon.minOrder && total < coupon.minOrder) {
      return NextResponse.json(
        { 
          success: false, 
          error: `الحد الأدنى للطلب ${coupon.minOrder} ج.م` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (total * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
