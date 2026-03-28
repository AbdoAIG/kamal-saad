import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmailVerifiedConfirmation } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق مطلوب' },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token }
      });

      return NextResponse.json(
        { success: false, error: 'رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد.' },
        { status: 400 }
      );
    }

    // Find the user by email (identifier)
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Clean up token
      await db.verificationToken.delete({
        where: { token }
      });

      return NextResponse.json({
        success: true,
        message: 'البريد الإلكتروني مؤكد بالفعل',
        alreadyVerified: true
      });
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date()
      }
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { token }
    });

    // Send confirmation email
    await sendEmailVerifiedConfirmation({
      email: user.email,
      name: user.name || 'مستخدم'
    });

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تأكيد البريد الإلكتروني' },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رسالة تحقق جديدة.'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'البريد الإلكتروني مؤكد بالفعل'
      });
    }

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase().trim() }
    });

    // Generate new verification token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store new token
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase().trim(),
        token: verificationToken,
        expires: verificationExpires
      }
    });

    // Send verification email
    const { sendEmailVerification } = await import('@/lib/email');
    await sendEmailVerification({
      email: email.toLowerCase().trim(),
      name: user.name || 'مستخدم',
      verificationToken
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالة التحقق الجديدة إلى بريدك الإلكتروني'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إرسال رسالة التحقق' },
      { status: 500 }
    );
  }
}
