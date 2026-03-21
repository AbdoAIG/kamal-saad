import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            addresses: true,
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
                discountPrice: true,
              }
            }
          }
        },
        coupon: true,
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse shipping address
    let shippingInfo = null;
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

    // Parse product images
    const processedOrder = {
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

// PUT - Update order status
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

    const updateData: any = {};
    if (status) updateData.status = status;

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                nameAr: true,
              }
            }
          }
        }
      }
    });

    // Create notification for user
    if (status) {
      const statusMessages: Record<string, { ar: string; en: string }> = {
        confirmed: { ar: 'تم تأكيد طلبك', en: 'Your order has been confirmed' },
        processing: { ar: 'جاري تجهيز طلبك', en: 'Your order is being processed' },
        shipped: { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
        delivered: { ar: 'تم توصيل طلبك', en: 'Your order has been delivered' },
        cancelled: { ar: 'تم إلغاء طلبك', en: 'Your order has been cancelled' },
      };

      const msg = statusMessages[status];
      if (msg && order.user) {
        await db.notification.create({
          data: {
            userId: order.user.id,
            type: 'order_update',
            title: `تحديث الطلب #${order.id.slice(-8)}`,
            titleAr: `تحديث الطلب #${order.id.slice(-8)}`,
            message: msg.en,
            messageAr: msg.ar,
            data: JSON.stringify({ orderId: order.id, status }),
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
