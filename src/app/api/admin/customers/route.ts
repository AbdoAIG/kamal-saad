import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';

// GET - Fetch all customers with their order stats (with pagination)
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = withRateLimit(request, rateLimits.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db.user.count({
      where: {
        role: 'customer'
      }
    });

    // Get paginated users with customer role
    const customers = await db.user.findMany({
      where: {
        role: 'customer'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Calculate stats for each customer
    const customersWithStats = customers.map(customer => {
      const ordersCount = customer.orders.length;
      const totalSpent = customer.orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        ordersCount,
        totalSpent,
        _count: customer._count
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: customersWithStats,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
