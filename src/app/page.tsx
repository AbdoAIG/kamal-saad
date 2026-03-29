'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Product } from '@prisma/client';
import { Loader2, Sparkles, Package, Plus } from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { PartnersMarquee } from '@/components/store/PartnersMarquee';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { ProductCard } from '@/components/store/ProductCard';
import { HeroBannerSection, BelowCategoriesBannerSection, BetweenProductsBannerSection, AboveFooterBannerSection } from '@/components/store/PromotionalBanner';
import { Sidebar } from '@/components/store/Sidebar';
import { FavoritesSidebar } from '@/components/store/FavoritesSidebar';
import { Button } from '@/components/ui/button';
import { useStore, t } from '@/store/useStore';
import Link from 'next/link';

interface ProductWithCategory extends Product {
  category?: { id: string; name: string; nameAr: string };
}

interface ProductsResponse {
  products: ProductWithCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  const { user, addItem, toggleCart, language } = useStore();
  const isArabic = language === 'ar';

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      const [catRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/products?page=1&limit=20${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${categoryFilter ? `&categoryId=${categoryFilter}` : ''}`)
      ]);
      
      const cats = await catRes.json();
      const prods: ProductsResponse = await productsRes.json();

      if (Array.isArray(cats) && cats.length === 0) {
        setIsSeeding(true);
        return;
      }
      
      if (Array.isArray(cats)) {
        setCategories(cats);
      }

      if (prods.products && Array.isArray(prods.products)) {
        setProducts(prods.products);
        setTotalProducts(prods.pagination?.total || 0);
        setHasMore(prods.pagination?.hasMore || false);
        setPage(1);
      }
      
      setIsSeeding(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/products?page=${nextPage}&limit=20${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${categoryFilter ? `&categoryId=${categoryFilter}` : ''}`);
      const data: ProductsResponse = await res.json();
      
      if (data.products && data.products.length > 0) {
        setProducts(prev => [...prev, ...data.products]);
        setPage(nextPage);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, searchQuery, categoryFilter]);

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchInitialData();
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    setProducts([]);
    fetchInitialData();
  }, [searchQuery, categoryFilter, fetchInitialData]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toggleCart();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-200 dark:border-teal-700 rounded-full border-t-teal-500 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isArabic ? 'جاري تحميل المتجر...' : 'Loading store...'}
          </h2>
        </div>
      </div>
    );
  }

  if (isSeeding && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center max-w-lg p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-gray-900/30">
          <img src="/logo.png" alt="KMS Logo" className="w-20 h-20 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {isArabic ? 'مرحباً بك في كمال سعد!' : 'Welcome to Kamal Saad!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {isArabic ? 'يبدو أن المتجر فارغ حالياً. اضغط على الزر أدناه لإضافة منتجات تجريبية.' : 'The store appears to be empty. Click below to add sample products.'}
          </p>
          <Button
            onClick={seedDatabase}
            className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-4 text-lg rounded-xl font-bold"
          >
            <Sparkles className="h-5 w-5 ml-2" />
            {isArabic ? 'إضافة منتجات تجريبية' : 'Add Sample Products'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-x-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={null}
        onCategorySelect={() => {}}
      />
      
      <main className="flex-1">
        {/* Hero Banners */}
        <HeroBannerSection />

        {/* Categories Section */}
        <section className="py-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {isArabic ? 'تسوق حسب القسم' : 'Shop by Category'}
              </h2>
              <Link href="/?category=all" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                {isArabic ? 'عرض الكل' : 'View All'}
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.map((category) => (
                <Link key={category.id} href={`/?category=${category.id}#products`} className="group">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 hover:from-teal-100 hover:to-cyan-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-teal-100 dark:border-gray-600 rounded-2xl p-4 text-center transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/30 hover:-translate-y-1 cursor-pointer">
                    <div className="w-12 h-12 mx-auto mb-2 bg-white dark:bg-gray-600 rounded-xl shadow-sm dark:shadow-gray-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {category.slug === 'pens-pencils' && '🖊️'}
                      {category.slug === 'notebooks' && '📓'}
                      {category.slug === 'school-bags' && '🎒'}
                      {category.slug === 'art-supplies' && '🎨'}
                      {category.slug === 'office-tools' && '📎'}
                      {category.slug === 'educational' && '🌍'}
                      {!['pens-pencils', 'notebooks', 'school-bags', 'art-supplies', 'office-tools', 'educational'].includes(category.slug) && '📦'}
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                      {isArabic ? category.nameAr : category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Below Categories Banners */}
        <BelowCategoriesBannerSection />

        {/* Products Section */}
        <section id="products" className="py-6 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {searchQuery 
                  ? (isArabic ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`)
                  : (isArabic ? 'جميع المنتجات' : 'All Products')
                }
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {products.length} / {totalProducts.toLocaleString()} {isArabic ? 'منتج' : 'products'}
              </span>
            </div>
            
            {products.length === 0 && !isLoadingMore && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {isArabic ? 'لا توجد منتجات' : 'No products found'}
                </p>
                <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm mt-2 inline-block">
                  {isArabic ? 'مسح البحث' : 'Clear search'}
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Load More Button */}
            <div className="flex flex-col items-center gap-4 py-8">
              {hasMore && (
                <Button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl font-bold shadow-lg dark:shadow-gray-900/30 hover:shadow-xl dark:hover:shadow-gray-900/50 transition-all duration-300 gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isArabic ? 'جاري التحميل...' : 'Loading...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {isArabic ? 'تحميل المزيد' : 'Load More'}
                    </>
                  )}
                </Button>
              )}
              
              {!hasMore && products.length > 0 && (
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    {isArabic ? 'تم تحميل جميع المنتجات' : 'All products loaded'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Between Products Banners */}
        <BetweenProductsBannerSection />

        {/* How to Order */}
        <section className="py-6 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              {isArabic ? 'كيف تطلب؟' : 'How to Order?'}
            </h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { step: '1', text: isArabic ? 'اختر المنتجات' : 'Choose Products' },
                { step: '2', text: isArabic ? 'أكمل الطلب' : 'Complete Order' },
                { step: '3', text: isArabic ? 'التوصيل' : 'Delivery' },
                { step: '4', text: isArabic ? 'استلم واستمتع' : 'Receive' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm dark:shadow-gray-900/30">
                  <div className="h-8 w-8 bg-gradient-to-l from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

        {/* Above Footer Banners */}
        <AboveFooterBannerSection />

      {/* Partners Marquee */}
      <PartnersMarquee />

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
