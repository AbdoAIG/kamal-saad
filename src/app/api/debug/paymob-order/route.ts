import { NextResponse } from 'next/server';
import { getAuthToken, PAYMOB_CONFIG } from '@/lib/paymob';

export async function GET() {
  try {
    console.log('[Paymob Test Order] Starting...');
    
    // Get auth token
    const token = await getAuthToken();
    console.log('[Paymob Test Order] Got token');
    
    // Create minimal order
    const orderData = {
      auth_token: token,
      delivery_needed: false,
      amount_cents: 1000, // 10 EGP
      currency: 'EGP',
      merchant_order_id: 'test_' + Date.now(),
      items: [
        {
          name: 'Test Item',
          amount_cents: 1000,
          quantity: 1
        }
      ],
    };

    console.log('[Paymob Test Order] Request:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log('[Paymob Test Order] Response status:', response.status);
    console.log('[Paymob Test Order] Response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseText,
        request: orderData
      });
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({
      success: true,
      orderId: data.id,
      data
    });

  } catch (error) {
    console.error('[Paymob Test Order] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    });
  }
}
