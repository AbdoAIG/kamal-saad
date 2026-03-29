import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

// POST - Run migration to add deletedAt column
// This endpoint accepts a secret key via Authorization header or query param
export async function POST(request: NextRequest) {
  try {
    // Get secret from header or query
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    const secretKey = process.env.MIGRATION_SECRET_KEY || process.env.NEXTAUTH_SECRET;

    const providedSecret = authHeader?.replace('Bearer ', '') || querySecret;

    // Verify secret
    if (!providedSecret || providedSecret !== secretKey) {
      return NextResponse.json({
        success: false,
        error: 'غير مصرح - مفتاح سري غير صالح'
      }, { status: 401 });
    }

    // Check if column already exists
    const checkColumn = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Product'
      AND column_name = 'deletedAt'
    `;

    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'عمود deletedAt موجود بالفعل',
        alreadyExists: true
      });
    }

    // Add deletedAt column
    await db.$executeRaw`
      ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3)
    `;

    return NextResponse.json({
      success: true,
      message: 'تم إضافة عمود deletedAt بنجاح',
      alreadyExists: false
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إضافة العمود',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Check migration status (public for debugging)
export async function GET() {
  try {
    const checkColumn = await db.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Product'
      AND column_name = 'deletedAt'
    `;

    const columnExists = Array.isArray(checkColumn) && checkColumn.length > 0;

    return NextResponse.json({
      success: true,
      deletedAtExists: columnExists,
      message: columnExists
        ? 'عمود deletedAt موجود - Soft Delete جاهز للعمل'
        : 'عمود deletedAt غير موجود - يرجى تشغيل الـ migration باستخدام المفتاح السري'
    });
  } catch (error: any) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في التحقق',
      details: error.message
    }, { status: 500 });
  }
}
