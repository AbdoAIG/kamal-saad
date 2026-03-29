import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Paymob Callback/Webhook Handler
 * This endpoint receives payment notifications from Paymob
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Paymob Callback Received:', JSON.stringify(body, null, 2));

    // Extract transaction data
    const {
      type,
      obj: {
        id: transactionId,
        order,
        amount_cents,
        success,
        pending,
        is_refunded,
        error_occured,
        source_data,
        data,
        hmac,
      }
    } = body;

    // Get merchant order ID (our order ID)
    const merchantOrderId = order?.merchant_order_id;
    
    if (!merchantOrderId) {
      console.error('No merchant order ID in callback');
      return NextResponse.json({ success: false, error: 'No order ID' }, { status: 400 });
    }

    // Find our order
    const dbOrder = await db.order.findUnique({
      where: { id: merchantOrderId }
    });

    if (!dbOrder) {
      console.error('Order not found:', merchantOrderId);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Get payment method from source_data
    const paymentMethod = source_data?.type || type;
    
    // Map Paymob payment types to our payment methods
    const paymentMethodMap: Record<string, string> = {
      'card': 'visa',
      'visa': 'visa',
      'mastercard': 'visa',
      'wallet': 'vodafone',
      'vodafone': 'vodafone',
      'orange': 'vodafone',
      'etisalat': 'vodafone',
      'kiosk': 'fawry',
      'fawry': 'fawry',
      'aman': 'fawry',
    };

    const mappedPaymentMethod = paymentMethodMap[paymentMethod?.toLowerCase()] || dbOrder.paymentMethod;

    // Determine order status based on transaction result
    let newStatus = dbOrder.status;
    let paymentStatus = 'failed';

    if (success && !is_refunded) {
      // Payment successful
      newStatus = 'confirmed';
      paymentStatus = 'paid';
      
      // Update product stock
      const orderItems = await db.orderItem.findMany({
        where: { orderId: merchantOrderId }
      });

      for (const item of orderItems) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity }
          }
        });
      }
    } else if (pending) {
      // Payment pending (for kiosk/wallet)
      newStatus = 'pending';
      paymentStatus = 'pending';
    } else if (is_refunded) {
      // Payment refunded
      newStatus = 'cancelled';
      paymentStatus = 'refunded';
    } else if (error_occured) {
      // Payment failed
      newStatus = 'cancelled';
      paymentStatus = 'failed';
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id: merchantOrderId },
      data: {
        status: newStatus,
        paymentMethod: mappedPaymentMethod,
        paymentReference: `PAYMOB-TXN-${transactionId}`,
        notes: `${dbOrder.notes || ''}\nPayment Status: ${paymentStatus}\nTransaction ID: ${transactionId}\nSource: ${paymentMethod}`,
      }
    });

    // Create notification for user
    if (success && dbOrder.userId) {
      try {
        await db.notification.create({
          data: {
            userId: dbOrder.userId,
            type: 'payment_success',
            title: 'تم الدفع بنجاح',
            titleAr: 'تم الدفع بنجاح',
            message: `تم تأكيد دفع طلبك بنجاح. رقم الطلب: #${merchantOrderId.slice(-8)}`,
            messageAr: `تم تأكيد دفع طلبك بنجاح. رقم الطلب: #${merchantOrderId.slice(-8)}`,
          }
        });
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      orderId: merchantOrderId,
      status: newStatus,
      paymentStatus,
      transactionId,
    });

  } catch (error) {
    console.error('Paymob callback error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    }, { status: 500 });
  }
}

// GET endpoint for transaction status query (redirect from Paymob)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('merchant_order_id');
  const success = searchParams.get('success');
  const pending = searchParams.get('pending');

  if (!orderId) {
    return NextResponse.redirect(new URL('/orders?error=no_order', request.url));
  }

  try {
    // Find order
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.redirect(new URL('/orders?error=not_found', request.url));
    }

    // Redirect based on payment result
    if (success === 'true') {
      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: { 
          status: 'confirmed',
          paymentReference: `PAYMOB-CALLBACK-${Date.now()}`
        }
      });
      
      return NextResponse.redirect(new URL(`/orders/${orderId}?payment=success`, request.url));
    } else if (pending === 'true') {
      return NextResponse.redirect(new URL(`/orders/${orderId}?payment=pending`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/orders/${orderId}?payment=failed`, request.url));
    }
  } catch (error) {
    console.error('Payment callback redirect error:', error);
    return NextResponse.redirect(new URL('/orders?error=server_error', request.url));
  }
}
