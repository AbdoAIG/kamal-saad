import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // First delete all related records (order items, cart items, reviews)
    await db.$transaction(async (tx) => {
      // Delete order items
      await tx.orderItem.deleteMany({});
      
      // Delete cart items
      await tx.cartItem.deleteMany({});
      
      // Delete reviews
      await tx.review.deleteMany({});
      
      // Delete stock notifications
      await tx.stockNotification.deleteMany({});
      
      // Finally delete all products
      await tx.product.deleteMany({});
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف جميع المنتجات بنجاح',
      deletedCount: 'all'
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المنتجات' },
      { status: 500 }
    );
  }
}
