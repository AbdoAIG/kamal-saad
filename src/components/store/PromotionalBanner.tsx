'use client';

import { useState, useEffect, useCallback } from 'react';
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
// HOTSPOT - Invisible clickable zone on the image
// ============================================================
function Hotspot({ banner }: { banner: Banner }) {
  const { hotspotX, hotspotY, hotspotW, hotspotH, link } = banner;
  if (!hotspotW || !hotspotH || !link) return null;

  const isExternal = link.startsWith('http');
  const handleClick = () => {
    if (isExternal) window.open(link, '_blank', 'noopener,noreferrer');
    else window.location.href = link;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${hotspotX}%`,
        top: `${hotspotY}%`,
        width: `${hotspotW}%`,
        height: `${hotspotH}%`,
        cursor: 'pointer',
        zIndex: 20,
        borderRadius: '8px',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    />
  );
}

// ============================================================
// HERO SLIDER
// ============================================================
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useStore();
  const isArabic = language === 'ar';

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const i = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(i);
  }, [isPaused, banners.length]);

  if (banners.length === 0) return null;
  const b = banners[current];
  const h = b.height > 0 ? b.height : 0;
  const w = b.width > 0 ? b.width : 0;

  return (
    <div
      className="relative w-full overflow-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        height: h > 0 ? `${h}px` : undefined,
        maxHeight: h > 0 ? undefined : '460px',
        minHeight: h > 0 ? undefined : '200px',
      }}
    >
      {/* Fallback: use class-based heights when no custom height */}
      <div className={`absolute inset-0 ${h === 0 ? 'h-[260px] sm:h-[340px] md:h-[380px] lg:h-[460px]' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={b.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Image - always covers the container */}
            <img
              src={b.image}
              alt={isArabic ? b.titleAr : b.title}
              className="w-full h-full object-cover object-center"
              loading={current === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
          </motion.div>
        </AnimatePresence>
      </div>

      <Hotspot banner={b} />

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)}
            className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'right-3 md:right-5' : 'left-3 md:left-5'}`}
          >
            {isArabic ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCurrent(p => (p + 1) % banners.length)}
            className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'left-3 md:left-5' : 'right-3 md:right-5'}`}
          >
            {isArabic ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PROMO CARD
// ============================================================
function PromoCard({ banner, isArabic }: { banner: Banner; isArabic: boolean }) {
  const h = banner.height > 0 ? banner.height : 220;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-2xl shadow-lg group"
      style={{ height: `${h}px` }}
    >
      <img
        src={banner.image}
        alt={isArabic ? banner.titleAr : banner.title}
        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <Hotspot banner={banner} />
    </motion.div>
  );
}

// ============================================================
// PROMO SECTION
// ============================================================
function PromoSection({ banners, isArabic }: { banners: Banner[]; isArabic: boolean }) {
  if (banners.length === 0) return null;
  const cols = banners.length === 1 ? 'grid-cols-1' : banners.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid ${cols} gap-4`}>
      {banners.map(b => <PromoCard key={b.id} banner={b} isArabic={isArabic} />)}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export function BannerSections() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useStore();
  const isArabic = language === 'ar';

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const heroBanners = banners.filter(b => b.section === 'hero').sort((a, b) => a.order - b.order);
  const belowCat = banners.filter(b => b.section === 'below-categories').sort((a, b) => a.order - b.order);
  const betweenProd = banners.filter(b => b.section === 'between-products').sort((a, b) => a.order - b.order);
  const aboveFooter = banners.filter(b => b.section === 'above-footer').sort((a, b) => a.order - b.order);

  if (loading) return <div className="w-full h-[260px] bg-gray-200 dark:bg-gray-800 animate-pulse" />;
  if (banners.length === 0) return null;

  return (
    <>
      {heroBanners.length > 0 && <HeroBanner banners={heroBanners} />}
      {belowCat.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={belowCat} isArabic={isArabic} />
        </div>
      )}
      {betweenProd.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={betweenProd} isArabic={isArabic} />
        </div>
      )}
      {aboveFooter.length > 0 && (
        <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
          <PromoSection banners={aboveFooter} isArabic={isArabic} />
        </div>
      )}
    </>
  );
}
