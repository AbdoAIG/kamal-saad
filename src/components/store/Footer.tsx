'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Facebook, Instagram, Youtube,
  CreditCard, Shield, Truck, Clock, Heart, MessageCircle
} from 'lucide-react';

// X (Twitter) Icon Component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { useStore, t } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';

export function Footer() {
  const { language } = useStore();
  const { settings } = useSettings();
  const isArabic = language === 'ar';

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Newsletter Section */}
      <div className="bg-gradient-to-l from-teal-600 to-cyan-600">
        <div className="container mx-auto px-4 py-10">
          <div className={`flex flex-col md:flex-row items-center justify-between gap-6 ${isArabic ? 'md:flex-row-reverse' : ''}`}>
            <div className={`text-center ${isArabic ? 'md:text-right' : 'md:text-left'}`}>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('newsletter', language)}
              </h3>
              <p className="text-teal-100">
                {t('newsletterDesc', language)}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder={t('emailPlaceholder', language)}
                className={`flex-1 md:w-80 px-5 py-3 rounded-xl ${isArabic ? 'text-right' : 'text-left'} bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50`}
              />
              <button className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                {t('subscribe', language)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 ${isArabic ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className={`flex items-center gap-3 mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className="relative h-16 w-16 rounded-xl overflow-hidden shadow-lg ring-2 ring-teal-100">
                <img
                  src="/logo.png"
                  alt="Kamal Saad Logo"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <span className="text-2xl font-bold text-white">{isArabic ? settings.storeName : settings.storeNameEn}</span>
                <p className="text-xs text-gray-400">{t('siteSlogan', language)}</p>
              </div>
            </div>
            <p className={`text-gray-400 leading-relaxed mb-6 max-w-md ${isArabic ? 'text-right' : 'text-left'}`}>
              {isArabic 
                ? 'متجرك الإلكتروني الأول لجميع المستلزمات المدرسية والمكتبية. نقدم منتجات عالية الجودة بأسعار منافسة مع خدمة توصيل سريعة وآمنة لجميع أنحاء مصر.'
                : 'Your first online destination for all school and office supplies. We offer high quality products at competitive prices with fast and secure delivery across Egypt.'}
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: Truck, text: t('fastDelivery', language) },
                { icon: Shield, text: t('qualityGuarantee', language) },
                { icon: CreditCard, text: t('securePayment', language) },
                { icon: Clock, text: t('support247', language) },
              ].map((feature, idx) => (
                <div key={idx} className={`flex items-center gap-3 bg-gray-800 p-3 rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <feature.icon className="h-5 w-5 text-teal-400 flex-shrink-0" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Social Media Buttons */}
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-3">{isArabic ? 'تابعنا على:' : 'Follow us:'}</p>
              <div className="flex gap-3 flex-wrap">
                {/* Facebook */}
                <motion.a
                  href={settings.facebook || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-11 w-11 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5 text-white" />
                </motion.a>
                
                {/* Instagram */}
                <motion.a
                  href={settings.instagram || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-11 w-11 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5 text-white" />
                </motion.a>
                
                {/* YouTube */}
                <motion.a
                  href={settings.youtube || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-11 w-11 bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  title="YouTube"
                >
                  <Youtube className="h-5 w-5 text-white" />
                </motion.a>
                
                {/* WhatsApp */}
                <motion.a
                  href={settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-11 w-11 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 text-white" />
                </motion.a>
                
                {/* X (Twitter) */}
                <motion.a
                  href={settings.twitter || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-11 w-11 bg-black hover:bg-gray-800 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  title="X (Twitter)"
                >
                  <XIcon className="h-5 w-5 text-white" />
                </motion.a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h3 className="text-white font-bold text-lg mb-6">{t('quickLinks', language)}</h3>
            <ul className="space-y-3">
              {[
                { label: t('aboutUs', language), href: '/' },
                { label: t('contactUs', language), href: '/contact' },
                { label: t('privacyPolicy', language), href: '/terms' },
                { label: t('offers', language), href: '/?sort=offers' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="hover:text-teal-400 transition-colors flex items-center gap-2">
                    {isArabic && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                    {link.label}
                    {!isArabic && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h3 className="text-white font-bold text-lg mb-6">{t('categories', language)}</h3>
            <ul className="space-y-3">
              {[
                isArabic ? 'أقلام ومصنفات' : 'Pens & Pencils',
                isArabic ? 'دفاتر وكراسات' : 'Notebooks',
                isArabic ? 'حقائب مدرسية' : 'School Bags',
                isArabic ? 'أدوات فنية' : 'Art Supplies',
                isArabic ? 'أدوات مكتبية' : 'Office Tools',
                isArabic ? 'أدوات تعليمية' : 'Educational',
              ].map((cat, idx) => (
                <li key={idx}>
                  <Link href="/" className="hover:text-teal-400 transition-colors flex items-center gap-2">
                    {isArabic && <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />}
                    {cat}
                    {!isArabic && <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h3 className="text-white font-bold text-lg mb-6">{t('contactUs', language)}</h3>
            <ul className="space-y-4">
              <li className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                <div className="h-10 w-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-teal-400" />
                </div>
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="text-xs text-gray-500">{t('callUs', language)}</p>
                  <p className="font-medium text-white">{settings.phone}</p>
                </div>
              </li>
              <li className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                <div className="h-10 w-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-teal-400" />
                </div>
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="text-xs text-gray-500">{isArabic ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium text-white">{settings.email}</p>
                </div>
              </li>
              <li className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                <div className="h-10 w-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-teal-400" />
                </div>
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="text-xs text-gray-500">{isArabic ? 'العنوان' : 'Address'}</p>
                  <p className="font-medium text-white">{settings.address}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>


      </div>

      {/* Bottom - Copyright */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <p className="text-sm text-gray-400">
                {isArabic ? (
                  <>
                    © 2026 <span className="text-teal-400 font-bold">{settings.storeName}</span>. جميع الحقوق محفوظة. 
                    <span className="text-gray-500 mx-1">|</span>
                    تصميم وتطوير <span className="text-cyan-400 font-medium">AbdoAIG - عبدالرحمن إبراهيم</span>
                  </>
                ) : (
                  <>
                    © 2026 <span className="text-teal-400 font-bold">{settings.storeNameEn}</span>. All Rights Reserved.
                    <span className="text-gray-500 mx-1">|</span>
                    Designed & Developed by <span className="text-cyan-400 font-medium">AbdoAIG - Abdelrahman Ibrahim</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
