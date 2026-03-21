import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// POST - Check and notify users (called when stock is updated)
// Finds all users waiting for this product and creates notifications for them
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only authenticated users can trigger stock notification checks
    // In production, this should be restricted to admin users or internal systems
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, stockQuantity } = body;

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
        nameAr: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Use provided stock quantity or product's current stock
    const currentStock = stockQuantity ?? product.stock;

    // If stock is 0 or less, no need to notify
    if (currentStock <= 0) {
      return NextResponse.json({
        success: true,
        message: 'Product is out of stock, no notifications sent',
        data: { notifiedCount: 0 },
      });
    }

    // Find all users waiting for this product who haven't been notified yet
    const pendingNotifications = await db.stockNotification.findMany({
      where: {
        productId: productId,
        isNotified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users waiting for this product',
        data: { notifiedCount: 0 },
      });
    }

    // Create notifications for all waiting users
    const notificationPromises = pendingNotifications.map((subscription) =>
      db.notification.create({
        data: {
          userId: subscription.userId,
          type: 'stock',
          title: 'Product Back in Stock!',
          titleAr: 'المنتج متوفر الآن!',
          message: `${product.name} is now back in stock with ${currentStock} units available.`,
          messageAr: `${product.nameAr} أصبح متوفراً الآن مع ${currentStock} وحدة متاحة.`,
          data: JSON.stringify({
            productId: product.id,
            productName: product.name,
            productNameAr: product.nameAr,
            stock: currentStock,
          }),
          isRead: false,
        },
      })
    );

    // Create all notifications and update stock notification status
    const [createdNotifications] = await Promise.all([
      Promise.all(notificationPromises),
      // Mark all stock notifications as notified
      db.stockNotification.updateMany({
        where: {
          productId: productId,
          isNotified: false,
        },
        data: {
          isNotified: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Notified ${createdNotifications.length} users about product restock`,
      data: {
        productId: product.id,
        productName: product.name,
        currentStock: currentStock,
        notifiedCount: createdNotifications.length,
        notifiedUsers: pendingNotifications.map((n) => ({
          id: n.user.id,
          name: n.user.name,
          email: n.user.email,
        })),
      },
    });
  } catch (error) {
    console.error('Stock notification check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check and notify users' },
      { status: 500 }
    );
  }
}
