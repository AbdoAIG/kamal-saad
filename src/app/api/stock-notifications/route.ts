import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get user's stock notifications
// Returns all products the user is waiting for
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeNotified = searchParams.get('includeNotified') === 'true';

    // Fetch stock notifications with product details
    const stockNotifications = await db.stockNotification.findMany({
      where: {
        userId: session.user.id,
        ...(includeNotified ? {} : { isNotified: false }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            images: true,
            price: true,
            discountPrice: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse product images JSON
    const parsedNotifications = stockNotifications.map((notification) => ({
      ...notification,
      product: {
        ...notification.product,
        images: notification.product.images
          ? JSON.parse(notification.product.images)
          : [],
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: parsedNotifications,
        count: parsedNotifications.length,
      },
    });
  } catch (error) {
    console.error('Stock notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock notifications' },
      { status: 500 }
    );
  }
}

// POST - Subscribe to stock notification
// Creates a notification request for when product is back in stock
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    // Validate productId
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is already in stock
    if (product.stock > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product is already in stock',
          data: { currentStock: product.stock }
        },
        { status: 400 }
      );
    }

    // Check if user is already subscribed
    const existingSubscription = await db.stockNotification.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    if (existingSubscription) {
      // If already notified, reset the notification status
      if (existingSubscription.isNotified) {
        const updated = await db.stockNotification.update({
          where: { id: existingSubscription.id },
          data: { isNotified: false },
        });
        return NextResponse.json({
          success: true,
          message: 'Stock notification subscription renewed',
          data: updated,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Already subscribed to stock notification for this product',
          data: existingSubscription,
        },
        { status: 400 }
      );
    }

    // Create stock notification subscription
    const subscription = await db.stockNotification.create({
      data: {
        userId: session.user.id,
        productId: productId,
        isNotified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to stock notification',
      data: subscription,
    });
  } catch (error) {
    console.error('Stock notification subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe to stock notification' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from stock notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    // Validate productId
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the subscription
    const subscription = await db.stockNotification.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Stock notification subscription not found' },
        { status: 404 }
      );
    }

    // Delete the subscription
    await db.stockNotification.delete({
      where: { id: subscription.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from stock notification',
    });
  } catch (error) {
    console.error('Stock notification unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe from stock notification' },
      { status: 500 }
    );
  }
}
