'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Store, Award, Users, Truck, Shield, Target,
  Heart, Star, Clock, CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/hooks/useSettings';

export default function AboutPage() {
  const { language } = useStore();
  const { settings } = useSettings();
  const isArabic = language === 'ar';

  const storeName = isArabic 
    ? (settings.storeName || 'كمال سعد') 
    : (settings.storeNameEn || 'Kamal Saad');

  const content = {
    ar: {
      pageTitle: 'عن المتجر',
      pageSubtitle: 'تعرّف على قصتنا ورؤيتنا وقيمنا',
      backToHome: 'العودة للرئيسية',
      storyTitle: 'قصتنا',
      storyText: `نحن في ${storeName} نؤمن بأن المستلزمات المكتبية والمدرسية ليست مجرد منتجات، بل هي أدوات تمكّن الطلاب والموظفين من تحقيق إمكاناتهم الكاملة. بدأنا رحلتنا بهدف توفير أفضل المنتجات بأسعار مناسبة، مع التركيز على الجودة والخدمة المتميزة.

منذ تأسيس المتجر، عملنا بشغف لتكون الوجهة الأولى لكل ما يحتاجه الطلاب والمكاتب والمدارس. نحرص دائماً على اختيار منتجات عالية الجودة من أفضل العلامات التجارية المحلية والعالمية.`,
      missionTitle: 'رسالتنا',
      missionText: 'توفير مستلزمات مكتبية ومدرسية عالية الجودة بأسعار تنافسية، مع تقديم تجربة تسوق استثنائية تضمن رضا العملاء وتلبي تطلعاتهم.',
      visionTitle: 'رؤيتنا',
      visionText: 'أن نكون الخيار الأول والأفضل في مجال المستلزمات المكتبية والمدرسية في مصر والمنطقة العربية، من خلال الابتكار والجودة والتميز في الخدمة.',
      valuesTitle: 'قيمنا',
      values: [
        { icon: Shield, title: 'الجودة', desc: 'نلتزم بأعلى معايير الجودة في جميع منتجاتنا' },
        { icon: Heart, title: 'الخدمة المتميزة', desc: 'نضع العميل في قلب كل ما نقوم به' },
        { icon: Truck, title: 'التوصيل السريع', desc: 'نضمن توصيل طلباتك في أسرع وقت ممكن' },
        { icon: Star, title: 'التنوع', desc: 'نوفر تشكيلة واسعة من المنتجات المتنوعة' },
        { icon: Award, title: 'الأسعار المناسبة', desc: 'نقدم أفضل المنتجات بأسعار تنافسية' },
        { icon: Users, title: 'فريق محترف', desc: 'فريقنا متخصص ومدرب لتقديم أفضل خدمة' },
      ],
      statsTitle: 'أرقامنا تتحدث',
      stats: [
        { number: '+10', label: 'سنوات خبرة', icon: Clock },
        { number: '+5000', label: 'عميل سعيد', icon: Users },
        { number: '+1000', label: 'منتج متنوع', icon: Store },
        { number: '+50000', label: 'طلب مكتمل', icon: CheckCircle2 },
      ],
      whyUsTitle: 'لماذا تختارنا؟',
      whyUs: [
        'تشكيلة واسعة من المستلزمات المكتبية والمدرسية',
        'منتجات أصلية من أفضل العلامات التجارية',
        'أسعار تنافسية وعروض مميزة',
        'توصيل سريع وآمن لجميع المحافظات',
        'خدمة عملاء متاحة على مدار الساعة',
        'سياسة إرجاع وتبديل مرنة',
        'خيارات دفع متعددة وآمنة',
        'تغليف احترافي يحافظ على المنتجات',
      ],
      contactCta: 'تواصل معنا',
      contactCtaDesc: 'هل لديك استفسار؟ نحن هنا لمساعدتك',
    },
    en: {
      pageTitle: 'About Us',
      pageSubtitle: 'Learn about our story, vision, and values',
      backToHome: 'Back to Home',
      storyTitle: 'Our Story',
      storyText: `At ${storeName}, we believe that office and school supplies are not just products — they are tools that empower students and professionals to reach their full potential. We started our journey with the goal of providing the best products at affordable prices, with a focus on quality and exceptional service.

Since our founding, we have passionately worked to become the go-to destination for everything students, offices, and schools need. We always ensure to select high-quality products from the best local and international brands.`,
      missionTitle: 'Our Mission',
      missionText: 'To provide high-quality office and school supplies at competitive prices, while delivering an exceptional shopping experience that ensures customer satisfaction and meets their aspirations.',
      visionTitle: 'Our Vision',
      visionText: 'To be the first and best choice in office and school supplies in Egypt and the Arab region, through innovation, quality, and service excellence.',
      valuesTitle: 'Our Values',
      values: [
        { icon: Shield, title: 'Quality', desc: 'We adhere to the highest quality standards in all our products' },
        { icon: Heart, title: 'Excellent Service', desc: 'We put the customer at the heart of everything we do' },
        { icon: Truck, title: 'Fast Delivery', desc: 'We ensure your orders are delivered as quickly as possible' },
        { icon: Star, title: 'Variety', desc: 'We offer a wide range of diverse products' },
        { icon: Award, title: 'Fair Prices', desc: 'We provide the best products at competitive prices' },
        { icon: Users, title: 'Professional Team', desc: 'Our team is specialized and trained to provide the best service' },
      ],
      statsTitle: 'Our Numbers Speak',
      stats: [
        { number: '+10', label: 'Years of Experience', icon: Clock },
        { number: '+5000', label: 'Happy Customers', icon: Users },
        { number: '+1000', label: 'Diverse Products', icon: Store },
        { number: '+50000', label: 'Completed Orders', icon: CheckCircle2 },
      ],
      whyUsTitle: 'Why Choose Us?',
      whyUs: [
        'Wide range of office and school supplies',
        'Authentic products from the best brands',
        'Competitive prices and special offers',
        'Fast and secure delivery to all governorates',
        '24/7 customer service',
        'Flexible return and exchange policy',
        'Multiple secure payment options',
        'Professional packaging that protects products',
      ],
      contactCta: 'Contact Us',
      contactCtaDesc: 'Have a question? We are here to help',
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-l from-teal-600 to-cyan-600 py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white"
            >
              <Store className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{c.pageTitle}</h1>
              <p className="text-xl text-teal-100 max-w-2xl mx-auto">{c.pageSubtitle}</p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="mt-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isArabic ? <ArrowLeft className="h-4 w-4 ml-2 rotate-180" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                  {c.backToHome}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                  <Store className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                {c.storyTitle}
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {c.storyText.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{c.missionTitle}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.missionText}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{c.visionTitle}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.visionText}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">{c.statsTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {c.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 text-center">
                    <CardContent className="p-6">
                      <stat.icon className="h-8 w-8 text-teal-500 mx-auto mb-3" />
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.number}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">{c.valuesTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {c.values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <div className="h-14 w-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <value.icon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{value.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-l from-teal-600 to-cyan-600 rounded-2xl shadow-lg p-8 md:p-10"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-8">{c.whyUsTitle}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {c.whyUs.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-white/80 flex-shrink-0" />
                    <p className="text-white/90">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{c.contactCta}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{c.contactCtaDesc}</p>
              <Link href="/contact">
                <Button className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 h-12 rounded-xl shadow-lg">
                  {c.contactCta}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
