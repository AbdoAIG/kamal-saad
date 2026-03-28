'use client';

import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Truck, Shield, RotateCcw, Check, Package } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product, useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface VariantOption {
  id: string;
  value: string;
  valueAr: string;
  colorCode?: string;
  image?: string;
}

interface Variant {
  id: string;
  name: string;
  nameAr: string;
  options: VariantOption[];
}

interface SKUValue {
  variantId: string;
  optionId: string;
  variant: { name: string; nameAr: string };
  option: { value: string; valueAr: string; colorCode?: string };
}

interface ProductSKU {
  id: string;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  stock: number;
  image?: string;
  isActive: boolean;
  values: SKUValue[];
}

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

  // Variant states
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skus, setSKUs] = useState<ProductSKU[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedSKU, setSelectedSKU] = useState<ProductSKU | null>(null);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Fetch variants when product changes
  useEffect(() => {
    if (product?.hasVariants && product.id) {
      fetchVariants();
    } else {
      setVariants([]);
      setSKUs([]);
      setSelectedOptions({});
      setSelectedSKU(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.hasVariants]);

  const fetchVariants = async () => {
    if (!product?.id) return;
    setVariantsLoading(true);
    try {
      // Fetch variants
      const variantsRes = await fetch(`/api/products/${product.id}/variants`);
      const variantsData = await variantsRes.json();
      if (variantsData.success) {
        setVariants(variantsData.data);
        
        // Set default selections (first option for each variant)
        const defaults: Record<string, string> = {};
        variantsData.data.forEach((v: Variant) => {
          if (v.options.length > 0) {
            defaults[v.id] = v.options[0].id;
          }
        });
        setSelectedOptions(defaults);
      }

      // Fetch SKUs
      const skusRes = await fetch(`/api/products/${product.id}/skus`);
      const skusData = await skusRes.json();
      if (skusData.success) {
        setSKUs(skusData.data);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setVariantsLoading(false);
    }
  };

  // Find matching SKU when options change
  useEffect(() => {
    if (variants.length === 0 || skus.length === 0) {
      setSelectedSKU(null);
      return;
    }

    // Find SKU that matches all selected options
    const matchingSKU = skus.find(sku => {
      return sku.values.every(v => selectedOptions[v.variantId] === v.optionId);
    });

    setSelectedSKU(matchingSKU || null);
  }, [selectedOptions, variants, skus]);

  // Reset quantity when SKU changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSKU]);

  if (!product) return null;

  const images = selectedSKU?.image 
    ? [selectedSKU.image, ...JSON.parse(product.images || '[]')]
    : JSON.parse(product.images || '[]');
  
  // Use SKU price if available, otherwise use product price
  const currentPrice = selectedSKU?.price ?? product.price;
  const currentDiscountPrice = selectedSKU?.discountPrice ?? product.discountPrice;
  const currentStock = selectedSKU?.stock ?? product.stock;
  
  const hasDiscount = currentDiscountPrice && currentDiscountPrice < currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentPrice - (currentDiscountPrice || 0)) / currentPrice) * 100)
    : 0;

  const handleOptionSelect = (variantId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variantId]: optionId
    }));
  };

  const handleAddToCart = () => {
    // If product has variants, must have selected SKU
    if (product.hasVariants && !selectedSKU) {
      alert('يرجى اختيار جميع الخيارات');
      return;
    }

    // Build SKU label from selected options
    let skuLabel = '';
    if (selectedSKU && selectedSKU.values) {
      skuLabel = selectedSKU.values.map(v => v.option.valueAr).join(' / ');
    }

    addItem(product, quantity, selectedSKU?.id, skuLabel);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      toggleCart();
      onClose();
    }, 1000);
  };

  // Check if all variants are selected
  const allVariantsSelected = variants.length === 0 || 
    variants.every(v => selectedOptions[v.id]);

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
                {(hasDiscount ? currentDiscountPrice : currentPrice)?.toFixed(2)}
              </span>
              <span className="text-xl text-gray-500">ج.م</span>
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  {currentPrice} ج.م
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.descriptionAr || product.description}
            </p>

            <Separator />

            {/* Variants Selection */}
            {product.hasVariants && (
              <div className="space-y-4">
                {variantsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                    <span className="mr-2 text-gray-500">جاري تحميل الخيارات...</span>
                  </div>
                ) : (
                  variants.map((variant) => (
                    <div key={variant.id} className="space-y-2">
                      <Label className="font-semibold text-gray-800">
                        {variant.nameAr}
                        <span className="text-gray-500 font-normal mr-1">
                          ({variant.name})
                        </span>
                      </Label>
                      
                      <div className="flex flex-wrap gap-2">
                        {variant.options.map((option) => {
                          const isSelected = selectedOptions[variant.id] === option.id;
                          
                          // For color variants, show color swatch
                          if (variant.name.toLowerCase() === 'color' && option.colorCode) {
                            return (
                              <button
                                key={option.id}
                                onClick={() => handleOptionSelect(variant.id, option.id)}
                                className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                                  isSelected 
                                    ? 'border-teal-500 ring-2 ring-teal-200' 
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                                title={option.valueAr}
                              >
                                <div 
                                  className="w-full h-full rounded-full"
                                  style={{ backgroundColor: option.colorCode }}
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          }
                          
                          // For other variants, show button
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleOptionSelect(variant.id, option.id)}
                              className={`px-4 py-2 rounded-xl border-2 transition-all font-medium ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              {option.valueAr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}

                {/* SKU Info */}
                {selectedSKU && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>رمز المنتج: {selectedSKU.sku}</span>
                      </div>
                      <Badge variant={selectedSKU.stock > 0 ? 'default' : 'destructive'}>
                        {selectedSKU.stock > 0 ? `${selectedSKU.stock} متوفر` : 'غير متوفر'}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Warning if not all variants selected */}
                {!allVariantsSelected && variants.length > 0 && (
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm">
                    يرجى اختيار جميع الخيارات المتاحة
                  </div>
                )}
              </div>
            )}

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
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                <span className={`font-medium ${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentStock}
                </span>{' '}
                متوفر في المخزون
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
                disabled={addedToCart || (product.hasVariants && !selectedSKU) || currentStock === 0}
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
                  ) : currentStock === 0 ? (
                    <span>غير متوفر</span>
                  ) : product.hasVariants && !selectedSKU ? (
                    <span>اختر الخيارات أولاً</span>
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

// Simple Label component if not imported
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={`text-sm ${className}`}>{children}</label>;
}
