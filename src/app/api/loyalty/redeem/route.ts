import { prisma } from '@/lib/prisma';
import { redeemPoints, POINTS_TO_EGP_RATE } from '@/lib/loyalty';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Redeem loyalty points for a discount on an order
 * Body:
 * - userId: string (required) - The user ID
 * - points: number (required) - Number of points to redeem
 * - orderId: string (required) - The order ID to apply discount to
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points, orderId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid points amount is required' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Order does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if order is in a valid state for redemption (pending or processing)
    if (!['pending', 'processing'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot redeem points on this order status' },
        { status: 400 }
      );
    }

    // Check if points have already been used on this order
    if (order.pointsUsed > 0) {
      return NextResponse.json(
        { success: false, error: 'Points have already been redeemed for this order' },
        { status: 400 }
      );
    }

    // Get user to check current points
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate user has enough points
    if (user.loyaltyPoints < points) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient points',
          data: {
            requestedPoints: points,
            availablePoints: user.loyaltyPoints,
            pointsNeeded: points - user.loyaltyPoints
          }
        },
        { status: 400 }
      );
    }

    // Calculate the discount
    const discountAmount = points * POINTS_TO_EGP_RATE;

    // Validate discount doesn't exceed order total
    const orderTotalAfterDiscount = order.total - order.discount;
    if (discountAmount > orderTotalAfterDiscount) {
      const maxPoints = Math.floor(orderTotalAfterDiscount / POINTS_TO_EGP_RATE);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Discount cannot exceed order total',
          data: {
            requestedPoints: points,
            requestedDiscount: discountAmount,
            maxAllowedPoints: maxPoints,
            maxAllowedDiscount: maxPoints * POINTS_TO_EGP_RATE,
            orderTotalAfterCurrentDiscount: orderTotalAfterDiscount
          }
        },
        { status: 400 }
      );
    }

    // Redeem the points
    const result = await redeemPoints(userId, points, orderId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        pointsRedeemed: points,
        discountApplied: result.discount,
        newPointsBalance: result.newBalance,
        order: updatedOrder,
        message: `Successfully redeemed ${points} points for ${result.discount} EGP discount`
      }
    });
  } catch (error) {
    console.error('Loyalty redeem error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to redeem points' },
      { status: 500 }
    );
  }
}
