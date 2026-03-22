import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Fawry Callback/Webhook Handler
// Documentation: https://www.fawry.com/developer/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('Fawry callback received', { body });

    const FAWRY_SECURITY_KEY = process.env.FAWRY_SECURITY_KEY;

    // Extract data
    const {
      type,
      fawryRefNumber,
      merchantRefNumber,
      paymentStatus,
      paymentAmount,
      paymentMethod,
      customerMobile,
      signature,
    } = body;

    // Verify Fawry signature if security key is configured
    if (FAWRY_SECURITY_KEY && signature) {
      // Build signature string for verification
      // Fawry signature = SHA256(securityKey + merchantRefNumber + fawryRefNumber + paymentStatus)
      const crypto = await import('crypto');
      const signatureString = [
        FAWRY_SECURITY_KEY,
        merchantRefNumber || '',
        fawryRefNumber || '',
        paymentStatus || '',
      ].join('');

      const expectedSignature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Fawry signature', { received: signature, expected: expectedSignature });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Find the order by merchant reference number
    const orderRecord = await db.order.findFirst({
      where: {
        OR: [
          { id: merchantRefNumber },
          { paymentReference: merchantRefNumber },
        ],
      },
    });

    if (!orderRecord) {
      logger.warn('Order not found for Fawry callback', { merchantRefNumber });
      return NextResponse.json({ received: true, message: 'Order not found' });
    }

    // Update order based on payment status
    // Fawry statuses: UNPAID, PAID, EXPIRED, CANCELED, REFUNDED, PARTIALLY_REFUNDED
    if (paymentStatus === 'PAID') {
      await db.order.update({
        where: { id: orderRecord.id },
        data: {
          paymentStatus: 'paid',
          paymentReference: fawryRefNumber,
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
          message: `Your Fawry payment for order #${orderRecord.id.slice(-8)} has been confirmed.`,
          messageAr: `تم تأكيد الدفع عبر فوري لطلبك رقم #${orderRecord.id.slice(-8)}`,
          data: JSON.stringify({
            orderId: orderRecord.id,
            fawryRefNumber,
            paymentMethod,
          }),
        },
      });

      logger.info('Fawry payment confirmed', { orderId: orderRecord.id, fawryRefNumber });
    } else if (paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELED') {
      await db.order.update({
        where: { id: orderRecord.id },
        data: {
          paymentStatus: 'failed',
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });

      logger.warn('Fawry payment expired/cancelled', { orderId: orderRecord.id, paymentStatus });
    } else if (paymentStatus === 'REFUNDED') {
      await db.order.update({
        where: { id: orderRecord.id },
        data: {
          paymentStatus: 'refunded',
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });

      logger.info('Fawry payment refunded', { orderId: orderRecord.id });
    }

    return NextResponse.json({ received: true, status: paymentStatus });
  } catch (error) {
    logger.error('Fawry callback error', { error: String(error) });
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// GET for Fawry redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status');
  const orderRef = searchParams.get('orderRef');
  const fawryRef = searchParams.get('fawryRef');
  
  const redirectUrl = status === 'success'
    ? `/checkout?payment=success&order=${orderRef}&fawryRef=${fawryRef}`
    : `/checkout?payment=failed&order=${orderRef}`;
  
  return NextResponse.redirect(new URL(redirectUrl, request.url).toString());
}
