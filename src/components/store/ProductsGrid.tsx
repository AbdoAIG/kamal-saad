'use client';

import { useState, useMemo } from 'react';
import { Product, Category } from '@prisma/client';
import { Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProductCard } from './ProductCard';
import { useStore, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductsGridProps {
  initialProducts: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
}

export function ProductsGrid({ initialProducts, categories, onAddToCart }: ProductsGridProps) {
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, language } = useStore();
  const isArabic = language === 'ar';
  const currency = t('currency', language);

  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [isGrid, setIsGrid] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...initialProducts];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nameAr.includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.descriptionAr?.includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      products = products.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by price
    products = products.filter((p) => {
      const price = p.discountPrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case 'price-high':
        products.sort((a, b) => (b.discountPrice || a.price) - (a.discountPrice || a.price));
        break;
      case 'popular':
        products.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      default:
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return products;
  }, [initialProducts, searchQuery, selectedCategory, sortBy, priceRange]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setPriceRange([0, 500]);
    setSortBy('newest');
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    priceRange[0] > 0 || priceRange[1] < 500,
  ].filter(Boolean).length;

  return (
    <section id="products-section" className="py-12" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {selectedCategory
              ? (isArabic ? categories.find(c => c.id === selectedCategory)?.nameAr : categories.find(c => c.id === selectedCategory)?.name)
              : t('allProducts', language)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {filteredProducts.length} {t('availableProducts', language)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1"
              >
                <X className="h-4 w-4" />
                {t('clearFilters', language)}
              </Button>
            </motion.div>
          )}

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-0">
              <SelectValue placeholder={t('sortNewest', language)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('sortNewest', language)}</SelectItem>
              <SelectItem value="price-low">{t('sortPriceLow', language)}</SelectItem>
              <SelectItem value="price-high">{t('sortPriceHigh', language)}</SelectItem>
              <SelectItem value="popular">{t('sortPopular', language)}</SelectItem>
              <SelectItem value="rating">{t('sortRating', language)}</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className={`gap-2 h-10 rounded-xl ${activeFiltersCount > 0 ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' : ''}`}>
                <SlidersHorizontal className="h-4 w-4" />
                {t('filter', language)}
                {activeFiltersCount > 0 && (
                  <span className="h-5 w-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side={isArabic ? 'right' : 'left'} className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="text-xl">{t('filterProducts', language)}</SheetTitle>
              </SheetHeader>
              <div className="space-y-8 py-6">
                {/* Categories */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('categories', language)}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Checkbox
                        id="all-categories"
                        checked={!selectedCategory}
                        onCheckedChange={() => setSelectedCategory(null)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="all-categories" className="font-medium cursor-pointer">
                        {t('allCategories', language)}
                      </Label>
                    </div>
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Checkbox
                          id={cat.id}
                          checked={selectedCategory === cat.id}
                          onCheckedChange={() => setSelectedCategory(cat.id)}
                          className="h-5 w-5"
                        />
                        <Label htmlFor={cat.id} className="font-medium cursor-pointer">
                          {isArabic ? cat.nameAr : cat.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">{t('priceRange', language)} ({currency})</h4>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      step={10}
                      className="mb-6"
                    />
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">{t('from', language)}</p>
                        <p className="font-bold text-gray-900 dark:text-white">{priceRange[0]} {currency}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                      <div className="text-center">
                        <p className="text-xs text-gray-500">{t('to', language)}</p>
                        <p className="font-bold text-gray-900 dark:text-white">{priceRange[1]} {currency}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-12 rounded-xl font-bold"
                >
                  {t('showResults', language)} ({filteredProducts.length})
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Grid/List Toggle */}
          <div className="hidden md:flex border rounded-xl overflow-hidden">
            <Button
              variant={isGrid ? 'default' : 'ghost'}
              size="icon"
              className={`h-10 w-10 rounded-none ${isGrid ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
              onClick={() => setIsGrid(true)}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={!isGrid ? 'default' : 'ghost'}
              size="icon"
              className={`h-10 w-10 rounded-none ${!isGrid ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
              onClick={() => setIsGrid(false)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('noProducts', language)}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('noProductsDesc', language)}</p>
          <Button onClick={resetFilters} className="rounded-xl bg-teal-500 hover:bg-teal-600">
            {t('clearFilters', language)}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className={isGrid
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'space-y-4'
          }
        >
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <ProductCard
                  product={product as any}
                  onAddToCart={onAddToCart}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
