import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // Check password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمات المرور غير متطابقة' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين غير صالح' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Find user by email (identifier)
    const user = await db.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used reset token
    await db.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

// GET - Verify reset token validity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Invalid reset link',
      });
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Reset link has expired',
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: resetToken.identifier,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { success: false, error: 'Error verifying token' },
      { status: 500 }
    );
  }
}
