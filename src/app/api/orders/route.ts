import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

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
    
    logger.info('Order creation request received', { 
      userId, 
      itemsCount: items?.length,
      paymentMethod 
    });
    
    if (!items || items.length === 0) {
      logger.error('Order creation failed: No items');
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }
    
    // Validate all product IDs exist
    const productIds = items.map((item: { productId: string }) => item.productId);
    const existingProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, discountPrice: true, stock: true, name: true }
    });
    
    if (existingProducts.length !== productIds.length) {
      const missingIds = productIds.filter((id: string) => !existingProducts.find(p => p.id === id));
      logger.error('Order creation failed: Products not found', { missingIds });
      return NextResponse.json(
        { success: false, error: 'Some products are no longer available' },
        { status: 400 }
      );
    }
    
    // Get or create guest user if no userId provided
    let orderUserId = userId;
    
    // Check if the userId is a valid existing user
    if (orderUserId && !orderUserId.startsWith('guest-')) {
      const existingUser = await db.user.findUnique({
        where: { id: orderUserId },
        select: { id: true }
      });
      
      if (!existingUser) {
        logger.warn('User ID provided but not found in database, creating guest', { userId });
        orderUserId = null;
      }
    }
    
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
      logger.info('Created guest user for order', { guestUserId: orderUserId });
    }
    
    // Calculate total if not provided
    let calculatedTotal = total;
    const productMap = Object.fromEntries(existingProducts.map(p => [p.id, p]));
    
    if (!calculatedTotal) {
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
      price: item.price || productMap[item.productId]?.price || 0
    }));
    
    logger.info('Creating order', { 
      userId: orderUserId, 
      total: calculatedTotal, 
      itemsCount: orderItems.length 
    });
    
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
    
    logger.info('Order created successfully', { orderId: order.id });
    
    // Update sales count and stock for products
    for (const item of items) {
      try {
        await db.product.update({
          where: { id: item.productId },
          data: {
            salesCount: { increment: item.quantity },
            stock: { decrement: item.quantity }
          }
        });
      } catch (updateError) {
        logger.error('Failed to update product stock', { 
          productId: item.productId, 
          error: String(updateError) 
        });
        // Don't fail the order for stock update issues
      }
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
        logger.info('Cart cleared for user', { userId: orderUserId });
      }
    } catch {
      // Ignore cart clear errors for guest users
    }
    
    // Send notifications
    try {
      // Get user info for notification
      const orderUser = await db.user.findUnique({
        where: { id: orderUserId },
        select: { name: true, email: true },
      });
      
      // Notify customer
      await NotificationService.notifyOrderCreated(orderUserId, order.id, calculatedTotal);
      
      // Notify admins
      await NotificationService.notifyAdminsNewOrder(
        order.id,
        calculatedTotal,
        orderUser?.name || orderUser?.email || 'Guest Customer'
      );
      
      logger.info('Order notifications sent', { orderId: order.id, userId: orderUserId });
    } catch (notificationError) {
      // Don't fail the order if notification fails
      logger.error('Failed to send order notifications', { error: String(notificationError) });
    }
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('=== ORDER CREATE ERROR ===');
    console.error('Error:', errorMessage);
    console.error('Stack:', errorStack);
    console.error('=========================');
    
    logger.error('Order create error', { 
      error: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'Failed to create order. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
