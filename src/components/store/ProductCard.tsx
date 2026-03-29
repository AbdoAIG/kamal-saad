'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useStore, t } from '@/store/useStore';
import { optimizeImage, ImagePresets } from '@/lib/image-utils';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { language, isFavorite, toggleFavorite } = useStore();

  const isArabic = language === 'ar';
  const isProductFavorite = isFavorite(product.id);

  let images: string[] = [];
  try {
    images = typeof product.images === 'string' 
      ? JSON.parse(product.images || '[]') 
      : (Array.isArray(product.images) ? product.images : []);
  } catch (e) {
    images = [];
  }
  
  const mainImage = images[0] || '';
  const optimizedImage = optimizeImage(mainImage, ImagePresets.productCard);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  const productName = isArabic ? product.nameAr : product.name;
  const categoryName = isArabic ? product.category?.nameAr : product.category?.name;
  const currency = t('currency', language);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-square bg-[#f8f8f8] dark:bg-gray-700 overflow-hidden">
            {/* Product Image */}
            {!imageError && mainImage ? (
              <Image
                src={optimizedImage}
                alt={productName}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className={`object-contain p-6 transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => { setImageError(true); setImageLoaded(true); }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}

            {/* Loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 animate-pulse" />
            )}

            {/* Featured / Discount badge - top left */}
            {product.featured && (
              <div className={`absolute top-3 ${isArabic ? 'right-3' : 'left-3'} bg-[#f5f5f5] dark:bg-gray-700 dark:text-gray-300 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide uppercase`}>
                {isArabic ? 'مميز' : 'Featured'}
              </div>
            )}

            {/* Discount badge - top center */}
            {hasDiscount && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                -{discountPercent}%
              </div>
            )}

            {/* Heart - top right - More prominent */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 z-20 shadow-md ${
                isProductFavorite
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500 shadow-red-200'
                  : 'bg-white/90 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-gray-200'
              }`}
            >
              <Heart className={`h-5 w-5 transition-all ${isProductFavorite ? 'fill-red-500' : ''}`} />
            </motion.button>
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <Link href={`/product/${product.id}`}>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug mb-1.5 line-clamp-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {productName}
            </h3>
          </Link>

          {/* Category + Reviews */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {categoryName || (isArabic ? 'عام' : 'General')}
            </span>
            <span className="text-gray-200 dark:text-gray-600">·</span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-400 dark:text-gray-500">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-200 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {product.reviewsCount} {isArabic ? 'تقييم' : 'reviews'}
            </span>
          </div>

          {/* Price Row - More prominent */}
          <div className={`flex items-center gap-2 flex-wrap mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
              {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{currency}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{product.price.toFixed(2)}</span>
              </>
            )}
          </div>

          {/* Action Buttons - Desktop: side by side, Mobile: stacked */}
          <div className={`flex flex-col-reverse sm:flex-row gap-2 ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
            {/* Add to Cart - Orange */}
            <Button
              className={`flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-2 border-orange-500 hover:border-orange-600 ${
                isArabic ? 'pl-3' : 'pr-3'
              }`}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{t('addToCart', language)}</span>
            </Button>
            {/* Buy Now - Green */}
            <Button
              className={`flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-2 border-emerald-500 hover:border-emerald-600 shadow-sm shadow-emerald-200 ${
                isArabic ? 'pr-3' : 'pl-3'
              }`}
              onClick={handleBuyNow}
            >
              <Zap className="h-4 w-4" />
              <span>{isArabic ? 'اشتري الان' : 'Buy Now'}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
