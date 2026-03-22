'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  ShoppingCart, Search, User, Menu, X, Heart, 
  Sun, Moon, Languages, Flame, Package, Settings, LogOut, MapPin, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, t } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

const navItems = [
  { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: Flame, href: '/' },
  { id: 'new', labelAr: 'المنتجات الحديثة', labelEn: 'New Products', href: '/?sort=new' },
  { id: 'offers', labelAr: 'أفضل العروض', labelEn: 'Best Offers', href: '/?sort=offers' },
  { id: 'featured', labelAr: 'المنتجات المميزة', labelEn: 'Featured', href: '/?sort=featured' },
  { id: 'recommended', labelAr: 'المنتجات الموصى بها', labelEn: 'Recommended', href: '/?sort=recommended' },
  { id: 'bestseller', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Selling', href: '/?sort=bestseller' },
  { id: 'special', labelAr: 'عروض خاصة', labelEn: 'Special Offers', href: '/?sort=special' },
  { id: 'support', labelAr: 'خدمات العملاء', labelEn: 'Customer Service', href: '/contact' },
  { id: 'about', labelAr: 'عن المتجر', labelEn: 'About Us', href: '/about' },
];

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  const { 
    items, toggleCart, toggleAuthModal, user, searchQuery, setSearchQuery,
    theme, toggleTheme, language, toggleLanguage, favorites, logout
  } = useStore();

  const isArabic = language === 'ar';
  const favoritesCount = favorites.length;

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    window.location.href = '/?search=' + encodeURIComponent(localSearch);
  };

  const handleLogout = async () => {
    logout();
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header 
      className="sticky top-0 z-50"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Main Header - White Section */}
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative h-12 lg:h-14 w-12 lg:w-14 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-100 dark:ring-blue-800 bg-white"
              >
                <img
                  src="/logo.png"
                  alt="Kamal Saad Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-400">
                    KMS
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isArabic ? 'كمال محمد سعد' : 'Kamal Mohamed Saad'}
                  </span>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder', language)}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className={`w-full h-11 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 rounded-r-xl transition-all duration-300 ${
                    isArabic ? 'pr-4 pl-24 text-right' : 'pl-4 pr-24 text-left'
                  }`}
                />
                <Button
                  type="submit"
                  className={`absolute top-0 h-11 px-4 bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-xl ${
                    isArabic ? 'left-0 rounded-l-xl rounded-r-none' : 'right-0 rounded-r-xl rounded-l-none'
                  }`}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title={isArabic ? 'English' : 'العربية'}
              >
                <Languages className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title={theme === 'dark' ? t('lightMode', language) : t('darkMode', language)}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </Button>

              {/* Favorites */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30"
                onClick={() => useStore.getState().toggleFavorites()}
              >
                <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <AnimatePresence>
                  {favoritesCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center bg-rose-500 text-white text-xs rounded-full font-bold"
                    >
                      {favoritesCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full font-bold"
                    >
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex gap-2 h-9 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {user.name?.charAt(0) || 'K'}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isArabic ? 'start' : 'end'} className="w-56">
                    <DropdownMenuLabel className={isArabic ? 'text-right' : 'text-left'}>
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile" className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                        <User className="h-4 w-4" />
                        <span>{t('myProfile', language)}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/orders" className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                        <Package className="h-4 w-4" />
                        <span>{t('myOrders', language)}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile?tab=addresses" className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                        <MapPin className="h-4 w-4" />
                        <span>{t('myAddresses', language)}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/contact" className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                        <MessageCircle className="h-4 w-4" />
                        <span>{t('contactUs', language)}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className={`text-red-500 focus:text-red-500 cursor-pointer ${isArabic ? 'flex-row-reverse justify-start' : ''}`}
                    >
                      <LogOut className={`h-4 w-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                      <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="hidden md:flex gap-2 h-9 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  onClick={() => toggleAuthModal('login')}
                >
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{t('login', language)}</span>
                </Button>
              )}

              {/* Menu Button - Orange */}
              <Button
                onClick={onMenuClick}
                className="h-9 gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex-shrink-0 lg:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="hidden sm:inline text-sm">{isArabic ? 'القائمة الرئيسية' : 'Menu'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Blue */}
      <div className="bg-blue-600 dark:bg-blue-700 shadow-md hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            {/* Categories Menu Button */}
            <Button
              onClick={onMenuClick}
              className="h-12 px-4 gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-none flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="font-medium">{isArabic ? 'القائمة الرئيسية' : 'Main Menu'}</span>
            </Button>

            {/* Navigation Links */}
            <nav className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
              {navItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-3 text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors whitespace-nowrap text-sm font-medium ${
                    index === 0 ? (isArabic ? 'border-r border-blue-500' : 'border-l border-blue-500') : ''
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{isArabic ? item.labelAr : item.labelEn}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-lg"
          >
            <div className="container mx-auto px-4 py-4">
              <form onSubmit={handleSearch} className="mb-4">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder', language)}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </form>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {item.icon && <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                  </Link>
                ))}
              </nav>
              {user ? (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.charAt(0) || 'K'}
                    </div>
                    <span>{user.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 rounded-xl text-red-500 mt-2"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    {isArabic ? 'تسجيل الخروج' : 'Logout'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 rounded-xl text-gray-700 dark:text-gray-300 mt-4"
                  onClick={() => {
                    toggleAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <User className="h-5 w-5" />
                  {t('login', language)}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Bar */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-2">
        <form onSubmit={handleSearch}>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder={t('searchPlaceholder', language)}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`w-full h-10 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-r-lg ${
                isArabic ? 'pr-3 pl-20 text-right' : 'pl-3 pr-20 text-left'
              }`}
            />
            <Button
              type="submit"
              className={`absolute top-0 h-10 px-3 bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-lg ${
                isArabic ? 'left-0 rounded-l-lg rounded-r-none' : 'right-0 rounded-r-lg rounded-l-none'
              }`}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </header>
  );
}
