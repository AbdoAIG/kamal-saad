'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Percent, Gift, CreditCard, X, ExternalLink } from 'lucide-react';
import { useStore, t } from '@/store/useStore';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string | null;
  subtitleAr: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  buttonTextAr: string | null;
  active: boolean;
  order: number;
}

// Default banners if no active banners in database
const defaultBanners = {
  ar: [
    {
      id: 'default-1',
      title: 'عروض العودة للمدارس',
      subtitle: 'خصم يصل إلى 30% على جميع الأدوات المدرسية',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    },
    {
      id: 'default-2',
      title: 'توصيل مجاني',
      subtitle: 'للطلبات فوق 200 جنيه مصري',
      gradient: 'from-teal-600 via-cyan-600 to-emerald-600',
    },
    {
      id: 'default-3',
      title: 'عروض حصرية',
      subtitle: 'خصم 15% للأعضاء الجدد',
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
    },
  ],
  en: [
    {
      id: 'default-1',
      title: 'Back to School Offers',
      subtitle: 'Up to 30% off on all school supplies',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    },
    {
      id: 'default-2',
      title: 'Free Delivery',
      subtitle: 'On orders over 200 EGP',
      gradient: 'from-teal-600 via-cyan-600 to-emerald-600',
    },
    {
      id: 'default-3',
      title: 'Exclusive Offers',
      subtitle: '15% off for new members',
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
    },
  ]
};

export function PromotionalBanner() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { language } = useStore();
  const isArabic = language === 'ar';

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          // Filter only active banners
          const activeBanners = data.data.filter((b: Banner) => b.active);
          if (activeBanners.length > 0) {
            setBanners(activeBanners);
          }
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
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

  // Don't render if dismissed or no banners
  if (dismissed) return null;
  
  // Show default banners if no custom banners
  const hasCustomBanners = banners.length > 0;
  const displayBanners = hasCustomBanners ? banners : defaultBanners[isArabic ? 'ar' : 'en'];

  if (displayBanners.length === 0) return null;

  const currentBannerData = displayBanners[currentBanner];
  const title = hasCustomBanners 
    ? (isArabic ? (currentBannerData as Banner).titleAr || (currentBannerData as Banner).title : (currentBannerData as Banner).title)
    : currentBannerData.title;
  const subtitle = hasCustomBanners
    ? (isArabic ? (currentBannerData as Banner).subtitleAr || (currentBannerData as Banner).subtitle : (currentBannerData as Banner).subtitle)
    : currentBannerData.subtitle;
  const buttonText = hasCustomBanners
    ? (isArabic ? (currentBannerData as Banner).buttonTextAr || (currentBannerData as Banner).buttonText : (currentBannerData as Banner).buttonText)
    : (isArabic ? 'تسوق الآن' : 'Shop Now');
  const link = hasCustomBanners ? (currentBannerData as Banner).link : null;
  const bannerImage = hasCustomBanners ? (currentBannerData as Banner).image : null;
  const gradient = hasCustomBanners 
    ? 'from-teal-600 via-cyan-600 to-blue-600' 
    : currentBannerData.gradient;

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
          className={`relative ${bannerImage ? '' : `bg-gradient-to-l ${gradient}`} p-6 md:p-8 lg:p-10 min-h-[200px] md:min-h-[250px] flex items-center`}
        >
          {/* Banner Image Background */}
          {bannerImage && (
            <>
              <img 
                src={bannerImage} 
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/40 to-transparent" />
            </>
          )}
          
          {/* Background decorations (only if no custom image) */}
          {!bannerImage && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
          )}

          <div className="container mx-auto relative z-10">
            <div className="flex flex-col items-center text-center">
              {subtitle && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold mb-3"
                >
                  <span className="animate-pulse">✨</span>
                  {subtitle}
                </motion.div>
              )}
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 drop-shadow-lg"
              >
                {title}
              </motion.h2>
              
              {buttonText && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-5 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-2"
                      >
                        {buttonText}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button 
                      size="lg" 
                      className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-5 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      {buttonText}
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - only show if multiple banners */}
      {displayBanners.length > 1 && (
        <>
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {displayBanners.map((_, index) => (
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
        </>
      )}

      {/* Close Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 z-30"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar - only show if multiple banners */}
      {displayBanners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
          <motion.div
            key={currentBanner}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full bg-white/80"
          />
        </div>
      )}
    </div>
  );
}
