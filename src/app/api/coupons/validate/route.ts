import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Validate coupon code and calculate discount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    // Validate required fields
    if (!code || cartTotal === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: code, cartTotal',
        isValid: false,
      }, { status: 400 });
    }

    // Validate cartTotal
    const total = parseFloat(cartTotal);
    if (isNaN(total) || total < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid cartTotal value',
        isValid: false,
      }, { status: 400 });
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon code',
        isValid: false,
        discount: 0,
        message: 'The coupon code you entered does not exist.',
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: false,
        isValid: false,
        discount: 0,
        message: 'This coupon is no longer active.',
      });
    }

    // Check validity dates
    const now = new Date();
    
    if (now < coupon.validFrom) {
      return NextResponse.json({
        success: false,
        isValid: false,
        discount: 0,
        message: `This coupon will be valid from ${coupon.validFrom.toLocaleDateString()}.`,
      });
    }

    if (now > coupon.validUntil) {
      return NextResponse.json({
        success: false,
        isValid: false,
        discount: 0,
        message: 'This coupon has expired.',
      });
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: false,
        isValid: false,
        discount: 0,
        message: 'This coupon has reached its usage limit.',
      });
    }

    // Check minimum order requirement
    if (coupon.minOrder !== null && total < coupon.minOrder) {
      return NextResponse.json({
        success: false,
        isValid: false,
        discount: 0,
        message: `Minimum order amount of ${coupon.minOrder} required. Your cart total is ${total.toFixed(2)}.`,
        minOrder: coupon.minOrder,
        cartTotal: total,
      });
    }

    // Calculate discount
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = (total * coupon.value) / 100;
      
      // Apply max discount cap if set
      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
      
      // Discount cannot exceed cart total
      if (discount > total) {
        discount = total;
      }
    }

    // Round discount to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    // Calculate final total after discount
    const finalTotal = Math.round((total - discount) * 100) / 100;

    return NextResponse.json({
      success: true,
      isValid: true,
      discount,
      finalTotal,
      message: `Coupon applied! You saved ${discount.toFixed(2)}.`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to validate coupon',
      isValid: false,
      discount: 0,
    }, { status: 500 });
  }
}
