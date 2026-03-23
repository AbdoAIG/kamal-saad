'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Share2, Minus, Plus, Truck, Shield, 
  RotateCcw, Check, ChevronRight, ChevronLeft, Package, Clock, Phone, Zap, Bell
} from 'lucide-react';
import { ProductImageGallery } from '@/components/store/ProductImageGallery';
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

interface ProductWithCategory extends Product {
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
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
  const [isFavoriteLocal, setIsFavoriteLocal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isStockNotified, setIsStockNotified] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const { addItem, toggleCart, items, language, isFavorite: checkIsFavorite, toggleFavorite, user } = useStore();
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
        setProduct(data);

        const allProductsRes = await fetch('/api/products');
        const allProductsData = await allProductsRes.json();
        const allProducts = allProductsData.products || allProductsData;
        const related = allProducts
          .filter((p: Product) => p.categoryId === data.categoryId && p.id !== data.id)
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

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
        toggleCart();
      }, 1000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
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

  const handleStockNotification = async () => {
    if (!user) {
      toast({
        title: isArabic ? 'يجب تسجيل الدخول' : 'Login Required',
        description: isArabic ? 'يرجى تسجيل الدخول للإشعار عند التوفر' : 'Please login to get notified when available',
        variant: 'destructive',
      });
      return;
    }

    setIsNotifying(true);
    try {
      const res = await fetch('/api/stock-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        setIsStockNotified(true);
        toast({
          title: isArabic ? 'تم التسجيل بنجاح' : 'Notification Set',
          description: isArabic ? 'سنرسل لك إشعاراً عند توفر المنتج' : 'We will notify you when this product is back in stock',
        });
      }
    } catch (error) {
      console.error('Error setting stock notification:', error);
    } finally {
      setIsNotifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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

  const images = JSON.parse(product.images || '[]');
  const hasDiscount = Boolean(product.discountPrice && product.discountPrice < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  const productName = isArabic ? product.nameAr : product.name;
  const productDescription = isArabic ? (product.descriptionAr || product.description) : product.description;
  const categoryName = isArabic ? product.category?.nameAr : product.category?.name;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className={`flex items-center gap-2 text-sm mb-6 text-gray-600 dark:text-gray-400 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Link href="/" className="hover:text-teal-600 transition-colors">
              {isArabic ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
            <Link href="/" className="hover:text-teal-600 transition-colors">
              {categoryName || (isArabic ? 'المنتجات' : 'Products')}
            </Link>
            <ChevronRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
            <span className="text-gray-900 dark:text-white font-medium">{productName}</span>
          </nav>

          {/* Product Details */}
          <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 ${isArabic ? '' : 'lg:grid-flow-col-dense'}`}>
            {/* Images Section - Enhanced Gallery */}
            <ProductImageGallery
              images={images.length > 0 ? images : ['https://via.placeholder.com/500']}
              productName={productName}
              isArabic={isArabic}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              featured={!!product.featured}
              language={language}
            />

            {/* Details Section */}
            <motion.div
              initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`space-y-6 ${isArabic ? '' : 'lg:col-start-1'}`}
            >
              <Badge className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-4 py-1.5 rounded-full font-medium">
                {categoryName || (isArabic ? 'عام' : 'General')}
              </Badge>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {productName}
              </h1>

              <div className={`flex flex-wrap items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200 dark:text-gray-600 dark:fill-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 dark:text-gray-400">{product.reviewsCount} {t('reviews', language)}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 dark:text-gray-400">{product.salesCount} {t('sold', language)}</span>
              </div>

              <div className="bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-2xl">
                <div className={`flex items-baseline gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {(hasDiscount ? product.discountPrice : product.price)?.toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-500 dark:text-gray-400">{currency}</span>
                  {hasDiscount && (
                    <span className={`text-xl text-gray-400 line-through ${isArabic ? 'mr-4' : 'ml-4'}`}>
                      {product.price}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <p className={`text-green-600 dark:text-green-400 font-medium mt-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? 'وفر' : 'Save'} {(product.price - (product.discountPrice || 0)).toFixed(2)} {currency}
                  </p>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                {productDescription || (isArabic ? 'لا يوجد وصف متاح لهذا المنتج.' : 'No description available for this product.')}
              </p>

              <Separator />

              <div className={`flex items-center gap-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium text-gray-700 dark:text-gray-300 text-lg">{t('quantity', language)}:</span>
                <div className={`flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-14 text-center font-bold text-xl text-gray-900 dark:text-white">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="text-green-600 font-bold">{product.stock}</span> {t('inStock', language)}
                  </span>
                </div>
              </div>

              <div className={`flex gap-3 pt-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
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
                        className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <Check className="h-6 w-6" />
                        {t('addedToCart', language)}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        <ShoppingCart className="h-6 w-6" />
                        {t('addToCart', language)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                <Button
                  className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  onClick={handleBuyNow}
                >
                  <span className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Zap className="h-6 w-6" />
                    {t('buyNow', language)}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-14 w-14 rounded-xl ${isProductFavorite ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20' : 'hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20'}`}
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-6 w-6 ${isProductFavorite ? 'fill-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl">
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Truck, title: t('fastDelivery', language), desc: isArabic ? 'خلال 24 ساعة' : 'Within 24 hours', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                  { icon: Shield, title: t('qualityGuarantee', language), desc: isArabic ? 'منتجات أصلية' : 'Original products', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                  { icon: RotateCcw, title: t('returnPolicy', language), desc: isArabic ? 'خلال 14 يوم' : 'Within 14 days', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
                ].map((feature, idx) => (
                  <div key={idx} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mx-auto mb-2`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{feature.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className={`flex items-center gap-4 p-4 bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Phone className="h-5 w-5 text-teal-600" />
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="font-medium text-gray-900 dark:text-white">{t('needHelp', language)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('callUs', language)}: <span className="text-teal-600 font-medium">+20 100 123 4567</span></p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm font-medium">
                  {t('description', language)}
                </TabsTrigger>
                <TabsTrigger value="specs" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm font-medium">
                  {t('specifications', language)}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm font-medium">
                  {t('reviews', language)}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="p-6 bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm">
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('description', language)}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {productDescription || (isArabic ? 'لا يوجد وصف متاح لهذا المنتج.' : 'No description available for this product.')}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="specs" className="p-6 bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('specifications', language)}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'الفئة' : 'Category'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{categoryName || (isArabic ? 'عام' : 'General')}</span>
                  </div>
                  <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'الكمية المتوفرة' : 'Stock'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.stock} {isArabic ? 'وحدة' : 'units'}</span>
                  </div>
                  <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'التقييم' : 'Rating'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.rating.toFixed(1)} / 5</span>
                  </div>
                  <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'عدد المبيعات' : 'Sales'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.salesCount}</span>
                  </div>
                  <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'السعر الأصلي' : 'Original Price'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.price} {currency}</span>
                  </div>
                  {product.discountPrice && (
                    <div className={`flex justify-between py-3 border-b dark:border-gray-700 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-600 dark:text-gray-400">{isArabic ? 'السعر بعد الخصم' : 'Discount Price'}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{product.discountPrice} {currency}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4">
                <ReviewsSection productId={productId} />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <div className={`flex items-center justify-between mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('relatedProducts', language)}</h2>
                <Link
                  href="/"
                  className={`text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                  {t('viewAll', language)}
                  {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((relProduct) => (
                  <ProductCard
                    key={relProduct.id}
                    product={relProduct as any}
                    onAddToCart={handleAddRelatedToCart}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />
    </div>
  );
}
