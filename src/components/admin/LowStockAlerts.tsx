'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle, Package, TrendingDown, RefreshCw, Bell, Download, Upload, X,
  CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id: string;
  name: string;
  nameAr: string;
  stock: number;
  minStock: number;
  price: number;
  discountPrice?: number;
  images: string[];
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
  hasVariants?: boolean;
}

interface LowStockData {
  summary: {
    totalLowStock: number;
    outOfStock: number;
    lowStock: number;
    variantProductsAffected: number;
  };
  outOfStockProducts: LowStockProduct[];
  lowStockProducts: LowStockProduct[];
}

interface LowStockAlertsProps {
  onRefresh?: () => void;
}

export function LowStockAlerts({ onRefresh }: LowStockAlertsProps) {
  const [data, setData] = useState<LowStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/low-stock');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleSendNotification = async () => {
    setSendingNotification(true);
    try {
      const res = await fetch('/api/admin/low-stock', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setNotificationSent(true);
        setTimeout(() => setNotificationSent(false), 3000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalLowStock === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-800">المخزون في حالة جيدة</p>
              <p className="text-green-600">جميع المنتجات متوفرة بكميات كافية</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Out of Stock */}
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">نفذ من المخزون</p>
                <p className="text-4xl font-bold mt-1">{data.summary.outOfStock}</p>
                <p className="text-red-100 text-sm mt-2">منتج غير متوفر</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <X className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">مخزون منخفض</p>
                <p className="text-4xl font-bold mt-1">{data.summary.lowStock}</p>
                <p className="text-amber-100 text-sm mt-2">منتج على وشك النفاد</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجراءات</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={fetchLowStock}
                    className="gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    تحديث
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSendNotification}
                    disabled={sendingNotification || notificationSent}
                    className="gap-1"
                  >
                    {sendingNotification ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : notificationSent ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    {notificationSent ? 'تم الإرسال' : 'إرسال تنبيه'}
                  </Button>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingDown className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Products */}
      {data.outOfStockProducts.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-red-50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <X className="h-5 w-5" />
              منتجات نفذت من المخزون ({data.outOfStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المنتج</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الفئة</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">السعر</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المخزون</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الحد الأدنى</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.outOfStockProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-red-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://via.placeholder.com/40'}
                            alt={product.nameAr}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{product.nameAr}</p>
                            <p className="text-xs text-gray-500">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.nameAr || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600">
                        {product.discountPrice || product.price} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-red-500 text-white">0</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.minStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {data.lowStockProducts.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-amber-50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              منتجات بمخزون منخفض ({data.lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المنتج</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الفئة</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">السعر</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">المخزون</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">الحد الأدنى</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.lowStockProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-amber-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://via.placeholder.com/40'}
                            alt={product.nameAr}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{product.nameAr}</p>
                            <p className="text-xs text-gray-500">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.nameAr || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600">
                        {product.discountPrice || product.price} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-amber-500 text-white">{product.stock}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.minStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
