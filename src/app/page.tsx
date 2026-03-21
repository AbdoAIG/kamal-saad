'use client';

import { useEffect, useState } from 'react';
import { Category, Product } from '@prisma/client';
import { Loader2, Sparkles, Store, Truck, Shield, Headphones, CreditCard, Package, Clock, Phone, ArrowLeft, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { AdminPanel } from '@/components/store/AdminPanel';
import { ProductCard } from '@/components/store/ProductCard';
import { PromotionalBanner } from '@/components/store/PromotionalBanner';
import { Sidebar } from '@/components/store/Sidebar';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStore, t } from '@/store/useStore';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user, addItem, toggleCart, language } = useStore();
  const isArabic = language === 'ar';

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products')
      ]);
      
      const cats = await catRes.json();
      const prods = await prodRes.json();

      if (cats.length === 0 && prods.length === 0) {
        setIsSeeding(true);
      } else {
        setCategories(cats);
        setProducts(prods);
        setIsSeeding(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toggleCart();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 border-4 border-teal-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isArabic ? 'جاري تحميل المتجر...' : 'Loading store...'}
          </h2>
          <p className="text-gray-500">
            {isArabic ? 'نقوم بتجهيز أفضل المنتجات لك' : 'Preparing the best products for you'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Empty State - Seeding
  if (isSeeding && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg p-10 bg-white rounded-3xl shadow-2xl"
        >
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <img src="/logo.png" alt="KMS Logo" className="w-24 h-24 mx-auto object-contain" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isArabic ? 'مرحباً بك في كمال سعد!' : 'Welcome to Kamal Saad!'}
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {isArabic 
              ? 'يبدو أن المتجر فارغ حالياً. اضغط على الزر أدناه لإضافة مجموعة من المنتجات التجريبية.'
              : 'The store appears to be empty. Click below to add sample products.'}
          </p>
          <Button
            onClick={seedDatabase}
            className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-10 py-6 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="h-5 w-5 ml-2" />
            {isArabic ? 'إضافة منتجات تجريبية' : 'Add Sample Products'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const discountedProducts = products.filter((p) => p.discountPrice).slice(0, 4);
  const bestSellers = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    'pens-pencils': '🖊️',
    'notebooks': '📓',
    'school-bags': '🎒',
    'art-supplies': '🎨',
    'office-tools': '📎',
    'educational': '🌍',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={null}
        onCategorySelect={() => {}}
      />
      
      {/* Admin Button */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 left-6 z-40"
        >
          <Button
            onClick={() => setIsAdminOpen(true)}
            className="bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-full h-14 w-14 shadow-2xl"
            size="icon"
          >
            <Store className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-12 md:py-20 relative">
            <div className={`flex flex-col lg:flex-row items-center gap-10 ${isArabic ? '' : 'lg:flex-row-reverse'}`}>
              {/* Content */}
              <div className="flex-1 text-center lg:text-right">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-medium">{t('studentDiscount', language)}</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                >
                  {isArabic ? 'كل ما تحتاجه للمدرسة والمكتب' : 'Everything You Need for School & Office'}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-teal-100 mb-6 max-w-xl mx-auto lg:mx-0"
                >
                  {isArabic 
                    ? 'أفضل المنتجات المدرسية والمكتبية بأسعار مناسبة مع توصيل سريع'
                    : 'Best school and office supplies at great prices with fast delivery'}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`flex flex-col sm:flex-row gap-3 justify-center lg:justify-start ${isArabic ? '' : 'sm:flex-row-reverse'}`}
                >
                  <Link href="/#products">
                    <Button size="lg" className="bg-white text-teal-700 hover:bg-gray-100 text-lg px-8 h-14 rounded-xl shadow-xl w-full sm:w-auto">
                      {t('shopNow', language)}
                      {isArabic ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-xl w-full sm:w-auto">
                      {t('contactUs', language)}
                    </Button>
                  </Link>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`flex items-center justify-center lg:justify-start gap-6 mt-8 ${isArabic ? '' : 'flex-row-reverse'}`}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold">{products.length}+</p>
                    <p className="text-xs text-teal-200">{isArabic ? 'منتج' : 'Products'}</p>
                  </div>
                  <div className="w-px h-10 bg-white/30" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{categories.length}</p>
                    <p className="text-xs text-teal-200">{isArabic ? 'أقسام' : 'Categories'}</p>
                  </div>
                  <div className="w-px h-10 bg-white/30" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">4.9</p>
                    <p className="text-xs text-teal-200">{isArabic ? 'تقييم' : 'Rating'}</p>
                  </div>
                </motion.div>
              </div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-3xl blur-3xl" />
                  <img
                    src="https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600"
                    alt="Office supplies"
                    className="relative z-10 w-full h-[400px] object-cover rounded-3xl shadow-2xl"
                  />
                  
                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`absolute -bottom-4 ${isArabic ? '-right-4' : '-left-4'} bg-white text-gray-900 p-4 rounded-2xl shadow-xl z-20`}
                  >
                    <div className={`flex items-center gap-3 ${isArabic ? '' : 'flex-row-reverse'}`}>
                      <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-bold">{isArabic ? 'توصيل مجاني' : 'Free Delivery'}</p>
                        <p className="text-sm text-gray-500">{isArabic ? 'للطلبات فوق 200 ج.م' : 'Orders over 200 EGP'}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Bar */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Truck, title: isArabic ? 'توصيل سريع' : 'Fast Delivery', desc: isArabic ? 'خلال 24-48 ساعة' : 'Within 24-48 hours' },
                { icon: Shield, title: isArabic ? 'ضمان الجودة' : 'Quality Guarantee', desc: isArabic ? 'منتجات أصلية 100%' : '100% Original' },
                { icon: CreditCard, title: isArabic ? 'دفع آمن' : 'Secure Payment', desc: isArabic ? 'طرق دفع متعددة' : 'Multiple methods' },
                { icon: Headphones, title: isArabic ? 'دعم متواصل' : '24/7 Support', desc: isArabic ? 'خدمة على مدار الساعة' : 'Around the clock' },
              ].map((feature, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${isArabic ? '' : 'flex-row-reverse'}`}>
                  <div className="h-10 w-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <div className="container mx-auto px-4 pt-6">
          <PromotionalBanner />
        </div>

        {/* Categories Section */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isArabic ? 'تسوق حسب القسم' : 'Shop by Category'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {isArabic ? 'اختر القسم الذي تبحث عنه' : 'Choose the category you\'re looking for'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((category, index) => (
                <Link key={category.id} href={`/?category=${category.id}#products`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <div className="bg-white rounded-2xl p-4 text-center border-2 border-transparent hover:border-teal-200 hover:shadow-lg transition-all duration-300">
                      <div className="text-4xl mb-2">
                        {categoryIcons[category.slug] || '📦'}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors text-sm">
                        {isArabic ? category.nameAr : category.name}
                      </h3>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-10 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isArabic ? 'منتجات مميزة' : 'Featured Products'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {isArabic ? 'أفضل المنتجات المختارة لك' : 'Best products selected for you'}
                    </p>
                  </div>
                </div>
                <Link href="/#products">
                  <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                    {t('viewAll', language)}
                    {isArabic ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard
                      product={product as any}
                      onAddToCart={handleAddToCart}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Discounts Section */}
        {discountedProducts.length > 0 && (
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isArabic ? 'عروض وتخفيضات' : 'Deals & Discounts'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {isArabic ? 'فرصة للاستفادة من أفضل العروض' : 'Chance to get the best deals'}
                    </p>
                  </div>
                </div>
                <Link href="/#products">
                  <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                    {t('viewAll', language)}
                    {isArabic ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {discountedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard
                      product={product as any}
                      onAddToCart={handleAddToCart}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How to Order Section */}
        <section className="py-12 bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isArabic ? 'كيف تطلب من المتجر؟' : 'How to Order?'}
              </h2>
              <p className="text-gray-500">
                {isArabic ? 'خطوات بسيطة للحصول على منتجاتك' : 'Simple steps to get your products'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', icon: Package, title: isArabic ? 'اختر المنتجات' : 'Choose Products', desc: isArabic ? 'تصفح المنتجات وأضف ما تريد للسلة' : 'Browse products and add to cart' },
                { step: '2', icon: CreditCard, title: isArabic ? 'أكمل الطلب' : 'Complete Order', desc: isArabic ? 'أدخل بياناتك واختر طريقة الدفع' : 'Enter your details and payment method' },
                { step: '3', icon: Truck, title: isArabic ? 'التوصيل' : 'Delivery', desc: isArabic ? 'نقوم بتوصيل طلبك لباب بيتك' : 'We deliver your order to your door' },
                { step: '4', icon: CheckCircle2, title: isArabic ? 'استلم واستمتع' : 'Receive & Enjoy', desc: isArabic ? 'استلم منتجاتك واستمتع بها' : 'Receive your products and enjoy' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-4">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                      <item.icon className="h-8 w-8 text-teal-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isArabic ? 'الأكثر مبيعاً' : 'Best Sellers'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {isArabic ? 'المنتجات الأكثر طلباً' : 'Most requested products'}
                    </p>
                  </div>
                </div>
                <Link href="/#products">
                  <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                    {t('viewAll', language)}
                    {isArabic ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bestSellers.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard
                      product={product as any}
                      onAddToCart={handleAddToCart}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products Section */}
        <section id="products" className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isArabic ? 'جميع المنتجات' : 'All Products'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {products.length} {isArabic ? 'منتج متاح' : 'products available'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <ProductCard
                    product={product as any}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">
              {isArabic ? 'اشترك في نشرتنا البريدية' : 'Subscribe to Our Newsletter'}
            </h2>
            <p className="text-teal-100 mb-6">
              {isArabic ? 'احصل على أحدث العروض والخصومات مباشرة في بريدك' : 'Get the latest offers and discounts directly in your inbox'}
            </p>
            <div className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto ${isArabic ? '' : 'sm:flex-row-reverse'}`}>
              <input
                type="email"
                placeholder={t('emailPlaceholder', language)}
                className="flex-1 h-12 px-4 rounded-xl bg-white/20 border border-white/30 placeholder:text-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="h-12 px-8 bg-white text-teal-600 hover:bg-gray-100 rounded-xl font-bold">
                {t('subscribe', language)}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />
      <AdminPanel
        open={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products as any}
        categories={categories}
        onRefresh={fetchData}
      />
    </div>
  );
}
