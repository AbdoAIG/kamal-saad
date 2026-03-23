import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get all orders for admin using raw SQL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build the query
    let whereClause = '';
    const params: any[] = [];
    
    if (status && status !== 'all') {
      whereClause = 'WHERE o.status = $1';
      params.push(status);
    }

    // Use raw SQL to fetch orders
    const orders = await db.$queryRawUnsafe(
      `SELECT 
        o.id, o."userId", o.status, o.total, o.discount, 
        o."shippingAddress", o.phone, o."paymentMethod", 
        o.notes, o."pointsUsed", o."pointsEarned", 
        o."createdAt", o."updatedAt",
        u.id as "userId", u.name as "userName", u.email as "userEmail", 
        u.phone as "userPhone", u.image as "userImage"
      FROM "Order" o
      LEFT JOIN "User" u ON o."userId" = u.id
      ${whereClause}
      ORDER BY o."createdAt" DESC`,
      ...params
    ) as any[];

    // Process orders
    const processedOrders = await Promise.all(orders.map(async (order) => {
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
            fullName: order.userName || '',
            phone: order.phone || '',
          };
        }
      }

      // Fetch order items
      const items = await db.$queryRaw`
        SELECT 
          oi.id, oi."orderId", oi."productId", oi.quantity, oi.price,
          p.id as "productId", p.name, p."nameAr", p.images, p.price as "productPrice"
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        WHERE oi."orderId" = ${order.id}
      ` as any[];

      return {
        ...order,
        user: {
          id: order.userId,
          name: order.userName,
          email: order.userEmail,
          phone: order.userPhone,
          image: order.userImage,
        },
        shippingInfo,
        paymentMethod: order.paymentMethod || 'cod',
        items: items.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.productId,
            name: item.name,
            nameAr: item.nameAr,
            images: JSON.parse(item.images || '[]'),
            price: item.productPrice,
          }
        }))
      };
    }));

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
