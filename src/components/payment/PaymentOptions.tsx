'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Building2, Wallet, Check, Loader2, Lock, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore, t } from '@/store/useStore';

interface PaymentOptionsProps {
  total: number;
  onPaymentSuccess: (paymentData: PaymentData) => void;
  onPaymentError: (error: string) => void;
}

export interface PaymentData {
  method: 'paymob' | 'fawry' | 'valu' | 'cod';
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
  const [selectedMethod, setSelectedMethod] = useState<'paymob' | 'fawry' | 'valu' | 'cod'>('paymob');
  const [isLoading, setIsLoading] = useState(false);
  const [valuMonths, setValuMonths] = useState(3);

  // Paymob card form state
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  // Fawry phone number
  const [fawryPhone, setFawryPhone] = useState('');

  const paymentMethods = [
    {
      id: 'paymob' as const,
      name: isArabic ? 'بطاقة ائتمان (Paymob)' : 'Credit Card (Paymob)',
      icon: CreditCard,
      description: isArabic ? 'ادفع بأمان باستخدام فيزا أو ماستر كارد' : 'Pay securely with Visa or MasterCard',
      color: 'from-blue-600 to-indigo-600',
      fees: 0,
    },
    {
      id: 'fawry' as const,
      name: isArabic ? 'فوري (Fawry)' : 'Fawry',
      icon: Building2,
      description: isArabic ? 'ادفع نقداً في أقرب منفذ فوري' : 'Pay cash at nearest Fawry outlet',
      color: 'from-orange-500 to-red-500',
      fees: 0,
    },
    {
      id: 'valu' as const,
      name: isArabic ? 'فالي التقسيط (Valu)' : 'Valu Installments',
      icon: Wallet,
      description: isArabic ? 'اشترِ الآن وادفع لاحقاً بدون فوائد' : 'Buy now, pay later with 0% interest',
      color: 'from-purple-600 to-pink-600',
      fees: 0,
      minAmount: 500,
    },
    {
      id: 'cod' as const,
      name: isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      icon: Clock,
      description: isArabic ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order',
      color: 'from-teal-600 to-cyan-600',
      fees: 15,
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
        // Simulate Paymob payment
        const response = await fetch('/api/payment/paymob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            cardData: {
              ...cardData,
              // Mask sensitive data
              cardNumber: cardData.cardNumber.slice(-4),
            },
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          onPaymentSuccess({
            method: 'paymob',
            transactionId: data.transactionId,
          });
        } else {
          onPaymentError(data.error || (isArabic ? 'فشل في عملية الدفع' : 'Payment failed'));
        }
      } else if (selectedMethod === 'fawry') {
        // Generate Fawry reference
        const response = await fetch('/api/payment/fawry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            phone: fawryPhone,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          onPaymentSuccess({
            method: 'fawry',
            referenceNumber: data.referenceNumber,
          });
        } else {
          onPaymentError(data.error || (isArabic ? 'فشل في إنشاء مرجع فوري' : 'Failed to generate Fawry reference'));
        }
      } else if (selectedMethod === 'valu') {
        // Valu payment
        const response = await fetch('/api/payment/valu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            months: valuMonths,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          onPaymentSuccess({
            method: 'valu',
            transactionId: data.transactionId,
            installmentPlan: calculateValuInstallment(),
          });
        } else {
          onPaymentError(data.error || (isArabic ? 'فشل في عملية التقسيط' : 'Installment failed'));
        }
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

  const isValidPayment = () => {
    if (selectedMethod === 'paymob') {
      return cardData.cardNumber.length >= 16 && 
             cardData.cardHolder.length >= 3 && 
             cardData.expiryDate.length >= 4 && 
             cardData.cvv.length >= 3;
    }
    if (selectedMethod === 'fawry') {
      return fawryPhone.length >= 10;
    }
    if (selectedMethod === 'valu') {
      return total >= 500;
    }
    return true;
  };

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const isDisabled = method.id === 'valu' && total < (method.minAmount || 0);
          
          return (
            <motion.button
              key={method.id}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              onClick={() => !isDisabled && setSelectedMethod(method.id)}
              disabled={isDisabled}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-start ${
                isSelected 
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 end-3 h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}
              
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${method.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{method.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                  {method.fees > 0 && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                      +{method.fees} {isArabic ? 'ج.م رسوم' : 'EGP fees'}
                    </p>
                  )}
                  {isDisabled && (
                    <p className="text-xs text-red-500 mt-1">
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
        {selectedMethod === 'paymob' && (
          <motion.div
            key="paymob-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'اتصال آمن ومشفر' : 'Secure encrypted connection'}
              </span>
            </div>
            
            <div className="space-y-2">
              <Label>{isArabic ? 'رقم البطاقة' : 'Card Number'}</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                className="h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{isArabic ? 'اسم حامل البطاقة' : 'Card Holder Name'}</Label>
              <Input
                placeholder={isArabic ? 'أحمد محمد' : 'John Doe'}
                value={cardData.cardHolder}
                onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label>
                <Input
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  type="password"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              <span>{isArabic ? 'بياناتك محمية ومشفرة بالكامل' : 'Your data is fully encrypted and protected'}</span>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'fawry' && (
          <motion.div
            key="fawry-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'الدفع عبر فوري' : 'Pay via Fawry'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'سيتم إرسال رقم مرجعي للدفع' : 'A reference number will be sent for payment'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
              <Input
                placeholder="01xxxxxxxxx"
                value={fawryPhone}
                onChange={(e) => setFawryPhone(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {isArabic 
                  ? 'سيتم إرسال رقم مرجعي إلى هاتفك. يمكنك الدفع نقداً في أي منفذ فوري خلال 24 ساعة.'
                  : 'A reference number will be sent to your phone. You can pay cash at any Fawry outlet within 24 hours.'
                }
              </p>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'valu' && total >= 500 && (
          <motion.div
            key="valu-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'التقسيط مع فالي' : 'Installments with Valu'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'بدون فوائد - اشترِ الآن وادفع لاحقاً' : '0% interest - Buy now, pay later'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>{isArabic ? 'اختر عدد الأقساط' : 'Select number of installments'}</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 9, 12].map((months) => (
                  <button
                    key={months}
                    onClick={() => setValuMonths(months)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      valuMonths === months
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <span className="font-bold text-gray-900 dark:text-white">{months}</span>
                    <span className="block text-xs text-gray-500">{isArabic ? 'شهر' : 'months'}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
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
                <span className="text-gray-700 dark:text-gray-300">
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
            className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order'}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {isArabic ? 'رسوم الدفع عند الاستلام' : 'COD fees'}
                </span>
                <span className="font-bold text-teal-600">15 {isArabic ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-teal-200 dark:border-teal-700">
                <span className="font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'الإجمالي المستحق' : 'Amount due'}
                </span>
                <span className="font-bold text-xl text-teal-600">
                  {(total + 15).toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={!isValidPayment() || isLoading}
        className="w-full h-14 text-lg font-bold bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {selectedMethod === 'cod' 
              ? (isArabic ? 'تأكيد الطلب' : 'Confirm Order')
              : (isArabic ? 'إتمام الدفع' : 'Complete Payment')
            }
            <span className="mx-2">
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
