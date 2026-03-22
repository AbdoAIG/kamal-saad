import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customPassword = body.password || 'admin123';
    const customEmail = body.email || 'admin@maktbati.com';
    const customName = body.name || 'المشرف';
    
    // Check if admin exists
    const existingAdmin = await db.user.findUnique({
      where: { email: customEmail }
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash(customPassword, 10);

    if (existingAdmin) {
      // Update existing admin with hashed password
      await db.user.update({
        where: { email: customEmail },
        data: {
          password: hashedPassword,
          role: 'admin',
          name: customName
        }
      });
      return NextResponse.json({ 
        success: true, 
        message: 'تم تحديث بيانات الأدمن بنجاح',
        credentials: {
          email: customEmail,
          password: customPassword
        }
      });
    }

    // Create new admin user
    const admin = await db.user.create({
      data: {
        email: customEmail,
        name: customName,
        password: hashedPassword,
        role: 'admin'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم إنشاء حساب الأدمن بنجاح',
      credentials: {
        email: customEmail,
        password: customPassword
      }
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ error: 'فشل في إعداد حساب الأدمن' }, { status: 500 });
  }
}
