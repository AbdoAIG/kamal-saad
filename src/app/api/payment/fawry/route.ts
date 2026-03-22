import { NextRequest, NextResponse } from 'next/server';

// Fawry Payment Gateway Integration
// Documentation: https://www.fawry.com/developer/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, phone } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Fawry API Configuration
    const FAWRY_MERCHANT_CODE = process.env.FAWRY_MERCHANT_CODE;
    const FAWRY_SECURITY_KEY = process.env.FAWRY_SECURITY_KEY;
    
    // For demo purposes, simulate successful reference generation
    // In production, replace with actual Fawry API calls

    if (!FAWRY_MERCHANT_CODE || !FAWRY_SECURITY_KEY) {
      // Demo mode - generate a reference number
      const referenceNumber = generateFawryReference();
      
      return NextResponse.json({
        success: true,
        referenceNumber,
        message: 'Fawry reference generated successfully (Demo Mode)',
        demo: true,
        expiryHours: 24,
        instructions: {
          ar: 'يمكنك الدفع نقداً في أي منفذ فوري خلال 24 ساعة باستخدام رقم المرجع',
          en: 'You can pay cash at any Fawry outlet within 24 hours using the reference number',
        },
      });
    }

    // Production implementation would be:
    /*
    const crypto = require('crypto');
    
    // Generate unique merchant reference
    const merchantRef = `ORD-${Date.now()}`;
    
    // Create signature
    const signatureString = FAWRY_MERCHANT_CODE + merchantRef + amount.toFixed(2) + FAWRY_SECURITY_KEY;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    // Call Fawry API
    const response = await fetch('https://www.atfawry.com/ECommerceWeb/Fawry/payments/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantCode: FAWRY_MERCHANT_CODE,
        merchantRefNum: merchantRef,
        paymentMethod: 'PAYATFAWRY',
        amount: amount,
        currencyCode: 'EGP',
        customerEmail: 'customer@example.com',
        customerMobile: phone,
        description: 'Order Payment',
        chargeItems: [],
        signature: signature,
      }),
    });
    
    const data = await response.json();
    
    if (data.statusCode === 200) {
      return NextResponse.json({
        success: true,
        referenceNumber: data.referenceNumber,
        expiryHours: 24,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.statusDescription,
      }, { status: 400 });
    }
    */

    // Demo response
    const referenceNumber = generateFawryReference();
    
    return NextResponse.json({
      success: true,
      referenceNumber,
      message: 'Fawry reference generated successfully',
      expiryHours: 24,
      instructions: {
        ar: 'يمكنك الدفع نقداً في أي منفذ فوري خلال 24 ساعة',
        en: 'You can pay cash at any Fawry outlet within 24 hours',
      },
    });

  } catch (error) {
    console.error('Fawry payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Reference generation failed' },
      { status: 500 }
    );
  }
}

// Generate Fawry-style reference number
function generateFawryReference(): string {
  const chars = '0123456789';
  let ref = '';
  for (let i = 0; i < 10; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}
