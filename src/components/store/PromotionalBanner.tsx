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

  const style: React.CSSProperties = { position: 'relative', width: '100%', overflow: 'hidden' };
  if (h > 0) { style.height = `${h}px`; }
  else { style.minHeight = '200px'; style.maxHeight = '460px'; }

  return (
    <div style={style} dir={isArabic ? 'rtl' : 'ltr'} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <AnimatePresence mode="wait">
        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
          <Image src={b.image} alt={isArabic ? b.titleAr : b.title} fill sizes="100vw" className="object-cover object-center" priority={current === 0} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
        </motion.div>
      </AnimatePresence>
      <Hotspot banner={b} />
      {banners.length > 1 && (
        <>
          <button onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)} className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'right-3 md:right-5' : 'left-3 md:left-5'}`}>
            {isArabic ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button onClick={() => setCurrent(p => (p + 1) % banners.length)} className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2.5 rounded-full transition-all hover:scale-110 border border-white/10 ${isArabic ? 'left-3 md:left-5' : 'right-3 md:right-5'}`}>
            {isArabic ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`} />
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
  const [imgError, setImgError] = useState(false);
  const h = banner.height > 0 ? banner.height : 220;

  return (
    <motion.div whileHover={{ scale: 1.01, y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-2xl shadow-lg group bg-gray-100" style={{ height: `${h}px` }}>
      {!imgError ? (
        <Image src={banner.image} alt={isArabic ? banner.titleAr : banner.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]" quality={85} onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="text-center text-gray-500"><div className="text-3xl mb-1">🖼️</div><p className="text-xs">صورة غير متوفرة</p></div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <Hotspot banner={banner} />
    </motion.div>
  );
}

// ============================================================
// PROMO SECTION (grid of cards)
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
      if (d.success) setBanners(d.data.filter((b: Banner) => b.section === 'hero').sort((a: Banner, b: Banner) => a.order - b.order));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full h-[260px] bg-gray-200 dark:bg-gray-800 animate-pulse" />;
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
      if (d.success) setBanners(d.data.filter((b: Banner) => b.section === 'below-categories').sort((a: Banner, b: Banner) => a.order - b.order));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full h-[100px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
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
      if (d.success) setBanners(d.data.filter((b: Banner) => b.section === 'between-products').sort((a: Banner, b: Banner) => a.order - b.order));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full h-[100px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
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
      if (d.success) setBanners(d.data.filter((b: Banner) => b.section === 'above-footer').sort((a: Banner, b: Banner) => a.order - b.order));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="w-full h-[100px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mx-auto max-w-7xl px-4 mt-5" />;
  if (banners.length === 0) return null;
  return (
    <div className="container mx-auto px-4 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
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
