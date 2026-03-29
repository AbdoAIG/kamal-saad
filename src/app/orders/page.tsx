'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, Clock, CheckCircle, Truck, XCircle,
  ChevronLeft, ChevronRight, RefreshCw, Eye, Loader2, AlertCircle
} from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { Sidebar } from '@/components/store/Sidebar';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { Category } from '@prisma/client';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    nameAr: string;
    images: string[];
    category?: {
      name: string;
      nameAr: string;
    };
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  discount: number;
  shippingAddress: string | null;
  phone: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    icon: Clock,
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
  },
  processing: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Package,
    labelAr: 'قيد التجهيز',
    labelEn: 'Processing',
  },
  shipped: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Truck,
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
  },
  delivered: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    icon: CheckCircle,
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    icon: XCircle,
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const { language, user, userId, addItem, toggleCart, toggleAuthModal, setAuthModalOpen } = useStore();
  const isArabic = language === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !userId) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user?.id || userId}`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || userId) {
      fetchOrders();
    }
  }, [user, userId, setAuthModalOpen]);

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    try {
      // Add all items to cart
      for (const item of order.items) {
        const product = {
          id: item.product.id,
          name: item.product.name,
          nameAr: item.product.nameAr,
          price: item.price,
          discountPrice: null,
          images: Array.isArray(item.product.images) ? item.product.images.join(',') : item.product.images,
          stock: 100,
          categoryId: '',
          rating: 0,
          reviewsCount: 0,
          salesCount: 0,
          featured: false,
        };
        addItem(product, item.quantity);
      }
      toggleCart();
    } catch (error) {
      console.error('Error reordering:', error);
    } finally {
      setReorderingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isArabic
      ? date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + ' ' + (isArabic ? 'ج.م' : 'EGP');
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  // Not authenticated state
  if (!user && !userId && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categories={categories}
          selectedCategory={null}
          onCategorySelect={() => {}}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {isArabic ? 'سجل الدخول لعرض طلباتك' : 'Login to view your orders'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isArabic
                ? 'قم بتسجيل الدخول للوصول إلى سجل طلباتك وتتبعها'
                : 'Sign in to access and track your order history'}
            </p>
            <Button
              onClick={() => toggleAuthModal('login')}
              className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              {isArabic ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </motion.div>
        </main>
        <Footer />
        <CartSidebar />
        <FavoritesSidebar />
        <AuthModal />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categories={categories}
          selectedCategory={null}
          onCategorySelect={() => {}}
        />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isArabic ? 'جاري تحميل الطلبات...' : 'Loading orders...'}
            </p>
          </motion.div>
        </main>
        <Footer />
        <CartSidebar />
        <FavoritesSidebar />
        <AuthModal />
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categories={categories}
          selectedCategory={null}
          onCategorySelect={() => {}}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-32 w-32 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <ShoppingBag className="h-16 w-16 text-teal-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {isArabic ? 'لا توجد طلبات بعد' : 'No orders yet'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isArabic
                ? 'لم تقم بأي طلبات حتى الآن. ابدأ التسوق الآن!'
                : "You haven't placed any orders yet. Start shopping now!"}
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              {isArabic ? 'تسوق الآن' : 'Shop Now'}
            </Button>
          </motion.div>
        </main>
        <Footer />
        <CartSidebar />
        <FavoritesSidebar />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={null}
        onCategorySelect={() => {}}
      />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl">
                <Package className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'طلباتي' : 'My Orders'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isArabic
                    ? `${orders.length} طلب في السجل`
                    : `${orders.length} order${orders.length !== 1 ? 's' : ''} in history`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Orders List */}
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, index) => {
                const status = getStatusConfig(order.status);
                const StatusIcon = status.icon;
                const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md dark:shadow-gray-900/30">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div className="bg-gradient-to-l from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 p-4 border-b dark:border-gray-700">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-teal-600">
                                  #{order.id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(order.createdAt)}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {isArabic
                                    ? `${itemsCount} منتج`
                                    : `${itemsCount} item${itemsCount !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${status.color} border font-medium`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                              {isArabic ? status.labelAr : status.labelEn}
                            </Badge>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-4">
                          <div className="flex flex-wrap gap-3 mb-4">
                            {order.items.slice(0, 4).map((item) => (
                              <div
                                key={item.id}
                                className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-600 shadow-sm"
                              >
                                <img
                                  src={Array.isArray(item.product.images) ? item.product.images[0] : item.product.images}
                                  alt={isArabic ? item.product.nameAr : item.product.name}
                                  className="w-full h-full object-cover"
                                />
                                {item.quantity > 1 && (
                                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {item.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                            {order.items.length > 4 && (
                              <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  +{order.items.length - 4}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Order Total */}
                          <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isArabic ? 'الإجمالي' : 'Total'}
                              </p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(order.total)}
                              </p>
                              {order.discount > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {isArabic ? `خصم: ${formatPrice(order.discount)}` : `Discount: ${formatPrice(order.discount)}`}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReorder(order)}
                                disabled={reorderingId === order.id}
                                className="rounded-xl"
                              >
                                {reorderingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline ml-2">
                                  {isArabic ? 'إعادة الطلب' : 'Reorder'}
                                </span>
                              </Button>
                              <Link href={`/orders/${order.id}`}>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-2">
                                    {isArabic ? 'التفاصيل' : 'Details'}
                                  </span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />
    </div>
  );
}
