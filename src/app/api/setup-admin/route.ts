import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const password = 'ABDOibrahim318';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if admin exists
    const existingUser = await db.user.findUnique({
      where: { email: 'admin@maktbati.com' }
    });

    if (existingUser) {
      // Update password
      await db.user.update({
        where: { email: 'admin@maktbati.com' },
        data: { 
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'تم تحديث كلمة مرور الأدمن بنجاح',
        email: 'admin@maktbati.com',
        password: 'ABDOibrahim318'
      });
    } else {
      // Create new admin
      await db.user.create({
        data: {
          email: 'admin@maktbati.com',
          name: 'مدير النظام',
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'تم إنشاء حساب الأدمن بنجاح',
        email: 'admin@maktbati.com',
        password: 'ABDOibrahim318'
      });
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
