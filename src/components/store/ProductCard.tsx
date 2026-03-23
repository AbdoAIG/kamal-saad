'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Zap, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product, useStore, t } from '@/store/useStore';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { language, isFavorite, toggleFavorite } = useStore();

  const isArabic = language === 'ar';
  const isProductFavorite = isFavorite(product.id);
  
  // Parse images safely with error handling
  let images: string[] = [];
  try {
    images = typeof product.images === 'string' 
      ? JSON.parse(product.images || '[]') 
      : (Array.isArray(product.images) ? product.images : []);
  } catch (e) {
    console.error('Error parsing product images:', e);
    images = [];
  }
  
  const hasMultipleImages = images.length > 1;
  const mainImage = images[0] || '/placeholder-product.png';
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  const productName = isArabic ? product.nameAr : product.name;
  const categoryName = isArabic ? product.category?.nameAr : product.category?.name;
  const currency = t('currency', language);

  // Auto-slide images on hover
  useEffect(() => {
    if (isHovered && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500); // Change image every 1.5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0); // Reset to first image when not hovering
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, hasMultipleImages, images.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    router.push('/checkout');
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-white dark:bg-gray-800 p-3">
            {/* Loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-3 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
            )}
            
            {/* Product Image with smooth transition */}
            {!imageError ? (
              <div className="relative w-full h-full">
                {images.map((img, idx) => (
                  <motion.img
                    key={idx}
                    src={img}
                    alt={`${productName} - ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-contain p-2"
                    onLoad={() => idx === 0 && setImageLoaded(true)}
                    onError={() => {
                      if (idx === 0) {
                        setImageError(true);
                        setImageLoaded(true);
                      }
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: currentImageIndex === idx ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ zIndex: currentImageIndex === idx ? 1 : 0 }}
                  />
                ))}
              </div>
            ) : (
              <div className="absolute inset-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl">
                <Package className="h-16 w-16 text-gray-300 dark:text-gray-500" />
              </div>
            )}

            {/* Image indicators for multiple images */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentImageIndex === idx 
                        ? 'w-4 bg-teal-500' 
                        : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Discount Badge */}
            {hasDiscount && (
              <div className={`absolute top-3 bg-gradient-to-r from-red-500 to-rose-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg z-10 ${isArabic ? 'right-3' : 'left-3'}`}>
                -{discountPercent}%
              </div>
            )}

            {/* Featured Badge */}
            {product.featured && (
              <div className={`absolute top-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg z-10 ${isArabic ? 'left-3' : 'right-3'}`}>
                ⭐
              </div>
            )}

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`absolute top-3 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg z-20 ${
                isArabic ? 'left-3' : 'right-3'
              } ${
                isProductFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500'
              }`}
              style={{ top: hasDiscount && product.featured ? '3.5rem' : '0.75rem' }}
            >
              <Heart className={`h-4 w-4 ${isProductFavorite ? 'fill-white' : ''}`} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
            {/* Category */}
            <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">
              {categoryName || (isArabic ? 'عام' : 'General')}
            </p>

            {/* Title */}
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug min-h-[40px] text-sm">
              {productName}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                ({product.reviewsCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{currency}</span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {product.price}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons - Always Visible */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-10 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold shadow-sm"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {t('addToCart', language)}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-10 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4 mr-1" />
                {isArabic ? 'اشتري الآن' : 'Buy Now'}
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
