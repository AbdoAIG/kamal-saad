'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Home, Grid3X3, Tags, Percent, Heart, 
  ShoppingBag, Truck, HelpCircle, Phone, 
  FileText, Settings, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore, t } from '@/store/useStore';
import { Category } from '@prisma/client';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function Sidebar({ isOpen, onClose, categories, selectedCategory, onCategorySelect }: SidebarProps) {
  const { language } = useStore();
  const isArabic = language === 'ar';

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const mainLinks = [
    { href: '/', icon: Home, label: isArabic ? 'الرئيسية' : 'Home' },
    { href: '#products-section', icon: Grid3X3, label: isArabic ? 'جميع المنتجات' : 'All Products' },
    { href: '#', icon: Tags, label: isArabic ? 'العروض' : 'Offers' },
    { href: '#', icon: Percent, label: isArabic ? 'التخفيضات' : 'Discounts' },
    { href: '#', icon: Heart, label: isArabic ? 'المفضلة' : 'Favorites' },
  ];

  const categoryIcons: { [key: string]: string } = {
    'أقلام': '🖊️',
    'دفاتر': '📓',
    'أدوات مدرسية': '🎒',
    'أدوات مكتبية': '📋',
    'ألوان': '🎨',
    'أدوات رسم': '✏️',
    'مستلزمات': '📦',
  };

  const quickLinks = [
    { href: '#', icon: ShoppingBag, label: isArabic ? 'تتبع الطلب' : 'Track Order' },
    { href: '#', icon: Truck, label: isArabic ? 'الشحن والتوصيل' : 'Shipping' },
    { href: '#', icon: HelpCircle, label: isArabic ? 'الأسئلة الشائعة' : 'FAQ' },
    { href: '#', icon: Phone, label: isArabic ? 'اتصل بنا' : 'Contact Us' },
  ];

  const handleCategoryClick = (categoryId: string | null) => {
    onCategorySelect(categoryId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: isArabic ? 320 : -320 }}
            animate={{ x: 0 }}
            exit={{ x: isArabic ? 320 : -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isArabic ? 'right-0' : 'left-0'} h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden`}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-l from-teal-600 to-cyan-600">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-white shadow-lg">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{t('siteName', language)}</h2>
                    <p className="text-xs text-white/80">{isArabic ? 'تصفح الأقسام' : 'Browse Categories'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Main Links */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {isArabic ? 'القائمة الرئيسية' : 'Main Menu'}
                  </h3>
                  <nav className="space-y-1">
                    {mainLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
                      >
                        <link.icon className="h-5 w-5 text-gray-400 group-hover:text-teal-500" />
                        <span className="font-medium">{link.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Categories */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {isArabic ? 'الأقسام' : 'Categories'}
                  </h3>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleCategoryClick(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                        selectedCategory === null
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">🏪</span>
                      <span className="font-medium">{isArabic ? 'جميع الأقسام' : 'All Categories'}</span>
                      {selectedCategory === null && (
                        <ChevronLeft className={`h-4 w-4 ${isArabic ? 'mr-auto' : 'ml-auto rotate-180'}`} />
                      )}
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                          selectedCategory === category.id
                            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="text-xl">
                          {categoryIcons[category.nameAr] || categoryIcons[category.name] || '📦'}
                        </span>
                        <span className="font-medium">
                          {isArabic ? category.nameAr || category.name : category.name}
                        </span>
                        {selectedCategory === category.id && (
                          <ChevronLeft className={`h-4 w-4 ${isArabic ? 'mr-auto' : 'ml-auto rotate-180'}`} />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Links */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {isArabic ? 'روابط سريعة' : 'Quick Links'}
                  </h3>
                  <nav className="space-y-1">
                    {quickLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <link.icon className="h-5 w-5 text-gray-400 group-hover:text-teal-500" />
                        <span className="font-medium">{link.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Help Section */}
                <div className="p-4">
                  <div className="bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {isArabic 
                        ? 'تواصل مع فريق الدعم الخاص بنا' 
                        : 'Contact our support team'
                      }
                    </p>
                    <Button className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl">
                      <Phone className="h-4 w-4 mr-2" />
                      {isArabic ? 'اتصل بنا' : 'Contact Us'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <Link href="#" className="hover:text-teal-600">{isArabic ? 'سياسة الخصوصية' : 'Privacy'}</Link>
                  <span>•</span>
                  <Link href="#" className="hover:text-teal-600">{isArabic ? 'الشروط' : 'Terms'}</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
