import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { sendOrderStatusUpdateEmail, sendShippingUpdateEmail } from '@/lib/email';

// GET - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { id } = await params;

    // Fetch order with user and items using Prisma
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
        coupon: {
          select: {
            code: true,
            type: true,
            value: true,
          }
        }
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

    const processedOrder = {
      ...order,
      user: order.user,
      shippingInfo,
      paymentMethod: order.paymentMethod || 'cod',
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
          discountPrice: item.product.discountPrice,
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
  // Check admin authentication
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, trackingNumber } = body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (adminNotes) updateData.notes = adminNotes;

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

    // Create notification for user when status changes
    if (status && order.user) {
      const statusMessages: Record<string, { ar: string; en: string }> = {
        confirmed: { ar: 'تم تأكيد طلبك', en: 'Your order has been confirmed' },
        processing: { ar: 'جاري تجهيز طلبك', en: 'Your order is being processed' },
        shipped: { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
        delivered: { ar: 'تم توصيل طلبك', en: 'Your order has been delivered' },
        cancelled: { ar: 'تم إلغاء طلبك', en: 'Your order has been cancelled' },
      };

      const msg = statusMessages[status];
      if (msg) {
        await db.notification.create({
          data: {
            userId: order.userId,
            type: 'order_update',
            title: `تحديث الطلب #${order.id.slice(-8)}`,
            titleAr: `تحديث الطلب #${order.id.slice(-8)}`,
            message: msg.en,
            messageAr: msg.ar,
            data: JSON.stringify({ orderId: order.id, status }),
          }
        });

        // Send email notification
        if (order.user?.email) {
          try {
            const statusArabic: Record<string, string> = {
              pending: 'قيد الانتظار',
              confirmed: 'مؤكد',
              processing: 'جاري التجهيز',
              shipped: 'تم الشحن',
              delivered: 'تم التوصيل',
              cancelled: 'ملغي',
            };

            // Send different email for shipping updates
            if (status === 'shipped' && trackingNumber) {
              await sendShippingUpdateEmail({
                email: order.user.email,
                name: order.user.name || 'عميل',
                orderId: order.id,
                status,
                statusAr: statusArabic[status],
                trackingNumber,
              });
            } else {
              await sendOrderStatusUpdateEmail({
                email: order.user.email,
                name: order.user.name || 'عميل',
                orderId: order.id,
                status,
                statusAr: statusArabic[status],
              });
            }
          } catch (emailError) {
            console.error('Failed to send order status email:', emailError);
            // Don't fail the request if email fails
          }
        }
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
