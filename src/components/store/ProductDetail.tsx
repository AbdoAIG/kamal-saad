'use client';

import { useState } from 'react';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductDetail({ product, open, onClose }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, toggleCart } = useStore();

  if (!product) return null;

  const images = JSON.parse(product.images || '[]');
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      toggleCart();
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0">
        <div className="grid lg:grid-cols-2">
          {/* Images Section */}
          <div className="bg-gray-50 p-6 lg:p-8">
            <div className="sticky top-0">
              {/* Main Image */}
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg mb-4"
              >
                <img
                  src={images[selectedImage] || 'https://via.placeholder.com/500'}
                  alt={product.nameAr}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <div className="absolute top-4 right-4 bg-gradient-to-l from-red-500 to-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                    خصم {discountPercent}%
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-gradient-to-l from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                    ⭐ مميز
                  </div>
                )}
              </motion.div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === idx
                          ? 'border-teal-500 shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 lg:p-8 space-y-6">
            {/* Category */}
            <p className="text-sm font-medium text-teal-600 bg-teal-50 inline-block px-3 py-1 rounded-full">
              {product.category?.nameAr || 'عام'}
            </p>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.nameAr}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-gray-900">{product.rating.toFixed(1)}</span>
              <span className="text-gray-500">({product.reviewsCount} تقييم)</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">{product.salesCount} مبيعة</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
              </span>
              <span className="text-xl text-gray-500">ر.س</span>
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  {product.price} ر.س
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.descriptionAr || product.description}
            </p>

            <Separator />

            {/* Quantity */}
            <div className="flex items-center gap-6">
              <span className="font-medium text-gray-700">الكمية:</span>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-white shadow-sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-white shadow-sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{product.stock}</span> متوفر في المخزون
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                className={`flex-1 h-14 rounded-xl text-lg font-bold transition-all duration-300 ${
                  addedToCart
                    ? 'bg-green-500 hover:bg-green-500'
                    : 'bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
                } text-white`}
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-5 w-5" />
                      تمت الإضافة!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      أضف للسلة
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`h-14 w-14 rounded-xl ${isFavorite ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, title: 'توصيل سريع', desc: 'خلال 24 ساعة' },
                { icon: Shield, title: 'ضمان الجودة', desc: 'منتجات أصلية' },
                { icon: RotateCcw, title: 'استرجاع سهل', desc: 'خلال 14 يوم' },
              ].map((feature, idx) => (
                <div key={idx} className="text-center p-3 bg-gray-50 rounded-xl">
                  <feature.icon className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                  <p className="text-xs font-medium text-gray-900">{feature.title}</p>
                  <p className="text-[10px] text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
