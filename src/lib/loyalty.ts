import { prisma } from '@/lib/prisma';

// Points conversion rate: 1 point = 0.5 EGP
export const POINTS_TO_EGP_RATE = 0.5;

// Points earned per EGP spent (e.g., 1 point per 10 EGP)
export const EGP_TO_POINTS_RATE = 0.1; // 10 EGP = 1 point

/**
 * Earn points after a purchase
 * @param userId - The user ID
 * @param points - Number of points to earn
 * @param reason - Reason for earning points
 * @param orderId - Optional order ID associated with the points
 */
export async function earnPoints(
  userId: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    if (points <= 0) {
      return { success: false, newBalance: 0, error: 'Points must be greater than 0' };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user's total points
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points }
        }
      });

      // Create loyalty history entry
      await tx.loyaltyHistory.create({
        data: {
          userId,
          points,
          type: 'earn',
          reason,
          orderId
        }
      });

      // Update order with points earned if orderId is provided
      if (orderId) {
        await tx.order.update({
          where: { id: orderId },
          data: { pointsEarned: points }
        });
      }

      return user;
    });

    return { success: true, newBalance: result.loyaltyPoints };
  } catch (error) {
    console.error('Error earning points:', error);
    return { 
      success: false, 
      newBalance: 0, 
      error: 'Failed to earn points' 
    };
  }
}

/**
 * Redeem points for a discount on an order
 * @param userId - The user ID
 * @param points - Number of points to redeem
 * @param orderId - The order ID to apply the discount to
 */
export async function redeemPoints(
  userId: string,
  points: number,
  orderId: string
): Promise<{ 
  success: boolean; 
  discount: number; 
  newBalance: number; 
  error?: string 
}> {
  try {
    if (points <= 0) {
      return { success: false, discount: 0, newBalance: 0, error: 'Points must be greater than 0' };
    }

    // Get user and order
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, discount: 0, newBalance: 0, error: 'User not found' };
    }

    if (user.loyaltyPoints < points) {
      return { 
        success: false, 
        discount: 0, 
        newBalance: user.loyaltyPoints, 
        error: 'Insufficient points' 
      };
    }

    // Calculate discount
    const discount = points * POINTS_TO_EGP_RATE;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { decrement: points }
        }
      });

      // Create loyalty history entry
      await tx.loyaltyHistory.create({
        data: {
          userId,
          points: -points, // Negative to indicate redemption
          type: 'redeem',
          reason: `Redeemed ${points} points for ${discount} EGP discount`,
          orderId
        }
      });

      // Update order with discount and points used
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          discount: { increment: discount },
          pointsUsed: points
        }
      });

      return { user: updatedUser, order };
    });

    return { 
      success: true, 
      discount, 
      newBalance: result.user.loyaltyPoints 
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    return { 
      success: false, 
      discount: 0, 
      newBalance: 0, 
      error: 'Failed to redeem points' 
    };
  }
}

/**
 * Expire points older than 1 year
 * This should be called periodically (e.g., via cron job)
 */
export async function expirePoints(): Promise<{ 
  success: boolean; 
  expiredCount: number; 
  totalExpiredPoints: number;
  error?: string 
}> {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Find all earned points older than 1 year that haven't been expired
    const oldPointsEntries = await prisma.loyaltyHistory.findMany({
      where: {
        type: 'earn',
        createdAt: { lt: oneYearAgo }
      },
      include: {
        user: true
      }
    });

    // Group by user and calculate points to expire
    const userPointsMap = new Map<string, number>();
    
    for (const entry of oldPointsEntries) {
      const currentPoints = userPointsMap.get(entry.userId) || 0;
      userPointsMap.set(entry.userId, currentPoints + entry.points);
    }

    let totalExpiredPoints = 0;
    const expiredEntries: string[] = [];

    // Process each user's expired points
    for (const [userId, pointsToExpire] of userPointsMap) {
      // Get current user balance
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.loyaltyPoints <= 0) continue;

      // Calculate actual points to expire (cannot exceed current balance)
      const actualPointsToExpire = Math.min(pointsToExpire, user.loyaltyPoints);

      if (actualPointsToExpire <= 0) continue;

      // Use transaction to expire points
      await prisma.$transaction(async (tx) => {
        // Deduct expired points from user
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: { decrement: actualPointsToExpire }
          }
        });

        // Create expiry history entry
        await tx.loyaltyHistory.create({
          data: {
            userId,
            points: -actualPointsToExpire,
            type: 'expire',
            reason: `Expired ${actualPointsToExpire} points (older than 1 year)`
          }
        });
      });

      totalExpiredPoints += actualPointsToExpire;
      expiredEntries.push(userId);
    }

    return { 
      success: true, 
      expiredCount: expiredEntries.length, 
      totalExpiredPoints 
    };
  } catch (error) {
    console.error('Error expiring points:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      totalExpiredPoints: 0,
      error: 'Failed to expire points' 
    };
  }
}

/**
 * Get user's loyalty points summary
 * @param userId - The user ID
 */
export async function getLoyaltySummary(userId: string): Promise<{
  success: boolean;
  data?: {
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    totalExpired: number;
    monetaryValue: number;
  };
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loyaltyHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Calculate totals from history
    let totalEarned = 0;
    let totalRedeemed = 0;
    let totalExpired = 0;

    for (const entry of user.loyaltyHistory) {
      if (entry.type === 'earn') {
        totalEarned += entry.points;
      } else if (entry.type === 'redeem') {
        totalRedeemed += Math.abs(entry.points);
      } else if (entry.type === 'expire') {
        totalExpired += Math.abs(entry.points);
      }
    }

    return {
      success: true,
      data: {
        currentPoints: user.loyaltyPoints,
        totalEarned,
        totalRedeemed,
        totalExpired,
        monetaryValue: user.loyaltyPoints * POINTS_TO_EGP_RATE
      }
    };
  } catch (error) {
    console.error('Error getting loyalty summary:', error);
    return { success: false, error: 'Failed to get loyalty summary' };
  }
}

/**
 * Calculate points to earn from an order total
 * @param orderTotal - The order total in EGP
 */
export function calculatePointsToEarn(orderTotal: number): number {
  return Math.floor(orderTotal * EGP_TO_POINTS_RATE);
}

/**
 * Calculate discount from points
 * @param points - Number of points
 */
export function calculateDiscountFromPoints(points: number): number {
  return points * POINTS_TO_EGP_RATE;
}
