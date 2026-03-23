'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Zap, Package, Eye } from 'lucide-react';
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
  
  const mainImage = images[0] || '/placeholder-product.png';
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  const productName = isArabic ? product.nameAr : product.name;
  const categoryName = isArabic ? product.category?.nameAr : product.category?.name;
  const currency = t('currency', language);

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
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group relative overflow-hidden border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer">
          {/* Image Container - Enhanced */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4">
            {/* Loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-4 bg-gray-200 dark:bg-gray-600 animate-pulse rounded-xl" />
            )}
            
            {/* Product Image - object-contain to show full image */}
            {!imageError ? (
              <motion.img
                src={mainImage}
                alt={productName}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                style={{ opacity: imageLoaded ? 1 : 0 }}
              />
            ) : (
              <div className="absolute inset-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl">
                <Package className="h-16 w-16 text-gray-300 dark:text-gray-500" />
              </div>
            )}

            {/* Discount Badge */}
            {hasDiscount && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`absolute top-3 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${isArabic ? 'right-3' : 'left-3'}`}
              >
                -{discountPercent}%
              </motion.div>
            )}

            {/* Featured Badge */}
            {product.featured && (
              <motion.div
                initial={{ scale: 0, rotate: 10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1 }}
                className={`absolute top-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${isArabic ? 'left-3' : 'right-3'}`}
              >
                ⭐
              </motion.div>
            )}

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`absolute bottom-3 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg z-10 ${
                isArabic ? 'left-3' : 'right-3'
              } ${
                isProductFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white/95 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-white' : ''}`} />
            </motion.button>

            {/* Quick View Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-black/5 dark:bg-black/20 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <Eye className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {isArabic ? 'عرض التفاصيل' : 'View Details'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4 bg-white dark:bg-gray-800">
            {/* Category */}
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">
              {categoryName || (isArabic ? 'عام' : 'General')}
            </p>

            {/* Title */}
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug min-h-[44px] text-sm">
              {productName}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.floor(product.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({product.reviewsCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1.5">
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

              {product.stock < 10 && product.stock > 0 && (
                <span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                  {t('onlyLeft', language)} {product.stock}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9 rounded-xl border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {t('addToCart', language)}
              </Button>
              <Button
                size="sm"
                className="h-9 px-4 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
