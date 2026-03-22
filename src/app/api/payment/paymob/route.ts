import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Paymob Payment Gateway Integration
// Documentation: https://docs.paymob.com/

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderId, cardData, billingData } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Paymob API Configuration
    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
    const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || '1017535'; // Default iframe ID
    const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

    // Demo mode - no API key configured
    if (!PAYMOB_API_KEY) {
      const transactionId = `PAYMOB-DEMO-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      logger.info('Paymob demo payment', { transactionId, amount, orderId });
      
      return NextResponse.json({
        success: true,
        transactionId,
        message: 'Payment processed successfully (Demo Mode)',
        demo: true,
        paymentUrl: null,
      });
    }

    // Production implementation
    const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

    // Step 1: Authentication Request
    const authResponse = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });

    if (!authResponse.ok) {
      throw new Error('Paymob authentication failed');
    }

    const authData = (await authResponse.json()) as PaymobAuthResponse;
    const authToken = authData.token;

    // Step 2: Order Registration
    const orderPayload = {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: Math.round(amount * 100), // Paymob expects cents
      currency: 'EGP',
      merchant_order_id: orderId || `ORD-${Date.now()}`,
      items: [],
      shipping_data: billingData ? {
        first_name: billingData.firstName || 'Customer',
        last_name: billingData.lastName || 'Name',
        phone_number: billingData.phone || '+201000000000',
        email: billingData.email || 'customer@example.com',
        country: 'EG',
        city: billingData.city || 'Cairo',
        street: billingData.address || 'NA',
        building: 'NA',
        floor: 'NA',
        apartment: 'NA',
      } : undefined,
    };

    const orderResponse = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      logger.error('Paymob order registration failed', { error: errorData });
      throw new Error('Paymob order registration failed');
    }

    const orderData = (await orderResponse.json()) as PaymobOrderResponse;
    const paymobOrderId = orderData.id;

    // Step 3: Payment Key Request
    const paymentKeyPayload = {
      auth_token: authToken,
      amount_cents: Math.round(amount * 100),
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        first_name: billingData?.firstName || 'Customer',
        last_name: billingData?.lastName || 'Name',
        email: billingData?.email || 'customer@example.com',
        phone_number: billingData?.phone || '+201000000000',
        country: 'EG',
        city: billingData?.city || 'Cairo',
        street: billingData?.address || 'NA',
        building: 'NA',
        floor: 'NA',
        apartment: 'NA',
      },
      currency: 'EGP',
      integration_id: PAYMOB_INTEGRATION_ID,
    };

    const paymentKeyResponse = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentKeyPayload),
    });

    if (!paymentKeyResponse.ok) {
      const errorData = await paymentKeyResponse.json();
      logger.error('Paymob payment key request failed', { error: errorData });
      throw new Error('Paymob payment key request failed');
    }

    const paymentKeyData = (await paymentKeyResponse.json()) as PaymobPaymentKeyResponse;
    const paymentKey = paymentKeyData.token;

    // Generate payment URL with the correct iframe ID
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    logger.info('Paymob payment initiated', { paymobOrderId, amount, orderId, iframeId: PAYMOB_IFRAME_ID });

    return NextResponse.json({
      success: true,
      paymentKey,
      paymobOrderId,
      paymentUrl,
      iframeId: PAYMOB_IFRAME_ID,
      message: 'Payment initiated successfully',
    });

  } catch (error) {
    logger.error('Paymob payment error', { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
