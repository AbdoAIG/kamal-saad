'use client';

import { Product } from '@/store/shop-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useShopStore } from '@/store/shop-store';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addToCart, setSelectedProduct } = useShopStore();
  
  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.discountPrice! / product.price) * 100) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleViewDetails = () => {
    setSelectedProduct(product);
    onViewDetails?.(product);
  };

  return (
    <Card className="group overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.nameAr}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white">خصم {discountPercent}%</Badge>
          )}
          {product.featured && (
            <Badge className="bg-emerald-500 text-white">مميز</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            size="icon"
            className="bg-white text-gray-900 hover:bg-emerald-500 hover:text-white"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category */}
        <p className="text-xs text-emerald-600 mb-1">{product.category?.nameAr}</p>
        
        {/* Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
          {product.nameAr}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({product.salesCount} مبيعة)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-emerald-600">
            {currentPrice.toFixed(2)} ر.س
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {product.price.toFixed(2)} ر.س
            </span>
          )}
        </div>

        {/* Stock Status */}
        <p className={`text-xs mt-2 ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
          {product.stock > 10 ? 'متوفر' : product.stock > 0 ? `متبقي ${product.stock} فقط` : 'نفذت الكمية'}
        </p>
      </CardContent>
    </Card>
  );
}
