import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOrderStatusUpdateEmail, sendShippingUpdateEmail } from '@/lib/email';
import crypto from 'crypto';

// Payment gateway webhook handlers
// Supports: Paymob, Fawry, and generic webhooks

interface PaymentWebhookData {
  orderId: string;
  status: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

// Paymob webhook handler
async function handlePaymobWebhook(data: any) {
  try {
    // Paymob sends obj with success, pending, or failure
    const success = data.success === true || data.success === 'true';
    const pending = data.pending === true || data.pending === 'true';
    const merchantOrderId = data.merchant_order_id || data.order?.merchant_order_id;
    
    let status: string;
    if (success) {
      status = 'confirmed';
    } else if (pending) {
      status = 'pending';
    } else {
      status = 'cancelled';
    }

    return {
      orderId: merchantOrderId,
      status,
      transactionId: data.id?.toString(),
      amount: data.amount_cents ? data.amount_cents / 100 : undefined,
    };
  } catch (error) {
    console.error('Error parsing Paymob webhook:', error);
    return null;
  }
}

// Fawry webhook handler
async function handleFawryWebhook(data: any) {
  try {
    // Fawry signature verification
    const fawrySecret = process.env.FAWRY_SECRET_KEY;
    if (fawrySecret && data.signature) {
      const expectedSignature = crypto
        .createHash('sha256')
        .update(
          data.fawryRef + data.merchantRef + data.orderAmount + fawrySecret
        )
        .digest('hex');
      
      if (expectedSignature !== data.signature) {
        console.error('Invalid Fawry webhook signature');
        return null;
      }
    }

    const statusMap: Record<string, string> = {
      PAID: 'confirmed',
      UNPAID: 'pending',
      CANCELED: 'cancelled',
      REFUNDED: 'refunded',
      EXPIRED: 'cancelled',
      FAILED: 'cancelled',
    };

    return {
      orderId: data.merchantRef,
      status: statusMap[data.orderStatus] || 'pending',
      transactionId: data.fawryRef,
      amount: data.orderAmount,
    };
  } catch (error) {
    console.error('Error parsing Fawry webhook:', error);
    return null;
  }
}

// Update order status and send notifications
async function updateOrderStatus(
  orderId: string,
  status: string,
  transactionId?: string,
  paymentMethod?: string
) {
  try {
    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, nameAr: true },
            },
          },
        },
      },
    });

    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return null;
    }

    // Don't update if status is the same
    if (order.status === status) {
      console.log(`Order ${orderId} already has status: ${status}`);
      return order;
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status,
        paymentReference: transactionId || order.paymentReference,
        paymentMethod: paymentMethod || order.paymentMethod,
        updatedAt: new Date(),
      },
    });

    // Update product stock if order is confirmed
    if (status === 'confirmed' && order.status !== 'confirmed') {
      for (const item of order.items) {
        if (item.skuId) {
          // Update SKU stock
          await db.productVariantSKU.update({
            where: { id: item.skuId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        } else {
          // Update product stock
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              salesCount: { increment: item.quantity },
            },
          });
        }
      }
    }

    // Send email notification
    const statusArabic: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      processing: 'جاري التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    };

    if (order.user?.email) {
      await sendOrderStatusUpdateEmail({
        email: order.user.email,
        name: order.user.name || 'عميل',
        orderId: order.id,
        status,
        statusAr: statusArabic[status] || status,
        trackingNumber: undefined,
      });
    }

    // Create notification for user
    if (order.userId) {
      await db.notification.create({
        data: {
          userId: order.userId,
          type: 'order',
          title: 'Order Status Updated',
          titleAr: 'تم تحديث حالة الطلب',
          message: `Your order #${order.id.slice(-8).toUpperCase()} status has been updated to: ${status}`,
          messageAr: `تم تحديث حالة طلبك رقم #${order.id.slice(-8).toUpperCase()} إلى: ${statusArabic[status] || status}`,
          data: JSON.stringify({ orderId: order.id, status }),
          isRead: false,
        },
      });
    }

    console.log(`Order ${orderId} updated to status: ${status}`);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType = request.headers.get('content-type') || '';
    
    let webhookData: any;
    let paymentData: PaymentWebhookData | null = null;
    let gateway = 'unknown';

    // Parse JSON body
    try {
      webhookData = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Detect payment gateway
    if (webhookData.obj || webhookData.merchant_order_id || webhookData.type === 'transaction') {
      gateway = 'paymob';
      paymentData = await handlePaymobWebhook(webhookData.obj || webhookData);
    } else if (webhookData.merchantRef || webhookData.fawryRef) {
      gateway = 'fawry';
      paymentData = await handleFawryWebhook(webhookData);
    } else if (webhookData.orderId && webhookData.status) {
      // Generic webhook format
      gateway = 'generic';
      paymentData = {
        orderId: webhookData.orderId,
        status: webhookData.status,
        transactionId: webhookData.transactionId,
        amount: webhookData.amount,
        paymentMethod: webhookData.paymentMethod,
      };
    }

    if (!paymentData || !paymentData.orderId) {
      console.error('Could not extract payment data from webhook:', webhookData);
      return NextResponse.json(
        { success: false, error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    // Log webhook receipt
    console.log(`Received ${gateway} webhook:`, JSON.stringify(paymentData, null, 2));

    // Update order status
    const updatedOrder = await updateOrderStatus(
      paymentData.orderId,
      paymentData.status,
      paymentData.transactionId,
      paymentData.paymentMethod
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      gateway,
      orderId: paymentData.orderId,
      status: paymentData.status,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET - Webhook test endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Payment webhook endpoint is active',
    supportedGateways: ['paymob', 'fawry', 'generic'],
    timestamp: new Date().toISOString(),
  });
}
