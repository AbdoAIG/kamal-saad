import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// PUT - Mark all notifications as read for authenticated user
export async function PUT() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update all unread notifications for the user
    const result = await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        message: `Successfully marked ${result.count} notifications as read`,
      },
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
