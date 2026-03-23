'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag, MapPin, CreditCard, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { Sidebar } from '@/components/store/Sidebar';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { PaymentOptions, PaymentData } from '@/components/payment/PaymentOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore, t } from '@/store/useStore';
import { Category } from '@prisma/client';

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  landmark?: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, language, user, clearCart } = useStore();
  const isArabic = language === 'ar';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    governorate: '',
    city: '',
    address: '',
    notes: '',
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = subtotal >= 200 ? 0 : 30;
  const total = subtotal + shippingFee;

  const egyptianGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية',
    'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'الدمياط', 'السويس',
    'الإسماعيلية', 'بورسعيد', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
    'مطروح', 'شمال سيناء', 'جنوب سيناء'
  ];

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  // Fetch saved addresses for logged-in users
  useEffect(() => {
    if (user?.id) {
      setLoadingAddresses(true);
      fetch('/api/addresses')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSavedAddresses(data.data);
            // Auto-select default address
            const defaultAddress = data.data.find((addr: SavedAddress) => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              // Fill the form with default address
              setShippingForm(prev => ({
                ...prev,
                fullName: defaultAddress.fullName || '',
                phone: defaultAddress.phone || '',
                governorate: defaultAddress.governorate || '',
                city: defaultAddress.city || '',
                address: defaultAddress.address || '',
              }));
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoadingAddresses(false));
    }
  }, [user?.id]);

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(addr => addr.id === addressId);
    if (selected) {
      setShippingForm(prev => ({
        ...prev,
        fullName: selected.fullName || '',
        phone: selected.phone || '',
        governorate: selected.governorate || '',
        city: selected.city || '',
        address: selected.address || '',
      }));
    }
  };

  useEffect(() => {
    if (items.length === 0 && !paymentSuccess) {
      router.push('/');
    }
  }, [items.length, paymentSuccess, router]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSuccess = async (data: PaymentData) => {
    setIsLoading(true);
    setPaymentData(data);
    
    // Create the order in the database
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'guest-' + Date.now(),
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.discountPrice || item.product.price,
          })),
          shippingAddress: JSON.stringify({
            fullName: shippingForm.fullName,
            phone: shippingForm.phone,
            email: shippingForm.email,
            governorate: shippingForm.governorate,
            city: shippingForm.city,
            address: shippingForm.address,
            notes: shippingForm.notes,
          }),
          phone: shippingForm.phone,
          subtotal,
          shippingFee,
          total: data.method === 'cod' ? total + 15 : total,
          paymentMethod: data.method,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentSuccess(true);
        setStep('confirmation');
        clearCart();
      } else {
        console.error('Order creation failed:', result.error);
        alert(isArabic ? 'حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى.' : 'Error creating order. Please try again.');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      alert(isArabic ? 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (items.length === 0 && !paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {isArabic ? 'سلة التسوق فارغة' : 'Your cart is empty'}
          </h2>
          <Button onClick={() => router.push('/')}>
            {isArabic ? 'تسوق الآن' : 'Shop Now'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {['shipping', 'payment', 'confirmation'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                  step === s 
                    ? 'bg-teal-500 text-white' 
                    : i < ['shipping', 'payment', 'confirmation'].indexOf(step)
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < ['shipping', 'payment', 'confirmation'].indexOf(step) ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`font-medium hidden sm:block ${
                  step === s ? 'text-teal-600' : 'text-gray-500'
                }`}>
                  {s === 'shipping' && (isArabic ? 'الشحن' : 'Shipping')}
                  {s === 'payment' && (isArabic ? 'الدفع' : 'Payment')}
                  {s === 'confirmation' && (isArabic ? 'التأكيد' : 'Confirmation')}
                </span>
                {i < 2 && <ArrowRight className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''} text-gray-300`} />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Shipping Step */}
                {step === 'shipping' && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                        <MapPin className="h-5 w-5 text-teal-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isArabic ? 'عنوان الشحن' : 'Shipping Address'}
                      </h2>
                    </div>

                    {/* Saved Addresses for logged-in users */}
                    {user && savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <Label className="mb-3 block">{isArabic ? 'العناوين المحفوظة' : 'Saved Addresses'}</Label>
                        <div className="grid gap-3">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => handleAddressSelect(addr.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedAddressId === addr.id
                                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">{addr.fullName}</span>
                                    {addr.isDefault && (
                                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                        {isArabic ? 'الافتراضي' : 'Default'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addr.phone}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {addr.governorate} - {addr.city} - {addr.address}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedAddressId === addr.id
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedAddressId === addr.id && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-sm text-gray-500">
                          {isArabic ? 'أو أدخل عنوان جديد:' : 'Or enter a new address:'}
                        </div>
                      </div>
                    )}

                    {loadingAddresses && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                      </div>
                    )}

                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{isArabic ? 'الاسم الكامل' : 'Full Name'}</Label>
                          <Input
                            value={shippingForm.fullName}
                            onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                            required
                            className="h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                          <Input
                            type="tel"
                            value={shippingForm.phone}
                            onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                            required
                            className="h-12 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <Input
                          type="email"
                          value={shippingForm.email}
                          onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{isArabic ? 'المحافظة' : 'Governorate'}</Label>
                          <select
                            value={shippingForm.governorate}
                            onChange={(e) => setShippingForm({ ...shippingForm, governorate: e.target.value })}
                            required
                            className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4"
                          >
                            <option value="">{isArabic ? 'اختر المحافظة' : 'Select Governorate'}</option>
                            {egyptianGovernorates.map(gov => (
                              <option key={gov} value={gov}>{gov}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>{isArabic ? 'المدينة' : 'City'}</Label>
                          <Input
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                            required
                            className="h-12 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{isArabic ? 'العنوان التفصيلي' : 'Detailed Address'}</Label>
                        <Input
                          value={shippingForm.address}
                          onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                          placeholder={isArabic ? 'شارع، رقم العمارة، رقم الشقة...' : 'Street, building, apartment...'}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                        <Input
                          value={shippingForm.notes}
                          onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                          placeholder={isArabic ? 'أي تعليمات خاصة للتوصيل...' : 'Any special delivery instructions...'}
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl"
                      >
                        {isArabic ? 'متابعة للدفع' : 'Continue to Payment'}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* Payment Step */}
                {step === 'payment' && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                        <CreditCard className="h-5 w-5 text-teal-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                      </h2>
                    </div>

                    <PaymentOptions
                      total={total}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />

                    <Button
                      variant="ghost"
                      onClick={() => setStep('shipping')}
                      className="mt-4"
                    >
                      {isArabic ? '← العودة للشحن' : '← Back to Shipping'}
                    </Button>
                  </motion.div>
                )}

                {/* Confirmation Step */}
                {step === 'confirmation' && paymentSuccess && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="h-12 w-12 text-green-600" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {isArabic ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed!'}
                    </h2>

                    {paymentData?.method === 'fawry' && paymentData.referenceNumber && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6">
                        <p className="text-orange-800 dark:text-orange-200 mb-2">
                          {isArabic ? 'رقم مرجع فوري:' : 'Fawry Reference Number:'}
                        </p>
                        <p className="text-2xl font-bold text-orange-600">{paymentData.referenceNumber}</p>
                      </div>
                    )}

                    {paymentData?.method === 'valu' && paymentData.installmentPlan && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                        <p className="text-purple-800 dark:text-purple-200 mb-2">
                          {isArabic ? 'خطة التقسيط:' : 'Installment Plan:'}
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                          {paymentData.installmentPlan.monthlyAmount.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'} / {isArabic ? 'شهر' : 'month'}
                        </p>
                      </div>
                    )}

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {isArabic 
                        ? 'سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني'
                        : 'Order details will be sent to your email'
                      }
                    </p>

                    <Button
                      onClick={() => router.push('/')}
                      className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl"
                    >
                      {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  {isArabic ? 'ملخص الطلب' : 'Order Summary'}
                </h3>

                <div className="space-y-3 mb-4">
                  {items.map((item) => {
                    const images = JSON.parse(item.product.images || '[]');
                    const mainImage = images[0] || 'https://via.placeholder.com/100';
                    const price = item.product.discountPrice || item.product.price;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={mainImage}
                            alt={isArabic ? item.product.nameAr : item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                            {isArabic ? item.product.nameAr : item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">x{item.quantity}</p>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(price * item.quantity).toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{subtotal.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 
                        ? (isArabic ? 'مجاني' : 'Free')
                        : `${shippingFee} ${isArabic ? 'ج.م' : 'EGP'}`
                      }
                    </span>
                  </div>
                  {subtotal < 200 && (
                    <p className="text-xs text-teal-600">
                      {isArabic 
                        ? 'أضف منتجات بقيمة 200 ج.م للحصول على شحن مجاني'
                        : 'Add 200 EGP more for free shipping'
                      }
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">{isArabic ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-teal-600">{total.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}</span>
                  </div>
                </div>
              </div>
            </div>
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
