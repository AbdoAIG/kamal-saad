import { NextResponse } from 'next/server';

export async function GET() {
  // Check all integration IDs
  const config = {
    card: {
      id: process.env.PAYMOB_CARD_INTEGRATION_ID || 'NOT SET',
      iframeId: process.env.PAYMOB_IFRAME_ID || 'NOT SET'
    },
    wallet: {
      id: process.env.PAYMOB_WALLET_INTEGRATION_ID || 'NOT SET'
    },
    kiosk: {
      id: process.env.PAYMOB_KIOSK_INTEGRATION_ID || 'NOT SET'
    }
  };

  // Test each integration
  const apiKey = process.env.PAYMOB_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'API Key not configured'
    });
  }

  try {
    // Get auth token
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    
    const authData = await authRes.json();
    const token = authData.token;

    // Test creating order and payment key for wallet
    const testResults: any = {};

    // Test Wallet Integration
    if (config.wallet.id !== 'NOT SET') {
      try {
        // Create test order
        const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: token,
            delivery_needed: "false",
            amount_cents: "1000",
            currency: "EGP",
            merchant_order_id: "wallet_test_" + Date.now(),
            items: [{ name: "Test", amount_cents: "1000", quantity: "1" }]
          }),
        });
        
        const orderData = await orderRes.json();
        
        // Try payment key with wallet integration
        const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: token,
            amount_cents: "1000",
            expiration: 3600,
            order_id: orderData.id,
            billing_data: {
              first_name: "Test",
              last_name: "User",
              phone_number: "01012345678",
              email: "test@test.com",
              country: "EG",
              city: "Cairo",
              street: "Test",
              building: "1",
              floor: "1",
              apartment: "1"
            },
            currency: "EGP",
            integration_id: parseInt(config.wallet.id),
            lock_order_when_paid: "false"
          }),
        });
        
        const keyData = await keyRes.json();
        
        testResults.wallet = {
          orderId: orderData.id,
          paymentKeyStatus: keyRes.status,
          paymentKeySuccess: !!keyData.token,
          error: keyData.message || keyData.detail || null
        };
      } catch (e: any) {
        testResults.wallet = { error: e.message };
      }
    }

    // Test Kiosk Integration
    if (config.kiosk.id !== 'NOT SET') {
      try {
        const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: token,
            delivery_needed: "false",
            amount_cents: "1000",
            currency: "EGP",
            merchant_order_id: "kiosk_test_" + Date.now(),
            items: [{ name: "Test", amount_cents: "1000", quantity: "1" }]
          }),
        });
        
        const orderData = await orderRes.json();
        
        const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: token,
            amount_cents: "1000",
            expiration: 3600,
            order_id: orderData.id,
            billing_data: {
              first_name: "Test",
              last_name: "User",
              phone_number: "01012345678",
              email: "test@test.com",
              country: "EG",
              city: "Cairo",
              street: "Test",
              building: "1",
              floor: "1",
              apartment: "1"
            },
            currency: "EGP",
            integration_id: parseInt(config.kiosk.id),
            lock_order_when_paid: "false"
          }),
        });
        
        const keyData = await keyRes.json();
        
        testResults.kiosk = {
          orderId: orderData.id,
          paymentKeyStatus: keyRes.status,
          paymentKeySuccess: !!keyData.token,
          error: keyData.message || keyData.detail || null
        };
      } catch (e: any) {
        testResults.kiosk = { error: e.message };
      }
    }

    return NextResponse.json({
      success: true,
      config,
      testResults
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
