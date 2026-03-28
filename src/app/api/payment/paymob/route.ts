import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface PaymentRequest {
  orderId: string;
  paymentMethod: 'card' | 'wallet' | 'kiosk';
  walletNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Paymob Payment] Starting...');
    
    const body = await request.json() as PaymentRequest;
    const { orderId, paymentMethod, walletNumber } = body;

    console.log('[Paymob Payment] Request:', { orderId, paymentMethod, walletNumber });

    if (!orderId || !paymentMethod) {
      return NextResponse.json({
        success: false,
        error: 'معرف الطلب وطريقة الدفع مطلوبان'
      }, { status: 400 });
    }

    // Get order from database
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'الطلب غير موجود'
      }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'هذا الطلب لا يمكن دفعه'
      }, { status: 400 });
    }

    // Get billing data
    let shippingInfo: any = {};
    try {
      shippingInfo = order.shippingAddress ? JSON.parse(order.shippingAddress) : {};
    } catch {
      shippingInfo = {};
    }

    const firstName = shippingInfo?.fullName?.split(' ')[0] || 'Customer';
    const lastName = shippingInfo?.fullName?.split(' ').slice(1).join(' ') || 'Customer';
    const phone = shippingInfo?.phone || order.phone || '01000000000';
    const email = shippingInfo?.email || order.user?.email || 'customer@example.com';
    const city = shippingInfo?.city || 'Cairo';
    const street = shippingInfo?.address || 'NA';

    const amountCents = Math.round(order.total * 100).toString();

    // Get API Key
    const apiKey = process.env.PAYMOB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Paymob API Key غير موجود'
      }, { status: 500 });
    }

    // Step 1: Authentication
    console.log('[Paymob Payment] Step 1: Authentication...');
    const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error('[Paymob Payment] Auth failed:', error);
      return NextResponse.json({
        success: false,
        error: 'فشل في الاتصال بـ Paymob',
        details: error
      }, { status: 500 });
    }

    const authData = await authResponse.json();
    const token = authData.token;
    console.log('[Paymob Payment] Auth successful');

    // Step 2: Create Order
    console.log('[Paymob Payment] Step 2: Creating order...');
    const merchantOrderId = order.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50) + Date.now();
    
    const orderPayload = {
      auth_token: token,
      delivery_needed: "false",
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: merchantOrderId,
      items: [
        {
          name: "Order " + order.id.substring(0, 8),
          amount_cents: amountCents,
          quantity: "1"
        }
      ]
    };

    console.log('[Paymob Payment] Order payload:', JSON.stringify(orderPayload));

    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('[Paymob Payment] Order creation failed:', error);
      return NextResponse.json({
        success: false,
        error: 'فشل في إنشاء طلب Paymob',
        details: error
      }, { status: 500 });
    }

    const orderData = await orderResponse.json();
    const paymobOrderId = orderData.id;
    console.log('[Paymob Payment] Order created:', paymobOrderId);

    // Step 3: Get Payment Key
    console.log('[Paymob Payment] Step 3: Getting payment key...');
    
    const integrationIdMap: Record<string, string> = {
      card: process.env.PAYMOB_CARD_INTEGRATION_ID || '',
      wallet: process.env.PAYMOB_WALLET_INTEGRATION_ID || '',
      kiosk: process.env.PAYMOB_KIOSK_INTEGRATION_ID || '',
    };

    const integrationId = integrationIdMap[paymentMethod];
    if (!integrationId) {
      return NextResponse.json({
        success: false,
        error: `Integration ID غير موجود لطريقة الدفع: ${paymentMethod}`
      }, { status: 500 });
    }

    const paymentKeyPayload = {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        email: email,
        country: "EG",
        city: city,
        street: street,
        building: "NA",
        floor: "NA",
        apartment: "NA"
      },
      currency: "EGP",
      integration_id: parseInt(integrationId),
      lock_order_when_paid: "false"
    };

    console.log('[Paymob Payment] Payment key payload:', JSON.stringify(paymentKeyPayload));

    const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentKeyPayload),
    });

    if (!paymentKeyResponse.ok) {
      const error = await paymentKeyResponse.text();
      console.error('[Paymob Payment] Payment key failed:', error);
      return NextResponse.json({
        success: false,
        error: 'فشل في الحصول على مفتاح الدفع',
        details: error
      }, { status: 500 });
    }

    const paymentKeyData = await paymentKeyResponse.json();
    const paymentKey = paymentKeyData.token;
    console.log('[Paymob Payment] Payment key obtained');

    // Update order with Paymob reference
    await db.order.update({
      where: { id: order.id },
      data: { paymentReference: `PAYMOB-${paymobOrderId}` }
    });

    // Step 4: Process based on payment method
    console.log('[Paymob Payment] Step 4: Processing', paymentMethod);

    if (paymentMethod === 'card') {
      const iframeId = process.env.PAYMOB_IFRAME_ID;
      const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
      
      return NextResponse.json({
        success: true,
        paymentMethod: 'card',
        paymentUrl,
        paymobOrderId
      });
    }

    if (paymentMethod === 'wallet') {
      if (!walletNumber) {
        return NextResponse.json({
          success: false,
          error: 'رقم المحفظة مطلوب'
        }, { status: 400 });
      }

      console.log('[Paymob Payment] Processing wallet payment for:', walletNumber);
      
      const walletResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            identifier: walletNumber,
            subtype: "WALLET"
          },
          payment_token: paymentKey
        }),
      });

      const walletData = await walletResponse.json();
      console.log('[Paymob Payment] Wallet response:', JSON.stringify(walletData));
      
      if (walletData.redirect_url) {
        return NextResponse.json({
          success: true,
          paymentMethod: 'wallet',
          redirectUrl: walletData.redirect_url,
          paymobOrderId
        });
      }

      if (walletData.pending) {
        return NextResponse.json({
          success: true,
          paymentMethod: 'wallet',
          message: 'تم إرسال طلب الدفع. تحقق من هاتفك للتأكيد.',
          paymobOrderId
        });
      }

      return NextResponse.json({
        success: false,
        error: walletData.data?.message || walletData.message || 'فشل في الدفع بالمحفظة',
        details: walletData
      });
    }

    if (paymentMethod === 'kiosk') {
      console.log('[Paymob Payment] Processing kiosk payment');
      
      const kioskResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            identifier: "AGGREGATOR",
            subtype: "AGGREGATOR"
          },
          payment_token: paymentKey
        }),
      });

      const kioskData = await kioskResponse.json();
      console.log('[Paymob Payment] Kiosk response:', JSON.stringify(kioskData));
      
      if (kioskData.pending && kioskData.source_data?.bill_reference) {
        const billReference = kioskData.source_data.bill_reference;
        
        await db.order.update({
          where: { id: order.id },
          data: { paymentReference: `PAYMOB-${paymobOrderId}-BILL-${billReference}` }
        });

        return NextResponse.json({
          success: true,
          paymentMethod: 'kiosk',
          billReference,
          message: 'يمكنك الدفع من أي فرع فوري أو أجري',
          paymobOrderId
        });
      }

      return NextResponse.json({
        success: false,
        error: kioskData.data?.message || kioskData.message || 'فشل في إنشاء رقم الفاتورة',
        details: kioskData
      });
    }

    return NextResponse.json({
      success: false,
      error: 'طريقة الدفع غير صالحة'
    }, { status: 400 });

  } catch (error) {
    console.error('[Paymob Payment] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في معالجة الدفع',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
