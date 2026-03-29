'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Shield, Clock, CreditCard, Wallet, Smartphone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

interface PaymentOptionsProps {
  total: number;
  onPaymentSuccess: (paymentData: PaymentData) => void;
  onPaymentError: (error: string) => void;
}

export interface PaymentData {
  method: 'card' | 'wallet' | 'kiosk' | 'cod';
  transactionId?: string;
  referenceNumber?: string;
  paymentUrl?: string;
  walletNumber?: string;
}

export function PaymentOptions({ total, onPaymentSuccess, onPaymentError }: PaymentOptionsProps) {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet' | 'kiosk' | 'cod'>('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const [billReference, setBillReference] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: 'card' as const,
      name: isArabic ? 'بطاقة ائتمانية' : 'Credit Card',
      description: isArabic ? 'فيزا، ماستركارد، Meeza' : 'Visa, MasterCard, Meeza',
      icon: CreditCard,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      fees: 0,
    },
    {
      id: 'wallet' as const,
      name: isArabic ? 'محفظة إلكترونية' : 'Mobile Wallet',
      description: isArabic ? 'فودافون كاش، أورانج، إتصالات' : 'Vodafone Cash, Orange, Etisalat',
      icon: Smartphone,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      fees: 0,
    },
    {
      id: 'kiosk' as const,
      name: isArabic ? 'فوري / أجري' : 'Fawry / Aman',
      description: isArabic ? 'ادفع من أي منفذ فوري أو أجري' : 'Pay at any Fawry or Aman outlet',
      icon: Building2,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      fees: 0,
    },
    {
      id: 'cod' as const,
      name: isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      description: isArabic ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order',
      icon: Wallet,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
      fees: 15,
    },
  ];

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // For COD, just call success directly
      if (selectedMethod === 'cod') {
        onPaymentSuccess({
          method: 'cod',
        });
        return;
      }

      // For wallet payment, include the wallet number
      if (selectedMethod === 'wallet') {
        if (walletNumber.length < 11) {
          onPaymentError(isArabic ? 'رقم المحفظة غير صالح' : 'Invalid wallet number');
          return;
        }
        onPaymentSuccess({
          method: 'wallet',
          walletNumber: walletNumber,
        });
        return;
      }

      // For card and kiosk payments
      onPaymentSuccess({
        method: selectedMethod,
      });

    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;
          
          return (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-start ${
                isSelected 
                  ? `${method.borderColor} ${method.bgColor} shadow-lg` 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} h-7 w-7 rounded-full flex items-center justify-center bg-gradient-to-r ${method.color}`}
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.color} shadow-md flex-shrink-0`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{method.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                  {method.fees > 0 && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-medium">
                      +{method.fees} {isArabic ? 'ج.م رسوم' : 'EGP fees'}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Wallet Number Input */}
      <AnimatePresence mode="wait">
        {selectedMethod === 'wallet' && (
          <motion.div
            key="wallet-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                  {isArabic ? 'الدفع بالمحفظة' : 'Wallet Payment'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'أدخل رقم المحفظة' : 'Enter your wallet number'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{isArabic ? 'رقم المحفظة' : 'Wallet Number'}</Label>
              <Input
                type="tel"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="h-12 rounded-xl"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                {isArabic ? 'فودافون كاش، أورانج موني، إتصالات كاش' : 'Vodafone Cash, Orange Money, Etisalat Cash'}
              </p>
            </div>
          </motion.div>
        )}

        {/* COD Info */}
        {selectedMethod === 'cod' && (
          <motion.div
            key="cod-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border-2 border-teal-200 dark:border-teal-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                  {isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order'}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-teal-200 dark:border-teal-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {isArabic ? 'رسوم الدفع عند الاستلام' : 'COD fees'}
                </span>
                <span className="font-bold text-teal-600">15 {isArabic ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-teal-200 dark:border-teal-700">
                <span className="font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'الإجمالي المستحق' : 'Amount due'}
                </span>
                <span className="font-bold text-2xl text-teal-600">
                  {(total + 15).toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-2">
        <Shield className="h-4 w-4" />
        <span>{isArabic ? 'جميع المعاملات مشفرة وآمنة' : 'All transactions are secure'}</span>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isLoading || (selectedMethod === 'wallet' && walletNumber.length < 11)}
        className="w-full h-16 text-lg font-bold bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            {selectedMethod === 'cod' 
              ? (isArabic ? 'تأكيد الطلب' : 'Confirm Order')
              : (isArabic ? 'إتمام الدفع' : 'Complete Payment')
            }
            <span className="mx-3 text-xl">
              {selectedMethod === 'cod' 
                ? (total + 15).toLocaleString()
                : total.toLocaleString()
              } {isArabic ? 'ج.م' : 'EGP'}
            </span>
          </>
        )}
      </Button>
    </div>
  );
}
