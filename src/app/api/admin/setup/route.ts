import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Check if admin exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@maktbati.com' }
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    if (existingAdmin) {
      // Update existing admin with hashed password
      await db.user.update({
        where: { email: 'admin@maktbati.com' },
        data: {
          password: hashedPassword,
          role: 'admin'
        }
      });
      return NextResponse.json({ 
        success: true, 
        message: 'تم تحديث بيانات الأدمن بنجاح',
        credentials: {
          email: 'admin@maktbati.com',
          password: 'admin123'
        }
      });
    }

    // Create new admin user
    const admin = await db.user.create({
      data: {
        email: 'admin@maktbati.com',
        name: 'المشرف',
        password: hashedPassword,
        role: 'admin'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم إنشاء حساب الأدمن بنجاح',
      credentials: {
        email: 'admin@maktbati.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ error: 'فشل في إعداد حساب الأدمن' }, { status: 500 });
  }
}
