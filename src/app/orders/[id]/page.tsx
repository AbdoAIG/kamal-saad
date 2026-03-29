'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, Clock, CheckCircle, Truck, XCircle, MapPin, Phone,
  CreditCard, Calendar, ArrowLeft, ArrowRight, RefreshCw, Loader2,
  AlertCircle, RotateCcw, ArrowLeftRight, Check
} from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { Sidebar } from '@/components/store/Sidebar';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  pointsUsed: number;
  pointsEarned: number;
  items: OrderItem[];
  coupon?: {
    code: string;
    type: string;
    value: number;
  } | null;
}

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    icon: Clock,
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
    descriptionAr: 'تم استلام طلبك وهو قيد المراجعة',
    descriptionEn: 'Your order has been received and is being reviewed',
  },
  processing: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Package,
    labelAr: 'قيد التجهيز',
    labelEn: 'Processing',
    descriptionAr: 'جاري تجهيز طلبك للشحن',
    descriptionEn: 'Your order is being prepared for shipping',
  },
  shipped: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Truck,
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
    descriptionAr: 'تم شحن طلبك وهو في الطريق إليك',
    descriptionEn: 'Your order has been shipped and is on its way',
  },
  delivered: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    icon: CheckCircle,
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    descriptionAr: 'تم تسليم طلبك بنجاح',
    descriptionEn: 'Your order has been delivered successfully',
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    icon: XCircle,
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    descriptionAr: 'تم إلغاء هذا الطلب',
    descriptionEn: 'This order has been cancelled',
  },
};

const statusTimeline = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { language, user, userId, addItem, toggleCart, setAuthModalOpen } = useStore();
  const isArabic = language === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!user && !userId) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?userId=${user?.id || userId}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        } else {
          router.push('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || userId) {
      fetchOrder();
    }
  }, [orderId, user, userId, router, setAuthModalOpen]);

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
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
      setReordering(false);
    }
  };

  const handleReturnRequest = async (type: 'return' | 'exchange') => {
    if (!order) return;
    setReturnSubmitting(true);
    setReturnError(null);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          type,
          reason: isArabic ? 'طلب استرجاع/استبدال من العميل' : 'Customer return/exchange request',
          items: order.items.map(item => ({
            productId: item.productId,
            productName: isArabic ? item.product.nameAr : item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReturnSuccess(true);
      } else {
        setReturnError(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Return request error:', error);
      setReturnError(isArabic ? 'حدث خطأ أثناء إرسال الطلب' : 'An error occurred while submitting the request');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isArabic
      ? date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + ' ' + (isArabic ? 'ج.م' : 'EGP');
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusTimeline.indexOf(order.status);
    return index === -1 ? 0 : index;
  };

  const canRequestReturn = order && ['delivered', 'shipped'].includes(order.status);

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
              {isArabic ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}
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

  // Not found state
  if (!order) {
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
            <AlertCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {isArabic ? 'الطلب غير موجود' : 'Order not found'}
            </h2>
            <Button onClick={() => router.push('/orders')}>
              {isArabic ? 'العودة للطلبات' : 'Back to Orders'}
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

  const status = getStatusConfig(order.status);
  const StatusIcon = status.icon;
  const currentStep = getCurrentStepIndex();

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
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href="/orders">
              <Button variant="ghost" className="gap-2">
                {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isArabic ? 'العودة للطلبات' : 'Back to Orders'}
              </Button>
            </Link>
          </motion.div>

          {/* Order Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg dark:shadow-gray-900/30 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl">
                      <Package className="h-8 w-8 text-teal-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400 font-mono">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${status.color} border text-base px-4 py-2`}>
                    <StatusIcon className="h-5 w-5 mr-2" />
                    {isArabic ? status.labelAr : status.labelEn}
                  </Badge>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {isArabic ? status.descriptionAr : status.descriptionEn}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {isArabic ? 'تتبع الطلب' : 'Order Tracking'}
                  </h2>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / (statusTimeline.length - 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-l from-teal-500 to-cyan-500"
                      />
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {statusTimeline.map((step, index) => {
                        const stepConfig = getStatusConfig(step);
                        const StepIcon = stepConfig.icon;
                        const isActive = index <= currentStep;
                        const isCurrent = index === currentStep;

                        return (
                          <div key={step} className="flex flex-col items-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 + index * 0.1 }}
                              className={`h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                                isActive
                                  ? 'bg-gradient-to-l from-teal-500 to-cyan-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                              } ${isCurrent ? 'ring-4 ring-teal-200 dark:ring-teal-800' : ''}`}
                            >
                              {isActive ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                            </motion.div>
                            <span className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'
                            }`}>
                              {isArabic ? stepConfig.labelAr : stepConfig.labelEn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2"
            >
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-teal-500" />
                    {isArabic ? 'المنتجات المطلوبة' : 'Order Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            <img
                              src={Array.isArray(item.product.images) ? item.product.images[0] : item.product.images}
                              alt={isArabic ? item.product.nameAr : item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${item.productId}`}>
                              <h3 className="font-medium text-gray-900 dark:text-white hover:text-teal-500 transition-colors line-clamp-2">
                                {isArabic ? item.product.nameAr : item.product.name}
                              </h3>
                            </Link>
                            {item.product.category && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isArabic ? item.product.category.nameAr : item.product.category.name}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isArabic ? 'الكمية:' : 'Qty:'} {item.quantity}
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {index < order.items.length - 1 && <Separator className="my-3" />}
                      </motion.div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{isArabic ? 'الخصم' : 'Discount'}</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      {order.coupon && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{isArabic ? 'كود الخصم:' : 'Coupon:'} {order.coupon.code}</span>
                          <span>-{order.coupon.type === 'percentage' ? `${order.coupon.value}%` : formatPrice(order.coupon.value)}</span>
                        </div>
                      )}
                      {order.pointsUsed > 0 && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                          <span>{isArabic ? 'نقاط مستخدمة' : 'Points Used'}</span>
                          <span>-{order.pointsUsed}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                        <span className="text-teal-600">{formatPrice(order.total - (order.discount || 0))}</span>
                      </div>
                      {order.pointsEarned > 0 && (
                        <div className="flex justify-between text-sm text-teal-600 dark:text-teal-400">
                          <span>{isArabic ? 'نقاط مكتسبة' : 'Points Earned'}</span>
                          <span>+{order.pointsEarned}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Order Info */}
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-500" />
                    {isArabic ? 'معلومات الطلب' : 'Order Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isArabic ? 'تاريخ الطلب' : 'Order Date'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isArabic ? 'رقم الطلب' : 'Order Number'}
                    </p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-500" />
                    {isArabic ? 'عنوان التوصيل' : 'Shipping Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shippingAddress ? (
                    <p className="text-gray-700 dark:text-gray-300">
                      {order.shippingAddress}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      {isArabic ? 'لا يوجد عنوان' : 'No address provided'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-teal-500" />
                    {isArabic ? 'معلومات الاتصال' : 'Contact Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.phone ? (
                    <p className="text-gray-700 dark:text-gray-300" dir="ltr">
                      {order.phone}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      {isArabic ? 'لا يوجد رقم هاتف' : 'No phone provided'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-teal-500" />
                    {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">
                    {isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-lg dark:shadow-gray-900/30">
                <CardContent className="p-4 space-y-3">
                  <Button
                    onClick={handleReorder}
                    disabled={reordering}
                    className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl"
                  >
                    {reordering ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isArabic ? 'إعادة الطلب' : 'Reorder'}
                  </Button>

                  {canRequestReturn && !returnSuccess && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleReturnRequest('return')}
                        disabled={returnSubmitting}
                        className="w-full rounded-xl"
                      >
                        {returnSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        {isArabic ? 'طلب استرجاع' : 'Request Return'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReturnRequest('exchange')}
                        disabled={returnSubmitting}
                        className="w-full rounded-xl"
                      >
                        {returnSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                        )}
                        {isArabic ? 'طلب استبدال' : 'Request Exchange'}
                      </Button>
                    </>
                  )}

                  {returnSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        {isArabic ? 'تم إرسال طلبك بنجاح!' : 'Your request has been submitted!'}
                      </p>
                    </div>
                  )}

                  {returnError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <p className="text-red-700 dark:text-red-300 text-sm text-center">
                        {returnError}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
