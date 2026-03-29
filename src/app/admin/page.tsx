'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  Loader2, Package, Users, ShoppingCart, TrendingUp, LogOut, LayoutDashboard,
  ClipboardList, Eye, Truck, CheckCircle, XCircle, Clock, Search, Phone,
  MapPin, Mail, User, Plus, Edit, Trash2, Settings, Bell, ChevronLeft,
  BarChart3, FileText, Store, Menu, X, Home, Tag, Image, AlertCircle,
  Archive, RotateCcw, Shield, Handshake
} from 'lucide-react';
import { ReportsDashboard } from '@/components/admin/ReportsDashboard';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ProductVariantManager } from '@/components/admin/ProductVariantManager';
import { LowStockAlerts } from '@/components/admin/LowStockAlerts';
import { ProductImportExport } from '@/components/admin/ProductImportExport';
import { RolesManagement } from '@/components/admin/RolesManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/admin/Pagination';

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
  hasVariants?: boolean;
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
  { id: 'trash', label: 'سلة المهملات', icon: Archive },
  { id: 'categories', label: 'الفئات', icon: Tag },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'banners', label: 'البنرات', icon: Image },
  { id: 'partners', label: 'شركاء النجاح', icon: Handshake },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'roles', label: 'الأدوار والصلاحيات', icon: Shield, superAdminOnly: true },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminPage() {
  const { user, setUser, setUserId, logout } = useStore();
  const router = useRouter();

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
  const [productSearch, setProductSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '',
    price: '', discountPrice: '', stock: '', categoryId: '', featured: false, images: [] as string[]
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Pagination state for orders
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ totalItems: 0, totalPages: 0, hasMore: false });
  const ORDERS_PER_PAGE = 20;

  // Pagination state for products  
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState({ totalItems: 0, totalPages: 0, hasMore: false });
  const PRODUCTS_PER_PAGE = 20;
  
  // Trash (deleted products) state
  const [trashProducts, setTrashProducts] = useState<Product[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashPagination, setTrashPagination] = useState({ totalItems: 0, totalPages: 0, hasMore: false });
  const [trashPage, setTrashPage] = useState(1);
  
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user is admin or super_admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Add loading state check - start false to avoid flash
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check session on mount only if user is not already set
  useEffect(() => {
    // Skip if user already set from login
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      setSessionChecked(true);
      return;
    }

    const checkSession = async () => {
      setIsLoadingUser(true);
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.user && (data.user.role === 'admin' || data.user.role === 'super_admin')) {
          setUser(data.user);
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoadingUser(false);
        setSessionChecked(true);
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data when admin is logged in
  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Fetch trash when navigating to trash page
  useEffect(() => {
    if (isAdmin && currentPage === 'trash') {
      fetchTrash(trashPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentPage]);

  const fetchData = async (page = 1) => {
    try {
      // Fetch products with pagination
      const productsRes = await fetch(`/api/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
        if (data.pagination) {
          setProductPagination(data.pagination);
        }
      }
      
      const categoriesRes = await fetch('/api/categories');
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.data || data.categories || data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchOrders = async (page = 1) => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ORDERS_PER_PAGE.toString());
      if (orderFilter !== 'all') params.append('status', orderFilter);
      if (orderSearch) params.append('search', orderSearch);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setOrderPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setOrderPage(1);
      fetchOrders(1);
    }
  }, [orderFilter]);

  const handleSearchOrders = () => {
    setOrderPage(1);
    fetchOrders(1);
  };

  // Fetch trash products
  const fetchTrash = async (page = 1) => {
    setTrashLoading(true);
    try {
      const res = await fetch(`/api/products/trash?page=${page}&limit=${PRODUCTS_PER_PAGE}`);
      const data = await res.json();
      if (data.success) {
        setTrashProducts(data.products);
        setTrashPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching trash:', error);
    } finally {
      setTrashLoading(false);
    }
  };

  // Restore a soft deleted product
  const handleRestore = async (productId: string) => {
    if (!confirm('هل أنت متأكد من استعادة هذا المنتج؟')) return;
    try {
      const res = await fetch('/api/products/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
      });
      const data = await res.json();
      if (data.success) {
        fetchTrash(trashPage);
        fetchData(productPage);
      }
    } catch (error) {
      console.error('Error restoring product:', error);
    }
  };

  // Permanently delete a product
  const handlePermanentDelete = async (productId: string) => {
    if (!confirm('هل أنت متأكد من الحذف النهائي؟\nهذا الإجراء لا يمكن التراجع عنه!')) return;
    try {
      const res = await fetch(`/api/products/restore?id=${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchTrash(trashPage);
      } else {
        alert(data.error || 'فشل في حذف المنتج نهائياً');
      }
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.toLowerCase().trim(),
          password: loginForm.password
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error('استجابة غير صالحة من الخادم');
      }

      if (!res.ok || data.success === false) {
        setLoginError(data.error || data.details || 'بيانات الدخول غير صحيحة');
      } else if (data.success && data.user) {
        // Check if user is admin
        if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
          setLoginError('ليس لديك صلاحية للوصول إلى لوحة التحكم');
          return;
        }
        // Set user in store
        setUser(data.user);
        setUserId(data.user.id);
        setLoginForm({ email: '', password: '' });
        // Small delay to ensure cookie is set, then reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setLoginError('حدث خطأ غير متوقع');
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في الاتصال';
      setLoginError(errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    logout();
    router.push('/');
  };

  const resetForm = () => {
    setFormData({
      name: '', nameAr: '', description: '', descriptionAr: '',
      price: '', discountPrice: '', stock: '', categoryId: '', featured: false, images: []
    });
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const [savingProduct, setSavingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setProductMessage(null);
    
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
      images: formData.images
    };
    
    try {
      const res = editingProduct 
        ? await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          });
      
      const data = await res.json();
      
      if (res.ok) {
        setProductMessage({ 
          type: 'success', 
          text: editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح' 
        });
        resetForm();
        fetchData();
        setTimeout(() => {
          setCurrentPage('products');
          setProductMessage(null);
        }, 1500);
      } else {
        setProductMessage({ 
          type: 'error', 
          text: data.error || 'حدث خطأ أثناء حفظ المنتج' 
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setProductMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSavingProduct(false);
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

  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAllProducts = async () => {
    if (!confirm(`هل أنت متأكد من حذف جميع المنتجات؟\nسيتم حذف ${products.length} منتج!`)) return;
    if (!confirm('هذا الإجراء لا يمكن التراجع عنه!\nهل أنت متأكد تماماً؟')) return;
    
    setDeletingAll(true);
    try {
      const res = await fetch('/api/products/delete-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProducts([]);
        alert(`تم حذف ${data.deletedCount} منتج بنجاح`);
      }
    } catch (error) {
      console.error('Error deleting all products:', error);
      alert('حدث خطأ أثناء حذف المنتجات');
    } finally {
      setDeletingAll(false);
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
      images: images
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

  // Filtered products for search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.nameAr.includes(productSearch)
  );

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
    <div className="min-h-screen bg-gray-100 flex flex-col" dir="rtl">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-xl relative`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-center">
            <div 
              className="w-14 h-14 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-teal-400/50 hover:scale-105 transition-transform cursor-pointer"
            >
              <img 
                src="/KMS LOGO FINAL.png" 
                alt="Kamal Saad" 
                className="w-12 h-12 object-contain p-1"
              />
            </div>
            {sidebarOpen && (
              <div className="mr-3">
                <p className="text-xs text-gray-400">لوحة التحكم</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            // Skip superAdminOnly items for non-super-admin users
            if (item.superAdminOnly && !isSuperAdmin) {
              return null;
            }
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
                <p className="font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
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
                أهلاً بك، {user?.name || 'مدير'} | {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                  {pendingOrders > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingOrders}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white">
                      <h3 className="font-bold">الإشعارات</h3>
                      <p className="text-sm text-emerald-100">لديك {pendingOrders} طلب جديد</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {orders.filter(o => o.status === 'pending').length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>لا توجد إشعارات جديدة</p>
                        </div>
                      ) : (
                        orders
                          .filter(o => o.status === 'pending')
                          .slice(0, 5)
                          .map(order => (
                            <div 
                              key={order.id}
                              className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                              onClick={() => {
                                setShowNotifications(false);
                                setCurrentPage('orders');
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">طلب جديد #{order.id.slice(-8)}</p>
                                  <p className="text-sm text-gray-500">{order.shippingInfo?.fullName || 'عميل زائر'}</p>
                                  <p className="text-sm font-bold text-emerald-600">{order.total.toLocaleString()} ج.م</p>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                    {orders.filter(o => o.status === 'pending').length > 0 && (
                      <div className="p-3 bg-gray-50 border-t">
                        <button 
                          onClick={() => {
                            setShowNotifications(false);
                            setCurrentPage('orders');
                          }}
                          className="w-full py-2 text-center text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition"
                        >
                          عرض جميع الطلبات
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

              {/* Low Stock Alerts */}
              <LowStockAlerts />
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
                {/* Pagination for Orders */}
                <Pagination
                  currentPage={orderPage}
                  totalPages={orderPagination.totalPages}
                  totalItems={orderPagination.totalItems}
                  itemsPerPage={ORDERS_PER_PAGE}
                  onPageChange={(page) => {
                    setOrderPage(page);
                    fetchOrders(page);
                  }}
                  itemName="طلبات"
                />
              </Card>
            </div>
          )}

          {/* Products Page */}
          {currentPage === 'products' && (
            <div className="space-y-6">
              {/* Import/Export Products */}
              <ProductImportExport onImportComplete={fetchData} />

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
                        <Label>صور المنتج</Label>
                        <ImageUploader
                          images={formData.images}
                          onImagesChange={(images) => setFormData({ ...formData, images })}
                          maxImages={5}
                          folder="kamal-saad-products"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          يمكنك أيضاً إضافة روابط صور خارجية (مثل postimg.cc) في حقل منفصل أدناه
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4" />
                        <Label htmlFor="featured">منتج مميز</Label>
                      </div>
                      
                      {/* Success/Error Message */}
                      {productMessage && (
                        <div className={`p-3 rounded-xl text-center ${productMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {productMessage.text}
                        </div>
                      )}
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={savingProduct}>
                          {savingProduct ? (
                            <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</>
                          ) : (
                            editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'
                          )}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm} disabled={savingProduct}>إلغاء</Button>
                      </div>
                    </form>

                    {/* Product Variants Manager - Only for existing products */}
                    {editingProduct && (
                      <div className="mt-6 pt-6 border-t">
                        <ProductVariantManager
                          productId={editingProduct.id}
                          productPrice={editingProduct.price}
                          productStock={editingProduct.stock}
                          hasVariants={editingProduct.hasVariants || false}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Products List */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gray-50 rounded-t-xl flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    قائمة المنتجات ({filteredProducts.length} من {products.length})
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="بحث عن منتج..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pr-9 w-64 h-9"
                      />
                    </div>
                    <Button 
                      onClick={handleDeleteAllProducts} 
                      disabled={deletingAll || products.length === 0}
                      className="bg-red-600 hover:bg-red-700 gap-2"
                    >
                      {deletingAll ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحذف...</>
                      ) : (
                        <><Trash2 className="h-4 w-4" /> حذف الكل</>
                      )}
                    </Button>
                    <Button onClick={() => { resetForm(); setIsAddingProduct(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة منتج
                    </Button>
                  </div>
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
                        {filteredProducts.map((product) => {
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
                {/* Pagination for Products */}
                <Pagination
                  currentPage={productPage}
                  totalPages={productPagination.totalPages}
                  totalItems={productPagination.totalItems}
                  itemsPerPage={PRODUCTS_PER_PAGE}
                  onPageChange={(page) => {
                    setProductPage(page);
                    fetchData(page);
                  }}
                  itemName="منتجات"
                />
              </Card>
            </div>
          )}

          {/* Trash Page - Deleted Products */}
          {currentPage === 'trash' && (
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-l from-gray-700 to-gray-800 text-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      سلة المهملات
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {trashPagination.totalItems} منتج محذوف
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {trashLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : trashProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Archive className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">سلة المهملات فارغة</p>
                      <p className="text-sm text-gray-400 mt-2">المنتجات المحذوفة ستظهر هنا</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المنتج</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الفئة</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">السعر</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المخزون</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">تاريخ الحذف</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {trashProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition opacity-75">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    {product.images && JSON.parse(product.images)[0] ? (
                                      <img 
                                        src={JSON.parse(product.images)[0]} 
                                        alt={product.nameAr}
                                        className="w-full h-full object-cover grayscale"
                                      />
                                    ) : (
                                      <Package className="h-6 w-6 m-3 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{product.nameAr}</p>
                                    <p className="text-sm text-gray-500">{product.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  {product.category?.nameAr || 'غير مصنف'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  {product.discountPrice ? (
                                    <>
                                      <p className="font-bold text-gray-600">{product.discountPrice.toLocaleString()} ج.م</p>
                                      <p className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} ج.م</p>
                                    </>
                                  ) : (
                                    <p className="font-bold text-gray-600">{product.price.toLocaleString()} ج.م</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-600">{product.stock} قطعة</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-500">
                                  {(product as any).deletedAt ? new Date((product as any).deletedAt).toLocaleDateString('ar-EG') : '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestore(product.id)}
                                    className="hover:bg-emerald-50 hover:text-emerald-600 text-emerald-500"
                                  >
                                    <RotateCcw className="h-4 w-4 ml-1" />
                                    استعادة
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePermanentDelete(product.id)}
                                    className="hover:bg-red-50 hover:text-red-600 text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 ml-1" />
                                    حذف نهائي
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
                {/* Pagination for Trash */}
                {trashProducts.length > 0 && (
                  <Pagination
                    currentPage={trashPage}
                    totalPages={trashPagination.totalPages}
                    totalItems={trashPagination.totalItems}
                    itemsPerPage={PRODUCTS_PER_PAGE}
                    onPageChange={(page) => {
                      setTrashPage(page);
                      fetchTrash(page);
                    }}
                    itemName="منتجات محذوفة"
                  />
                )}
              </Card>
            </div>
          )}

          {/* Banners Page */}
          {currentPage === 'banners' && (
            <BannersManagement />
          )}

          {/* Categories Page */}
          {currentPage === 'categories' && (
            <CategoriesManagement categories={categories} setCategories={setCategories} />
          )}

          {/* Customers Page */}
          {currentPage === 'customers' && (
            <CustomersManagement />
          )}

          {/* Partners Page */}
          {currentPage === 'partners' && (
            <PartnersManagement />
          )}

          {/* Reports Page */}
          {currentPage === 'reports' && (
            <ReportsDashboard orders={orders} products={products} />
          )}

          {/* Roles Page */}
          {currentPage === 'roles' && isSuperAdmin && (
            <RolesManagement />
          )}

          {/* Settings Page */}
          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </div>
      </main>
      </div>{/* End of flex container for sidebar and main */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4" dir="rtl">
        <div className="px-6 text-center">
          <p className="text-sm text-gray-400">
            © 2026 <span className="text-teal-400 font-bold">كمال سعد</span>. جميع الحقوق محفوظة. 
            <span className="text-gray-500 mx-1">|</span>
            تصميم وتطوير <span className="text-cyan-400 font-medium">AbdoAIG - عبدالرحمن إبراهيم</span>
          </p>
        </div>
      </footer>

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

// Categories Management Component
function CategoriesManagement({ categories, setCategories }: { categories: Category[], setCategories: (cats: Category[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', slug: '' });
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory ? { id: editingCategory.id, ...formData } : formData;
      
      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const result = await res.json();
        const category = result.data || result;
        if (editingCategory) {
          setCategories(categories.map(c => c.id === editingCategory.id ? category : c));
        } else {
          setCategories([...categories, category]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    // First try to delete - the API will tell us if there are active products
    try {
      const res = await fetch(`/api/categories/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCategories(categories.filter(c => c.id !== id));
        return;
      }

      // If the category has active products, show reassign dialog
      if (data.hasProducts) {
        setDeletingCategory(categories.find(c => c.id === id) || null);
        setReassignCategoryId('');
        return;
      }

      alert(data.error || 'حدث خطأ أثناء حذف القسم');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ أثناء حذف القسم');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    
    if (!reassignCategoryId) {
      alert('يرجى اختيار فئة بديلة لنقل المنتجات إليها');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignToCategoryId: reassignCategoryId })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCategories(categories.filter(c => c.id !== deletingCategory.id));
        setDeletingCategory(null);
        setReassignCategoryId('');
      } else {
        alert(data.error || 'حدث خطأ أثناء حذف القسم');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ أثناء حذف القسم');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, nameAr: category.nameAr, slug: (category as any).slug || '' });
    setEditingCategory(category);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', slug: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">إدارة الأقسام</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 rounded-t-xl">
            <CardTitle>{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالعربية</Label>
                  <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">القسم</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{category.nameAr}</p>
                    <p className="text-xs text-gray-500">{category.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Category Delete Reassign Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              تأكيد حذف الفئة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-gray-600 text-sm">
              الفئة <span className="font-bold text-gray-800">"{deletingCategory?.nameAr}"</span> تحتوي على منتجات نشطة.
            </p>
            <p className="text-gray-600 text-sm">
              يرجى اختيار فئة بديلة لنقل المنتجات إليها قبل الحذف:
            </p>
            <Select value={reassignCategoryId} onValueChange={setReassignCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة البديلة..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(c => c.id !== deletingCategory?.id)
                  .map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr} ({cat.name})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirmDelete}
                disabled={deleting || !reassignCategoryId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحذف...</>
                ) : (
                  'تأكيد الحذف ونقل المنتجات'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeletingCategory(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Coupons Management Component
function CouponsManagement() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxUses: '', expiresAt: '', active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      setCoupons(data.coupons || data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          expiresAt: formData.expiresAt || null
        })
      });
      if (res.ok) {
        fetchCoupons();
        setFormData({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxUses: '', expiresAt: '', active: true });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    try {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">إدارة الكوبونات</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 ml-2" />
          إضافة كوبون
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 rounded-t-xl">
            <CardTitle>إضافة كوبون جديد</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>كود الكوبون</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="WELCOME10" />
                </div>
                <div className="space-y-2">
                  <Label>نوع الخصم</Label>
                  <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قيمة الخصم</Label>
                  <Input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأدنى للطلب</Label>
                  <Input type="number" value={formData.minOrder} onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })} placeholder="اختياري" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">إضافة الكوبون</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right">الكود</th>
                  <th className="px-6 py-4 text-right">الخصم</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue} ج.م`}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={coupon.active ? 'bg-green-500' : 'bg-gray-500'}>
                        {coupon.active ? 'فعال' : 'غير فعال'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Customers Management Component
function CustomersManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, hasMore: false });
  const CUSTOMERS_PER_PAGE = 20;

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?page=${page}&limit=${CUSTOMERS_PER_PAGE}`);
      const data = await res.json();
      setCustomers(data.data || data.customers || data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">العملاء</h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث عن عميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right">العميل</th>
                  <th className="px-6 py-4 text-right">الهاتف</th>
                  <th className="px-6 py-4 text-right">تاريخ التسجيل</th>
                  <th className="px-6 py-4 text-right">الطلبات</th>
                  <th className="px-6 py-4 text-right">إجمالي المشتريات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name || 'بدون اسم'}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{customer._count?.orders || 0} طلب</Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {(customer.totalSpent || 0).toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          {/* Pagination for Customers */}
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={CUSTOMERS_PER_PAGE}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchCustomers(page);
            }}
            itemName="عملاء"
          />
        </Card>
      )}
    </div>
  );
}

// Reports Page Component
function ReportsPage({ orders, products }: { orders: Order[], products: Product[] }) {
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

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">التقارير والإحصائيات</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-40"
            />
            <span className="text-gray-500">إلى</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-40"
            />
          </div>
          
          {/* Export buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => handleExport('sales')}
              disabled={exporting}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              تصدير المبيعات
            </Button>
            <Button 
              onClick={() => handleExport('products')}
              disabled={exporting}
              variant="outline"
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              تصدير المنتجات
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'overview', label: 'نظرة عامة' },
          { id: 'sales', label: 'المبيعات' },
          { id: 'products', label: 'المنتجات' },
          { id: 'customers', label: 'العملاء' },
          { id: 'financial', label: 'المالية' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={reportType === tab.id ? 'default' : 'ghost'}
            onClick={() => setReportType(tab.id)}
            className={reportType === tab.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <p className="text-emerald-100 text-sm">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold mt-1">
                  {(reportData?.summary?.totalRevenue || totalRevenue).toLocaleString()} ج.م
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <p className="text-blue-100 text-sm">إجمالي الطلبات</p>
                <p className="text-3xl font-bold mt-1">{reportData?.summary?.totalOrders || orders.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <p className="text-amber-100 text-sm">طلبات قيد الانتظار</p>
                <p className="text-3xl font-bold mt-1">{reportData?.summary?.pendingOrders || pendingOrders}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <CardContent className="p-6">
                <p className="text-red-100 text-sm">طلبات ملغية</p>
                <p className="text-3xl font-bold mt-1">{reportData?.summary?.cancelledOrders || cancelledOrders}</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          {reportData?.statusDistribution && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>توزيع حالات الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {Object.entries(reportData.statusDistribution).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-800">{count as number}</p>
                      <p className="text-sm text-gray-500 capitalize">{status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Sales Chart */}
          {reportData?.dailySales && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>المبيعات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] h-64 flex items-end gap-1">
                    {reportData.dailySales.slice(-14).map((day: any, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500"
                          style={{ height: `${Math.max(10, (day.revenue / Math.max(...reportData.dailySales.map((d: any) => d.revenue))) * 200)}px` }}
                          title={`${day.date}: ${day.revenue.toLocaleString()} ج.م`}
                        />
                        <p className="text-xs text-gray-500 mt-1">{new Date(day.date).getDate()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products */}
          {reportData?.topSelling && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  أكثر المنتجات مبيعاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topSelling.map((product: any, index: number) => (
                    <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>{product.nameAr}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-600 font-bold">{(product.revenue || 0).toLocaleString()} ج.م</span>
                        <Badge variant="outline">{product.soldQuantity || product.stock} مباع</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Distribution */}
          {reportData?.paymentDistribution && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>طرق الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.paymentDistribution).map(([method, count]) => (
                    <div key={method} className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-800">{count as number}</p>
                      <p className="text-sm text-gray-500 capitalize">{method}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Customers */}
          {reportData?.topCustomers && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  أفضل العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                    <div key={customer.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium">{customer.name || 'بدون اسم'}</span>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-emerald-600 font-bold">{customer.totalSpent.toLocaleString()} ج.م</span>
                        <p className="text-xs text-gray-500">{customer.ordersCount} طلب</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  ملخص الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>معدل التحويل</span>
                    <span className="font-bold text-emerald-600">
                      {reportData?.summary?.conversionRate || (orders.length > 0 ? ((deliveredOrders.length / orders.length) * 100).toFixed(1) : 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>متوسط قيمة الطلب</span>
                    <span className="font-bold text-emerald-600">
                      {(reportData?.summary?.averageOrderValue || (orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0)).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>المنتجات المتاحة</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  {reportData?.growth && (
                    <>
                      <div className="flex justify-between items-center">
                        <span>نمو الإيرادات</span>
                        <span className={`font-bold ${parseFloat(reportData.growth.revenue) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {parseFloat(reportData.growth.revenue) >= 0 ? '+' : ''}{reportData.growth.revenue}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  أكثر المنتجات طلباً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>{product.nameAr}</span>
                      </div>
                      <Badge variant="outline">{product.stock} متاح</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Partners Management Component
function PartnersManagement() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', nameAr: '', logo: '', url: '', order: 0, active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partners', {
        headers: { 'x-admin-request': 'true' },
      });
      const data = await res.json();
      if (data.success) setPartners(data.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await fetch('/api/partners/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setPartners(data.data);
      } else {
        alert(data.error || 'حدث خطأ أثناء استيراد الشركاء');
      }
    } catch (error) {
      console.error('Error seeding partners:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.logo) return;

    setSaving(true);
    try {
      const method = editingPartner ? 'PUT' : 'POST';
      const url = editingPartner ? `/api/partners/${editingPartner.id}` : '/api/partners';
      const body = editingPartner ? { ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        fetchPartners();
        resetForm();
      } else {
        alert(data.error || `فشل في الحفظ (${res.status})`);
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPartners();
      } else {
        alert(data.error || 'فشل في حذف الشريك');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  const handleEdit = (partner: any) => {
    setFormData({
      name: partner.name,
      nameAr: partner.nameAr || '',
      logo: partner.logo,
      url: partner.url || '',
      order: partner.order || 0,
      active: partner.active,
    });
    setEditingPartner(partner);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', logo: '', url: '', order: 0, active: true });
    setEditingPartner(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">شركاء النجاح</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة شعارات شركاء النجاح الظاهرة في الشريط المتحرك</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 ml-2" />
          إضافة شريك
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 rounded-t-xl">
            <CardTitle>{editingPartner ? 'تعديل الشريك' : 'إضافة شريك جديد'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Faber-Castell"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="فابر كاستل"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>رابط الشعار *</Label>
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <ImageUploader
                    images={formData.logo ? [formData.logo] : []}
                    onImagesChange={(images) => setFormData({ ...formData, logo: images[0] || '' })}
                    maxImages={1}
                    folder="kamal-saad-partners"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رابط الموقع (اختياري)</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="partner-active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="partner-active">فعال</Label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</>
                  ) : (
                    editingPartner ? 'حفظ التعديلات' : 'إضافة الشريك'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {partners.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-base">معاينة الشريط المتحرك</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-xl bg-gray-50 py-4">
              <div className="flex gap-8 items-center animate-marquee-preview">
                {[...partners, ...partners].map((partner, i) => (
                  <div
                    key={`${partner.id}-${i}`}
                    className="flex-shrink-0 w-28 h-16 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center p-2"
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partners List */}
      {partners.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-16 text-center">
            <Handshake className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">لا يوجد شركاء حتى الآن</p>
            <Button onClick={handleSeedDefaults} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Plus className="h-4 w-4 ml-2" />
              استيراد الشركاء الافتراضيين
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">الشعار</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">الاسم</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">الترتيب</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">الحالة</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1">
                        <img src={partner.logo} alt={partner.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{partner.nameAr || partner.name}</p>
                      <p className="text-xs text-gray-500">{partner.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{partner.order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={partner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {partner.active ? 'فعال' : 'غير فعال'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(partner.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Settings Page Component
function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'contact' | 'content'>('general');
  const [settings, setSettings] = useState({
    storeName: 'كمال سعد',
    storeNameEn: 'Kamal Saad',
    phone: '01234567890',
    phone2: '',
    email: 'info@kamalsaad.com',
    address: 'القاهرة، مصر',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    whatsapp: '',
    workingHoursWeekdays: 'السبت - الخميس: 9:00 صباحاً - 9:00 مساءً',
    workingHoursFriday: 'الجمعة: 2:00 مساءً - 9:00 مساءً',
    mapEmbedUrl: '',
    terms_content: '',
    privacy_content: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          storeName: data.settings.storeName || prev.storeName,
          storeNameEn: data.settings.storeNameEn || prev.storeNameEn,
          phone: data.settings.phone || prev.phone,
          phone2: data.settings.phone2 || prev.phone2,
          email: data.settings.email || prev.email,
          address: data.settings.address || prev.address,
          facebook: data.settings.facebook || '',
          instagram: data.settings.instagram || '',
          twitter: data.settings.twitter || '',
          youtube: data.settings.youtube || '',
          whatsapp: data.settings.whatsapp || '',
          workingHoursWeekdays: data.settings.workingHoursWeekdays || prev.workingHoursWeekdays,
          workingHoursFriday: data.settings.workingHoursFriday || prev.workingHoursFriday,
          mapEmbedUrl: data.settings.mapEmbedUrl || '',
          terms_content: data.settings.terms_content || '',
          privacy_content: data.settings.privacy_content || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'storeName', value: settings.storeName, group: 'store' },
            { key: 'storeNameEn', value: settings.storeNameEn, group: 'store' },
            { key: 'phone', value: settings.phone, group: 'contact' },
            { key: 'phone2', value: settings.phone2, group: 'contact' },
            { key: 'email', value: settings.email, group: 'contact' },
            { key: 'address', value: settings.address, group: 'contact' },
            { key: 'facebook', value: settings.facebook, group: 'social' },
            { key: 'instagram', value: settings.instagram, group: 'social' },
            { key: 'twitter', value: settings.twitter, group: 'social' },
            { key: 'youtube', value: settings.youtube, group: 'social' },
            { key: 'whatsapp', value: settings.whatsapp, group: 'social' },
            { key: 'workingHoursWeekdays', value: settings.workingHoursWeekdays, group: 'contact' },
            { key: 'workingHoursFriday', value: settings.workingHoursFriday, group: 'contact' },
            { key: 'mapEmbedUrl', value: settings.mapEmbedUrl, group: 'contact' },
            { key: 'terms_content', value: settings.terms_content, group: 'content' },
            { key: 'privacy_content', value: settings.privacy_content, group: 'content' },
          ]
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      } else {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const settingsTabs = [
    { key: 'general' as const, label: 'عام', icon: Store },
    { key: 'contact' as const, label: 'خدمة العملاء', icon: Phone },
    { key: 'content' as const, label: 'الشروط والخصوصية', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">الإعدادات</h2>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Settings Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {settingsTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSettingsTab(tab.key)}
            className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSettingsTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeSettingsTab === 'general' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                معلومات المتجر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المتجر بالعربية</Label>
                <Input 
                  value={settings.storeName} 
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>اسم المتجر بالإنجليزية</Label>
                <Input 
                  value={settings.storeNameEn} 
                  onChange={(e) => setSettings({ ...settings, storeNameEn: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-sm">🌐</span>
                </div>
                وسائل التواصل الاجتماعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>فيسبوك</Label>
                <Input 
                  placeholder="https://facebook.com/..."
                  value={settings.facebook} 
                  onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>انستجرام</Label>
                <Input 
                  placeholder="https://instagram.com/..."
                  value={settings.instagram} 
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>واتساب (رقم الهاتف)</Label>
                <Input 
                  placeholder="+201001234567"
                  value={settings.whatsapp} 
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  dir="ltr"
                />
                <p className="text-xs text-gray-400">أدخل رقم الهاتف مع رمز الدولة بدون مسافات</p>
              </div>
              <div className="space-y-2">
                <Label>تويتر (X)</Label>
                <Input 
                  placeholder="https://x.com/..."
                  value={settings.twitter} 
                  onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>يوتيوب</Label>
                <Input 
                  placeholder="https://youtube.com/..."
                  value={settings.youtube} 
                  onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact / Customer Service Tab */}
      {activeSettingsTab === 'contact' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-600" />
                معلومات الاتصال
              </CardTitle>
              <p className="text-sm text-gray-500">هذه المعلومات ستظهر في صفحة اتصل بنا</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>رقم الهاتف الرئيسي</Label>
                <Input 
                  value={settings.phone} 
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم هاتف إضافي (اختياري)</Label>
                <Input 
                  placeholder="+20 2 1234 5678"
                  value={settings.phone2} 
                  onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  type="email"
                  value={settings.email} 
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Textarea 
                  value={settings.address} 
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                ساعات العمل والخريطة
              </CardTitle>
              <p className="text-sm text-gray-500">تحكم في ساعات العمل وعرض الخريطة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ساعات العمل (أيام الأسبوع)</Label>
                <Input 
                  placeholder="السبت - الخميس: 9:00 صباحاً - 9:00 مساءً"
                  value={settings.workingHoursWeekdays} 
                  onChange={(e) => setSettings({ ...settings, workingHoursWeekdays: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ساعات العمل (الجمعة)</Label>
                <Input 
                  placeholder="الجمعة: 2:00 مساءً - 9:00 مساءً"
                  value={settings.workingHoursFriday} 
                  onChange={(e) => setSettings({ ...settings, workingHoursFriday: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  رابط خريطة جوجل المضمنة
                </Label>
                <Textarea 
                  placeholder='الصق كود iframe من Google Maps هنا. مثال: &lt;iframe src="https://www.google.com/maps/embed?..."&gt;&lt;/iframe&gt;'
                  value={settings.mapEmbedUrl} 
                  onChange={(e) => setSettings({ ...settings, mapEmbedUrl: e.target.value })}
                  rows={4}
                  dir="ltr"
                  className="text-xs font-mono"
                />
                <p className="text-xs text-gray-400">
                  لل获取 رابط التضمين: افتح Google Maps ← اختر الموقع ← شارك ← تضمين خريطة ← نسخ كود HTML
                </p>
                {settings.mapEmbedUrl && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2">معاينة الخريطة:</p>
                    <div 
                      className="h-[150px] rounded overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: settings.mapEmbedUrl.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="150"') }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Tab (Terms & Privacy) */}
      {activeSettingsTab === 'content' && (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                شروط وأحكام الاستخدام
              </CardTitle>
              <p className="text-sm text-gray-500">استخدم تنسيق Markdown للنص. اتركه فارغاً لاستخدام النص الافتراضي.</p>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={settings.terms_content} 
                onChange={(e) => setSettings({ ...settings, terms_content: e.target.value })}
                rows={16}
                placeholder="# شروط وأحكام الاستخدام&#10;&#10;## المقدمة&#10;مرحباً بكم في موقع كمال سعد...&#10;&#10;## 1. التعريفات&#10;- **الموقع**: ...&#10;- **المستخدم**: ..."
                className="font-mono text-sm"
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <span>دعم التنسيق:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded"># عنوان</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">## عنوان فرعي</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">**نص عريض**</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">- قائمة</code>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                سياسة الخصوصية
              </CardTitle>
              <p className="text-sm text-gray-500">استخدم تنسيق Markdown للنص. اتركه فارغاً لاستخدام النص الافتراضي.</p>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={settings.privacy_content} 
                onChange={(e) => setSettings({ ...settings, privacy_content: e.target.value })}
                rows={16}
                placeholder="# سياسة الخصوصية&#10;&#10;## المقدمة&#10;في كمال سعد، نحترم خصوصيتك...&#10;&#10;## 1. المعلومات التي نجمعها&#10;- **الاسم والبريد الإلكتروني**: ..."
                className="font-mono text-sm"
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <span>دعم التنسيق:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded"># عنوان</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">## عنوان فرعي</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">**نص عريض**</code>
                <code className="bg-gray-100 px-2 py-0.5 rounded">- قائمة</code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</>
          ) : (
            'حفظ الإعدادات'
          )}
        </Button>
        {saving && <span className="text-sm text-gray-500">جاري حفظ جميع الإعدادات...</span>}
      </div>
    </div>
  );
}

// Banners Management Component
function BannersManagement() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', titleAr: '', subtitle: '', subtitleAr: '',
    image: '', link: '', buttonText: '', buttonTextAr: '',
    active: true, order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner ? { id: editingBanner.id, ...formData } : formData;
      
      const res = await fetch('/api/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        fetchBanners();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleEdit = (banner: any) => {
    setFormData({
      title: banner.title,
      titleAr: banner.titleAr,
      subtitle: banner.subtitle || '',
      subtitleAr: banner.subtitleAr || '',
      image: banner.image,
      link: banner.link || '',
      buttonText: banner.buttonText || '',
      buttonTextAr: banner.buttonTextAr || '',
      active: banner.active,
      order: banner.order
    });
    setEditingBanner(banner);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '', titleAr: '', subtitle: '', subtitleAr: '',
      image: '', link: '', buttonText: '', buttonTextAr: '',
      active: true, order: 0
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">إدارة البنرات الإعلانية</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 ml-2" />
          إضافة بانر
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 rounded-t-xl">
            <CardTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان بالإنجليزية</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>العنوان بالعربية</Label>
                  <Input value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>صورة البانر *</Label>
                <ImageUploader
                  images={formData.image ? [formData.image] : []}
                  onImagesChange={(images) => setFormData({ ...formData, image: images[0] || '' })}
                  maxImages={1}
                  folder="kamal-saad-banners"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نص الزر بالعربية</Label>
                  <Input value={formData.buttonTextAr} onChange={(e) => setFormData({ ...formData, buttonTextAr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الترتيب (1-3 = Hero, 4-6 = Middle)</Label>
                  <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4" />
                <Label htmlFor="active">فعال</Label>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingBanner ? 'حفظ التعديلات' : 'إضافة البانر'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : banners.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-16 text-center">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">لا توجد بنرات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="relative h-32">
                <img src={banner.image} alt={banner.titleAr} className="w-full h-full object-cover" />
                <Badge className={`absolute top-2 right-2 ${banner.active ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {banner.active ? 'فعال' : 'غير فعال'}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h4 className="font-medium">{banner.titleAr}</h4>
                <p className="text-sm text-gray-500">الترتيب: {banner.order}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
