'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export function CartSidebar() {
  const router = useRouter();
  const { 
    items, 
    isCartOpen, 
    setCartOpen, 
    removeItem, 
    updateQuantity, 
    getTotal, 
    clearCart, 
    toggleAuthModal, 
    user, 
    language 
  } = useStore();
  
  const isArabic = language === 'ar';
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = t('currency', language);

  const handleCheckout = () => {
    setCartOpen(false);
    router.push('/checkout');
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0" side={isArabic ? 'left' : 'right'}>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
          <SheetHeader>
            <SheetTitle className={`flex items-center gap-3 text-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>{t('cart', language)}</span>
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-2">
                    ({itemCount} {isArabic ? 'منتج' : 'items'})
                  </span>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8" dir={isArabic ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"
            >
              <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('emptyCart', language)}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
              {t('emptyCartDesc', language)}
            </p>
            <Button
              onClick={() => setCartOpen(false)}
              className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl px-8"
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
                  {items.map((item, index) => {
                    const images = JSON.parse(item.product.images || '[]');
                    const mainImage = images[0] || 'https://via.placeholder.com/100';
                    const price = item.product.discountPrice || item.product.price;
                    const productName = isArabic ? item.product.nameAr : item.product.name;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl relative group ${isArabic ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={mainImage}
                            alt={productName}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {productName}
                          </h4>
                          {/* Show variant label if exists */}
                          {item.skuLabel && (
                            <p className="text-xs text-teal-600 dark:text-teal-400 mb-1">
                              {item.skuLabel}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{price.toFixed(2)} {currency}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-700"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-bold text-gray-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-700"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className={`flex flex-col items-end justify-between ${isArabic ? 'items-start' : ''}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <p className="font-bold text-teal-600 dark:text-teal-400">
                            {(price * item.quantity).toFixed(2)} {currency}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-900 space-y-4" dir={isArabic ? 'rtl' : 'ltr'}>
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('subtotal', language)}</span>
                  <span>{getTotal().toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('shipping', language)}</span>
                  <span className="text-green-600 dark:text-green-400">{t('free', language)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>{t('total', language)}</span>
                  <span className="text-teal-600 dark:text-teal-400">{getTotal().toFixed(2)} {currency}</span>
                </div>
              </div>

              {/* Payment Methods Preview */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{isArabic ? 'طرق الدفع:' : 'Payment:'}</span>
                <div className="flex items-center gap-1">
                  <div className="h-6 px-2 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] font-bold text-blue-600 flex items-center">
                    Paymob
                  </div>
                  <div className="h-6 px-2 bg-orange-100 dark:bg-orange-900/30 rounded text-[10px] font-bold text-orange-600 flex items-center">
                    Fawry
                  </div>
                  <div className="h-6 px-2 bg-purple-100 dark:bg-purple-900/30 rounded text-[10px] font-bold text-purple-600 flex items-center">
                    Valu
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className={`w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-6 rounded-xl text-lg font-bold ${isArabic ? 'flex-row-reverse' : ''}`}
                  onClick={handleCheckout}
                >
                  <CreditCard className={`h-5 w-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {t('checkout', language)}
                  {isArabic ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
                <Button
                  variant="outline"
                  className={`w-full rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}
                  onClick={() => clearCart()}
                >
                  <Trash2 className={`h-4 w-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {t('clearCart', language)}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
