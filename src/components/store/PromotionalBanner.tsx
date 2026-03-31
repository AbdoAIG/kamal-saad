'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface Banner {
  id: string;
  title: string; titleAr: string;
  subtitle: string | null; subtitleAr: string | null;
  image: string; link: string | null;
  section: string;
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  hotspotW: number;
  hotspotH: number;
  active: boolean; order: number;
}

// ============================================================
// HOTSPOT
// ============================================================
function Hotspot({ banner }: { banner: Banner }) {
  const { hotspotX, hotspotY, hotspotW, hotspotH, link } = banner;
  if (!hotspotW || !hotspotH || !link) return null;

  const handleClick = () => {
    if (link.startsWith('http')) window.open(link, '_blank', 'noopener,noreferrer');
    else window.location.href = link;
  };

  return (
    <div
      style={{
        position: 'absolute', left: `${hotspotX}%`, top: `${hotspotY}%`,
        width: `${hotspotW}%`, height: `${hotspotH}%`,
        cursor: 'pointer', zIndex: 20, borderRadius: '8px',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    />
  );
}

// ============================================================
// HERO SLIDER - Shows full banner without cropping
// ============================================================
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageHeight, setImageHeight] = useState<Record<string, number>>({});
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const i = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(i);
  }, [isPaused, banners.length]);

  if (banners.length === 0) return null;
  const b = banners[current];

  // Use natural image aspect ratio or default
  const aspectRatio = b.width && b.height ? b.width / b.height : 16 / 9;

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'} 
      onMouseEnter={() => setIsPaused(true)} 
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full bg-gray-100 dark:bg-gray-800"
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key={b.id} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.6 }} 
          className="relative w-full"
          style={{ aspectRatio: aspectRatio }}
        >
          <Image 
            src={b.image} 
            alt={isArabic ? b.titleAr : b.title} 
            fill 
            sizes="100vw" 
            className="object-contain" 
            priority={current === 0}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setImageHeight(prev => ({
                ...prev,
                [b.id]: img.naturalHeight
              }));
            }}
          />
        </motion.div>
      </AnimatePresence>
      <Hotspot banner={b} />
      {banners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)} 
            className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-700 p-2 md:p-3 rounded-full transition-all hover:scale-110 shadow-lg ${isArabic ? 'right-3 md:right-5' : 'left-3 md:left-5'}`}
          >
            {isArabic ? <ChevronRight className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button 
            onClick={() => setCurrent(p => (p + 1) % banners.length)} 
            className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-700 p-2 md:p-3 rounded-full transition-all hover:scale-110 shadow-lg ${isArabic ? 'left-3 md:left-5' : 'right-3 md:right-5'}`}
          >
            {isArabic ? <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {banners.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrent(i)} 
                className={`transition-all rounded-full ${i === current ? 'w-6 h-2.5 bg-white shadow-md' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'}`} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PROMO CARD - Shows full image without cropping
// ============================================================
function PromoCard({ banner, isArabic }: { banner: Banner; isArabic: boolean }) {
  const [imgError, setImgError] = useState(false);
  
  // Calculate aspect ratio from stored dimensions
  const aspectRatio = banner.width && banner.height 
    ? banner.width / banner.height 
    : 16 / 9;

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -3 }} 
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-2xl shadow-lg group bg-gray-100 dark:bg-gray-800"
      style={{ aspectRatio: aspectRatio }}
    >
      {!imgError ? (
        <Image 
          src={banner.image} 
          alt={isArabic ? banner.titleAr : banner.title} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
          className="object-contain" 
          quality={90} 
          onError={() => setImgError(true)} 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-3xl mb-1">🖼️</div>
            <p className="text-xs">صورة غير متوفرة</p>
          </div>
        </div>
      )}
      <Hotspot banner={banner} />
    </motion.div>
  );
}

// ============================================================
// PROMO SECTION (grid of cards)
// ============================================================
function PromoSection({ banners, isArabic }: { banners: Banner[]; isArabic: boolean }) {
  if (banners.length === 0) return null;
  
  // Responsive grid based on number of banners
  const gridClass = banners.length === 1 
    ? 'grid-cols-1' 
    : banners.length === 2 
      ? 'grid-cols-1 sm:grid-cols-2' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  
  return (
    <div className={`grid ${gridClass} gap-3 md:gap-4`}>
      {banners.map(b => <PromoCard key={b.id} banner={b} isArabic={isArabic} />)}
    </div>
  );
}

// ============================================================
// INDIVIDUAL SECTION RENDERERS
// These are exported so page.tsx can place them at the correct
// positions within the layout (between categories, between products, etc.)
// ============================================================

/** Renders hero banners only. Place at the very top of the page. */
export function HeroBannerSection() {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => {
      if (d.success) setBanners(
        d.data
          .filter((b: Banner) => b.section === 'hero' && b.active !== false)
          .sort((a: Banner, b: Banner) => a.order - b.order)
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-gray-800 animate-pulse" />;
  if (banners.length === 0) return null;
  return <div dir={isArabic ? 'rtl' : 'ltr'}><HeroBanner banners={banners} /></div>;
}

/** Renders below-categories banners. Place AFTER the categories section. */
export function BelowCategoriesBannerSection() {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => {
      if (d.success) setBanners(
        d.data
          .filter((b: Banner) => b.section === 'below-categories' && b.active !== false)
          .sort((a: Banner, b: Banner) => a.order - b.order)
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full aspect-[3/1] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-4 md:py-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <PromoSection banners={banners} isArabic={isArabic} />
    </div>
  );
}

/** Renders between-products banners. Place AFTER the products section. */
export function BetweenProductsBannerSection() {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => {
      if (d.success) setBanners(
        d.data
          .filter((b: Banner) => b.section === 'between-products' && b.active !== false)
          .sort((a: Banner, b: Banner) => a.order - b.order)
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full aspect-[3/1] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-4 md:py-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <PromoSection banners={banners} isArabic={isArabic} />
    </div>
  );
}

/** Renders above-footer banners. Place BEFORE the footer. */
export function AboveFooterBannerSection() {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => {
      if (d.success) setBanners(
        d.data
          .filter((b: Banner) => b.section === 'above-footer' && b.active !== false)
          .sort((a: Banner, b: Banner) => a.order - b.order)
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full aspect-[3/1] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-4 md:py-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <PromoSection banners={banners} isArabic={isArabic} />
    </div>
  );
}

// Keep the old export for backward compatibility (renders everything at once)
export function BannerSections() {
  return (
    <>
      <HeroBannerSection />
      <BelowCategoriesBannerSection />
      <BetweenProductsBannerSection />
      <AboveFooterBannerSection />
    </>
  );
}
