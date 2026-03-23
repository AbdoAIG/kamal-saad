'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isArabic: boolean;
  hasDiscount?: boolean;
  discountPercent?: number;
  featured?: boolean;
  language: 'ar' | 'en';
}

const t = (key: string, lang: 'ar' | 'en') => {
  const translations: Record<string, { ar: string; en: string }> = {
    discount: { ar: 'خصم', en: 'OFF' },
    featured: { ar: 'مميز', en: 'Featured' },
    clickToZoom: { ar: 'انقر للتكبير', en: 'Click to zoom' },
    image: { ar: 'صورة', en: 'Image' },
    of: { ar: 'من', en: 'of' },
  };
  return translations[key]?.[lang] || key;
};

export function ProductImageGallery({
  images,
  productName,
  isArabic,
  hasDiscount,
  discountPercent,
  featured,
  language,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Ensure images is an array
  const imageList = Array.isArray(images) && images.length > 0 
    ? images 
    : ['https://via.placeholder.com/500x500?text=No+Image'];

  // Reset zoom when changing images
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedImage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') {
          navigateImage('next');
        } else if (e.key === 'ArrowLeft') {
          navigateImage('prev');
        } else if (e.key === 'Escape') {
          setIsLightboxOpen(false);
        } else if (e.key === '+' || e.key === '=') {
          handleZoomIn();
        } else if (e.key === '-') {
          handleZoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, selectedImage, imageList.length]);

  const navigateImage = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setSelectedImage((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
    } else {
      setSelectedImage((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
    }
  }, [imageList.length]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) {
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const maxPan = (zoomLevel - 1) * 200;
      const newX = Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStart.x));
      const newY = Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStart.y));
      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`space-y-4 ${isArabic ? '' : 'lg:col-start-2'}`}
      >
        {/* Main Image Container */}
        <div className="relative group">
          {/* Main Image Frame */}
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
          >
            {/* Image with smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                src={imageList[selectedImage]}
                alt={`${productName} - ${t('image', language)} ${selectedImage + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </AnimatePresence>

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Zoom hint */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ZoomIn className="h-4 w-4" />
              {t('clickToZoom', language)}
            </motion.div>

            {/* Discount Badge */}
            {hasDiscount && discountPercent && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`absolute top-4 bg-gradient-to-l from-red-500 to-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm z-10 ${isArabic ? 'right-4' : 'left-4'}`}
              >
                {t('discount', language)} {discountPercent}%
              </motion.div>
            )}

            {/* Featured Badge */}
            {featured && (
              <motion.div
                initial={{ scale: 0, rotate: 10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className={`absolute top-4 bg-gradient-to-l from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm z-10 ${isArabic ? 'left-4' : 'right-4'}`}
              >
                ⭐ {t('featured', language)}
              </motion.div>
            )}

            {/* Navigation Arrows */}
            {imageList.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(isArabic ? 'next' : 'prev');
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 h-12 w-12 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 ${isArabic ? 'left-3' : 'right-3'}`}
                  aria-label={isArabic ? 'الصورة السابقة' : 'Previous image'}
                >
                  {isArabic ? <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" /> : <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-200" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(isArabic ? 'prev' : 'next');
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 h-12 w-12 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 ${isArabic ? 'right-3' : 'left-3'}`}
                  aria-label={isArabic ? 'الصورة التالية' : 'Next image'}
                >
                  {isArabic ? <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-200" /> : <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />}
                </motion.button>
              </>
            )}
          </div>

          {/* Image Counter */}
          {imageList.length > 1 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900/80 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-medium px-3 py-1 rounded-full z-10">
              {selectedImage + 1} / {imageList.length}
            </div>
          )}
        </div>

        {/* Thumbnails Gallery */}
        {imageList.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative pt-2"
          >
            <div className={`flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {imageList.map((img: string, idx: number) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImage === idx
                      ? 'border-teal-500 shadow-lg ring-2 ring-teal-200 dark:ring-teal-800 ring-offset-2 dark:ring-offset-gray-900'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 ring-2 ring-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${productName} - ${t('image', language)} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Active indicator */}
                  {selectedImage === idx && (
                    <motion.div
                      layoutId="activeThumbnail"
                      className="absolute inset-0 bg-teal-500/20"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Scroll indicators for mobile */}
            <div className="absolute top-0 bottom-2 left-0 w-8 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent pointer-events-none md:hidden" />
            <div className="absolute top-0 bottom-2 right-0 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none md:hidden" />
          </motion.div>
        )}
      </motion.div>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-black/95 border-none p-0 overflow-hidden flex flex-col">
          {/* Lightbox Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 flex items-center justify-between">
            <div className="text-white font-medium">
              {selectedImage + 1} {t('of', language)} {imageList.length}
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel === 1}
                  className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5 text-white" />
                </button>
                <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel === 3}
                  className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
              </div>
              
              {/* Reset zoom */}
              {zoomLevel > 1 && (
                <button
                  onClick={resetZoom}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Reset zoom"
                >
                  <RotateCw className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Close button */}
              <DialogClose className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="h-6 w-6 text-white" />
              </DialogClose>
            </div>
          </div>

          {/* Lightbox Image */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={imageList[selectedImage]}
                alt={`${productName} - ${t('image', language)} ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                }}
                draggable={false}
              />
            </AnimatePresence>
          </div>

          {/* Lightbox Navigation */}
          {imageList.length > 1 && (
            <>
              <button
                onClick={() => navigateImage(isArabic ? 'next' : 'prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors z-20"
                aria-label={isArabic ? 'الصورة التالية' : 'Previous image'}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={() => navigateImage(isArabic ? 'prev' : 'next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors z-20"
                aria-label={isArabic ? 'الصورة السابقة' : 'Next image'}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Lightbox Thumbnails */}
          {imageList.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className={`flex justify-center gap-2 overflow-x-auto max-w-full ${isArabic ? 'flex-row-reverse' : ''}`}>
                {imageList.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === idx
                        ? 'border-white shadow-lg'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
