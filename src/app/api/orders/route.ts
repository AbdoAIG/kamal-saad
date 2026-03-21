import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get orders for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: JSON.parse(item.product.images)
          }
        }))
      }))
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items, shippingAddress, phone, subtotal, shippingFee, total, paymentMethod } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }
    
    // Get or create guest user if no userId provided
    let orderUserId = userId;
    
    if (!orderUserId || orderUserId.startsWith('guest-')) {
      // Create a guest user
      const guestUser = await db.user.create({
        data: {
          email: `guest-${Date.now()}@guest.com`,
          name: 'Guest User',
          role: 'customer'
        }
      });
      orderUserId = guestUser.id;
    }
    
    // Calculate total if not provided
    let calculatedTotal = total;
    if (!calculatedTotal) {
      const productIds = items.map((item: { productId: string }) => item.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } }
      });
      
      const productMap = Object.fromEntries(products.map(p => [p.id, p]));
      
      calculatedTotal = 0;
      items.forEach((item: { productId: string; quantity: number; price?: number }) => {
        const product = productMap[item.productId];
        const price = item.price || product?.discountPrice || product?.price || 0;
        calculatedTotal += price * item.quantity;
      });
    }
    
    // Prepare order items
    const orderItems = items.map((item: { productId: string; quantity: number; price?: number }) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price || 0
    }));
    
    // Create order
    const order = await db.order.create({
      data: {
        userId: orderUserId,
        status: 'pending',
        total: calculatedTotal,
        discount: subtotal ? subtotal - calculatedTotal + (shippingFee || 0) : 0,
        shippingAddress,
        phone,
        paymentMethod: paymentMethod || 'cod',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Update sales count and stock for products
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          salesCount: { increment: item.quantity },
          stock: { decrement: item.quantity }
        }
      });
    }
    
    // Clear cart if user is logged in
    try {
      const cart = await db.cart.findUnique({
        where: { userId: orderUserId }
      });
      
      if (cart) {
        await db.cartItem.deleteMany({
          where: { cartId: cart.id }
        });
      }
    } catch {
      // Ignore cart clear errors for guest users
    }
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: unknown) {
    console.error('Order create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
