import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { registerSchema, validateBody } from '@/schemas';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';
import { sendEmailVerification } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // Apply rate limiting for registration (3 registrations per hour)
  const rateLimitResponse = await withRateLimit(request, rateLimits.register);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(registerSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, email, password, phone } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with unverified email
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: 'customer',
        emailVerified: null // Not verified yet
      }
    });

    // Store verification token in VerificationToken table
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase().trim(),
        token: verificationToken,
        expires: verificationExpires
      }
    });

    // Send verification email
    const emailResult = await sendEmailVerification({
      email: email.toLowerCase().trim(),
      name,
      verificationToken
    });

    if (!emailResult.success) {
      console.warn('Failed to send verification email, but user was created:', emailResult.error);
      // Continue anyway - user can request resend
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    );
  }
}
