import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

// GET - Get orders for user using raw SQL
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
    
    // Use raw SQL to fetch orders
    const orders = await db.$queryRaw`
      SELECT 
        o.id, o."userId", o.status, o.total, o.discount, 
        o."shippingAddress", o.phone, o."paymentMethod", 
        o.notes, o."pointsUsed", o."pointsEarned", 
        o."createdAt", o."updatedAt"
      FROM "Order" o
      WHERE o."userId" = ${userId}
      ORDER BY o."createdAt" DESC
    ` as any[];
    
    // Fetch order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await db.$queryRaw`
        SELECT 
          oi.id, oi."orderId", oi."productId", oi.quantity, oi.price,
          p.id as "productId", p.name, p."nameAr", p.price as "productPrice",
          p."discountPrice", p.images, p."categoryId"
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        WHERE oi."orderId" = ${order.id}
      ` as any[];
      
      return {
        ...order,
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
            price: item.productPrice,
            discountPrice: item.discountPrice,
            images: JSON.parse(item.images || '[]'),
            categoryId: item.categoryId,
          }
        }))
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: ordersWithItems
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order using raw SQL
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
    
    // Validate all product IDs exist using raw SQL
    const productIds = items.map((item: { productId: string }) => item.productId);
    const existingProducts = await db.$queryRaw`
      SELECT id, price, "discountPrice", stock, name FROM "Product" WHERE id = ANY(${productIds}::text[])
    ` as any[];
    
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
      const existingUser = await db.$queryRaw`
        SELECT id FROM "User" WHERE id = ${orderUserId}
      ` as any[];
      
      if (existingUser.length === 0) {
        logger.warn('User ID provided but not found in database, creating guest', { userId });
        orderUserId = null;
      }
    }
    
    if (!orderUserId || orderUserId.startsWith('guest-')) {
      // Create a guest user using raw SQL
      const guestEmail = `guest-${Date.now()}@guest.com`;
      await db.$executeRaw`
        INSERT INTO "User" (id, email, name, role, "isActive", "loyaltyPoints", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${guestEmail}, 'Guest User', 'customer', true, 0, NOW(), NOW())
      `;
      
      // Get the created guest user
      const guestUser = await db.$queryRaw`
        SELECT id FROM "User" WHERE email = ${guestEmail}
      ` as any[];
      
      if (guestUser.length > 0) {
        orderUserId = guestUser[0].id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to create guest user' },
          { status: 500 }
        );
      }
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
    
    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create order using raw SQL - only columns that exist
    await db.$executeRaw`
      INSERT INTO "Order" (id, "userId", status, total, discount, "shippingAddress", phone, "paymentMethod", notes, "pointsUsed", "pointsEarned", "createdAt", "updatedAt")
      VALUES (
        ${orderId},
        ${orderUserId},
        'pending',
        ${calculatedTotal},
        ${subtotal ? subtotal - calculatedTotal + (shippingFee || 0) : 0},
        ${shippingAddress || null},
        ${phone || null},
        ${paymentMethod || 'cod'},
        null,
        0,
        0,
        NOW(),
        NOW()
      )
    `;
    
    // Create order items using raw SQL
    for (const item of items) {
      const itemPrice = item.price || productMap[item.productId]?.price || 0;
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await db.$executeRaw`
        INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, price)
        VALUES (${itemId}, ${orderId}, ${item.productId}, ${item.quantity}, ${itemPrice})
      `;
    }
    
    logger.info('Order created successfully using raw SQL', { orderId });
    
    // Update sales count and stock for products using raw SQL
    for (const item of items) {
      try {
        await db.$executeRaw`
          UPDATE "Product" 
          SET "salesCount" = "salesCount" + ${item.quantity},
              stock = stock - ${item.quantity},
              "updatedAt" = NOW()
          WHERE id = ${item.productId}
        `;
      } catch (updateError) {
        logger.error('Failed to update product stock', { 
          productId: item.productId, 
          error: String(updateError) 
        });
      }
    }
    
    // Clear cart using raw SQL
    try {
      await db.$executeRaw`
        DELETE FROM "CartItem" 
        WHERE "cartId" IN (
          SELECT id FROM "Cart" WHERE "userId" = ${orderUserId}
        )
      `;
      logger.info('Cart cleared for user', { userId: orderUserId });
    } catch {
      // Ignore cart clear errors for guest users
    }
    
    // Fetch the created order using raw SQL
    const createdOrder = await db.$queryRaw`
      SELECT 
        id, "userId", status, total, discount, 
        "shippingAddress", phone, "paymentMethod", 
        notes, "pointsUsed", "pointsEarned", 
        "createdAt", "updatedAt"
      FROM "Order" WHERE id = ${orderId}
    ` as any[];
    
    // Fetch order items
    const orderItems = await db.$queryRaw`
      SELECT 
        oi.id, oi."orderId", oi."productId", oi.quantity, oi.price,
        p.id as "productId", p.name, p."nameAr", p.price as "productPrice",
        p."discountPrice", p.images, p."categoryId"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."orderId" = ${orderId}
    ` as any[];
    
    const order = {
      ...createdOrder[0],
      items: orderItems.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.productId,
          name: item.name,
          nameAr: item.nameAr,
          price: item.productPrice,
          discountPrice: item.discountPrice,
          images: item.images,
          categoryId: item.categoryId,
        }
      }))
    };
    
    // Send notifications
    try {
      const orderUserResult = await db.$queryRaw`
        SELECT name, email FROM "User" WHERE id = ${orderUserId}
      ` as any[];
      
      const orderUser = orderUserResult[0];
      
      await NotificationService.notifyOrderCreated(orderUserId, orderId, calculatedTotal);
      
      await NotificationService.notifyAdminsNewOrder(
        orderId,
        calculatedTotal,
        orderUser?.name || orderUser?.email || 'Guest Customer'
      );
      
      logger.info('Order notifications sent', { orderId, userId: orderUserId });
    } catch (notificationError) {
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
