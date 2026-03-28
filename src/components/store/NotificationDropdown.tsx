'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, Package, TrendingUp, Tag, Settings, 
  Check, CheckCheck, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Notification {
  id: string;
  type: 'order' | 'stock' | 'promo' | 'system';
  title: string;
  titleAr: string | null;
  message: string;
  messageAr: string | null;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    unreadCount: number;
  };
}

// Translations for notifications
const notificationTranslations = {
  ar: {
    notifications: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    viewAll: 'عرض الكل',
    noNotifications: 'لا توجد إشعارات',
    noNotificationsDesc: 'ستظهر الإشعارات الجديدة هنا',
    justNow: 'الآن',
    minutesAgo: 'دقائق مضت',
    hoursAgo: 'ساعات مضت',
    daysAgo: 'أيام مضت',
    orderNotification: 'طلب',
    stockNotification: 'مخزون',
    promoNotification: 'عرض',
    systemNotification: 'نظام',
    new: 'جديد',
  },
  en: {
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    viewAll: 'View All',
    noNotifications: 'No notifications',
    noNotificationsDesc: 'New notifications will appear here',
    justNow: 'Just now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    orderNotification: 'Order',
    stockNotification: 'Stock',
    promoNotification: 'Promo',
    systemNotification: 'System',
    new: 'New',
  }
};

const nt = (key: keyof typeof notificationTranslations.ar, language: 'ar' | 'en') => {
  return notificationTranslations[language][key];
};

// Time ago utility
function getTimeAgo(dateString: string, language: 'ar' | 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return nt('justNow', language);
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${nt('minutesAgo', language)}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${nt('hoursAgo', language)}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${nt('daysAgo', language)}`;
  }
  
  // Format date for older notifications
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Get notification link based on type
function getNotificationLink(notification: Notification): string {
  switch (notification.type) {
    case 'order':
      return notification.data?.orderId 
        ? `/?order=${notification.data.orderId}` 
        : '/?orders=true';
    case 'stock':
      return notification.data?.productId 
        ? `/?product=${notification.data.productId}` 
        : '/';
    case 'promo':
      return '/?promo=true';
    case 'system':
    default:
      return '/';
  }
}

// Get notification icon based on type
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'order':
      return Package;
    case 'stock':
      return TrendingUp;
    case 'promo':
      return Tag;
    case 'system':
    default:
      return Settings;
  }
}

// Get notification icon colors based on type
function getNotificationIconClass(type: Notification['type']) {
  switch (type) {
    case 'order':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'stock':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'promo':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'system':
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

export function NotificationDropdown() {
  const { user, language } = useStore();
  const isArabic = language === 'ar';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/notifications?limit=10');
      const data: NotificationsResponse = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (markingAllRead) return;
    
    setMarkingAllRead(true);
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  // Show nothing if not logged in
  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
        >
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center bg-gradient-to-l from-rose-500 to-pink-500 text-white text-xs rounded-full font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={isArabic ? 'start' : 'end'}
        className="w-80 sm:w-96 p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {nt('notifications', language)}
          </h3>
          {unreadCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
            >
              {unreadCount} {nt('new', language)}
            </Badge>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">
              {nt('noNotifications', language)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {nt('noNotificationsDesc', language)}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="py-2">
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const iconClass = getNotificationIconClass(notification.type);
                const title = isArabic && notification.titleAr ? notification.titleAr : notification.title;
                const timeAgo = getTimeAgo(notification.createdAt, language);
                const link = getNotificationLink(notification);
                
                return (
                  <div key={notification.id}>
                    <Link
                      href={link}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        !notification.isRead ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${
                            !notification.isRead 
                              ? 'font-semibold text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {title}
                          </p>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-teal-500 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {timeAgo}
                        </p>
                      </div>
                    </Link>
                    {index < notifications.length - 1 && (
                      <Separator className="my-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 flex items-center justify-between gap-2">
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={markingAllRead}
                  className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                >
                  {markingAllRead ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-1.5" />
                  )}
                  {nt('markAllRead', language)}
                </Button>
              ) : (
                <div />
              )}
              <Link
                href="/?notifications=true"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {nt('viewAll', language)}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
