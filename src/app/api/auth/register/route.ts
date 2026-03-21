import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address } = body;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

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

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 });
  }
}
