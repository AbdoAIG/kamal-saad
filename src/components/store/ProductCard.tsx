'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Zap } from 'lucide-react';
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
  const { language, isFavorite, toggleFavorite } = useStore();

  const isArabic = language === 'ar';
  const isProductFavorite = isFavorite(product.id);
  const images = JSON.parse(product.images || '[]');
  const mainImage = images[0] || 'https://via.placeholder.com/300';
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
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse" />
            )}
            
            <motion.img
              src={mainImage}
              alt={productName}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className={`absolute top-3 flex flex-col gap-2 ${isArabic ? 'right-3' : 'left-3'}`}>
              {hasDiscount && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                >
                  -{discountPercent}%
                </motion.div>
              )}
              {product.featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                >
                  ⭐
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              className="absolute bottom-3 left-3 right-3 flex gap-2"
            >
              <Button
                size="sm"
                className="flex-1 bg-white/95 hover:bg-white text-gray-900 font-bold rounded-xl h-10 shadow-lg backdrop-blur-sm dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {t('addToCart', language)}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl h-10 shadow-lg"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4 mr-1" />
                {t('buyNow', language)}
              </Button>
            </motion.div>

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={`absolute top-3 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                isArabic ? 'left-3' : 'right-3'
              } ${
                isProductFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-white' : ''}`} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category */}
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1.5">
              {categoryName || (isArabic ? 'عام' : 'General')}
            </p>

            {/* Title */}
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-relaxed min-h-[48px] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
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
                        : 'text-gray-200 fill-gray-200 dark:text-gray-600 dark:fill-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({product.reviewsCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{currency}</span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                    {product.price}
                  </span>
                )}
              </div>

              {product.stock < 10 && product.stock > 0 && (
                <span className="text-xs text-orange-500 font-medium">
                  {t('onlyLeft', language)} {product.stock}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
