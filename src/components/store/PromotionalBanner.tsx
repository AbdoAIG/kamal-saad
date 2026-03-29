'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
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
  type: string;
  active: boolean;
  order: number;
}

// ============================================================
// HERO BANNER SLIDER - Full-width professional slider
// ============================================================
export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.data) {
          const heroBanners = data.data
            .filter((b: Banner) => b.active && b.type === 'hero')
            .sort((a: Banner, b: Banner) => a.order - b.order);
          if (heroBanners.length > 0) setBanners(heroBanners);
        }
      } catch (error) {
        console.error('Error fetching hero banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const goTo = useCallback((index: number) => setCurrent(index), []);
  const next = useCallback(() => setCurrent((prev) => (prev + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length), [banners.length]);

  // Default fallback banner
  const defaultBanner = {
    title: isArabic ? 'كمال سعد للمستلزمات المكتبية والمدرسية' : 'Kamal Saad Office & School Supplies',
    subtitle: isArabic ? 'أفضل المنتجات بأفضل الأسعار' : 'Best Products at Best Prices',
    gradient: true,
  };

  const hasBanners = banners.length > 0;
  const items = hasBanners ? banners : [defaultBanner as any];
  const activeBanner = hasBanners ? banners[current] : null;

  if (loading) {
    return (
      <div className="w-full h-[280px] md:h-[400px] lg:h-[480px] bg-gray-200 dark:bg-gray-800 animate-pulse" />
    );
  }

  return (
    <div
      className="relative w-full h-[280px] md:h-[400px] lg:h-[480px] overflow-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {activeBanner?.image ? (
            <>
              <img
                src={activeBanner.image}
                alt={isArabic ? activeBanner.titleAr : activeBanner.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Gradient overlays for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
              <div className={`absolute inset-0 bg-gradient-to-r ${isArabic ? 'from-black/60 via-transparent to-transparent' : 'from-transparent via-transparent to-black/60'}`} />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-l from-teal-700 via-cyan-600 to-teal-500" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              {activeBanner?.subtitle && (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  {isArabic ? activeBanner.subtitleAr || activeBanner.subtitle : activeBanner.subtitle}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight drop-shadow-xl">
                {activeBanner
                  ? (isArabic ? activeBanner.titleAr : activeBanner.title)
                  : defaultBanner.title}
              </h1>
              {activeBanner?.buttonText && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  {activeBanner.link ? (
                    <a href={activeBanner.link} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-7 py-5 text-base rounded-xl shadow-2xl transition-all gap-2">
                        {isArabic ? activeBanner.buttonTextAr || activeBanner.buttonText : activeBanner.buttonText}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  ) : (
                    <a href="#products">
                      <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-7 py-5 text-base rounded-xl shadow-2xl transition-all">
                        {isArabic ? activeBanner.buttonTextAr || activeBanner.buttonText : activeBanner.buttonText}
                      </Button>
                    </a>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 border border-white/10 ${isArabic ? 'right-3 md:right-5' : 'left-3 md:left-5'}`}
          >
            {isArabic ? <ChevronRight className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button
            onClick={next}
            className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 border border-white/10 ${isArabic ? 'left-3 md:left-5' : 'right-3 md:right-5'}`}
          >
            {isArabic ? <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </>
      )}

      {/* Dots + Progress */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === current
                    ? 'w-7 h-2.5 bg-white shadow-lg'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          {/* Progress bar */}
          <div className="w-20 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              key={current}
              initial={{ width: '0%' }}
              animate={{ width: isPaused ? undefined : '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-white/70 rounded-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SINGLE BANNER CARD - Used for horizontal and vertical banners
// ============================================================
function BannerCard({
  banner,
  variant = 'horizontal',
  isArabic,
}: {
  banner: Banner;
  variant: 'horizontal' | 'vertical';
  isArabic: boolean;
}) {
  const title = isArabic ? banner.titleAr : banner.title;
  const subtitle = isArabic ? (banner.subtitleAr || banner.subtitle) : banner.subtitle;
  const buttonText = isArabic ? (banner.buttonTextAr || banner.buttonText) : banner.buttonText;

  const isVertical = variant === 'vertical';

  return (
    <motion.a
      href={banner.link || '#products'}
      target={banner.link ? '_blank' : undefined}
      rel={banner.link ? 'noopener noreferrer' : undefined}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl shadow-lg group block cursor-pointer ${
        isVertical
          ? 'h-[280px] md:h-[400px] lg:h-[480px]'
          : 'h-[180px] md:h-[220px] lg:h-[260px]'
      }`}
    >
      {/* Image - auto-resizes to fill container */}
      <img
        src={banner.image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 ${
        isVertical
          ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent'
          : 'bg-gradient-to-r from-black/70 via-black/40 to-transparent'
      }`} />

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-end p-5 md:p-6 ${isVertical ? 'items-center text-center' : ''}`}>
        {subtitle && (
          <span className={`inline-flex self-start items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-white/10 ${isVertical ? 'self-center' : ''}`}>
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            {subtitle}
          </span>
        )}
        <h3 className={`text-white font-bold drop-shadow-lg mb-2 leading-snug ${
          isVertical ? 'text-lg md:text-xl' : 'text-base md:text-lg lg:text-xl'
        }`}>
          {title}
        </h3>
        {buttonText && (
          <span className={`inline-flex items-center gap-1.5 bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg text-xs md:text-sm shadow-lg transition-all group-hover:shadow-xl group-hover:scale-105 self-start ${isVertical ? 'self-center mt-1' : ''}`}>
            {buttonText}
            <ArrowLeft className={`w-3.5 h-3.5 transition-transform group-hover:${isArabic ? 'translate-x-1' : '-translate-x-1'}`} />
          </span>
        )}
      </div>
    </motion.a>
  );
}

// ============================================================
// PROMO BANNERS SECTION - Grid of horizontal + vertical banners
// ============================================================
export function PromoBannersSection() {
  const [horizontalBanners, setHorizontalBanners] = useState<Banner[]>([]);
  const [verticalBanners, setVerticalBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.data) {
          const promoBanners = data.data.filter((b: Banner) => b.active);
          setHorizontalBanners(
            promoBanners
              .filter((b: Banner) => b.type === 'horizontal')
              .sort((a: Banner, b: Banner) => a.order - b.order)
          );
          setVerticalBanners(
            promoBanners
              .filter((b: Banner) => b.type === 'vertical')
              .sort((a: Banner, b: Banner) => a.order - b.order)
          );
        }
      } catch (error) {
        console.error('Error fetching promo banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[220px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-[280px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Show default banners if none exist
  const hasAny = horizontalBanners.length > 0 || verticalBanners.length > 0;
  if (!hasAny) return null;

  return (
    <div className="container mx-auto px-4 py-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Horizontal Banner */}
        {horizontalBanners.length > 0 && (
          <div className="lg:col-span-2">
            <BannerCard
              banner={horizontalBanners[0]}
              variant="horizontal"
              isArabic={isArabic}
            />
          </div>
        )}

        {/* Vertical Banner */}
        {verticalBanners.length > 0 && (
          <div className="lg:col-span-1">
            <BannerCard
              banner={verticalBanners[0]}
              variant="vertical"
              isArabic={isArabic}
            />
          </div>
        )}

        {/* If no horizontal but have vertical, show vertical as full width */}
        {horizontalBanners.length === 0 && verticalBanners.length > 0 && (
          <div className="lg:col-span-2">
            <BannerCard
              banner={verticalBanners[0]}
              variant="horizontal"
              isArabic={isArabic}
            />
          </div>
        )}

        {/* If no vertical but have horizontal, show horizontal as full width */}
        {verticalBanners.length === 0 && horizontalBanners.length > 0 && (
          <div className="lg:col-span-1">
            <BannerCard
              banner={horizontalBanners[1] || horizontalBanners[0]}
              variant="vertical"
              isArabic={isArabic}
            />
          </div>
        )}

        {/* Additional banners row */}
        {horizontalBanners.length > 1 && (
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {horizontalBanners.slice(1).map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                variant="horizontal"
                isArabic={isArabic}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
