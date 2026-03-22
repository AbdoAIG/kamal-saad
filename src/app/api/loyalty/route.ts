import { prisma } from '@/lib/prisma';
import { getLoyaltySummary, POINTS_TO_EGP_RATE } from '@/lib/loyalty';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Get user's loyalty points and history
 * Query params:
 * - userId: string (required) - The user ID
 * - limit: number (optional) - Number of history entries to return (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get loyalty summary
    const summaryResult = await getLoyaltySummary(userId);

    if (!summaryResult.success) {
      return NextResponse.json(
        { success: false, error: summaryResult.error },
        { status: 404 }
      );
    }

    // Get recent history with pagination
    const history = await prisma.loyaltyHistory.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Format history entries
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      points: entry.points,
      type: entry.type,
      reason: entry.reason,
      monetaryValue: entry.type === 'redeem' || entry.type === 'expire' 
        ? Math.abs(entry.points) * POINTS_TO_EGP_RATE 
        : entry.points * POINTS_TO_EGP_RATE,
      orderId: entry.orderId,
      order: entry.order,
      createdAt: entry.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult.data,
        history: formattedHistory,
        pointsRate: {
          pointsToEgp: POINTS_TO_EGP_RATE,
          description: `1 point = ${POINTS_TO_EGP_RATE} EGP`
        }
      }
    });
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loyalty data' },
      { status: 500 }
    );
  }
}
