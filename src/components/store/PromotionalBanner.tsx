'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag } from 'lucide-react';
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
  buttonStyle: string;
  section: string;
  size: string;
  active: boolean;
  order: number;
}

// ============================================================
// Button styles
// ============================================================
function BannerButton({ text, style, href }: { text: string; style: string; href: string }) {
  const isExternal = href.startsWith('http');
  const baseClass = "font-bold rounded-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-sm md:text-base px-5 md:px-7 py-3 md:py-4 inline-flex items-center gap-2";

  const styles: Record<string, string> = {
    white: `${baseClass} bg-white text-gray-900 hover:bg-gray-100`,
    orange: `${baseClass} bg-orange-500 text-white hover:bg-orange-600`,
    green: `${baseClass} bg-emerald-500 text-white hover:bg-emerald-600`,
    teal: `${baseClass} bg-teal-500 text-white hover:bg-teal-600`,
    red: `${baseClass} bg-red-500 text-white hover:bg-red-600`,
    gradient: `${baseClass} bg-gradient-to-l from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600`,
    outline: `${baseClass} bg-transparent border-2 border-white text-white hover:bg-white/10`,
  };

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        <span className={styles[style] || styles.white}>
          {text}
          <ExternalLink className="w-4 h-4" />
        </span>
      </a>
    );
  }

  return (
    <a href={href}>
      <span className={styles[style] || styles.white}>
        {text}
        <ShoppingBag className="w-4 h-4" />
      </span>
    </a>
  );
}

// ============================================================
// HERO BANNER SLIDER
// ============================================================
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  if (banners.length === 0) return null;

  const active = banners[current];
  const title = isArabic ? active.titleAr : active.title;
  const subtitle = isArabic ? (active.subtitleAr || active.subtitle) : active.subtitle;
  const btnText = isArabic ? (active.buttonTextAr || active.buttonText) : active.buttonText;
  const btnLink = active.link || '#products';

  return (
    <div
      className="relative w-full h-[260px] md:h-[380px] lg:h-[460px] overflow-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img src={active.image} alt={title} className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
          <div className={`absolute inset-0 bg-gradient-to-r ${isArabic ? 'from-black/60 via-transparent to-transparent' : 'from-transparent via-transparent to-black/60'}`} />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center z-10">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="max-w-2xl"
            >
              {subtitle && (
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-3 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  {subtitle}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-5 leading-tight drop-shadow-xl">
                {title}
              </h1>
              {btnText && <BannerButton text={btnText} style={active.buttonStyle || 'white'} href={btnLink} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => setCurrent((p) => (p - 1 + banners.length) % banners.length)}
            className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'right-3 md:right-5' : 'left-3 md:left-5'}`}>
            {isArabic ? <ChevronRight className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button onClick={() => setCurrent((p) => (p + 1) % banners.length)}
            className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'left-3 md:left-5' : 'right-3 md:right-5'}`}>
            {isArabic ? <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`transition-all duration-300 rounded-full ${i === current ? 'w-7 h-2.5 bg-white shadow-lg' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
            {!isPaused && (
              <div className="w-20 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div key={current} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-white/70 rounded-full" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PROMO BANNER CARD - Individual banner in a grid
// ============================================================
function PromoBannerCard({ banner, isArabic, heightClass }: { banner: Banner; isArabic: boolean; heightClass: string }) {
  const title = isArabic ? banner.titleAr : banner.title;
  const subtitle = isArabic ? (banner.subtitleAr || banner.subtitle) : banner.subtitle;
  const btnText = isArabic ? (banner.buttonTextAr || banner.buttonText) : banner.buttonText;
  const btnLink = banner.link || '#products';
  const isVertical = banner.size === 'small';

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer ${heightClass}`}
      onClick={() => { window.location.href = btnLink; }}
    >
      <img src={banner.image} alt={title} className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" />
      <div className={`absolute inset-0 ${isVertical ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent' : 'bg-gradient-to-r from-black/65 via-black/35 to-transparent'}`} />

      <div className={`absolute inset-0 flex flex-col justify-end p-4 md:p-5 lg:p-6 ${isVertical ? 'items-center text-center' : ''}`}>
        {subtitle && (
          <span className={`inline-flex self-start items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold mb-2 border border-white/10 ${isVertical ? 'self-center' : ''}`}>
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            {subtitle}
          </span>
        )}
        <h3 className={`text-white font-bold drop-shadow-lg leading-snug ${isVertical ? 'text-base md:text-lg lg:text-xl' : 'text-sm md:text-lg lg:text-xl'}`}>
          {title}
        </h3>
        {btnText && (
          <div className="mt-2.5">
            <BannerButton text={btnText} style={banner.buttonStyle || 'white'} href={btnLink} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// PROMO SECTION - Renders a group of promo banners in grid
// ============================================================
function PromoSection({ banners, isArabic }: { banners: Banner[]; isArabic: boolean }) {
  if (banners.length === 0) return null;

  const large = banners.filter(b => b.size === 'large');
  const small = banners.filter(b => b.size === 'small');
  const full = banners.filter(b => b.size === 'full');
  const half = banners.filter(b => b.size === 'half');

  // Layout logic based on banner sizes
  if (full.length > 0) {
    return (
      <div className="space-y-4">
        {full.map(b => (
          <PromoBannerCard key={b.id} banner={b} isArabic={isArabic} heightClass="h-[180px] md:h-[220px] lg:h-[260px]" />
        ))}
        {large.length > 0 && small.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PromoBannerCard banner={large[0]} isArabic={isArabic} heightClass="h-[200px] md:h-[240px]" />
            </div>
            <div>
              <PromoBannerCard banner={small[0]} isArabic={isArabic} heightClass="h-[200px] md:h-[240px]" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (large.length > 0 || small.length > 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {large.map(b => (
          <div key={b.id} className="lg:col-span-2">
            <PromoBannerCard banner={b} isArabic={isArabic} heightClass="h-[180px] md:h-[220px] lg:h-[260px]" />
          </div>
        ))}
        {small.map(b => (
          <div key={b.id}>
            <PromoBannerCard banner={b} isArabic={isArabic} heightClass="h-[200px] md:h-[260px] lg:h-[260px]" />
          </div>
        ))}
      </div>
    );
  }

  if (half.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {half.map(b => (
          <PromoBannerCard key={b.id} banner={b} isArabic={isArabic} heightClass="h-[180px] md:h-[220px]" />
        ))}
      </div>
    );
  }

  // Fallback: treat all as full width
  return (
    <div className="space-y-4">
      {banners.map(b => (
        <PromoBannerCard key={b.id} banner={b} isArabic={isArabic} heightClass="h-[180px] md:h-[220px] lg:h-[260px]" />
      ))}
    </div>
  );
}

// ============================================================
// MAIN BANNERS COMPONENT - Fetches & renders all banners
// ============================================================
export function BannerSections() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.data) setBanners(data.data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const heroBanners = banners.filter(b => b.section === 'hero').sort((a, b) => a.order - b.order);
  const belowCatBanners = banners.filter(b => b.section === 'below-categories').sort((a, b) => a.order - b.order);
  const betweenProductsBanners = banners.filter(b => b.section === 'between-products').sort((a, b) => a.order - b.order);
  const aboveFooterBanners = banners.filter(b => b.section === 'above-footer').sort((a, b) => a.order - b.order);

  // Loading skeleton
  if (loading) {
    return (
      <>
        <div className="w-full h-[260px] md:h-[380px] bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-[200px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-[200px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  if (banners.length === 0) return null;

  return (
    <>
      {/* Hero Section */}
      {heroBanners.length > 0 && <HeroBanner banners={heroBanners} />}

      {/* Below Categories Section */}
      {belowCatBanners.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={belowCatBanners} isArabic={isArabic} />
        </div>
      )}

      {/* Between Products Section */}
      {betweenProductsBanners.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={betweenProductsBanners} isArabic={isArabic} />
        </div>
      )}

      {/* Above Footer Section */}
      {aboveFooterBanners.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={aboveFooterBanners} isArabic={isArabic} />
        </div>
      )}
    </>
  );
}
