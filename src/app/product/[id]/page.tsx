'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Share2, Minus, Plus, Truck, Shield, 
  RotateCcw, Check, ChevronRight, ChevronLeft, Package, Phone, Zap, 
  ZoomIn, ZoomOut, X, ArrowRight, Facebook, Twitter, MessageCircle, Link2, CheckCircle
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
  const [activeTab, setActiveTab] = useState('description');

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
        const productData = data.data || data;
        setProduct(productData);

        if (productData.variants) {
          setVariants(productData.variants);
          const defaults: Record<string, string> = {};
          productData.variants.forEach((v: Variant) => {
            if (v.options.length > 0) {
              defaults[v.id] = v.options[0].id;
            }
          });
          setSelectedOptions(defaults);
        }

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
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
        toggleCart();
      }, 1000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
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

  const baseImages = product ? (Array.isArray(JSON.parse(product.images || '[]')) ? JSON.parse(product.images || '[]') : []) : [];
  const images = selectedSKU?.image 
    ? [selectedSKU.image, ...baseImages]
    : baseImages;

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

  const allVariantsSelected = variants.length === 0 || 
    variants.every(v => selectedOptions[v.id]);

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
        });
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff] dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="flex-1">
        {/* Top navigation bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-[#ffffff] dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link 
              href={`/?category=${product.category?.id || 'all'}#products`}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isArabic ? <ArrowRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              <span>{isArabic ? `العودة إلى ${categoryName}` : `Back to ${categoryName || 'Products'}`}</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`absolute top-full mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-3 min-w-[180px] z-50 ${isArabic ? 'right-0' : 'left-0'}`}
                    >
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { shareHandlers.facebook(); setShowShareMenu(false); }} className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all"><Facebook className="h-4 w-4" /></button>
                        <button onClick={() => { shareHandlers.twitter(); setShowShareMenu(false); }} className="h-9 w-9 rounded-lg bg-gray-900 hover:bg-black text-white flex items-center justify-center transition-all"><Twitter className="h-4 w-4" /></button>
                        <button onClick={() => { shareHandlers.whatsapp(); setShowShareMenu(false); }} className="h-9 w-9 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all"><MessageCircle className="h-4 w-4" /></button>
                        <button onClick={() => shareHandlers.copyLink()} className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${copiedLink ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{copiedLink ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={handleToggleFavorite}
                className={`p-2 transition-colors ${isProductFavorite ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">

            {/* ═══ LEFT: Image Gallery ═══ */}
            <div className="space-y-3">
              {/* Main Image */}
              <div 
                className="relative aspect-square bg-white dark:bg-gray-900 rounded-lg overflow-hidden cursor-zoom-in group"
                onClick={() => setIsLightboxOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    src={images[selectedImage] || 'https://via.placeholder.com/500'}
                    alt={productName}
                    className="w-full h-full object-contain p-8"
                  />
                </AnimatePresence>

                {/* Discount badge */}
                {hasDiscount && (
                  <div className={`absolute top-3 bg-red-500 text-white px-2.5 py-1 text-xs font-bold ${isArabic ? 'right-3' : 'left-3'}`}>
                    -{discountPercent}%
                  </div>
                )}

                {/* Featured badge */}
                {product.featured && (
                  <div className={`absolute top-3 bg-gray-900 text-white px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${isArabic ? 'left-3' : 'right-3'}`}>
                    {isArabic ? 'مميز' : 'Featured'}
                  </div>
                )}

                {/* Zoom icon - top right */}
                <div className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-md dark:shadow-gray-900/50 text-gray-500 dark:text-gray-400">
                    <ZoomIn className="h-4 w-4" />
                  </div>
                </div>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                      className={`absolute top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-700 p-2 rounded-full shadow-md dark:shadow-gray-900/50 hover:bg-white dark:hover:bg-gray-600 transition-colors ${isArabic ? 'left-2' : 'right-2'}`}
                    >
                      {isArabic ? <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                      className={`absolute top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-700 p-2 rounded-full shadow-md dark:shadow-gray-900/50 hover:bg-white dark:hover:bg-gray-600 transition-colors ${isArabic ? 'right-2' : 'left-2'}`}
                    >
                      {isArabic ? <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
                    </button>
                  </>
                )}

                {/* Page indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {String(selectedImage + 1).padStart(2, '0')} — {String(images.length).padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? 'border-gray-900 dark:border-gray-100 shadow-sm dark:shadow-gray-900/50'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 opacity-70'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ RIGHT: Product Details ═══ */}
            <div className="space-y-5 sm:space-y-6">
              {/* Category + New badge */}
              <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 font-medium">
                  {categoryName || (isArabic ? 'عام' : 'General')}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] tracking-wider uppercase text-gray-500 dark:text-gray-400 bg-[#ffffff] dark:bg-gray-900 px-2 py-0.5 rounded-sm font-semibold">
                    {isArabic ? 'تخفيض' : 'Sale'}
                  </span>
                )}
                {product.featured && (
                  <span className="text-[10px] tracking-wider uppercase text-gray-500 dark:text-gray-400 bg-[#ffffff] dark:bg-gray-900 px-2 py-0.5 rounded-sm font-semibold">
                    {isArabic ? 'جديد' : 'New'}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {productName}
              </h1>

              {/* Subtitle / collection */}
              {productDescription && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 tracking-wide uppercase leading-relaxed line-clamp-2">
                  {isArabic ? 'كمال سعد — مستلزمات مكتبية ومدرسية' : 'Kamal Saad — Office & School Supplies'}
                </p>
              )}

              {/* Rating */}
              <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">({product.reviewsCount} {t('reviews', language)})</span>
                <span className="text-gray-200 dark:text-gray-600">|</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{product.salesCount} {t('sold', language)}</span>
              </div>

              {/* Price */}
              <div className={`flex items-baseline gap-3 flex-wrap ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                  {(hasDiscount ? currentDiscountPrice : currentPrice)?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">{currency}</span>
                {hasDiscount && (
                  <span className="text-base text-gray-400 dark:text-gray-500 line-through">{currentPrice.toFixed(2)}</span>
                )}
              </div>

              {/* Underline Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className={`flex gap-6 sm:gap-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {[
                    { id: 'description', label: isArabic ? 'الوصف' : 'Description' },
                    { id: 'details', label: isArabic ? 'المواصفات' : 'Details' },
                    { id: 'reviews', label: isArabic ? 'التقييمات' : `Reviews (${product.reviewsCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-100'
                          : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === 'description' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {productDescription || (isArabic ? 'لا يوجد وصف متاح.' : 'No description available.')}
                  </p>
                )}
                {activeTab === 'details' && (
                  <div className="space-y-2 text-sm">
                    <div className={`flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-400 dark:text-gray-500">{isArabic ? 'الفئة' : 'Category'}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{categoryName || '-'}</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-400 dark:text-gray-500">{isArabic ? 'المخزون' : 'Stock'}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{currentStock}</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-400 dark:text-gray-500">{isArabic ? 'التقييم' : 'Rating'}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{product.rating.toFixed(1)} / 5</span>
                    </div>
                    <div className={`flex justify-between py-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-400 dark:text-gray-500">{isArabic ? 'المبيعات' : 'Sales'}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{product.salesCount}</span>
                    </div>
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <ReviewsSection productId={productId} />
                )}
              </div>

              {/* ═══ Variant Selectors ═══ */}
              {product.hasVariants && variants.length > 0 && (
                <div className="space-y-5 pt-2">
                  {variantsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <div key={variant.id}>
                        {/* Label */}
                        <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
                          {isArabic ? variant.nameAr : variant.name}
                        </p>
                        
                        {/* Color swatches */}
                        {variant.name.toLowerCase() === 'color' && variant.options.some(o => o.colorCode) ? (
                          <div className="flex flex-wrap gap-2">
                            {variant.options.map((option) => {
                              const isSelected = selectedOptions[variant.id] === option.id;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => handleOptionSelect(variant.id, option.id)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    isSelected 
                                      ? 'border-gray-800 dark:border-gray-200 scale-110' 
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
                                  title={isArabic ? option.valueAr : option.value}
                                >
                                  <div 
                                    className="w-full h-full rounded-full"
                                    style={{ backgroundColor: option.colorCode || '#ccc' }}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Square size buttons */
                          <div className="flex flex-wrap gap-2">
                            {variant.options.map((option) => {
                              const isSelected = selectedOptions[variant.id] === option.id;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => handleOptionSelect(variant.id, option.id)}
                                  className={`w-10 h-10 rounded-sm border-2 text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'border-gray-800 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm dark:shadow-gray-900/50'
                                      : 'border-gray-200 dark:border-gray-700 bg-[#ffffff] dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                  }`}
                                >
                                  {isArabic ? option.valueAr : option.value}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* SKU + Stock info */}
                  {selectedSKU && (
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                      <span>SKU: {selectedSKU.sku}</span>
                      <span className={currentStock > 0 ? 'text-green-600' : 'text-red-500'}>
                        {currentStock > 0 
                          ? `${currentStock} ${isArabic ? 'متوفر' : 'in stock'}` 
                          : isArabic ? 'غير متوفر' : 'Out of stock'}
                      </span>
                    </div>
                  )}

                  {!allVariantsSelected && variants.length > 0 && (
                    <p className="text-xs text-amber-600">
                      {isArabic ? 'يرجى اختيار جميع الخيارات' : 'Please select all options'}
                    </p>
                  )}
                </div>
              )}

              {/* ═══ Quantity ═══ */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
                  {isArabic ? 'الكمية' : 'Quantity'}
                </p>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 border border-gray-200 dark:border-gray-700 rounded-sm flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-800 dark:text-gray-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                    className="h-10 w-10 border border-gray-200 dark:border-gray-700 rounded-sm flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({currentStock} {t('inStock', language)})
                  </span>
                </div>
              </div>

              {/* ═══ Action Buttons ═══ */}
              <div className={`flex gap-3 pt-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Button
                  className={`h-12 flex-1 rounded-sm text-xs font-semibold tracking-widest uppercase transition-all border-2 ${
                    addedToCart
                      ? 'bg-emerald-500 hover:bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
                  }`}
                  onClick={handleAddToCart}
                  disabled={addedToCart || (product.hasVariants && !selectedSKU) || currentStock === 0}
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" /> {isArabic ? 'تمت الإضافة' : 'Added'}
                    </span>
                  ) : currentStock === 0 ? (
                    isArabic ? 'غير متوفر' : 'Out of Stock'
                  ) : product.hasVariants && !selectedSKU ? (
                    isArabic ? 'اختر الخيارات' : 'Select Options'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> {t('addToCart', language)}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={`h-12 flex-1 rounded-sm text-xs font-semibold tracking-widest uppercase border-2 border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all`}
                  onClick={handleBuyNow}
                  disabled={(product.hasVariants && !selectedSKU) || currentStock === 0}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4" /> {t('buyNow', language)}
                  </span>
                </Button>
              </div>

              {/* Features */}
              <div className={`grid grid-cols-3 gap-3 pt-2 ${isArabic ? 'text-right' : ''}`}>
                {[
                  { icon: Truck, text: isArabic ? 'توصيل سريع' : 'Fast Delivery' },
                  { icon: Shield, text: isArabic ? 'ضمان أصلي' : 'Authentic' },
                  { icon: RotateCcw, text: isArabic ? 'إرجاع مجاني' : 'Free Returns' },
                ].map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 ${isArabic ? 'flex-row-reverse justify-end' : ''}`}>
                    <f.icon className="h-4 w-4 shrink-0" />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <div className={`flex items-center justify-between mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('relatedProducts', language)}</h2>
              <Link href="/" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 tracking-wider uppercase">
                {t('viewAll', language)} →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct as any} onAddToCart={handleAddRelatedToCart} />
              ))}
            </div>
          </div>
        )}
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
