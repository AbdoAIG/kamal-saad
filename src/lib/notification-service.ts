import { db } from './db';
import { logger } from './logger';

export type NotificationType = 'order' | 'stock' | 'promo' | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  data?: Record<string, unknown>;
}

interface CreateAdminNotificationParams {
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  data?: Record<string, unknown>;
}

/**
 * Notification Service
 * Handles creation and management of notifications
 */
export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  static async create(params: CreateNotificationParams) {
    try {
      const notification = await db.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          titleAr: params.titleAr || null,
          message: params.message,
          messageAr: params.messageAr || null,
          data: params.data ? JSON.stringify(params.data) : null,
          isRead: false,
        },
      });

      logger.info('Notification created', {
        userId: params.userId,
        type: params.type,
        notificationId: notification.id,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { error: String(error), params });
      throw error;
    }
  }

  /**
   * Create notifications for all admin users
   */
  static async createForAdmins(params: CreateAdminNotificationParams) {
    try {
      // Get all admin users
      const admins = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });

      if (admins.length === 0) {
        logger.warn('No admin users found for notification');
        return [];
      }

      // Create notifications for all admins
      const notifications = await Promise.all(
        admins.map((admin) =>
          db.notification.create({
            data: {
              userId: admin.id,
              type: params.type,
              title: params.title,
              titleAr: params.titleAr || null,
              message: params.message,
              messageAr: params.messageAr || null,
              data: params.data ? JSON.stringify(params.data) : null,
              isRead: false,
            },
          })
        )
      );

      logger.info('Admin notifications created', {
        adminCount: admins.length,
        type: params.type,
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to create admin notifications', { error: String(error), params });
      throw error;
    }
  }

  /**
   * Create order notification for customer
   */
  static async notifyOrderCreated(userId: string, orderId: string, total: number) {
    return this.create({
      userId,
      type: 'order',
      title: 'Order Placed Successfully',
      titleAr: 'تم إنشاء طلبك بنجاح',
      message: `Your order #${orderId.slice(-8)} for ${total.toLocaleString()} EGP has been placed successfully.`,
      messageAr: `تم إنشاء طلبك رقم #${orderId.slice(-8)} بقيمة ${total.toLocaleString()} ج.م بنجاح.`,
      data: { orderId, total },
    });
  }

  /**
   * Create admin notification for new order
   */
  static async notifyAdminsNewOrder(orderId: string, total: number, customerName: string) {
    return this.createForAdmins({
      type: 'order',
      title: 'New Order Received',
      titleAr: 'طلب جديد',
      message: `New order #${orderId.slice(-8)} from ${customerName} for ${total.toLocaleString()} EGP`,
      messageAr: `طلب جديد #${orderId.slice(-8)} من ${customerName} بقيمة ${total.toLocaleString()} ج.م`,
      data: { orderId, total, customerName },
    });
  }

  /**
   * Create order status update notification
   */
  static async notifyOrderStatusUpdate(
    userId: string,
    orderId: string,
    status: string,
    statusAr: string
  ) {
    return this.create({
      userId,
      type: 'order',
      title: 'Order Status Updated',
      titleAr: 'تم تحديث حالة الطلب',
      message: `Your order #${orderId.slice(-8)} status has been updated to: ${status}`,
      messageAr: `تم تحديث حالة طلبك رقم #${orderId.slice(-8)} إلى: ${statusAr}`,
      data: { orderId, status },
    });
  }

  /**
   * Create stock notification
   */
  static async notifyStockAvailable(userId: string, productId: string, productName: string) {
    return this.create({
      userId,
      type: 'stock',
      title: 'Product Back in Stock',
      titleAr: 'المنتج متوفر الآن',
      message: `${productName} is now back in stock!`,
      messageAr: `${productName} متوفر الآن في المخزون!`,
      data: { productId, productName },
    });
  }

  /**
   * Create promotional notification for all users
   */
  static async broadcastPromo(title: string, titleAr: string, message: string, messageAr: string) {
    try {
      // Get all users
      const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Create notifications in batches of 100
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        batches.push(batch);
      }

      let created = 0;
      for (const batch of batches) {
        await Promise.all(
          batch.map((user) =>
            db.notification.create({
              data: {
                userId: user.id,
                type: 'promo',
                title,
                titleAr,
                message,
                messageAr,
                isRead: false,
              },
            })
          )
        );
        created += batch.length;
      }

      logger.info('Promotional notification broadcast', { recipientCount: created });
      return { success: true, count: created };
    } catch (error) {
      logger.error('Failed to broadcast promo notification', { error: String(error) });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string) {
    return db.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    logger.info('Old notifications cleaned up', { deletedCount: result.count });
    return result;
  }
}
