import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const results: {
    timestamp: string;
    environment: string;
    checks: {
      name: string;
      status: 'success' | 'error' | 'warning';
      message: string;
      details?: any;
    }[];
  } = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: []
  };

  // 1. Check database connection
  try {
    await db.$queryRaw`SELECT 1`;
    results.checks.push({
      name: 'Database Connection',
      status: 'success',
      message: 'PostgreSQL متصل بنجاح'
    });
  } catch (error) {
    results.checks.push({
      name: 'Database Connection',
      status: 'error',
      message: 'فشل الاتصال بقاعدة البيانات',
      details: String(error)
    });
  }

  // 2. Check Session table exists
  try {
    const sessions = await db.session.count();
    results.checks.push({
      name: 'Session Table',
      status: 'success',
      message: `جدول Session موجود (${sessions} جلسات نشطة)`
    });
  } catch (error) {
    results.checks.push({
      name: 'Session Table',
      status: 'error',
      message: 'جدول Session غير موجود - يجب تشغيل prisma migrate',
      details: String(error)
    });
  }

  // 3. Check User table and admin users
  try {
    const users = await db.user.count();
    const admins = await db.user.count({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      }
    });
    results.checks.push({
      name: 'Users Table',
      status: admins > 0 ? 'success' : 'warning',
      message: `${users} مستخدم، ${admins} أدمن`,
      details: admins === 0 ? 'لا يوجد مستخدم أدمن! استخدم /api/setup-admin لإنشاء واحد' : undefined
    });
  } catch (error) {
    results.checks.push({
      name: 'Users Table',
      status: 'error',
      message: 'جدول المستخدمين غير موجود',
      details: String(error)
    });
  }

  // 4. Check Product table
  try {
    const products = await db.product.count();
    results.checks.push({
      name: 'Products Table',
      status: 'success',
      message: `${products} منتج`
    });
  } catch (error) {
    results.checks.push({
      name: 'Products Table',
      status: 'error',
      message: 'جدول المنتجات غير موجود',
      details: String(error)
    });
  }

  // 5. Check Order table
  try {
    const orders = await db.order.count();
    results.checks.push({
      name: 'Orders Table',
      status: 'success',
      message: `${orders} طلب`
    });
  } catch (error) {
    results.checks.push({
      name: 'Orders Table',
      status: 'error',
      message: 'جدول الطلبات غير موجود',
      details: String(error)
    });
  }

  // 6. Check environment variables
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  };

  results.checks.push({
    name: 'Environment Variables',
    status: envCheck.DATABASE_URL ? 'success' : 'error',
    message: envCheck.DATABASE_URL ? 'DATABASE_URL موجود' : 'DATABASE_URL غير موجود!',
    details: envCheck
  });

  // 7. Test login query
  try {
    const testEmail = 'test@example.com';
    await db.user.findUnique({
      where: { email: testEmail }
    });
    results.checks.push({
      name: 'Login Query Test',
      status: 'success',
      message: 'استعلام البحث عن مستخدم يعمل'
    });
  } catch (error) {
    results.checks.push({
      name: 'Login Query Test',
      status: 'error',
      message: 'فشل استعلام البحث عن مستخدم',
      details: String(error)
    });
  }

  // Calculate overall status
  const hasErrors = results.checks.some(c => c.status === 'error');
  const hasWarnings = results.checks.some(c => c.status === 'warning');

  return NextResponse.json({
    success: !hasErrors,
    status: hasErrors ? 'ERROR' : hasWarnings ? 'WARNING' : 'OK',
    ...results
  }, { 
    status: hasErrors ? 500 : 200 
  });
}
