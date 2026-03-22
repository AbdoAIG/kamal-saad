'use client';

import { useRouter } from 'next/navigation';
import { Heart, Trash2, ArrowLeft, ArrowRight, ShoppingCart, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export function FavoritesSidebar() {
  const router = useRouter();
  const { 
    favorites, 
    isFavoritesOpen, 
    setFavoritesOpen, 
    removeFavorite, 
    clearFavorites,
    addItem,
    toggleCart,
    language 
  } = useStore();
  
  const isArabic = language === 'ar';
  const currency = t('currency', language);

  const handleAddToCart = (productId: string) => {
    const favorite = favorites.find(f => f.productId === productId);
    if (favorite) {
      addItem(favorite.product);
      toggleCart();
      setFavoritesOpen(false);
    }
  };

  const handleRemoveFavorite = (productId: string) => {
    removeFavorite(productId);
  };

  return (
    <Sheet open={isFavoritesOpen} onOpenChange={setFavoritesOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0" side={isArabic ? 'left' : 'right'}>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-l from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
          <SheetHeader>
            <SheetTitle className={`flex items-center gap-3 text-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className="h-10 w-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>{t('favorites', language)}</span>
                {favorites.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-2">
                    ({favorites.length} {isArabic ? 'منتج' : 'items'})
                  </span>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {favorites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8" dir={isArabic ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"
            >
              <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('emptyFavorites', language)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
              {t('emptyFavoritesDesc', language)}
            </p>
            <Button
              onClick={() => setFavoritesOpen(false)}
              className="bg-gradient-to-l from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl px-8"
            >
              {t('browseProducts', language)}
              {isArabic ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3" dir={isArabic ? 'rtl' : 'ltr'}>
                <AnimatePresence>
                  {favorites.map((favorite, index) => {
                    const images = JSON.parse(favorite.product.images || '[]');
                    const mainImage = images[0] || 'https://via.placeholder.com/100';
                    const price = favorite.product.discountPrice || favorite.product.price;
                    const productName = isArabic ? favorite.product.nameAr : favorite.product.name;

                    return (
                      <motion.div
                        key={favorite.id}
                        initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl relative group ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={mainImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {productName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {price.toFixed(2)} {currency}
                          </p>
                          
                          {/* Add to Cart Button */}
                          <Button
                            size="sm"
                            className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-lg h-8"
                            onClick={() => handleAddToCart(favorite.productId)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                            {t('addToCart', language)}
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <div className={`flex flex-col items-end justify-between ${isArabic ? 'items-start' : ''}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            onClick={() => handleRemoveFavorite(favorite.productId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-900 space-y-4" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{isArabic ? 'عدد المنتجات' : 'Products count'}</span>
                <span>{favorites.length}</span>
              </div>

              <div className="space-y-2">
                <Button
                  className={`w-full bg-gradient-to-l from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-3 rounded-xl font-bold ${isArabic ? 'flex-row-reverse' : ''}`}
                  onClick={() => {
                    // Add all favorites to cart
                    favorites.forEach(f => addItem(f.product));
                    setFavoritesOpen(false);
                    toggleCart();
                  }}
                >
                  <ShoppingCart className={`h-4 w-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {isArabic ? 'أضف الكل للسلة' : 'Add All to Cart'}
                </Button>
                <Button
                  variant="outline"
                  className={`w-full rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}
                  onClick={() => clearFavorites()}
                >
                  <Trash2 className={`h-4 w-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {isArabic ? 'إفراغ المفضلة' : 'Clear Favorites'}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
