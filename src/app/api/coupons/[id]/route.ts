import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupon',
    }, { status: 500 });
  }
}

// PUT - Update coupon (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found',
      }, { status: 404 });
    }

    // Validate coupon type if provided
    if (type && type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon type. Must be "percentage" or "fixed"',
      }, { status: 400 });
    }

    // Validate value if provided
    const finalType = type || existingCoupon.type;
    const finalValue = value !== undefined ? value : existingCoupon.value;

    if (finalType === 'percentage' && (finalValue <= 0 || finalValue > 100)) {
      return NextResponse.json({
        success: false,
        error: 'Percentage value must be between 1 and 100',
      }, { status: 400 });
    }

    if (finalType === 'fixed' && finalValue <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Fixed value must be greater than 0',
      }, { status: 400 });
    }

    // Validate dates if provided
    let fromDate = existingCoupon.validFrom;
    let untilDate = existingCoupon.validUntil;

    if (validFrom) {
      fromDate = new Date(validFrom);
      if (isNaN(fromDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid validFrom date format',
        }, { status: 400 });
      }
    }

    if (validUntil) {
      untilDate = new Date(validUntil);
      if (isNaN(untilDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid validUntil date format',
        }, { status: 400 });
      }
    }

    if (fromDate >= untilDate) {
      return NextResponse.json({
        success: false,
        error: 'validFrom must be before validUntil',
      }, { status: 400 });
    }

    // Check if new code already exists (if changing code)
    if (code && code.toUpperCase() !== existingCoupon.code) {
      const duplicateCoupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (duplicateCoupon) {
        return NextResponse.json({
          success: false,
          error: 'Coupon code already exists',
        }, { status: 409 });
        }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (code) updateData.code = code.toUpperCase();
    if (type) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (minOrder !== undefined) updateData.minOrder = minOrder ? parseFloat(minOrder) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (validFrom) updateData.validFrom = fromDate;
    if (validUntil) updateData.validUntil = untilDate;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update coupon',
    }, { status: 500 });
  }
}

// DELETE - Delete coupon (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!existingCoupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found',
      }, { status: 404 });
    }

    // Check if coupon has been used in orders
    if (existingCoupon.orders.length > 0) {
      // Instead of deleting, deactivate the coupon
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Coupon has been used in orders. It has been deactivated instead of deleted.',
        data: coupon,
      });
    }

    // Delete coupon if not used
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete coupon',
    }, { status: 500 });
  }
}
