import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

// POST - Request password reset
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

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Save reset token
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: resetToken,
        expires,
      },
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name || 'مستخدم',
      resetToken,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
