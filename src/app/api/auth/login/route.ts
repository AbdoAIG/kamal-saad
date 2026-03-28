import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';

// Simple validation without external schema
function validateLogin(body: any): { email: string; password: string } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'طلب غير صالح' };
  }
  
  const { email, password } = body;
  
  if (!email || typeof email !== 'string') {
    return { error: 'البريد الإلكتروني مطلوب' };
  }
  
  if (!email.includes('@')) {
    return { error: 'البريد الإلكتروني غير صالح' };
  }
  
  if (!password || typeof password !== 'string') {
    return { error: 'كلمة المرور مطلوبة' };
  }
  
  if (password.length < 1) {
    return { error: 'كلمة المرور قصيرة جداً' };
  }
  
  return {
    email: email.toLowerCase().trim(),
    password
  };
}

export async function POST(request: NextRequest) {
  // Apply rate limiting for login (10 attempts per 15 minutes)
  const rateLimitResponse = withRateLimit(request, rateLimits.login);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const debug: { step: string; timestamp: string; details?: any }[] = [];
  
  try {
    // Step 1: Parse body
    let body;
    try {
      body = await request.json();
      debug.push({ step: 'parse_body', timestamp: new Date().toISOString(), details: { email: body?.email } });
    } catch (parseError) {
      debug.push({ step: 'parse_body_error', timestamp: new Date().toISOString(), details: String(parseError) });
      return NextResponse.json(
        { success: false, error: 'طلب غير صالح', debug },
        { status: 400 }
      );
    }

    // Step 2: Validate input
    const validated = validateLogin(body);
    if ('error' in validated) {
      debug.push({ step: 'validation_failed', timestamp: new Date().toISOString(), details: validated.error });
      return NextResponse.json(
        { success: false, error: validated.error, debug },
        { status: 400 }
      );
    }
    debug.push({ step: 'validation_passed', timestamp: new Date().toISOString() });

    const { email, password } = validated;

    // Step 3: Find user
    let user;
    try {
      user = await db.user.findUnique({
        where: { email }
      });
      debug.push({ step: 'user_lookup', timestamp: new Date().toISOString(), details: { found: !!user, hasPassword: !!user?.password } });
    } catch (dbError) {
      debug.push({ step: 'user_lookup_error', timestamp: new Date().toISOString(), details: String(dbError) });
      return NextResponse.json(
        { success: false, error: 'خطأ في الاتصال بقاعدة البيانات', debug },
        { status: 500 }
      );
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة', debug: debug.slice(0, 3) },
        { status: 401 }
      );
    }

    // Step 4: Verify password
    let isValid;
    try {
      isValid = await bcrypt.compare(password, user.password);
      debug.push({ step: 'password_check', timestamp: new Date().toISOString(), details: { valid: isValid } });
    } catch (bcryptError) {
      debug.push({ step: 'password_check_error', timestamp: new Date().toISOString(), details: String(bcryptError) });
      return NextResponse.json(
        { success: false, error: 'خطأ في التحقق من كلمة المرور', debug },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة', debug: debug.slice(0, 4) },
        { status: 401 }
      );
    }

    // Step 5: Check if user is active
    if (!user.isActive) {
      debug.push({ step: 'user_inactive', timestamp: new Date().toISOString() });
      return NextResponse.json(
        { success: false, error: 'الحساب غير مفعل', debug },
        { status: 403 }
      );
    }
    debug.push({ step: 'user_active', timestamp: new Date().toISOString() });

    // Step 5.5: Check if email is verified
    if (!user.emailVerified) {
      debug.push({ step: 'email_not_verified', timestamp: new Date().toISOString() });
      return NextResponse.json(
        { 
          success: false, 
          error: 'يرجى التحقق من بريدك الإلكتروني أولاً',
          requiresVerification: true,
          email: user.email,
          debug: debug.slice(0, 5)
        },
        { status: 403 }
      );
    }
    debug.push({ step: 'email_verified', timestamp: new Date().toISOString() });

    // Step 6: Create session token
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    debug.push({ step: 'session_token_created', timestamp: new Date().toISOString() });

    // Step 7: Delete old sessions and create new one
    try {
      await db.session.deleteMany({
        where: { userId: user.id }
      });
      debug.push({ step: 'old_sessions_deleted', timestamp: new Date().toISOString() });

      await db.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: expiresAt
        }
      });
      debug.push({ step: 'session_created', timestamp: new Date().toISOString() });
    } catch (sessionError) {
      debug.push({ step: 'session_error', timestamp: new Date().toISOString(), details: String(sessionError) });
      // Continue anyway - we'll try to set the cookie
    }

    // Step 8: Update last login
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      debug.push({ step: 'last_login_updated', timestamp: new Date().toISOString() });
    } catch (e) {
      debug.push({ step: 'last_login_error', timestamp: new Date().toISOString(), details: String(e) });
    }

    // Step 9: Set session cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/'
      });
      debug.push({ step: 'cookie_set', timestamp: new Date().toISOString() });
    } catch (cookieError) {
      debug.push({ step: 'cookie_error', timestamp: new Date().toISOString(), details: String(cookieError) });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    debug.push({ step: 'login_success', timestamp: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      debug: process.env.NODE_ENV === 'development' ? debug : undefined
    });
  } catch (error) {
    debug.push({ step: 'unexpected_error', timestamp: new Date().toISOString(), details: String(error) });
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تسجيل الدخول', debug },
      { status: 500 }
    );
  }
}

// DELETE - Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (sessionToken) {
      try {
        await db.session.deleteMany({
          where: { sessionToken }
        });
      } catch (e) {
        // Ignore
      }
    }
    
    try {
      cookieStore.delete('session');
    } catch (e) {
      // Ignore
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج'
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج'
    });
  }
}
