'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useStore, t } from '@/store/useStore';
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
  const hasMultipleImages = images.length > 1;
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
      <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden">
            {/* Product Image */}
            {!imageError && mainImage ? (
              <img
                src={mainImage}
                alt={productName}
                className={`w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}

            {/* Featured / Discount badge - top left */}
            {product.featured && (
              <div className={`absolute top-3 ${isArabic ? 'right-3' : 'left-3'} bg-[#f5f5f5] text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide uppercase`}>
                {isArabic ? 'مميز' : 'Featured'}
              </div>
            )}

            {/* Heart - top right */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-200 z-20 ${
                isProductFavorite
                  ? 'text-red-500'
                  : 'text-gray-300 hover:text-red-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${isProductFavorite ? 'fill-red-500' : ''}`} />
            </motion.button>
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2 hover:text-gray-600 transition-colors">
              {productName}
            </h3>
          </Link>

          {/* Category + Reviews */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">
              {categoryName || (isArabic ? 'عام' : 'General')}
            </span>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-400">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">
              {product.reviewsCount} {isArabic ? 'تقييم' : 'reviews'}
            </span>
          </div>

          {/* Price Row */}
          <div className={`flex items-center gap-2 flex-wrap mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg font-bold text-gray-800">
              {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">{currency}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-400 line-through">{product.price.toFixed(2)}</span>
                <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              className={`flex-1 h-10 border border-gray-200 text-gray-600 bg-transparent hover:bg-gray-50 hover:border-gray-300 rounded-lg text-xs font-medium transition-all ${
                isArabic ? 'pl-3' : 'pr-3'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/product/${product.id}`);
              }}
            >
              {isArabic ? 'التفاصيل' : 'Details'}
            </Button>
            <Button
              className={`flex-1 h-10 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                isArabic ? 'pr-3' : 'pl-3'
              }`}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{t('addToCart', language)}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
