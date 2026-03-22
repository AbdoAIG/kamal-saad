'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
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
  position?: number;
}

// Default hero banners - Updated with new text
const defaultHeroBanners = {
  ar: [
    {
      id: 'hero-1',
      title: 'كل ما تحتاجه للمدرسة والمكتب',
      subtitle: 'أفضل المنتجات المدرسية والمكتبية بأسعار مناسبة',
      gradient: 'from-teal-600 via-cyan-600 to-blue-600',
      features: ['توصيل سريع', 'ضمان الجودة', 'دفع آمن', 'دعم متواصل'],
      stats: { products: '500+', categories: '6' }
    },
    {
      id: 'hero-2',
      title: 'عروض العودة للمدارس',
      subtitle: 'خصم 30%',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      features: ['خصومات حصرية', 'توصيل سريع'],
      stats: { discount: '30%', delivery: 'خصم' }
    },
    {
      id: 'hero-3',
      title: 'توصيل مجاني',
      subtitle: 'للطلبات فوق 1000 جنيه',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      features: ['توصيل سريع', 'دفع عند الاستلام'],
      stats: { minOrder: '1000 ج.م', delivery: 'مجاني' }
    },
  ],
  en: [
    {
      id: 'hero-1',
      title: 'Everything You Need for School & Office',
      subtitle: 'Best school and office supplies at great prices',
      gradient: 'from-teal-600 via-cyan-600 to-blue-600',
      features: ['Fast Delivery', 'Quality Guarantee', 'Secure Payment', '24/7 Support'],
      stats: { products: '500+', categories: '6' }
    },
    {
      id: 'hero-2',
      title: 'Back to School Offers',
      subtitle: '30% Discount',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      features: ['Exclusive Discounts', 'Fast Delivery'],
      stats: { discount: '30%', delivery: 'Discount' }
    },
    {
      id: 'hero-3',
      title: 'Free Delivery',
      subtitle: 'On orders over 1000 EGP',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      features: ['Fast Delivery', 'Cash on Delivery'],
      stats: { minOrder: '1000 EGP', delivery: 'Free' }
    },
  ]
};

interface HeroBannerProps {
  isHero?: boolean;
  position?: 1 | 2; // Position 1 = Hero section, Position 2 = Middle of page
}

export function PromotionalBanner({ isHero = false, position = 1 }: HeroBannerProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useStore();
  const isArabic = language === 'ar';

  // Fetch banners from API filtered by position
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          // Filter banners by position (order field: 1 = hero, 2 = middle)
          const positionBanners = data.data.filter((b: Banner) => {
            // Banner order 1-3 = position 1 (hero), order 4-6 = position 2 (middle)
            if (position === 1) {
              return b.active && b.order >= 1 && b.order <= 3;
            } else {
              return b.active && b.order >= 4 && b.order <= 6;
            }
          });
          if (positionBanners.length > 0) {
            setBanners(positionBanners);
          }
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [position]);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    const displayBanners = banners.length > 0 ? banners : defaultHeroBanners[isArabic ? 'ar' : 'en'];
    if (displayBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length, isArabic]);

  const nextBanner = () => {
    const displayBanners = banners.length > 0 ? banners : defaultHeroBanners[isArabic ? 'ar' : 'en'];
    setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
  };

  const prevBanner = () => {
    const displayBanners = banners.length > 0 ? banners : defaultHeroBanners[isArabic ? 'ar' : 'en'];
    setCurrentBanner((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };
  
  const hasCustomBanners = banners.length > 0;
  const displayBanners = hasCustomBanners ? banners : defaultHeroBanners[isArabic ? 'ar' : 'en'];

  if (displayBanners.length === 0) return null;

  const currentBannerData = displayBanners[currentBanner];
  
  // Get banner content
  const title = hasCustomBanners 
    ? (isArabic ? (currentBannerData as Banner).titleAr || (currentBannerData as Banner).title : (currentBannerData as Banner).title)
    : (currentBannerData as any).title;
  const subtitle = hasCustomBanners
    ? (isArabic ? (currentBannerData as Banner).subtitleAr || (currentBannerData as Banner).subtitle : (currentBannerData as Banner).subtitle)
    : (currentBannerData as any).subtitle;
  const buttonText = hasCustomBanners
    ? (isArabic ? (currentBannerData as Banner).buttonTextAr || (currentBannerData as Banner).buttonText : (currentBannerData as Banner).buttonText)
    : (isArabic ? 'تسوق الآن' : 'Shop Now');
  const link = hasCustomBanners ? (currentBannerData as Banner).link : null;
  const bannerImage = hasCustomBanners ? (currentBannerData as Banner).image : null;
  const gradient = hasCustomBanners 
    ? 'from-teal-600 via-cyan-600 to-blue-600' 
    : (currentBannerData as any).gradient;
  const features = hasCustomBanners ? [] : (currentBannerData as any).features || [];
  const stats = hasCustomBanners ? null : (currentBannerData as any).stats;

  // Hero Banner Style
  if (isHero) {
    return (
      <div 
        className={`relative overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={`relative ${bannerImage ? '' : `bg-gradient-to-l ${gradient}`} min-h-[300px] md:min-h-[400px] lg:min-h-[450px] flex items-center`}
          >
            {/* Banner Image Background */}
            {bannerImage && (
              <>
                <img 
                  src={bannerImage} 
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-black/30" />
              </>
            )}
            
            {/* Background decorations */}
            {!bannerImage && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}

            <div className="container mx-auto px-4 relative z-10">
              <div className={`flex flex-col items-center text-center max-w-3xl mx-auto ${isArabic ? 'rtl' : 'ltr'}`}>
                {/* Subtitle */}
                {subtitle && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold mb-4 md:mb-6"
                  >
                    <span className="animate-pulse">✨</span>
                    {subtitle}
                  </motion.div>
                )}
                
                {/* Title */}
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight"
                >
                  {title}
                </motion.h1>
                
                {/* Stats */}
                {stats && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-6 md:gap-8 mb-6"
                  >
                    {Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
                        <p className="text-xs md:text-sm text-white/70">
                          {isArabic ? 
                            (key === 'products' ? 'منتج' : key === 'categories' ? 'أقسام' : key === 'discount' ? 'خصم' : key === 'delivery' ? 'توصيل' : key === 'minOrder' ? 'الحد الأدنى' : key) :
                            key.charAt(0).toUpperCase() + key.slice(1)
                          }
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
                
                {/* CTA Button */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 md:px-10 py-4 md:py-6 text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 gap-2"
                      >
                        {buttonText}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  ) : (
                    <a href="#products">
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 md:px-10 py-4 md:py-6 text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        {buttonText}
                      </Button>
                    </a>
                  )}
                </motion.div>
                
                {/* Features */}
                {features.length > 0 && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-3 md:gap-4"
                  >
                    {features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium">
                        {feature}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {displayBanners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Dots Navigation */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {displayBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentBanner 
                      ? 'w-6 md:w-8 h-2 md:h-3 bg-white' 
                      : 'w-2 md:w-3 h-2 md:h-3 bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Progress Bar */}
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

  // Regular Banner Style (smaller, for middle of page)
  return (
    <div 
      className={`relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg ${isArabic ? 'rtl' : 'ltr'}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner}
          initial={{ opacity: 0, x: isArabic ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isArabic ? 50 : -50 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`relative ${bannerImage ? '' : `bg-gradient-to-l ${gradient}`} p-4 md:p-6 min-h-[120px] md:min-h-[180px] flex items-center`}
        >
          {bannerImage && (
            <>
              <img 
                src={bannerImage} 
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/40 to-transparent" />
            </>
          )}
          
          {!bannerImage && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
          )}

          <div className="container mx-auto relative z-10">
            <div className="flex flex-col items-center text-center">
              {subtitle && (
                <motion.span
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold mb-2"
                >
                  <span>✨</span>
                  {subtitle}
                </motion.span>
              )}
              
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 drop-shadow-lg"
              >
                {title}
              </motion.h2>
              
              {buttonText && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button 
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-4 py-2 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-1"
                      >
                        {buttonText}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  ) : (
                    <a href="#products">
                      <Button 
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-4 py-2 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        {buttonText}
                      </Button>
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {displayBanners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {displayBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentBanner 
                    ? 'w-5 h-2 bg-white' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Progress Bar */}
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
