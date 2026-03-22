'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Loader2, Package, Users, ShoppingCart, TrendingUp, LogOut, LayoutDashboard,
  ClipboardList, Eye, Truck, CheckCircle, XCircle, Clock, Search, Phone,
  MapPin, Mail, User, Plus, Edit, Trash2, Settings, Bell, ChevronLeft,
  BarChart3, FileText, Store, Menu, X, Home, Tag, Percent, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number;
  images: string;
  stock: number;
  categoryId: string;
  featured: boolean;
  category?: { name: string; nameAr: string };
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    nameAr: string;
    images: string[];
    price: number;
    discountPrice?: number;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  discount: number;
  shippingAddress?: string;
  phone?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  shippingInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
    governorate?: string;
    city?: string;
    address?: string;
    notes?: string;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
  } | null;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'جاري التجهيز', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  shipped: { label: 'تم الشحن', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

const paymentMethodConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  cod: { label: 'الدفع عند الاستلام', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  fawry: { label: 'فوري', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  visa: { label: 'فيزا / ماستركارد', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  vodafone: { label: 'فودافون كاش', color: 'text-red-700', bgColor: 'bg-red-100' },
  valu: { label: 'فاليو', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const menuItems = [
  { id: 'dashboard', label: 'نظرة عامة', icon: Home },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'categories', label: 'الفئات', icon: Tag },
  { id: 'coupons', label: 'الكوبونات', icon: Percent },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Product form
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '',
    price: '', discountPrice: '', stock: '', categoryId: '', featured: false, images: ''
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as { role?: string }).role;
      if (userRole === 'admin') {
        setIsAdmin(true);
        fetchData();
        fetchOrders();
      } else {
        setIsAdmin(false);
      }
    } else if (status === 'unauthenticated') {
      setIsAdmin(false);
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderFilter !== 'all') params.append('status', orderFilter);
      if (orderSearch) params.append('search', orderSearch);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [orderFilter]);

  const handleSearchOrders = () => fetchOrders();

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openOrderDetails = async (order: Order) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError('بيانات الدخول غير صحيحة');
      }
      // The useEffect will handle the rest when session updates
    } catch (error) {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsAdmin(false);
    router.push('/');
  };

  const resetForm = () => {
    setFormData({
      name: '', nameAr: '', description: '', descriptionAr: '',
      price: '', discountPrice: '', stock: '', categoryId: '', featured: false, images: ''
    });
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      nameAr: formData.nameAr,
      description: formData.description,
      descriptionAr: formData.descriptionAr,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      stock: parseInt(formData.stock),
      categoryId: formData.categoryId,
      featured: formData.featured,
      images: formData.images.split(',').map(url => url.trim()).filter(Boolean)
    };
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      }
      resetForm();
      fetchData();
      setCurrentPage('products');
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    const images = JSON.parse(product.images || '[]');
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description || '',
      descriptionAr: product.descriptionAr || '',
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      featured: product.featured,
      images: images.join(', ')
    });
    setEditingProduct(product);
    setIsAddingProduct(true);
    setCurrentPage('products');
  };

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
  const totalOrdersValue = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border">
              <img 
                src="/KMS LOGO FINAL.png" 
                alt="Kamal Saad" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">لوحة التحكم</CardTitle>
            <p className="text-gray-500 text-sm">قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              {loginError && (
                <div className="bg-red-50 text-red-600 text-sm text-center p-3 rounded-xl">
                  {loginError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <><Loader2 className="h-5 w-5 animate-spin ml-2" /> جاري تسجيل الدخول...</>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-xl relative`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <img 
                src="/KMS LOGO FINAL.png" 
                alt="Kamal Saad" 
                className="w-10 h-10 object-contain"
              />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">كمال سعد</h1>
                <p className="text-xs text-gray-400">لوحة التحكم</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (item.id === 'products') {
                    resetForm();
                    setIsAddingProduct(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {item.id === 'orders' && pendingOrders > 0 && !sidebarOpen && (
                  <span className="absolute top-0 left-0 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {pendingOrders}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-1/2 -left-3 w-6 h-12 bg-gray-800 rounded-l-lg flex items-center justify-center text-gray-400 hover:text-white shadow-lg"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {menuItems.find(m => m.id === currentPage)?.label || 'لوحة التحكم'}
              </h2>
              <p className="text-sm text-gray-500">
                أهلاً بك، {session?.user?.name || 'مدير'} | {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <Bell className="h-5 w-5" />
                {pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingOrders}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm">إجمالي المبيعات</p>
                        <p className="text-3xl font-bold mt-1">{totalOrdersValue.toLocaleString()} ج.م</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-7 w-7" />
                      </div>
                    </div>
                    <p className="text-emerald-100 text-sm mt-4">
                      من {orders.length} طلب
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm">طلبات جديدة</p>
                        <p className="text-3xl font-bold mt-1">{pendingOrders}</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <ClipboardList className="h-7 w-7" />
                      </div>
                    </div>
                    <p className="text-amber-100 text-sm mt-4">
                      بانتظار المراجعة
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">قيد التجهيز</p>
                        <p className="text-3xl font-bold mt-1">{processingOrders}</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Package className="h-7 w-7" />
                      </div>
                    </div>
                    <p className="text-blue-100 text-sm mt-4">
                      جاري المعالجة
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">المنتجات</p>
                        <p className="text-3xl font-bold mt-1">{totalProducts}</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Package className="h-7 w-7" />
                      </div>
                    </div>
                    <p className="text-purple-100 text-sm mt-4">
                      مخزون: {totalStock} قطعة
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gray-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                    أحدث الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طلبات حالياً</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {orders.slice(0, 6).map(order => {
                        const status = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => openOrderDetails(order)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${status.bgColor}`}>
                                <StatusIcon className={`h-5 w-5 ${status.color}`} />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">#{order.id.slice(-8)}</p>
                                <p className="text-sm text-gray-500">
                                  {order.shippingInfo?.fullName || order.user?.name || 'عميل زائر'}
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-lg text-emerald-600">{order.total.toLocaleString()} ج.م</p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Page */}
          {currentPage === 'orders' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="بحث بالاسم أو الهاتف أو رقم الطلب..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="pr-10 h-11"
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchOrders()}
                        />
                      </div>
                    </div>
                    <Select value={orderFilter} onValueChange={setOrderFilter}>
                      <SelectTrigger className="w-44 h-11">
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الطلبات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="processing">جاري التجهيز</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSearchOrders} className="h-11 bg-emerald-600 hover:bg-emerald-700">
                      بحث
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card className="shadow-lg border-0 overflow-hidden">
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">رقم الطلب</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">العميل</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">العنوان</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المنتجات</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الإجمالي</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الدفع</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الحالة</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => {
                          const status = statusConfig[order.status] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          const payment = paymentMethodConfig[order.paymentMethod || 'cod'] || paymentMethodConfig.cod;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-800">#{order.id.slice(-8)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-800">{order.shippingInfo?.fullName || order.user?.name || 'عميل زائر'}</p>
                                  <p className="text-sm text-gray-500">{order.shippingInfo?.phone || order.phone || order.user?.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-48">
                                  {order.shippingInfo ? (
                                    <>
                                      {order.shippingInfo.governorate && order.shippingInfo.city ? (
                                        <p className="text-sm font-medium text-gray-800">{order.shippingInfo.governorate} - {order.shippingInfo.city}</p>
                                      ) : null}
                                      <p className="text-xs text-gray-500 truncate">{order.shippingInfo.address || order.shippingInfo.raw || 'لا يوجد عنوان'}</p>
                                    </>
                                  ) : (
                                    <span className="text-gray-400 text-sm">لا يوجد عنوان</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className="font-medium">
                                  {order.items.length} منتج
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-emerald-600 text-lg">{order.total.toLocaleString()} ج.م</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${payment.bgColor} ${payment.color}`}>
                                  {payment.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                                  disabled={updatingStatus}
                                >
                                  <SelectTrigger className={`w-36 h-9 ${status.bgColor} border-0`}>
                                    <div className="flex items-center gap-2">
                                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                                      <span className={`font-medium ${status.color}`}>{status.label}</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                                    <SelectItem value="confirmed">مؤكد</SelectItem>
                                    <SelectItem value="processing">جاري التجهيز</SelectItem>
                                    <SelectItem value="shipped">تم الشحن</SelectItem>
                                    <SelectItem value="delivered">تم التوصيل</SelectItem>
                                    <SelectItem value="cancelled">ملغي</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openOrderDetails(order)}
                                  className="hover:bg-emerald-50 hover:text-emerald-600"
                                >
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Products Page */}
          {currentPage === 'products' && (
            <div className="space-y-6">
              {/* Add/Edit Product Form */}
              {isAddingProduct && (
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gray-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      {editingProduct ? <Edit className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-emerald-600" />}
                      {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>الاسم بالإنجليزية</Label>
                          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم بالعربية</Label>
                          <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} required className="h-11" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>الوصف بالإنجليزية</Label>
                          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>الوصف بالعربية</Label>
                          <Textarea value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} rows={3} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>السعر (ج.م)</Label>
                          <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>سعر الخصم</Label>
                          <Input type="number" step="0.01" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>الكمية</Label>
                          <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>الفئة</Label>
                          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>روابط الصور (مفصولة بفواصل)</Label>
                        <Input value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} placeholder="https://..." className="h-11" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4" />
                        <Label htmlFor="featured">منتج مميز</Label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                          {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Products List */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gray-50 rounded-t-xl flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    قائمة المنتجات ({products.length})
                  </CardTitle>
                  <Button onClick={() => { resetForm(); setIsAddingProduct(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة منتج
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المنتج</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">السعر</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المخزون</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الحالة</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map((product) => {
                          const images = JSON.parse(product.images || '[]');
                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img src={images[0] || 'https://via.placeholder.com/50'} alt={product.nameAr} className="w-12 h-12 object-cover rounded-xl" />
                                  <div>
                                    <p className="font-medium text-gray-800">{product.nameAr}</p>
                                    <p className="text-xs text-gray-500">{product.category?.nameAr}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <span className="font-bold text-emerald-600">{product.discountPrice || product.price} ج.م</span>
                                  {product.discountPrice && (
                                    <span className="text-xs text-gray-400 line-through block">{product.price} ج.م</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {product.stock}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1">
                                  {product.featured && <Badge className="bg-amber-500">مميز</Badge>}
                                  {product.discountPrice && <Badge className="bg-red-500">خصم</Badge>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="hover:bg-blue-50 hover:text-blue-600">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="hover:bg-red-50 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other Pages Placeholder */}
          {['categories', 'coupons', 'customers', 'reports', 'settings'].includes(currentPage) && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {currentPage === 'categories' && <Tag className="h-10 w-10 text-gray-400" />}
                  {currentPage === 'coupons' && <Percent className="h-10 w-10 text-gray-400" />}
                  {currentPage === 'customers' && <Users className="h-10 w-10 text-gray-400" />}
                  {currentPage === 'reports' && <BarChart3 className="h-10 w-10 text-gray-400" />}
                  {currentPage === 'settings' && <Settings className="h-10 w-10 text-gray-400" />}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {menuItems.find(m => m.id === currentPage)?.label}
                </h3>
                <p className="text-gray-500">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              تفاصيل الطلب #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="font-medium">حالة الطلب:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleUpdateOrderStatus(selectedOrder.id, value)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="processing">جاري التجهيز</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="delivered">تم التوصيل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedOrder.shippingInfo?.fullName || selectedOrder.user?.name || 'عميل زائر'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.shippingInfo?.email || selectedOrder.user?.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span dir="ltr">{selectedOrder.shippingInfo?.phone || selectedOrder.phone || selectedOrder.user?.phone || '-'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      عنوان الشحن
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.shippingInfo ? (
                      <div className="space-y-2">
                        {selectedOrder.shippingInfo.governorate && selectedOrder.shippingInfo.city && (
                          <p className="font-medium text-gray-800">
                            {selectedOrder.shippingInfo.governorate} - {selectedOrder.shippingInfo.city}
                          </p>
                        )}
                        <p className="text-gray-600">{selectedOrder.shippingInfo.address || selectedOrder.shippingInfo.raw || 'لا يوجد عنوان تفصيلي'}</p>
                        {selectedOrder.shippingInfo.notes && (
                          <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">
                            <strong>ملاحظات:</strong> {selectedOrder.shippingInfo.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">لا يوجد عنوان</span>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Method */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">طريقة الدفع:</span>
                    </div>
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${(paymentMethodConfig[selectedOrder.paymentMethod || 'cod'] || paymentMethodConfig.cod).bgColor} ${(paymentMethodConfig[selectedOrder.paymentMethod || 'cod'] || paymentMethodConfig.cod).color}`}>
                      {(paymentMethodConfig[selectedOrder.paymentMethod || 'cod'] || paymentMethodConfig.cod).label}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    المنتجات المطلوبة ({selectedOrder.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <img
                          src={item.product.images?.[0] || 'https://via.placeholder.com/60'}
                          alt={item.product.nameAr}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.product.nameAr}</p>
                          <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-emerald-600">{(item.price * item.quantity).toLocaleString()} ج.م</p>
                          <p className="text-xs text-gray-500">{item.price.toLocaleString()} ج.م / قطعة</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">المجموع الفرعي:</span>
                      <span className="font-medium">{selectedOrder.total.toLocaleString()} ج.م</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>الخصم:</span>
                        <span>-{selectedOrder.discount.toLocaleString()} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                      <span>الإجمالي:</span>
                      <span className="text-emerald-600">{selectedOrder.total.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    <p>تاريخ الطلب: {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</p>
                    <p>آخر تحديث: {new Date(selectedOrder.updatedAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
