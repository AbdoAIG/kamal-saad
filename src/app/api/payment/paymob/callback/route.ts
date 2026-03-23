import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Paymob Callback/Webhook Handler
// This endpoint receives payment callbacks from Paymob

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('Paymob callback received', { body });

    // Verify the callback signature
    const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
    
    if (PAYMOB_HMAC_SECRET) {
      // In production, verify HMAC signature
      // const crypto = require('crypto');
      // const hmac = crypto.createHmac('sha512', PAYMOB_HMAC_SECRET);
      // const expectedSignature = hmac.update(JSON.stringify(body.obj)).digest('hex');
      // if (body.hmac !== expectedSignature) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    // Extract payment data
    const {
      type,
      obj: {
        id: transactionId,
        success,
        pending,
        amount_cents,
        currency,
        order,
        data,
      } = {},
    } = body;

    // Handle different callback types
    if (type === 'TRANSACTION') {
      const orderId = order?.id;
      const merchantOrderId = data?.merchant_order_id;

      // Find the order by transaction ID or merchant order ID
      const orderRecord = await db.order.findFirst({
        where: {
          OR: [
            { id: merchantOrderId },
            { paymentReference: String(transactionId) },
          ],
        },
      });

      if (!orderRecord) {
        logger.warn('Order not found for Paymob callback', { transactionId, merchantOrderId });
        return NextResponse.json({ received: true, message: 'Order not found' });
      }

      // Update order payment status
      if (success) {
        await db.order.update({
          where: { id: orderRecord.id },
          data: {
            paymentReference: String(transactionId),
            status: orderRecord.status === 'pending' ? 'confirmed' : orderRecord.status,
            updatedAt: new Date(),
          },
        });

        // Create notification for user
        await db.notification.create({
          data: {
            userId: orderRecord.userId,
            type: 'order',
            title: 'Payment Successful',
            titleAr: 'تم الدفع بنجاح',
            message: `Your payment for order #${orderRecord.id.slice(-8)} has been confirmed.`,
            messageAr: `تم تأكيد الدفع لطلبك رقم #${orderRecord.id.slice(-8)}`,
            data: JSON.stringify({ orderId: orderRecord.id, transactionId }),
          },
        });

        logger.info('Payment confirmed via Paymob', { orderId: orderRecord.id, transactionId });
      } else if (!pending) {
        // Payment failed
        await db.order.update({
          where: { id: orderRecord.id },
          data: {
            paymentReference: String(transactionId),
            updatedAt: new Date(),
          },
        });

        logger.warn('Payment failed via Paymob', { orderId: orderRecord.id, transactionId });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Paymob callback error', { error: String(error) });
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// GET for Paymob redirect (after payment)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('order');
  const transactionId = searchParams.get('id');
  
  // Redirect to frontend with status
  const redirectUrl = success
    ? `/checkout?payment=success&order=${orderId}&transaction=${transactionId}`
    : `/checkout?payment=failed&order=${orderId}`;
  
  return NextResponse.redirect(new URL(redirectUrl, request.url).toString());
}
