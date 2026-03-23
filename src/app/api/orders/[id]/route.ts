import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get a single order by ID using raw SQL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch order using raw SQL
    const orders = await db.$queryRaw`
      SELECT 
        id, "userId", status, total, discount, 
        "shippingAddress", phone, "paymentMethod", 
        notes, "pointsUsed", "pointsEarned", 
        "createdAt", "updatedAt", "couponId"
      FROM "Order" 
      WHERE id = ${id} AND "userId" = ${userId}
    ` as any[];

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Fetch order items
    const items = await db.$queryRaw`
      SELECT 
        oi.id, oi."orderId", oi."productId", oi.quantity, oi.price,
        p.id as "productId", p.name, p."nameAr", p.images, 
        p.price as "productPrice", p."discountPrice", p."categoryId",
        c.id as "categoryId", c.name as "categoryName", c."nameAr" as "categoryNameAr"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Category" c ON p."categoryId" = c.id
      WHERE oi."orderId" = ${id}
    ` as any[];

    // Fetch coupon if exists
    let coupon = null;
    if (order.couponId) {
      const coupons = await db.$queryRaw`
        SELECT id, code, type, value, "minOrder", "maxDiscount"
        FROM "Coupon" WHERE id = ${order.couponId}
      ` as any[];
      coupon = coupons[0] || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        coupon,
        items: items.map(item => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.productId,
            name: item.name,
            nameAr: item.nameAr,
            images: JSON.parse(item.images || '[]'),
            price: item.productPrice,
            discountPrice: item.discountPrice,
            categoryId: item.categoryId,
            category: {
              id: item.categoryId,
              name: item.categoryName,
              nameAr: item.categoryNameAr,
            }
          }
        }))
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
