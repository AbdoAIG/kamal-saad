'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Package, Users, ShoppingCart, TrendingUp, LogOut, LayoutDashboard, ClipboardList, Eye, Truck, CheckCircle, XCircle, Clock, Search, Phone, MapPin, Mail, User, ChevronDown, ChevronUp, AlertTriangle, Image, ToggleLeft, ToggleRight, Settings, Tag, MessageSquare, Percent, Save, RefreshCw, CreditCard, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStore, Product } from '@/store/useStore';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  categories: { id: string; name: string; nameAr: string }[];
  onRefresh: () => void;
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
  createdAt: string;
  updatedAt: string;
  shippingInfo?: {
    fullName?: string;
    phone?: string;
    governorate?: string;
    city?: string;
    address?: string;
    landmark?: string;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
    addresses?: any[];
  } | null;
  items: OrderItem[];
}

interface Banner {
  id: string;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  image: string;
  link?: string;
  buttonText?: string;
  buttonTextAr?: string;
  active: boolean;
  order: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  reply?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'جاري التجهيز', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  shipped: { label: 'تم الشحن', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

export function AdminPanel({ open, onClose, products, categories, onRefresh }: AdminPanelProps) {
  const { user, logout } = useStore();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    discountPrice: '',
    stock: '',
    categoryId: '',
    featured: false,
    images: ''
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    titleAr: '',
    subtitle: '',
    subtitleAr: '',
    image: '',
    link: '',
    buttonText: '',
    buttonTextAr: '',
    active: true,
    order: 0
  });

  // Contact messages state
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Search for products
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderFilter !== 'all') params.append('status', orderFilter);
      if (orderSearch) params.append('search', orderSearch);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch banners
  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setBannersLoading(false);
    }
  };

  // Fetch contact messages
  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrders();
      fetchBanners();
      fetchContacts();
    }
  }, [open, orderFilter]);

  // Filter products based on search
  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.nameAr.includes(productSearch)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  const handleSearchOrders = () => {
    fetchOrders();
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

  // Banner handlers
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner ? { id: editingBanner.id, ...bannerForm } : bannerForm;
      
      const res = await fetch('/api/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        fetchBanners();
        resetBannerForm();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setBannerForm({
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
    setShowBannerForm(true);
  };

  const resetBannerForm = () => {
    setBannerForm({
      title: '',
      titleAr: '',
      subtitle: '',
      subtitleAr: '',
      image: '',
      link: '',
      buttonText: '',
      buttonTextAr: '',
      active: true,
      order: 0
    });
    setEditingBanner(null);
    setShowBannerForm(false);
  };

  // Contact handlers
  const handleReplyToMessage = async () => {
    if (!selectedContact || !replyText.trim()) return;
    try {
      await fetch(`/api/contact/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText, status: 'replied' })
      });
      setReplyText('');
      fetchContacts();
      setShowContactDetails(false);
    } catch (error) {
      console.error('Error replying to message:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: '',
      discountPrice: '',
      stock: '',
      categoryId: '',
      featured: false,
      images: ''
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
      onRefresh();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      onRefresh();
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
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const featuredCount = products.filter(p => p.featured).length;
  const discountedCount = products.filter(p => p.discountPrice).length;

  // Order stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalOrdersValue = orders.reduce((sum, o) => sum + o.total, 0);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayoutDashboard className="h-5 w-5 text-emerald-600" />
              لوحة التحكم
            </DialogTitle>
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">نظرة عامة</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              الطلبات
              {pendingOrders > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{pendingOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="banners">البنرات</TabsTrigger>
            <TabsTrigger value="contact">الرسائل</TabsTrigger>
            <TabsTrigger value="add">إضافة منتج</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">إجمالي المنتجات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-8 w-8 text-emerald-600" />
                    <span className="text-3xl font-bold">{totalProducts}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">الطلبات الجديدة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-amber-600" />
                    <span className="text-3xl font-bold">{pendingOrders}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">إجمالي المبيعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <span className="text-2xl font-bold">{totalOrdersValue.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">ج.م</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-8 w-8 text-purple-600" />
                    <span className="text-3xl font-bold">{totalStock}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  أحدث الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد طلبات حالياً</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map(order => {
                      const status = statusConfig[order.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => openOrderDetails(order)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.bgColor}`}>
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">#{order.id.slice(-8)}</p>
                              <p className="text-sm text-gray-500">
                                {order.user?.name || 'عميل زائر'}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold">{order.total.toLocaleString()} ج.م</p>
                            <p className="text-xs text-gray-500">
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
          </TabsContent>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold">إدارة الطلبات</h3>
              <div className="flex gap-2 items-center">
                <div className="flex gap-2">
                  <Input
                    placeholder="بحث بالاسم أو الهاتف..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-64"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrders()}
                  />
                  <Button variant="outline" size="icon" onClick={handleSearchOrders}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-40">
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
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الطلب</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتجات</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجمالي</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">#{order.id.slice(-8)}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{order.user?.name || 'عميل زائر'}</p>
                                <p className="text-xs text-gray-500">{order.user?.email || order.phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{order.items.length} منتج</Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold">{order.total.toLocaleString()} ج.م</td>
                            <td className="px-4 py-3">
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                                disabled={updatingStatus}
                              >
                                <SelectTrigger className={`w-36 ${status.bgColor}`}>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                                    <span className={status.color}>{status.label}</span>
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
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                              <br />
                              <span className="text-xs">
                                {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openOrderDetails(order)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Products List */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">قائمة المنتجات</h3>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="بحث عن منتج..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => { resetForm(); setIsAddingProduct(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة منتج
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتج</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السعر</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المخزون</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => {
                      const images = JSON.parse(product.images || '[]');
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={images[0] || 'https://via.placeholder.com/50'}
                                alt={product.nameAr}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{product.nameAr}</p>
                                <p className="text-xs text-gray-500">{product.category?.nameAr}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-medium">{product.discountPrice || product.price} ج.م</span>
                              {product.discountPrice && (
                                <span className="text-xs text-gray-400 line-through block">{product.price} ج.م</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={product.stock < 10 ? 'text-red-600 font-medium' : ''}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {product.featured && <Badge className="bg-amber-500">مميز</Badge>}
                              {product.discountPrice && <Badge className="bg-red-500">خصم</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Banners Management */}
          <TabsContent value="banners" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">إدارة البنرات الإعلانية</h3>
              <Button onClick={() => { resetBannerForm(); setShowBannerForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <ImagePlus className="h-4 w-4" />
                إضافة بانر
              </Button>
            </div>

            {showBannerForm && (
              <Card className="p-4">
                <h4 className="font-medium mb-4">{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</h4>
                <form onSubmit={handleBannerSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان بالإنجليزية</Label>
                      <Input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان بالعربية</Label>
                      <Input value={bannerForm.titleAr} onChange={(e) => setBannerForm({ ...bannerForm, titleAr: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان الفرعي بالإنجليزية</Label>
                      <Input value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان الفرعي بالعربية</Label>
                      <Input value={bannerForm.subtitleAr} onChange={(e) => setBannerForm({ ...bannerForm, subtitleAr: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>رابط الصورة</Label>
                    <Input value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} placeholder="https://example.com/image.jpg" required />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نص الزر بالإنجليزية</Label>
                      <Input value={bannerForm.buttonText} onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>نص الزر بالعربية</Label>
                      <Input value={bannerForm.buttonTextAr} onChange={(e) => setBannerForm({ ...bannerForm, buttonTextAr: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رابط عند الضغط</Label>
                      <Input value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>الترتيب</Label>
                      <Input type="number" value={bannerForm.order} onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active" checked={bannerForm.active} onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })} className="w-4 h-4" />
                    <Label htmlFor="active">فعال</Label>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingBanner ? 'حفظ التعديلات' : 'إضافة البانر'}</Button>
                    <Button type="button" variant="outline" onClick={resetBannerForm}>إلغاء</Button>
                  </div>
                </form>
              </Card>
            )}

            {bannersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بنرات</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-gray-500">{banner.subtitleAr}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleEditBanner(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Contact Messages */}
          <TabsContent value="contact" className="space-y-4">
            <h3 className="text-lg font-semibold">رسائل التواصل</h3>
            {contactsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد رسائل</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">البريد الإلكتروني</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الموضوع</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{contact.name}</td>
                        <td className="px-4 py-3">{contact.email}</td>
                        <td className="px-4 py-3">{contact.subject || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={contact.status === 'new' ? 'bg-blue-500' : contact.status === 'replied' ? 'bg-green-500' : 'bg-gray-500'}>
                            {contact.status === 'new' ? 'جديد' : contact.status === 'replied' ? 'تم الرد' : 'مقروء'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(contact.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedContact(contact); setShowContactDetails(true); }}>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Add/Edit Product */}
          <TabsContent value="add" className="space-y-4">
            <h3 className="text-lg font-semibold">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم بالإنجليزية</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">الاسم بالعربية</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف بالإنجليزية</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف بالعربية</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ج.م)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">سعر الخصم (اختياري)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">الكمية</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">الفئة</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">روابط الصور (مفصولة بفواصل)</Label>
                  <Input
                    id="images"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="featured">منتج مميز</Label>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Order Details Modal */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                تفاصيل الطلب #{selectedOrder?.id.slice(-8)}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Update */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
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

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{selectedOrder.user?.name || 'عميل زائر'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedOrder.user?.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span dir="ltr">{selectedOrder.phone || selectedOrder.user?.phone || '-'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            {selectedOrder.shippingInfo ? (
                              <>
                                <p>{selectedOrder.shippingInfo.governorate} - {selectedOrder.shippingInfo.city}</p>
                                <p className="text-sm text-gray-500">{selectedOrder.shippingInfo.address}</p>
                                {selectedOrder.shippingInfo.landmark && (
                                  <p className="text-sm text-gray-500">علامة مميزة: {selectedOrder.shippingInfo.landmark}</p>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">لا يوجد عنوان</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      المنتجات المطلوبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.product.images?.[0] || 'https://via.placeholder.com/60'}
                            alt={item.product.nameAr}
                            className="w-14 h-14 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.product.nameAr}</p>
                            <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold">{(item.price * item.quantity).toLocaleString()} ج.م</p>
                            <p className="text-xs text-gray-500">{item.price.toLocaleString()} ج.م / قطعة</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">ملخص الطلب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المجموع الفرعي:</span>
                        <span>{selectedOrder.total.toLocaleString()} ج.م</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>الخصم:</span>
                          <span>-{selectedOrder.discount.toLocaleString()} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>الإجمالي:</span>
                        <span>{selectedOrder.total.toLocaleString()} ج.م</span>
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

        {/* Contact Message Details Modal */}
        <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                تفاصيل الرسالة
              </DialogTitle>
            </DialogHeader>
            {selectedContact && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">الاسم</p>
                    <p className="font-medium">{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                    <p className="font-medium">{selectedContact.email}</p>
                  </div>
                  {selectedContact.phone && (
                    <div>
                      <p className="text-sm text-gray-500">الهاتف</p>
                      <p className="font-medium" dir="ltr">{selectedContact.phone}</p>
                    </div>
                  )}
                  {selectedContact.subject && (
                    <div>
                      <p className="text-sm text-gray-500">الموضوع</p>
                      <p className="font-medium">{selectedContact.subject}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">الرسالة</p>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedContact.message}
                  </div>
                </div>
                
                {selectedContact.reply && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الرد السابق</p>
                    <div className="p-3 bg-green-50 rounded-lg text-sm">
                      {selectedContact.reply}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="reply">الرد</Label>
                  <Textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleReplyToMessage} className="bg-emerald-600 hover:bg-emerald-700">
                    إرسال الرد
                  </Button>
                  <Button variant="outline" onClick={() => setShowContactDetails(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
