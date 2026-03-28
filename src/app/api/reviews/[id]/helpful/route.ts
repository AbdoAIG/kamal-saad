import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Response messages in Arabic and English
const messages = {
  notFound: {
    en: 'Review not found',
    ar: 'التقييم غير موجود'
  },
  success: {
    en: 'Marked as helpful',
    ar: 'تم التسجيل كمفيد'
  },
  error: {
    en: 'Failed to mark as helpful',
    ar: 'فشل في التسجيل كمفيد'
  },
  invalidId: {
    en: 'Invalid review ID',
    ar: 'معرف التقييم غير صالح'
  }
};

// POST - Mark review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: messages.invalidId.en,
          errorAr: messages.invalidId.ar
        },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await db.review.findUnique({
      where: { id }
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: messages.notFound.en,
          errorAr: messages.notFound.ar
        },
        { status: 404 }
      );
    }

    // Increment helpful count
    const updatedReview = await db.review.update({
      where: { id },
      data: {
        helpful: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: messages.success.en,
      messageAr: messages.success.ar,
      data: {
        helpful: updatedReview.helpful
      }
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json(
      {
        success: false,
        error: messages.error.en,
        errorAr: messages.error.ar
      },
      { status: 500 }
    );
  }
}
