import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// Valid notification types
const VALID_TYPES = ['order', 'stock', 'promo', 'system'] as const;
type NotificationType = (typeof VALID_TYPES)[number];

// GET - Fetch notifications for authenticated user with pagination
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 50); // Max 50 items per page
    const skip = (validPage - 1) * validLimit;

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    };

    // Fetch notifications and counts in parallel
    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: validLimit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    // Parse data JSON for each notification
    const parsedNotifications = notifications.map((notification) => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: parsedNotifications,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validLimit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, title, titleAr, message, messageAr, data } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!VALID_TYPES.includes(type as NotificationType)) {
      return NextResponse.json(
        { success: false, error: `Invalid notification type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create notification
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        titleAr: titleAr || null,
        message,
        messageAr: messageAr || null,
        data: data ? JSON.stringify(data) : null,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null,
      },
    });
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
