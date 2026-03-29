import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Server-Sent Events (SSE) for real-time notifications
// This endpoint keeps a connection open and pushes notifications in real-time

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const isAdmin = session.user.role === 'admin';

  // Set up SSE response
  const encoder = new TextEncoder();
  let isConnected = true;
  let lastNotificationId = '';

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Get initial unread count
      const initialUnreadCount = await db.notification.count({
        where: { userId, isRead: false },
      });
      
      const countMessage = `data: ${JSON.stringify({ type: 'unread_count', count: initialUnreadCount })}\n\n`;
      controller.enqueue(encoder.encode(countMessage));

      // If admin, also send pending orders count
      if (isAdmin) {
        const pendingOrdersCount = await db.order.count({
          where: { status: 'pending' },
        });
        const adminMessage = `data: ${JSON.stringify({ type: 'admin_stats', pendingOrders: pendingOrdersCount })}\n\n`;
        controller.enqueue(encoder.encode(adminMessage));
      }

      // Polling interval for new notifications (every 5 seconds)
      const pollInterval = setInterval(async () => {
        if (!isConnected) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Check for new notifications
          const notifications = await db.notification.findMany({
            where: {
              userId,
              isRead: false,
              ...(lastNotificationId && { id: { gt: lastNotificationId } }),
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          if (notifications.length > 0) {
            lastNotificationId = notifications[0].id;
            
            for (const notification of notifications) {
              const message = `data: ${JSON.stringify({
                type: 'notification',
                data: {
                  id: notification.id,
                  type: notification.type,
                  title: notification.title,
                  titleAr: notification.titleAr,
                  message: notification.message,
                  messageAr: notification.messageAr,
                  createdAt: notification.createdAt,
                  data: notification.data ? JSON.parse(notification.data) : null,
                },
              })}\n\n`;
              controller.enqueue(encoder.encode(message));
            }

            // Send updated unread count
            const unreadCount = await db.notification.count({
              where: { userId, isRead: false },
            });
            const countMessage = `data: ${JSON.stringify({ type: 'unread_count', count: unreadCount })}\n\n`;
            controller.enqueue(encoder.encode(countMessage));
          }

          // If admin, also check for new orders
          if (isAdmin) {
            const pendingOrdersCount = await db.order.count({
              where: { status: 'pending' },
            });
            const adminMessage = `data: ${JSON.stringify({ type: 'admin_stats', pendingOrders: pendingOrdersCount })}\n\n`;
            controller.enqueue(encoder.encode(adminMessage));
          }
        } catch (error) {
          console.error('SSE polling error:', error);
        }
      }, 5000);

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        if (!isConnected) {
          clearInterval(keepAliveInterval);
          return;
        }
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isConnected = false;
        clearInterval(pollInterval);
        clearInterval(keepAliveInterval);
        try {
          controller.close();
        } catch (e) {
          // Ignore close errors
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
