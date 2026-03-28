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
import {
  Shield, Plus, Edit, Trash2, Users, Check, X, Loader2, RefreshCw
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

const allResources = Object.values(RESOURCES);
const allActions = Object.values(ACTIONS);

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [initStatus, setInitStatus] = useState<{ initialized: boolean; missingRoles: string[] } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    color: '#6366f1',
    permissions: [] as { resource: string; action: string }[],
  });

  useEffect(() => {
    fetchRoles();
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
      const url = editingRole
        ? `/api/admin/roles`
        : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole
        ? { id: editingRole.id, ...formData }
        : formData;

      const res = await fetch(url, {
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
      const res = await fetch(`/api/admin/roles?id=${roleId}`, {
        method: 'DELETE',
      });
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
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأدوار والصلاحيات</h2>
          <p className="text-gray-500">إدارة أدوار المستخدمين وصلاحياتهم</p>
        </div>
        <div className="flex gap-2">
          {initStatus && !initStatus.initialized && (
            <Button
              variant="outline"
              onClick={initRoles}
              disabled={saving}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              تهيئة الأدوار
            </Button>
          )}
          <Button onClick={openCreateDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            إضافة دور جديد
          </Button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="overflow-hidden">
            <CardHeader
              className="text-white"
              style={{ backgroundColor: role.color }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {role.nameAr}
                </CardTitle>
                {isSystemRole(role.name) && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    نظام
                  </Badge>
                )}
              </div>
              <p className="text-sm text-white/80">{role.name}</p>
            </CardHeader>
            <CardContent className="p-4">
              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}

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

              {/* Permissions Preview */}
              <div className="flex flex-wrap gap-1 mb-4 max-h-24 overflow-y-auto">
                {role.permissions.slice(0, 8).map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {RESOURCE_LABELS[p.resource as Resource]?.ar || p.resource}
                  </Badge>
                ))}
                {role.permissions.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{role.permissions.length - 8}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(role)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 ml-1" />
                  تعديل
                </Button>
                {!isSystemRole(role.name) && role.userCount === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(role.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
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

            {/* Permissions Matrix */}
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
                        <td className="px-4 py-2 font-medium">
                          {RESOURCE_LABELS[resource]?.ar || resource}
                        </td>
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</>
              ) : (
                'حفظ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
