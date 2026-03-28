import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.PAYMOB_API_KEY;
    
    console.log('[Paymob Direct] Starting...');
    console.log('[Paymob Direct] API Key exists:', !!apiKey);
    console.log('[Paymob Direct] API Key length:', apiKey?.length);
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key not configured'
      });
    }

    // Step 1: Authentication
    console.log('[Paymob Direct] Step 1: Authentication...');
    const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const authText = await authResponse.text();
    console.log('[Paymob Direct] Auth response:', authText);

    if (!authResponse.ok) {
      return NextResponse.json({
        success: false,
        step: 'authentication',
        status: authResponse.status,
        error: authText
      });
    }

    const authData = JSON.parse(authText);
    const token = authData.token;
    console.log('[Paymob Direct] Token obtained');

    // Step 2: Order Registration
    console.log('[Paymob Direct] Step 2: Creating order...');
    const orderPayload = {
      auth_token: token,
      delivery_needed: "false",
      amount_cents: "1000",
      currency: "EGP",
      merchant_order_id: Date.now().toString(),
      items: [
        {
          name: "Test Product",
          amount_cents: "1000",
          quantity: "1"
        }
      ]
    };

    console.log('[Paymob Direct] Order payload:', JSON.stringify(orderPayload, null, 2));

    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    const orderText = await orderResponse.text();
    console.log('[Paymob Direct] Order response status:', orderResponse.status);
    console.log('[Paymob Direct] Order response:', orderText);

    if (!orderResponse.ok) {
      return NextResponse.json({
        success: false,
        step: 'order_creation',
        status: orderResponse.status,
        error: orderText,
        payload: orderPayload
      });
    }

    const orderData = JSON.parse(orderText);
    console.log('[Paymob Direct] Order created:', orderData.id);

    // Step 3: Payment Key
    console.log('[Paymob Direct] Step 3: Getting payment key...');
    const integrationId = process.env.PAYMOB_CARD_INTEGRATION_ID;
    
    const paymentKeyPayload = {
      auth_token: token,
      amount_cents: "1000",
      expiration: 3600,
      order_id: orderData.id,
      billing_data: {
        first_name: "Test",
        last_name: "Customer",
        phone_number: "01012345678",
        email: "test@example.com",
        country: "EG",
        city: "Cairo",
        street: "Test Street",
        building: "1",
        floor: "1",
        apartment: "1"
      },
      currency: "EGP",
      integration_id: parseInt(integrationId || "0"),
      lock_order_when_paid: "false"
    };

    console.log('[Paymob Direct] Payment key payload:', JSON.stringify(paymentKeyPayload, null, 2));

    const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentKeyPayload),
    });

    const paymentKeyText = await paymentKeyResponse.text();
    console.log('[Paymob Direct] Payment key response status:', paymentKeyResponse.status);
    console.log('[Paymob Direct] Payment key response:', paymentKeyText);

    if (!paymentKeyResponse.ok) {
      return NextResponse.json({
        success: false,
        step: 'payment_key',
        status: paymentKeyResponse.status,
        error: paymentKeyText,
        payload: paymentKeyPayload,
        orderId: orderData.id
      });
    }

    const paymentKeyData = JSON.parse(paymentKeyText);

    return NextResponse.json({
      success: true,
      message: 'Payment flow completed successfully!',
      orderId: orderData.id,
      paymentKey: paymentKeyData.token.substring(0, 30) + '...',
      paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKeyData.token}`
    });

  } catch (error) {
    console.error('[Paymob Direct] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    });
  }
}
