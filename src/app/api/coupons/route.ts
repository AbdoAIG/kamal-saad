import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all coupons (admin only) or validate a coupon code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const admin = searchParams.get('admin');

    // Validate a single coupon code (for customers)
    if (code) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json({
          success: false,
          error: 'Invalid coupon code',
        }, { status: 404 });
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return NextResponse.json({
          success: false,
          error: 'This coupon is no longer active',
          isValid: false,
        });
      }

      // Check validity dates
      const now = new Date();
      if (now < coupon.validFrom) {
        return NextResponse.json({
          success: false,
          error: 'This coupon is not yet valid',
          isValid: false,
        });
      }

      if (now > coupon.validUntil) {
        return NextResponse.json({
          success: false,
          error: 'This coupon has expired',
          isValid: false,
        });
      }

      // Check usage limit
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({
          success: false,
          error: 'This coupon has reached its usage limit',
          isValid: false,
        });
      }

      return NextResponse.json({
        success: true,
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minOrder: coupon.minOrder,
          maxDiscount: coupon.maxDiscount,
        },
      });
    }

    // List all coupons (admin only)
    if (admin === 'true') {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: coupons,
      });
    }

    // Default: return error if no valid query params
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
    }, { status: 400 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupons',
    }, { status: 500 });
  }
}

// POST - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
    } = body;

    // Validate required fields
    if (!code || !type || value === undefined || !validFrom || !validUntil) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: code, type, value, validFrom, validUntil',
      }, { status: 400 });
    }

    // Validate coupon type
    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon type. Must be "percentage" or "fixed"',
      }, { status: 400 });
    }

    // Validate value
    if (type === 'percentage' && (value <= 0 || value > 100)) {
      return NextResponse.json({
        success: false,
        error: 'Percentage value must be between 1 and 100',
      }, { status: 400 });
    }

    if (type === 'fixed' && value <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Fixed value must be greater than 0',
      }, { status: 400 });
    }

    // Validate dates
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format',
      }, { status: 400 });
    }

    if (fromDate >= untilDate) {
      return NextResponse.json({
        success: false,
        error: 'validFrom must be before validUntil',
      }, { status: 400 });
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon code already exists',
      }, { status: 409 });
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        usageCount: 0,
        validFrom: fromDate,
        validUntil: untilDate,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create coupon',
    }, { status: 500 });
  }
}
