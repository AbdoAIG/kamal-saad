'use client';

import { Product } from '@prisma/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  products: Product[];
  showNavigation?: boolean;
}

export function ProductSection({ title, products, showNavigation = false }: ProductSectionProps) {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`product-scroll-${title.replace(/\s/g, '-')}`);
    if (container) {
      const scrollAmount = container.offsetWidth - 100;
      container.scrollBy({
        left: direction === 'left' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {showNavigation && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div
        id={`product-scroll-${title.replace(/\s/g, '-')}`}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[280px] max-w-[280px]">
            <ProductCard product={product as any} />
          </div>
        ))}
      </div>
    </section>
  );
}
