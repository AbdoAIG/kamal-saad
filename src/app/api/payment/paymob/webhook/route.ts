import { NextRequest, NextResponse } from 'next/server';

/**
 * Paymob Webhook Handler
 * URL: https://kamal-saad.vercel.app/api/payment/paymob/webhook
 */

// GET - للتحقق من أن الـ endpoint يعمل
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Paymob webhook endpoint is ready',
    timestamp: new Date().toISOString(),
    endpoint: '/api/payment/paymob/webhook'
  });
}

// POST - لاستقبال إشعارات Paymob
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('='.repeat(50));
    console.log('Paymob Webhook Received:', new Date().toISOString());
    console.log(JSON.stringify(body, null, 2));
    console.log('='.repeat(50));

    // Extract transaction data
    const { type, obj } = body;
    
    if (!obj) {
      return NextResponse.json({ received: true, error: 'Invalid payload' }, { status: 200 });
    }

    const {
      id: transactionId,
      order,
      success,
      pending,
      is_refunded,
      error_occured,
      source_data,
    } = obj;

    const merchantOrderId = order?.merchant_order_id;
    
    console.log('Transaction ID:', transactionId);
    console.log('Order ID:', merchantOrderId);
    console.log('Success:', success);
    console.log('Pending:', pending);

    // Return success to Paymob
    return NextResponse.json({
      received: true,
      orderId: merchantOrderId,
      transactionId,
      success: success === true
    });

  } catch (error) {
    console.error('Paymob webhook error:', error);
    
    // Always return 200 for webhooks
    return NextResponse.json({
      received: true,
      error: 'Internal error'
    }, { status: 200 });
  }
}
