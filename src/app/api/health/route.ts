import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    // Check if categories exist
    const categoriesCount = await db.category.count();
    const productsCount = await db.product.count();
    const usersCount = await db.user.count();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      categories: categoriesCount,
      products: productsCount,
      users: usersCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
