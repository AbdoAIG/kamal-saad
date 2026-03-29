import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';

// GET - Get all orders for admin with pagination
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimits.api);
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build the query using Prisma
    const whereClause: any = {}
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get total count for pagination
    const totalCount = await db.order.count({ where: whereClause });

    // Fetch orders with user info
    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                images: true,
                price: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });

    // Process orders
    const processedOrders = orders.map(order => {
      let shippingInfo = null;

      // Try to parse shipping address as JSON
      if (order.shippingAddress) {
        try {
          shippingInfo = JSON.parse(order.shippingAddress);
        } catch {
          shippingInfo = {
            raw: order.shippingAddress,
            governorate: '',
            city: '',
            address: order.shippingAddress,
            fullName: order.user?.name || '',
            phone: order.phone || '',
          };
        }
      }

      return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        total: order.total,
        discount: order.discount,
        shippingAddress: order.shippingAddress,
        phone: order.phone,
        paymentMethod: order.paymentMethod || 'cod',
        notes: order.notes,
        pointsUsed: order.pointsUsed,
        pointsEarned: order.pointsEarned,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.user,
        shippingInfo,
        items: order.items.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product.id,
            name: item.product.name,
            nameAr: item.product.nameAr,
            images: JSON.parse(item.product.images || '[]'),
            price: item.product.price,
          }
        }))
      };
    });

    // Filter by search if provided
    let filteredOrders = processedOrders;
    let filteredCount = totalCount;
    
    if (search) {
      const searchLower = search.toLowerCase();
      const searchId = search.replace('#', '').toLowerCase();

      filteredOrders = processedOrders.filter(order => {
        const matchesId = order.id.toLowerCase().includes(searchId) ||
                         order.id.slice(-8).toLowerCase().includes(searchId);
        const matchesName = order.shippingInfo?.fullName?.toLowerCase().includes(searchLower) ||
                          order.user?.name?.toLowerCase().includes(searchLower);
        const matchesEmail = order.user?.email?.toLowerCase().includes(searchLower);
        const matchesPhone = order.shippingInfo?.phone?.includes(search) ||
                           order.phone?.includes(search);

        return matchesId || matchesName || matchesEmail || matchesPhone;
      });
      
      // For search, we need to recalculate count (approximate)
      // In production, you might want to do a separate count query with search filters
      filteredCount = filteredOrders.length;
    }

    const totalPages = Math.ceil((search ? filteredCount : totalCount) / limit);

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      pagination: {
        page,
        limit,
        totalItems: search ? filteredCount : totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
