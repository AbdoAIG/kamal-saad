'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2
        px-5 py-2.5
        bg-gray-900/90 hover:bg-gray-900
        dark:bg-white/90 dark:hover:bg-white
        text-white dark:text-gray-900
        backdrop-blur-md
        rounded-full
        shadow-lg shadow-gray-900/20 dark:shadow-black/20
        border border-gray-700/50 dark:border-gray-300/50
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-gray-900/30 dark:hover:shadow-black/30
        hover:-translate-y-0.5
        active:translate-y-0
        ${isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
      aria-label="الرجوع إلى أعلى الصفحة"
    >
      <span className="text-xs font-medium tracking-wide">أعلى الصفحة</span>
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
