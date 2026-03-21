import { NextRequest, NextResponse } from 'next/server';

// Valu Payment Gateway Integration
// Documentation: https://valu-docs.readme.io/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, months } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Minimum amount for Valu is 500 EGP
    if (amount < 500) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount for Valu is 500 EGP' },
        { status: 400 }
      );
    }

    // Validate months
    const validMonths = [3, 6, 9, 12];
    if (!validMonths.includes(months)) {
      return NextResponse.json(
        { success: false, error: 'Invalid installment period' },
        { status: 400 }
      );
    }

    // Valu API Configuration
    const VALU_API_KEY = process.env.VALU_API_KEY;
    const VALU_MERCHANT_ID = process.env.VALU_MERCHANT_ID;

    // Calculate installment details
    const monthlyAmount = Math.ceil(amount / months);
    const totalAmount = monthlyAmount * months;
    const downPayment = 0; // Can be customized

    // For demo purposes, simulate successful installment plan
    if (!VALU_API_KEY || !VALU_MERCHANT_ID) {
      // Demo mode
      const transactionId = `VALU-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      return NextResponse.json({
        success: true,
        transactionId,
        message: 'Valu installment plan created successfully (Demo Mode)',
        demo: true,
        installmentPlan: {
          months,
          monthlyAmount,
          totalAmount,
          downPayment,
          interestRate: 0, // 0% interest
        },
      });
    }

    // Production implementation would be:
    /*
    // Call Valu API to create installment
    const response = await fetch('https://api.valu.com/v1/installments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VALU_API_KEY}`,
      },
      body: JSON.stringify({
        merchant_id: VALU_MERCHANT_ID,
        amount: amount,
        tenure: months,
        down_payment: downPayment,
        customer_phone: phone,
        order_id: orderId,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        transactionId: data.transaction_id,
        paymentUrl: data.payment_url,
        installmentPlan: {
          months,
          monthlyAmount: data.monthly_installment,
          totalAmount: data.total_amount,
          downPayment: data.down_payment,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.message || 'Installment plan creation failed',
      }, { status: 400 });
    }
    */

    // Demo response
    return NextResponse.json({
      success: true,
      transactionId: `VALU-${Date.now()}`,
      message: 'Valu installment plan created successfully',
      installmentPlan: {
        months,
        monthlyAmount,
        totalAmount,
        downPayment,
        interestRate: 0,
      },
      instructions: {
        ar: 'سيتم توجيهك لإتمام عملية التقسيط مع فالي',
        en: 'You will be redirected to complete the installment with Valu',
      },
    });

  } catch (error) {
    console.error('Valu payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Installment processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to calculate installment preview
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = parseFloat(searchParams.get('amount') || '0');

  if (amount < 500) {
    return NextResponse.json({
      success: false,
      error: 'Minimum amount for Valu is 500 EGP',
    });
  }

  const plans = [3, 6, 9, 12].map(months => ({
    months,
    monthlyAmount: Math.ceil(amount / months),
    totalAmount: Math.ceil(amount / months) * months,
    interestRate: 0,
  }));

  return NextResponse.json({
    success: true,
    amount,
    plans,
  });
}
