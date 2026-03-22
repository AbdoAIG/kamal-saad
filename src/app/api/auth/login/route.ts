import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await db.user.findUnique({ 
      where: { email },
      include: { roleData: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Check if password matches (supports both hashed and plain text for migration)
    let passwordMatch = false;
    if (user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = user.password === password;
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Set session cookie
    const sessionId = Math.random().toString(36).substring(2);
    (await cookies()).set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    // Store session in database
    await db.session.create({
      data: {
        sessionToken: sessionId,
        userId: user.id,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'فشل في تسجيل الدخول' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sessionId = (await cookies()).get('session')?.value;
    if (sessionId) {
      await db.session.deleteMany({ where: { sessionToken: sessionId } });
      (await cookies()).delete('session');
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'فشل في تسجيل الخروج' }, { status: 500 });
  }
}
