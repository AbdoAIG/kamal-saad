'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  ShoppingCart, Search, User, Menu, X, Heart, Bell, 
  Sun, Moon, Languages, LayoutGrid, Package, Settings, LogOut, MapPin, MessageCircle
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
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { 
    items, toggleCart, toggleAuthModal, user, searchQuery, setSearchQuery,
    theme, toggleTheme, language, toggleLanguage, favorites, toggleFavorites, logout
  } = useStore();

  const isArabic = language === 'ar';
  const favoritesCount = favorites.length;

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Apply theme on mount
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
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white dark:bg-gray-900'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-28 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            {/* Categories Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-12 w-12 rounded-xl bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <LayoutGrid className="h-6 w-6" />
            </Button>
            <motion.div 
              whileHover={{ scale: 1.08 }}
              className="relative h-20 w-20 rounded-xl overflow-hidden shadow-xl ring-2 ring-teal-100 dark:ring-teal-800 bg-white"
            >
              <img
                src="/logo.png"
                alt="Kamal Saad Logo"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div className="block">
              <span className="text-3xl font-bold bg-gradient-to-l from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {t('siteName', language)}
              </span>
              <p className={`text-xs text-gray-500 dark:text-gray-400 ${isArabic ? '-mt-1' : 'mt-0'}`}>
                {t('siteSlogan', language)}
              </p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full group">
              <Input
                type="text"
                placeholder={t('searchPlaceholder', language)}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className={`w-full h-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl transition-all duration-300 ${
                  isArabic ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
                }`}
              />
              <Button
                type="submit"
                size="icon"
                className={`absolute top-1 h-10 w-10 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg ${
                  isArabic ? 'right-1' : 'left-1'
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
              className="h-10 w-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
              title={isArabic ? 'English' : 'العربية'}
            >
              <Languages className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
              title={theme === 'dark' ? t('lightMode', language) : t('darkMode', language)}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </Button>

            {/* Notifications */}
            {user && <NotificationDropdown />}

            {/* Favorites */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30"
              onClick={toggleFavorites}
            >
              <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <AnimatePresence>
                {favoritesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center bg-gradient-to-l from-rose-500 to-pink-500 text-white text-xs rounded-full font-bold"
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
              className="relative h-10 w-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center bg-gradient-to-l from-teal-500 to-cyan-500 text-white text-xs rounded-full font-bold"
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
                  <Button variant="ghost" size="sm" className="hidden md:flex gap-2 h-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.charAt(0) || 'K'}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{user.name}</span>
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
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile?tab=loyalty" className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-start' : ''}`}>
                      <Settings className="h-4 w-4" />
                      <span>{t('loyaltyPoints', language)}</span>
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
                className="hidden md:flex gap-2 h-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
                onClick={() => toggleAuthModal('login')}
              >
                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300">{t('login', language)}</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5 text-gray-600 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden py-4 border-t dark:border-gray-700"
            >
              <form onSubmit={handleSearch} className="mb-4">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder', language)}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </form>
              <div className="flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                        {user.name?.charAt(0) || 'K'}
                      </div>
                      <span>{user.name}</span>
                    </div>
                    <Button variant="ghost" asChild className="justify-start gap-2 rounded-xl text-gray-700 dark:text-gray-300">
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-5 w-5" />
                        {t('myProfile', language)}
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start gap-2 rounded-xl text-gray-700 dark:text-gray-300">
                      <Link href="/orders" onClick={() => setIsMenuOpen(false)}>
                        <Package className="h-5 w-5" />
                        {t('myOrders', language)}
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start gap-2 rounded-xl text-gray-700 dark:text-gray-300">
                      <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                        <MessageCircle className="h-5 w-5" />
                        {t('contactUs', language)}
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-2 rounded-xl text-red-500"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      {isArabic ? 'تسجيل الخروج' : 'Logout'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-xl text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      toggleAuthModal('login');
                      setIsMenuOpen(false);
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
      </div>
    </motion.header>
  );
}
