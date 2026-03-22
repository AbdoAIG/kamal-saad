'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Package, Users, TrendingUp, Download, Calendar, DollarSign, ShoppingCart, PieChart } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ReportsDashboardProps {
  orders: any[];
  products: any[];
}

export function ReportsDashboard({ orders, products }: ReportsDashboardProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange.startDate, dateRange.endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await res.json();
      setReportData(data.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/export?type=${type}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;

  // Prepare chart data
  const statusChartData = reportData?.statusDistribution
    ? Object.entries(reportData.statusDistribution).map(([name, value]) => ({
        name: name === 'pending' ? 'قيد الانتظار' :
              name === 'confirmed' ? 'مؤكد' :
              name === 'processing' ? 'جاري التجهيز' :
              name === 'shipped' ? 'تم الشحن' :
              name === 'delivered' ? 'تم التوصيل' :
              name === 'cancelled' ? 'ملغي' : name,
        value
      }))
    : [];

  const paymentChartData = reportData?.paymentDistribution
    ? Object.entries(reportData.paymentDistribution).map(([name, value]) => ({
        name: name === 'cod' ? 'الدفع عند الاستلام' :
              name === 'paymob' ? 'بطاقة ائتمان' :
              name === 'fawry' ? 'فوري' :
              name === 'valu' ? 'فاليو' : name,
        value
      }))
    : [];

  const dailySalesData = reportData?.dailySales?.slice(-14).map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
    revenue: day.revenue,
    orders: day.orders
  })) || [];

  const dailyRevenueData = reportData?.dailyRevenue?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
    gross: day.gross,
    net: day.net
  })) || [];

  const categoryData = reportData?.categoryPerformance?.map((cat: any) => ({
    name: cat.category,
    revenue: cat.revenue,
    sold: cat.soldQuantity
  })) || [];

  const topProducts = reportData?.topSelling?.slice(0, 10) || [];
  const topCustomers = reportData?.topCustomers?.slice(0, 10) || [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {entry.name.includes('revenue') || entry.name.includes('gross') || entry.name.includes('net') || entry.name.includes('الإيرادات') ? ' ج.م' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h2>
          <p className="text-gray-500">تحليل شامل لأداء المتجر</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-36 border-0 shadow-none"
            />
            <span className="text-gray-400">→</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-36 border-0 shadow-none"
            />
          </div>
          
          <Button onClick={() => handleExport('sales')} disabled={exporting} variant="outline" className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm overflow-x-auto">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: PieChart },
          { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
          { id: 'products', label: 'المنتجات', icon: Package },
          { id: 'customers', label: 'العملاء', icon: Users },
          { id: 'financial', label: 'المالية', icon: DollarSign },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={reportType === tab.id ? 'default' : 'ghost'}
            onClick={() => setReportType(tab.id)}
            className={`gap-2 ${reportType === tab.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">إجمالي الإيرادات</p>
                    <p className="text-3xl font-bold mt-1">
                      {(reportData?.summary?.totalRevenue || totalRevenue).toLocaleString()}
                    </p>
                    <p className="text-emerald-100 text-sm">جنيه مصري</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <DollarSign className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">إجمالي الطلبات</p>
                    <p className="text-3xl font-bold mt-1">{reportData?.summary?.totalOrders || orders.length}</p>
                    <p className="text-blue-100 text-sm">طلب</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">طلبات قيد الانتظار</p>
                    <p className="text-3xl font-bold mt-1">{reportData?.summary?.pendingOrders || pendingOrdersCount}</p>
                    <p className="text-amber-100 text-sm">بانتظار المراجعة</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Calendar className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">متوسط قيمة الطلب</p>
                    <p className="text-3xl font-bold mt-1">
                      {Math.round(reportData?.summary?.averageOrderValue || (orders.length > 0 ? totalRevenue / orders.length : 0)).toLocaleString()}
                    </p>
                    <p className="text-purple-100 text-sm">جنيه</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  trend المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySalesData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="الإيرادات"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>توزيع حالات الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Orders Bar Chart */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>عدد الطلبات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" name="الطلبات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Pie */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>طرق الدفع المستخدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={paymentChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Report Specific */}
          {reportType === 'financial' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>الإيرادات اليومية (إجمالي وصافي)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gross"
                        name="إجمالي"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="صافي"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Performance */}
          {categoryData.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>أداء الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 12 }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products & Customers Side by Side */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            {topProducts.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    أكثر المنتجات مبيعاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product: any, index: number) => (
                      <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-medium text-gray-800">{product.nameAr || product.name}</span>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-emerald-600 font-bold">{(product.revenue || 0).toLocaleString()} ج.م</span>
                          <p className="text-xs text-gray-500">{product.soldQuantity} قطعة مباعة</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Customers */}
            {topCustomers.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    أفضل العملاء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCustomers.map((customer: any, index: number) => (
                      <div key={customer.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-medium text-gray-800">{customer.name || 'بدون اسم'}</span>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-purple-600 font-bold">{customer.totalSpent.toLocaleString()} ج.م</span>
                          <p className="text-xs text-gray-500">{customer.ordersCount} طلب</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
