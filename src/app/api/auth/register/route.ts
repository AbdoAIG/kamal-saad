import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'جميع الحقول المطلوبة يجب ملؤها' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'البريد الإلكتروني مستخدم بالفعل' 
      }, { status: 400 });
    }

    // Create new user
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        password, // في الإنتاج يجب تشفير كلمة المرور
        phone,
        address,
        role: 'customer'
      }
    });

    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail({ email, name })
      .then(result => {
        if (result.success) {
          console.log(`Welcome email sent to ${email}`);
        } else {
          console.log(`Failed to send welcome email to ${email}:`, result.error);
        }
      })
      .catch(err => {
        console.error('Error in sendWelcomeEmail:', err);
      });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ 
      error: 'فشل في إنشاء الحساب' 
    }, { status: 500 });
  }
}
