'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Share2, Minus, Plus, Truck, Shield, 
  RotateCcw, Check, ChevronRight, ChevronLeft, Package, Phone, Zap, 
  ZoomIn, ZoomOut, X, Menu, Facebook, Twitter, MessageCircle, Link2, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/store/ProductCard';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { ReviewsSection } from '@/components/store/ReviewsSection';
import { useStore, Product, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

// Variant interfaces
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

interface ProductWithCategory extends Product {
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
  variants?: Variant[];
  variantSKUs?: ProductSKU[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Variant states
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skus, setSKUs] = useState<ProductSKU[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedSKU, setSelectedSKU] = useState<ProductSKU | null>(null);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const { addItem, toggleCart, language, isFavorite: checkIsFavorite, toggleFavorite, user } = useStore();
  const isArabic = language === 'ar';
  const currency = t('currency', language);
  const [isProductFavorite, setIsProductFavorite] = useState(false);

  useEffect(() => {
    if (product) {
      setIsProductFavorite(checkIsFavorite(product.id));
    }
  }, [product, checkIsFavorite]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        // Handle both response formats: {data: product} or product directly
        const productData = data.data || data;
        setProduct(productData);

        // Set variants if available
        if (productData.variants) {
          setVariants(productData.variants);
          // Set default selections
          const defaults: Record<string, string> = {};
          productData.variants.forEach((v: Variant) => {
            if (v.options.length > 0) {
              defaults[v.id] = v.options[0].id;
            }
          });
          setSelectedOptions(defaults);
        }

        // Set SKUs if available
        if (productData.variantSKUs) {
          setSKUs(productData.variantSKUs);
        }

        const allProductsRes = await fetch('/api/products');
        const allProductsData = await allProductsRes.json();
        const allProducts = allProductsData.products || allProductsData;
        const related = allProducts
          .filter((p: Product) => p.categoryId === productData.categoryId && p.id !== productData.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  // Find matching SKU when options change
  useEffect(() => {
    if (variants.length === 0 || skus.length === 0) {
      setSelectedSKU(null);
      return;
    }

    const matchingSKU = skus.find(sku => {
      return sku.values.every(v => selectedOptions[v.variantId] === v.optionId);
    });

    setSelectedSKU(matchingSKU || null);
  }, [selectedOptions, variants, skus]);

  // Reset quantity when SKU changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSKU]);

  const handleOptionSelect = (variantId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variantId]: optionId
    }));
  };

  const handleAddToCart = () => {
    if (product) {
      // If product has variants, must have selected SKU
      if (product.hasVariants && !selectedSKU) {
        toast({
          title: isArabic ? 'اختر الخيارات' : 'Select Options',
          description: isArabic ? 'يرجى اختيار جميع الخيارات المتاحة' : 'Please select all available options',
          variant: 'destructive',
        });
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
      }, 1000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      // If product has variants, must have selected SKU
      if (product.hasVariants && !selectedSKU) {
        toast({
          title: isArabic ? 'اختر الخيارات' : 'Select Options',
          description: isArabic ? 'يرجى اختيار جميع الخيارات المتاحة' : 'Please select all available options',
          variant: 'destructive',
        });
        return;
      }

      let skuLabel = '';
      if (selectedSKU && selectedSKU.values) {
        skuLabel = selectedSKU.values.map(v => v.option.valueAr).join(' / ');
      }

      addItem(product, quantity, selectedSKU?.id, skuLabel);
      router.push('/checkout');
    }
  };

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product);
      setIsProductFavorite(!isProductFavorite);
    }
  };

  const handleAddRelatedToCart = (prod: Product) => {
    addItem(prod);
    toggleCart();
  };

  // Parse images - use SKU image if available
  const baseImages = product ? (Array.isArray(JSON.parse(product.images || '[]')) ? JSON.parse(product.images || '[]') : []) : [];
  const images = selectedSKU?.image 
    ? [selectedSKU.image, ...baseImages]
    : baseImages;

  // Use SKU price/stock if available
  const currentPrice = selectedSKU?.price ?? product?.price ?? 0;
  const currentDiscountPrice = selectedSKU?.discountPrice ?? product?.discountPrice;
  const currentStock = selectedSKU?.stock ?? product?.stock ?? 0;

  const hasDiscount = currentDiscountPrice && currentDiscountPrice < currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentPrice - (currentDiscountPrice || 0)) / currentPrice) * 100)
    : 0;

  const productName = product ? (isArabic ? product.nameAr : product.name) : '';
  const productDescription = product ? (isArabic ? (product.descriptionAr || product.description) : product.description) : '';
  const categoryName = product ? (isArabic ? product.category?.nameAr : product.category?.name) : '';

  // Check if all variants are selected
  const allVariantsSelected = variants.length === 0 || 
    variants.every(v => selectedOptions[v.id]);

  // Share handlers
  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${productId}` : '';
  const shareText = isArabic 
    ? `شوف هذا المنتج الرائع: ${productName}` 
    : `Check out this amazing product: ${productName}`;

  const shareHandlers = {
    facebook: () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank', 'width=600,height=400');
    },
    twitter: () => {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
    },
    whatsapp: () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`, '_blank');
    },
    copyLink: async () => {
      try {
        await navigator.clipboard.writeText(productUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast({
          title: isArabic ? 'تم نسخ الرابط' : 'Link Copied',
          description: isArabic ? 'تم نسخ رابط المنتج إلى الحافظة' : 'Product link copied to clipboard',
        });
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{isArabic ? 'جاري تحميل المنتج...' : 'Loading product...'}</p>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 overflow-x-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-4 sm:mb-6 text-gray-500 dark:text-gray-400 overflow-x-auto pb-1 scrollbar-hide">
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>{isArabic ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 ${isArabic ? 'rotate-180' : ''}`} />
            {product.category && (
              <>
                <Link
                  href={`/?category=${product.category.id}#products`}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap"
                >
                  {categoryName}
                </Link>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 ${isArabic ? 'rotate-180' : ''}`} />
              </>
            )}
            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[180px] sm:max-w-[300px]">{productName}</span>
          </nav>

          {/* Product Details - Mobile First Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            
            {/* Images Section */}
            <div className="space-y-3">
              {/* Main Image */}
              <div 
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={images[selectedImage] || 'https://via.placeholder.com/500'}
                    alt={productName}
                    className="w-full h-full object-contain p-4"
                  />
                </AnimatePresence>

                {/* Badges */}
                {hasDiscount && (
                  <div className={`absolute top-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${isArabic ? 'right-3' : 'left-3'}`}>
                    -{discountPercent}%
                  </div>
                )}
                {product.featured && (
                  <div className={`absolute top-3 bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${isArabic ? 'left-3' : 'right-3'}`}>
                    ⭐
                  </div>
                )}

                {/* Zoom indicator */}
                <div className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full">
                  <ZoomIn className="h-5 w-5" />
                </div>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                      className={`absolute top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${isArabic ? 'left-3' : 'right-3'}`}
                    >
                      {isArabic ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                      className={`absolute top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${isArabic ? 'right-3' : 'left-3'}`}
                    >
                      {isArabic ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className={`flex gap-2 overflow-x-auto pb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? 'border-teal-500 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800 p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4 sm:space-y-5">
              {/* Category Badge */}
              <Badge className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-medium">
                {categoryName || (isArabic ? 'عام' : 'General')}
              </Badge>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {productName}
              </h1>

              {/* Rating & Sales */}
              <div className={`flex flex-wrap items-center gap-3 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-400">{product.reviewsCount} {t('reviews', language)}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-400">{product.salesCount} {t('sold', language)}</span>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 sm:p-5 rounded-2xl">
                <div className={`flex items-baseline gap-2 flex-wrap ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {(hasDiscount ? currentDiscountPrice : currentPrice)?.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400">{currency}</span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">{currentPrice}</span>
                  )}
                </div>
                {hasDiscount && (
                  <p className={`text-green-600 dark:text-green-400 font-medium mt-1 text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? 'وفر' : 'Save'} {(currentPrice - (currentDiscountPrice || 0)).toFixed(2)} {currency}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {productDescription || (isArabic ? 'لا يوجد وصف متاح.' : 'No description available.')}
              </p>

              {/* Variants Selection */}
              {product.hasVariants && variants.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  
                  {variantsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                      <span className="mr-2 text-gray-500">{isArabic ? 'جاري تحميل الخيارات...' : 'Loading options...'}</span>
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <div key={variant.id} className="space-y-2">
                        <label className="font-semibold text-gray-800 dark:text-white">
                          {isArabic ? variant.nameAr : variant.name}
                        </label>
                        
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
                                  title={isArabic ? option.valueAr : option.value}
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
                                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-700'
                                }`}
                              >
                                {isArabic ? option.valueAr : option.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}

                  {/* SKU Info */}
                  {selectedSKU && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Package className="h-4 w-4" />
                          <span>{isArabic ? 'رمز المنتج:' : 'SKU:'} {selectedSKU.sku}</span>
                        </div>
                        <Badge variant={selectedSKU.stock > 0 ? 'default' : 'destructive'}>
                          {selectedSKU.stock > 0 
                            ? `${selectedSKU.stock} ${isArabic ? 'متوفر' : 'in stock'}` 
                            : isArabic ? 'غير متوفر' : 'Out of stock'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Warning if not all variants selected */}
                  {!allVariantsSelected && variants.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl text-sm">
                      {isArabic ? 'يرجى اختيار جميع الخيارات المتاحة' : 'Please select all available options'}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Quantity & Stock */}
              <div className={`flex flex-wrap items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('quantity', language)}:</span>
                <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-lg text-gray-900 dark:text-white">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} disabled={quantity >= currentStock}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className={`flex items-center gap-1 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className={`${currentStock > 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>{currentStock}</span> {t('inStock', language)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-2 sm:gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Button
                  className={`flex-1 h-12 sm:h-14 rounded-xl text-base font-bold ${addedToCart ? 'bg-green-500 hover:bg-green-500' : 'bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'} text-white`}
                  onClick={handleAddToCart}
                  disabled={addedToCart || (product.hasVariants && !selectedSKU) || currentStock === 0}
                >
                  {addedToCart ? (
                    <span className="flex items-center gap-2"><Check className="h-5 w-5" /> {t('addedToCart', language)}</span>
                  ) : currentStock === 0 ? (
                    isArabic ? 'غير متوفر' : 'Out of Stock'
                  ) : product.hasVariants && !selectedSKU ? (
                    isArabic ? 'اختر الخيارات أولاً' : 'Select Options'
                  ) : (
                    <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> {t('addToCart', language)}</span>
                  )}
                </Button>
                <Button
                  className="flex-1 h-12 sm:h-14 rounded-xl text-base font-bold bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  onClick={handleBuyNow}
                  disabled={(product.hasVariants && !selectedSKU) || currentStock === 0}
                >
                  <span className="flex items-center gap-2"><Zap className="h-5 w-5" /> {t('buyNow', language)}</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0 ${isProductFavorite ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20' : ''}`}
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-red-500' : ''}`} />
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  
                  {/* Share Menu Dropdown */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute bottom-full mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px] z-50 ${
                          isArabic ? 'right-0' : 'left-0'
                        }`}
                      >
                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-3 text-center">
                          {isArabic ? 'مشاركة المنتج' : 'Share Product'}
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => { shareHandlers.facebook(); setShowShareMenu(false); }}
                            className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-110"
                            title="Facebook"
                          >
                            <Facebook className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => { shareHandlers.twitter(); setShowShareMenu(false); }}
                            className="h-11 w-11 rounded-xl bg-gray-900 hover:bg-black text-white flex items-center justify-center transition-all hover:scale-110"
                            title="Twitter/X"
                          >
                            <Twitter className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => { shareHandlers.whatsapp(); setShowShareMenu(false); }}
                            className="h-11 w-11 rounded-xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => shareHandlers.copyLink()}
                            className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                              copiedLink 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                            }`}
                            title={isArabic ? 'نسخ الرابط' : 'Copy Link'}
                          >
                            {copiedLink ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { icon: Truck, title: t('fastDelivery', language), desc: isArabic ? '24 ساعة' : '24 hours', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                  { icon: Shield, title: t('qualityGuarantee', language), desc: isArabic ? 'أصلي' : 'Original', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                  { icon: RotateCcw, title: t('returnPolicy', language), desc: isArabic ? '14 يوم' : '14 days', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
                ].map((feature, idx) => (
                  <div key={idx} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className={`h-10 w-10 rounded-xl ${feature.color} flex items-center justify-center mx-auto mb-2`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-xs">{feature.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Help */}
              <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Phone className="h-5 w-5 text-teal-600 shrink-0" />
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{t('needHelp', language)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('callUs', language)}: <span className="text-teal-600 font-medium">+20 100 123 4567</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 sm:mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">{t('description', language)}</TabsTrigger>
                <TabsTrigger value="specs" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">{t('specifications', language)}</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm">{t('reviews', language)}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl mt-3 shadow-sm">
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  {productDescription || (isArabic ? 'لا يوجد وصف متاح.' : 'No description available.')}
                </p>
              </TabsContent>
              <TabsContent value="specs" className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl mt-3 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`flex justify-between py-2 border-b dark:border-gray-700 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'الفئة' : 'Category'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{categoryName || '-'}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b dark:border-gray-700 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'المخزون' : 'Stock'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentStock}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b dark:border-gray-700 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'التقييم' : 'Rating'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.rating.toFixed(1)} / 5</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b dark:border-gray-700 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'المبيعات' : 'Sales'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.salesCount}</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-3">
                <ReviewsSection productId={productId} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 sm:mt-16">
              <div className={`flex items-center justify-between mb-4 sm:mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t('relatedProducts', language)}</h2>
                <Link href="/" className={`text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {t('viewAll', language)}
                  {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((relProduct) => (
                  <ProductCard key={relProduct.id} product={relProduct as any} onAddToCart={handleAddRelatedToCart} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-black/95 border-none p-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 flex items-center justify-between">
            <div className="text-white font-medium text-sm">
              {selectedImage + 1} / {images.length}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="p-2 rounded-full hover:bg-white/20 text-white">
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-white text-sm min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))} className="p-2 rounded-full hover:bg-white/20 text-white">
                <ZoomIn className="h-5 w-5" />
              </button>
              <DialogClose className="p-2 rounded-full hover:bg-white/20 text-white">
                <X className="h-6 w-6" />
              </DialogClose>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center h-full">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={images[selectedImage]}
              alt={productName}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
          {images.length > 1 && (
            <>
              <button onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
