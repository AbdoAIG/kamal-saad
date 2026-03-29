'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, Plus, Edit, Trash2, Users, Check, X, Loader2, RefreshCw, UserPlus, Key, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  RESOURCES, ACTIONS, RESOURCE_LABELS, ACTION_LABELS,
  DEFAULT_ROLES, type Resource, type Action
} from '@/lib/permissions';

interface Permission {
  id: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  userCount: number;
  permissions: Permission[];
  isSystem?: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId: string | null;
  roleData: Role | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const allResources = Object.values(RESOURCES);
const allActions = Object.values(ACTIONS);

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [initStatus, setInitStatus] = useState<{ initialized: boolean; missingRoles: string[] } | null>(null);

  // Form state for roles
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    color: '#6366f1',
    permissions: [] as { resource: string; action: string }[],
  });

  // Form state for users
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    roleId: '',
  });

  useEffect(() => {
    fetchRoles();
    fetchAdminUsers();
    checkInitStatus();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const checkInitStatus = async () => {
    try {
      const res = await fetch('/api/admin/roles/init');
      const data = await res.json();
      if (data.success) {
        setInitStatus(data);
      }
    } catch (error) {
      console.error('Error checking init status:', error);
    }
  };

  const initRoles = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/roles/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
        checkInitStatus();
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      color: '#6366f1',
      permissions: [],
    });
    setShowDialog(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      nameAr: role.nameAr,
      description: role.description || '',
      color: role.color,
      permissions: role.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
      })),
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.nameAr) {
      alert('اسم الدور مطلوب');
      return;
    }

    setSaving(true);
    try {
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole ? { id: editingRole.id, ...formData } : formData;

      const res = await fetch('/api/admin/roles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setShowDialog(false);
        fetchRoles();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

    try {
      const res = await fetch(`/api/admin/roles?id=${roleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const exists = formData.permissions.some(
      (p) => p.resource === resource && p.action === action
    );

    if (exists) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(
          (p) => !(p.resource === resource && p.action === action)
        ),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, { resource, action }],
      });
    }
  };

  const hasPermission = (resource: string, action: string) => {
    return formData.permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  const isSystemRole = (roleName: string) => {
    return DEFAULT_ROLES.some((r) => r.name === roleName);
  };

  // User management functions
  const openCreateUserDialog = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      roleId: '',
    });
    setShowUserDialog(true);
  };

  const openEditUserDialog = (user: AdminUser) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      password: '',
      name: user.name,
      phone: '',
      roleId: user.roleId || '',
    });
    setShowUserDialog(true);
  };

  const handleUserSubmit = async () => {
    if (!userFormData.email || (!editingUser && !userFormData.password)) {
      alert('البريد الإلكتروني وكلمة المرور مطلوبان');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            name: userFormData.name,
            phone: userFormData.phone,
            roleId: userFormData.roleId || null,
            password: userFormData.password || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowUserDialog(false);
          fetchAdminUsers();
        } else {
          alert(data.error || 'حدث خطأ');
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userFormData),
        });
        const data = await res.json();
        if (data.success) {
          setShowUserDialog(false);
          fetchAdminUsers();
        } else {
          alert(data.error || 'حدث خطأ');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAdminUsers();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleUserActive = async (user: AdminUser) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminUsers();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأدوار والمستخدمين</h2>
          <p className="text-gray-500">إدارة أدوار المستخدمين وصلاحياتهم وإنشاء مدراء جدد</p>
        </div>
        <div className="flex gap-2">
          {initStatus && !initStatus.initialized && (
            <Button variant="outline" onClick={initRoles} disabled={saving} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              تهيئة الأدوار
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateUserDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-4 w-4" />
              إضافة مستخدم جديد
            </Button>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المستخدم</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">البريد الإلكتروني</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الدور</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">آخر دخول</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {adminUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.name || 'بدون اسم'}</p>
                              <p className="text-xs text-gray-500">{user.role === 'super_admin' ? 'سوبر أدمن' : 'مدير'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            style={{ backgroundColor: user.roleData?.color || '#6366f1' }}
                            className="text-white"
                          >
                            {user.roleData?.nameAr || (user.role === 'super_admin' ? 'سوبر أدمن' : 'مدير')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.isActive ? "default" : "secondary"} 
                            className={user.isActive ? "bg-green-500" : "bg-gray-400"}>
                            {user.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : 'لم يسجل دخول بعد'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditUserDialog(user)} title="تعديل">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleUserActive(user)}
                              title={user.isActive ? 'تعطيل' : 'تفعيل'}
                              className={user.isActive ? 'text-orange-500' : 'text-green-500'}
                            >
                              {user.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </Button>
                            {user.role !== 'super_admin' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-500 hover:bg-red-50"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>لا يوجد مستخدمين مديرين</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              إضافة دور جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="overflow-hidden">
                <CardHeader className="text-white" style={{ backgroundColor: role.color }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.nameAr}
                    </CardTitle>
                    {isSystemRole(role.name) && (
                      <Badge variant="secondary" className="bg-white/20 text-white">نظام</Badge>
                    )}
                  </div>
                  <p className="text-sm text-white/80">{role.name}</p>
                </CardHeader>
                <CardContent className="p-4">
                  {role.description && <p className="text-sm text-gray-600 mb-4">{role.description}</p>}

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {role.userCount} مستخدم
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {role.permissions.length} صلاحية
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4 max-h-24 overflow-y-auto">
                    {role.permissions.slice(0, 8).map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {RESOURCE_LABELS[p.resource as Resource]?.ar || p.resource}
                      </Badge>
                    ))}
                    {role.permissions.length > 8 && (
                      <Badge variant="secondary" className="text-xs">+{role.permissions.length - 8}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(role)} className="flex-1">
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    {!isSystemRole(role.name) && role.userCount === 0 && (
                      <Button variant="outline" size="sm" onClick={() => handleDelete(role.id)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>اسم الدور (إنجليزي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="products_manager"
                  disabled={editingRole ? isSystemRole(editingRole.name) : false}
                />
              </div>
              <div>
                <Label>اسم الدور (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مدير المنتجات"
                />
              </div>
            </div>

            <div>
              <Label>الوصف</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الدور..."
              />
            </div>

            <div>
              <Label>اللون</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold">الصلاحيات</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">المورد</th>
                      {allActions.map((action) => (
                        <th key={action} className="px-2 py-2 text-center">
                          {ACTION_LABELS[action]?.ar || action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allResources.map((resource) => (
                      <tr key={resource} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{RESOURCE_LABELS[resource]?.ar || resource}</td>
                        {allActions.map((action) => (
                          <td key={`${resource}-${action}`} className="px-2 py-2 text-center">
                            <Checkbox
                              checked={hasPermission(resource, action) || false}
                              onCheckedChange={() => togglePermission(resource, action)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</> : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="admin@example.com"
                disabled={!!editingUser}
              />
            </div>

            <div>
              <Label>كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء على الحالية)' : '*'}</Label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label>الاسم</Label>
              <Input
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="أحمد محمد"
              />
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="+20 100 123 4567"
              />
            </div>

            <div>
              <Label>الدور</Label>
              <Select value={userFormData.roleId} onValueChange={(value) => setUserFormData({ ...userFormData, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        {role.nameAr}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>إلغاء</Button>
            <Button onClick={handleUserSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</> : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
