import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db.siteSetting.findFirst({
      where: { key: `newsletter:${email}` }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'هذا البريد الإلكتروني مشترك بالفعل' },
        { status: 400 }
      );
    }

    // Save subscription
    await db.siteSetting.create({
      data: {
        key: `newsletter:${email}`,
        value: email,
        type: 'newsletter',
        group: 'newsletter',
        label: 'Newsletter Subscriber',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم الاشتراك بنجاح! شكراً لك'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء الاشتراك' },
      { status: 500 }
    );
  }
}
