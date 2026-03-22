'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Product } from '@prisma/client';
import { Loader2, Sparkles, Store, Truck, Shield, Headphones, CreditCard, Package, CheckCircle2, Plus } from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartSidebar } from '@/components/store/CartSidebar';
import { AuthModal } from '@/components/store/AuthModal';
import { AdminPanel } from '@/components/store/AdminPanel';
import { ProductCard } from '@/components/store/ProductCard';
import { PromotionalBanner } from '@/components/store/PromotionalBanner';
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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
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

      // Handle categories
      if (Array.isArray(cats) && cats.length === 0) {
        setIsSeeding(true);
        return;
      }
      
      if (Array.isArray(cats)) {
        setCategories(cats);
      }

      // Initial products
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

  // Load more products with button
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

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-200 rounded-full border-t-teal-500 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isArabic ? 'جاري تحميل المتجر...' : 'Loading store...'}
          </h2>
        </div>
      </div>
    );
  }

  // Empty State - Seeding
  if (isSeeding && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center max-w-lg p-10 bg-white rounded-3xl shadow-xl">
          <img src="/logo.png" alt="KMS Logo" className="w-20 h-20 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isArabic ? 'مرحباً بك في كمال سعد!' : 'Welcome to Kamal Saad!'}
          </h1>
          <p className="text-gray-600 mb-8">
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

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    'pens-pencils': '🖊️',
    'notebooks': '📓',
    'school-bags': '🎒',
    'art-supplies': '🎨',
    'office-tools': '📎',
    'educational': '🌍',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={null}
        onCategorySelect={() => {}}
      />
      
      {/* Admin Button */}
      {user?.role === 'admin' && (
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            onClick={() => setIsAdminOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full h-12 w-12 shadow-lg"
            size="icon"
          >
            <Store className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <main className="flex-1">
        {/* Hero Section - Simplified */}
        <section className="bg-gradient-to-l from-teal-600 via-cyan-600 to-blue-600 text-white py-10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {isArabic ? 'كل ما تحتاجه للمدرسة والمكتب' : 'Everything You Need for School & Office'}
              </h1>
              <p className="text-lg text-teal-100 mb-6">
                {isArabic ? 'أفضل المنتجات المدرسية والمكتبية بأسعار مناسبة' : 'Best school and office supplies at great prices'}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/#products">
                  <Button size="lg" className="bg-white text-teal-700 hover:bg-gray-100 px-8">
                    {t('shopNow', language)}
                  </Button>
                </Link>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalProducts.toLocaleString()}+</p>
                  <p className="text-xs text-teal-200">{isArabic ? 'منتج' : 'Products'}</p>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-xs text-teal-200">{isArabic ? 'أقسام' : 'Categories'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bar */}
        <section className="bg-white border-b py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: Truck, text: isArabic ? 'توصيل سريع' : 'Fast Delivery' },
                { icon: Shield, text: isArabic ? 'ضمان الجودة' : 'Quality Guarantee' },
                { icon: CreditCard, text: isArabic ? 'دفع آمن' : 'Secure Payment' },
                { icon: Headphones, text: isArabic ? 'دعم متواصل' : '24/7 Support' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-700">
                  <feature.icon className="h-5 w-5 text-teal-600" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <div className="container mx-auto px-4 pt-6">
          <PromotionalBanner />
        </div>

        {/* Categories Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isArabic ? 'تسوق حسب القسم' : 'Shop by Category'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link key={category.id} href={`/?category=${category.id}#products`}>
                  <div className="bg-white hover:bg-teal-50 border rounded-xl px-4 py-3 text-center transition-colors cursor-pointer">
                    <div className="text-2xl mb-1">
                      {categoryIcons[category.slug] || '📦'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {isArabic ? category.nameAr : category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Products Section with Load More Button */}
        <section id="products" className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {searchQuery 
                  ? (isArabic ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`)
                  : (isArabic ? 'جميع المنتجات' : 'All Products')
                }
              </h2>
              <span className="text-sm text-gray-500">
                {products.length} / {totalProducts.toLocaleString()} {isArabic ? 'منتج' : 'products'}
              </span>
            </div>
            
            {products.length === 0 && !isLoadingMore && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
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
                  className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
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
                  <p className="text-gray-400 text-sm">
                    {isArabic ? 'تم تحميل جميع المنتجات' : 'All products loaded'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {isArabic ? `إجمالي ${products.length} منتج` : `Total ${products.length} products`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How to Order - Simplified */}
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {isArabic ? 'كيف تطلب؟' : 'How to Order?'}
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { icon: Package, text: isArabic ? 'اختر المنتجات' : 'Choose Products' },
                { icon: CreditCard, text: isArabic ? 'أكمل الطلب' : 'Complete Order' },
                { icon: Truck, text: isArabic ? 'التوصيل' : 'Delivery' },
                { icon: CheckCircle2, text: isArabic ? 'استلم واستمتع' : 'Receive' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartSidebar />
      <FavoritesSidebar />
      <AuthModal />
      <AdminPanel
        open={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products as any}
        categories={categories}
        onRefresh={fetchInitialData}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
