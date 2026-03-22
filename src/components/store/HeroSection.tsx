'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Truck, Shield, Headphones, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore, t } from '@/store/useStore';

export function HeroSection() {
  const { language } = useStore();
  const isArabic = language === 'ar';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
        
        {/* Floating Elements */}
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-20 ${isArabic ? 'left-[15%]' : 'right-[15%]'} text-6xl opacity-20`}
        >
          ✏️
        </motion.div>
        <motion.div
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-40 ${isArabic ? 'right-[20%]' : 'left-[20%]'} text-5xl opacity-20`}
        >
          📚
        </motion.div>
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-20 ${isArabic ? 'left-[25%]' : 'right-[25%]'} text-4xl opacity-20`}
        >
          🎨
        </motion.div>
        <motion.div
          animate={{ y: [15, -15, 15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-40 ${isArabic ? 'right-[15%]' : 'left-[15%]'} text-5xl opacity-20`}
        >
          🎒
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${isArabic ? '' : 'lg:grid-flow-col-dense'}`}>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-center lg:text-right ${isArabic ? '' : 'lg:col-start-2'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6"
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">{t('studentDiscount', language)}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              {t('heroTitle', language)}
              <br />
              <span className="bg-gradient-to-l from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('heroTitleHighlight', language)}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-teal-100 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              {t('heroSubtitle', language)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start ${isArabic ? '' : 'sm:flex-row-reverse'}`}
            >
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-gray-100 text-lg px-8 h-14 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('shopNow', language)}
                {isArabic ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/50 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-xl backdrop-blur-sm"
                onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('browseCategories', language)}
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`flex items-center justify-center lg:justify-start gap-8 mt-10 ${isArabic ? '' : 'flex-row-reverse'}`}
            >
              <div className="text-center">
                <p className="text-3xl font-bold">+5000</p>
                <p className="text-sm text-teal-200">{isArabic ? 'منتج' : 'Products'}</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-bold">+10000</p>
                <p className="text-sm text-teal-200">{isArabic ? 'عميل سعيد' : 'Happy Customers'}</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-bold">4.9</p>
                <p className="text-sm text-teal-200">{isArabic ? 'تقييم' : 'Rating'}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`hidden lg:block relative ${isArabic ? '' : 'lg:col-start-1'}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-3xl blur-3xl" />
              <motion.img
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                src="https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600"
                alt="Office supplies"
                className="relative z-10 w-full h-[500px] object-cover rounded-3xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: isArabic ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className={`absolute -bottom-6 ${isArabic ? '-right-6' : '-left-6'} bg-white text-gray-900 p-4 rounded-2xl shadow-xl z-20`}
              >
                <div className={`flex items-center gap-3 ${isArabic ? '' : 'flex-row-reverse'}`}>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <p className="font-bold">{isArabic ? 'توصيل مجاني' : 'Free Delivery'}</p>
                    <p className="text-sm text-gray-500">{t('freeShipping', language)}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className={`absolute -top-6 ${isArabic ? '-left-6' : '-right-6'} bg-white text-gray-900 p-4 rounded-2xl shadow-xl z-20`}
              >
                <div className={`flex items-center gap-3 ${isArabic ? '' : 'flex-row-reverse'}`}>
                  <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <p className="font-bold">{t('discount', language)} 30%</p>
                    <p className="text-sm text-gray-500">{isArabic ? 'على الموبايلات' : 'on Mobiles'}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Truck, title: t('fastDelivery', language), desc: isArabic ? 'خلال 24 ساعة' : 'Within 24 hours' },
            { icon: Shield, title: t('qualityGuarantee', language), desc: isArabic ? 'منتجات أصلية 100%' : '100% Original' },
            { icon: CreditCard, title: t('securePayment', language), desc: isArabic ? 'طرق دفع متعددة' : 'Multiple methods' },
            { icon: Headphones, title: t('support247', language), desc: isArabic ? 'خدمة على مدار الساعة' : 'Around the clock' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 ${isArabic ? '' : 'flex-row-reverse'}`}
            >
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-6 w-6" />
              </div>
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-teal-200">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
