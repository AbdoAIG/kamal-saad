'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Shield, Clock, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';

interface PaymentOptionsProps {
  total: number;
  onPaymentSuccess: (paymentData: PaymentData) => void;
  onPaymentError: (error: string) => void;
}

export interface PaymentData {
  method: 'paymob' | 'vodafone' | 'valu' | 'cod';
  transactionId?: string;
  referenceNumber?: string;
  installmentPlan?: {
    months: number;
    monthlyAmount: number;
    totalAmount: number;
  };
}

export function PaymentOptions({ total, onPaymentSuccess, onPaymentError }: PaymentOptionsProps) {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [selectedMethod, setSelectedMethod] = useState<'paymob' | 'vodafone' | 'valu' | 'cod'>('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [valuMonths, setValuMonths] = useState(3);

  const paymentMethods = [
    {
      id: 'paymob' as const,
      name: isArabic ? 'باي موب' : 'Paymob',
      nameAr: 'باي موب',
      description: isArabic ? 'ادفع بأمان باستخدام فيزا أو ماستركارد' : 'Pay securely with Visa or MasterCard',
      icon: 'paymob',
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      fees: 0,
      logo: '/payment/paymob.png',
    },
    {
      id: 'vodafone' as const,
      name: isArabic ? 'فودافون كاش' : 'Vodafone Cash',
      nameAr: 'فودافون كاش',
      description: isArabic ? 'ادفع مباشرة من محفظتك' : 'Pay directly from your wallet',
      icon: 'vodafone',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      fees: 0,
      logo: '/payment/vodafone.png',
    },
    {
      id: 'valu' as const,
      name: isArabic ? 'فاليو' : 'Valu',
      nameAr: 'فاليو',
      description: isArabic ? 'قسط الآن وادفع لاحقاً بدون فوائد' : 'Buy now, pay later with 0% interest',
      icon: 'valu',
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      fees: 0,
      minAmount: 500,
      logo: '/payment/valu.png',
    },
    {
      id: 'cod' as const,
      name: isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      nameAr: 'الدفع عند الاستلام',
      description: isArabic ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order',
      icon: 'cod',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      fees: 15,
      logo: null,
    },
  ];

  // Valu installment calculation
  const calculateValuInstallment = () => {
    const monthlyAmount = Math.ceil(total / valuMonths);
    return {
      months: valuMonths,
      monthlyAmount,
      totalAmount: monthlyAmount * valuMonths,
    };
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      if (selectedMethod === 'paymob') {
        // Paymob payment - simulate for now
        const transactionId = `PAYMOB-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        onPaymentSuccess({
          method: 'paymob',
          transactionId,
        });
      } else if (selectedMethod === 'vodafone') {
        // Vodafone Cash - simulate for now
        const transactionId = `VF-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        onPaymentSuccess({
          method: 'vodafone',
          transactionId,
        });
      } else if (selectedMethod === 'valu') {
        // Valu payment
        const transactionId = `VALU-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        onPaymentSuccess({
          method: 'valu',
          transactionId,
          installmentPlan: calculateValuInstallment(),
        });
      } else {
        // Cash on delivery
        onPaymentSuccess({
          method: 'cod',
        });
      }
    } catch {
      onPaymentError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = selectedMethod === 'valu' && total < 500;

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isMethodDisabled = method.id === 'valu' && total < (method.minAmount || 0);
          
          return (
            <motion.button
              key={method.id}
              whileHover={{ scale: isMethodDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isMethodDisabled ? 1 : 0.98 }}
              onClick={() => !isMethodDisabled && setSelectedMethod(method.id)}
              disabled={isMethodDisabled}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-start ${
                isSelected 
                  ? `${method.borderColor} ${method.bgColor} shadow-lg` 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${isMethodDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                {/* Payment Logo/Icon */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.color} shadow-md flex-shrink-0`}>
                  {method.id === 'paymob' && (
                    <span className="text-white font-bold text-lg">Paymob</span>
                  )}
                  {method.id === 'vodafone' && (
                    <span className="text-white font-bold text-sm">Vodafone</span>
                  )}
                  {method.id === 'valu' && (
                    <span className="text-white font-bold text-lg">Valu</span>
                  )}
                  {method.id === 'cod' && (
                    <CreditCard className="h-8 w-8 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{method.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                  {method.fees > 0 && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-medium">
                      +{method.fees} {isArabic ? 'ج.م رسوم' : 'EGP fees'}
                    </p>
                  )}
                  {isMethodDisabled && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      {isArabic ? `الحد الأدنى ${method.minAmount} ج.م` : `Minimum ${method.minAmount} EGP`}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Payment Details Forms */}
      <AnimatePresence mode="wait">
        {selectedMethod === 'valu' && total >= 500 && (
          <motion.div
            key="valu-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                  {isArabic ? 'التقسيط مع فاليو' : 'Installments with Valu'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'بدون فوائد - اشترِ الآن وادفع لاحقاً' : '0% interest - Buy now, pay later'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isArabic ? 'اختر عدد الأقساط' : 'Select number of installments'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 9, 12].map((months) => (
                  <button
                    key={months}
                    onClick={() => setValuMonths(months)}
                    className={`p-3 rounded-xl border-2 transition-all font-bold ${
                      valuMonths === months
                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{months}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isArabic ? 'شهر' : 'months'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {isArabic ? 'القسط الشهري' : 'Monthly installment'}
                </span>
                <span className="font-bold text-xl text-purple-600">
                  {calculateValuInstallment().monthlyAmount.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-500">{isArabic ? 'الإجمالي' : 'Total'}</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {calculateValuInstallment().totalAmount.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

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
        <span>{isArabic ? 'جميع المعاملات مشفرة وآمنة' : 'All transactions are secure and encrypted'}</span>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isDisabled || isLoading}
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
