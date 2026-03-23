import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get single order details using raw SQL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch order using raw SQL
    const orders = await db.$queryRaw`
      SELECT 
        o.id, o."userId", o.status, o.total, o.discount, 
        o."shippingAddress", o.phone, o."paymentMethod", 
        o.notes, o."pointsUsed", o."pointsEarned", 
        o."createdAt", o."updatedAt",
        u.id as "userId", u.name as "userName", u.email as "userEmail", 
        u.phone as "userPhone", u.image as "userImage"
      FROM "Order" o
      LEFT JOIN "User" u ON o."userId" = u.id
      WHERE o.id = ${id}
    ` as any[];

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Parse shipping address
    let shippingInfo = null;
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
        p.id as "productId", p.name, p."nameAr", p.images, 
        p.price as "productPrice", p."discountPrice"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."orderId" = ${id}
    ` as any[];

    const processedOrder = {
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
          discountPrice: item.discountPrice,
        }
      }))
    };

    return NextResponse.json({
      success: true,
      data: processedOrder
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT - Update order status using raw SQL
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order using raw SQL
    if (status) {
      await db.$executeRaw`
        UPDATE "Order" 
        SET status = ${status}, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    }

    // Fetch the updated order
    const orders = await db.$queryRaw`
      SELECT 
        o.id, o."userId", o.status, o.total, o.discount, 
        o."shippingAddress", o.phone, o."paymentMethod", 
        o.notes, o."pointsUsed", o."pointsEarned", 
        o."createdAt", o."updatedAt",
        u.id as "userId", u.name as "userName", u.email as "userEmail"
      FROM "Order" o
      LEFT JOIN "User" u ON o."userId" = u.id
      WHERE o.id = ${id}
    ` as any[];

    const order = orders[0];

    // Fetch order items
    const items = await db.$queryRaw`
      SELECT 
        oi.id, oi."orderId", oi."productId", oi.quantity, oi.price,
        p.name, p."nameAr"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."orderId" = ${id}
    ` as any[];

    // Create notification for user
    if (status && order) {
      const statusMessages: Record<string, { ar: string; en: string }> = {
        confirmed: { ar: 'تم تأكيد طلبك', en: 'Your order has been confirmed' },
        processing: { ar: 'جاري تجهيز طلبك', en: 'Your order is being processed' },
        shipped: { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
        delivered: { ar: 'تم توصيل طلبك', en: 'Your order has been delivered' },
        cancelled: { ar: 'تم إلغاء طلبك', en: 'Your order has been cancelled' },
      };

      const msg = statusMessages[status];
      if (msg) {
        await db.$executeRaw`
          INSERT INTO "Notification" (id, "userId", type, title, "titleAr", message, "messageAr", data, "isRead", "createdAt")
          VALUES (
            gen_random_uuid(),
            ${order.userId},
            'order_update',
            ${`تحديث الطلب #${order.id.slice(-8)}`},
            ${`تحديث الطلب #${order.id.slice(-8)}`},
            ${msg.en},
            ${msg.ar},
            ${JSON.stringify({ orderId: order.id, status })},
            false,
            NOW()
          )
        `;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        user: {
          id: order.userId,
          name: order.userName,
          email: order.userEmail,
        },
        items
      }
    });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
