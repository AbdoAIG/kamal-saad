'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Percent, Gift, CreditCard } from 'lucide-react';
import { useStore, t } from '@/store/useStore';
import { Button } from '@/components/ui/button';

export function PromotionalBanner() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { language } = useStore();
  const isArabic = language === 'ar';

  const banners = isArabic ? [
    {
      id: 1,
      title: 'عروض العودة للمدارس',
      subtitle: 'خصم يصل إلى 30% على جميع الأدوات المدرسية',
      description: 'استعد للعام الدراسي الجديد مع أفضل العروض على الأقلام والدفاتر والحقائب المدرسية',
      icon: ShoppingBag,
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      accent: 'bg-yellow-400',
      cta: 'تسوق الآن',
    },
    {
      id: 2,
      title: 'توصيل مجاني',
      subtitle: 'للطلبات فوق 200 جنيه مصري',
      description: 'استمتع بالتوصيل المجاني لجميع محافظات مصر عند شرائك بأكثر من 200 جنيه',
      icon: Truck,
      gradient: 'from-teal-600 via-cyan-600 to-emerald-600',
      accent: 'bg-orange-400',
      cta: 'اطلب الآن',
    },
    {
      id: 3,
      title: 'عروض حصرية',
      subtitle: 'خصم 15% للأعضاء الجدد',
      description: 'سجل الآن واحصل على خصم فوري 15% على أول طلب لك من متجر كمال سعد',
      icon: Percent,
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
      accent: 'bg-cyan-400',
      cta: 'سجل مجاناً',
    },
    {
      id: 4,
      title: 'هدايا مميزة',
      subtitle: 'أدوات مكتبية بأفضل الأسعار',
      description: 'اكتشف مجموعتنا الواسعة من الأدوات المكتبية عالية الجودة بأسعار لا تُقاوم',
      icon: Gift,
      gradient: 'from-amber-600 via-orange-600 to-red-600',
      accent: 'bg-green-400',
      cta: 'اكتشف المزيد',
    },
    {
      id: 5,
      title: 'التقسيط المريح',
      subtitle: 'اقسط مشترياتك حتى 12 شهر',
      description: 'اشترِ الآن وادفع لاحقاً مع خطط التقسيط المرنة دون فوائد',
      icon: CreditCard,
      gradient: 'from-violet-600 via-purple-600 to-indigo-600',
      accent: 'bg-pink-400',
      cta: 'اعرف المزيد',
    },
  ] : [
    {
      id: 1,
      title: 'Back to School Offers',
      subtitle: 'Up to 30% off on all school supplies',
      description: 'Get ready for the new school year with the best offers on pens, notebooks, and school bags',
      icon: ShoppingBag,
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      accent: 'bg-yellow-400',
      cta: 'Shop Now',
    },
    {
      id: 2,
      title: 'Free Delivery',
      subtitle: 'On orders over 200 EGP',
      description: 'Enjoy free delivery to all Egyptian governorates when you spend more than 200 EGP',
      icon: Truck,
      gradient: 'from-teal-600 via-cyan-600 to-emerald-600',
      accent: 'bg-orange-400',
      cta: 'Order Now',
    },
    {
      id: 3,
      title: 'Exclusive Offers',
      subtitle: '15% off for new members',
      description: 'Sign up now and get an instant 15% discount on your first order from Kamal Saad store',
      icon: Percent,
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
      accent: 'bg-cyan-400',
      cta: 'Sign Up Free',
    },
    {
      id: 4,
      title: 'Special Gifts',
      subtitle: 'Office supplies at best prices',
      description: 'Discover our wide range of high-quality office supplies at irresistible prices',
      icon: Gift,
      gradient: 'from-amber-600 via-orange-600 to-red-600',
      accent: 'bg-green-400',
      cta: 'Discover More',
    },
    {
      id: 5,
      title: 'Easy Installments',
      subtitle: 'Pay in installments up to 12 months',
      description: 'Buy now and pay later with flexible installment plans without interest',
      icon: CreditCard,
      gradient: 'from-violet-600 via-purple-600 to-indigo-600',
      accent: 'bg-pink-400',
      cta: 'Learn More',
    },
  ];

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBannerData = banners[currentBanner];
  const IconComponent = currentBannerData.icon;

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shadow-2xl ${isArabic ? 'rtl' : 'ltr'}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner}
          initial={{ opacity: 0, x: isArabic ? -100 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isArabic ? 100 : -100 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className={`relative bg-gradient-to-l ${currentBannerData.gradient} p-8 md:p-12 lg:p-16 min-h-[300px] md:min-h-[350px] flex items-center`}
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Content */}
              <div className="flex-1 text-center md:text-start">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-flex items-center gap-2 ${currentBannerData.accent} text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold mb-4`}
                >
                  <span className="animate-pulse">✨</span>
                  {currentBannerData.subtitle}
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                >
                  {currentBannerData.title}
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg md:text-xl mb-6 max-w-xl"
                >
                  {currentBannerData.description}
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {currentBannerData.cta}
                  </Button>
                </motion.div>
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="hidden md:flex flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl scale-150" />
                  <div className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-8 border border-white/30">
                    <IconComponent className="w-24 h-24 md:w-32 md:h-32 text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevBanner}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextBanner}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBanner(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentBanner 
                ? 'w-8 h-3 bg-white' 
                : 'w-3 h-3 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
        <motion.div
          key={currentBanner}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          className="h-full bg-white/80"
        />
      </div>
    </div>
  );
}
