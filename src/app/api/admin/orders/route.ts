import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get all orders for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
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
      }
    });

    // Process orders and parse data
    const processedOrders = orders.map(order => {
      let shippingInfo = null;

      // Try to parse shipping address as JSON
      if (order.shippingAddress) {
        try {
          shippingInfo = JSON.parse(order.shippingAddress);
        } catch {
          // Old format - plain text address
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
        ...order,
        shippingInfo,
        paymentMethod: order.paymentMethod || 'cod',
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: JSON.parse(item.product.images || '[]')
          }
        }))
      };
    });

    // Filter by search if provided
    let filteredOrders = processedOrders;
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
    }

    return NextResponse.json({
      success: true,
      data: filteredOrders
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
