'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Check, ChevronDown, ChevronUp, 
  Palette, Ruler, Package, Image as ImageIcon, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface VariantOption {
  id?: string;
  value: string;
  valueAr: string;
  colorCode?: string;
  image?: string;
  order: number;
}

interface Variant {
  id?: string;
  name: string;
  nameAr: string;
  order: number;
  options: VariantOption[];
}

interface VariantSKUValue {
  variantId: string;
  optionId: string;
}

interface ProductVariantSKU {
  id?: string;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  stock: number;
  image?: string;
  isActive: boolean;
  values?: {
    variantId: string;
    optionId: string;
    variant: { name: string; nameAr: string };
    option: { value: string; valueAr: string; colorCode?: string };
  }[];
}

interface ProductVariantManagerProps {
  productId: string;
  productPrice: number;
  productStock: number;
  hasVariants: boolean;
  onVariantsChange?: (hasVariants: boolean) => void;
}

// Predefined variant types
const VARIANT_TEMPLATES = [
  { name: 'Color', nameAr: 'اللون', icon: Palette },
  { name: 'Size', nameAr: 'المقاس', icon: Ruler },
  { name: 'Material', nameAr: 'الخامة', icon: Package },
];

export function ProductVariantManager({
  productId,
  productPrice,
  productStock,
  hasVariants: initialHasVariants,
  onVariantsChange
}: ProductVariantManagerProps) {
  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skus, setSkus] = useState<ProductVariantSKU[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [showSKUDialog, setShowSKUDialog] = useState(false);
  const [editingSKU, setEditingSKU] = useState<ProductVariantSKU | null>(null);

  // Load variants on mount
  useEffect(() => {
    if (hasVariants) {
      fetchVariants();
      fetchSKUs();
    }
  }, [productId, hasVariants]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      const data = await res.json();
      if (data.success) {
        setVariants(data.data);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSKUs = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/skus`);
      const data = await res.json();
      if (data.success) {
        setSkus(data.data);
      }
    } catch (error) {
      console.error('Error fetching SKUs:', error);
    }
  };

  const toggleVariants = async (enabled: boolean) => {
    setHasVariants(enabled);
    if (!enabled) {
      // Update product to remove variants
      try {
        await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasVariants: false })
        });
      } catch (error) {
        console.error('Error updating product:', error);
      }
    }
    onVariantsChange?.(enabled);
  };

  // Variant Dialog Handlers
  const openVariantDialog = (variant?: Variant) => {
    if (variant) {
      setEditingVariant({ ...variant });
    } else {
      setEditingVariant({
        name: '',
        nameAr: '',
        order: variants.length,
        options: []
      });
    }
    setShowVariantDialog(true);
  };

  const saveVariant = async () => {
    if (!editingVariant) return;
    setSaving(true);

    try {
      const isEdit = !!editingVariant.id;
      const url = isEdit 
        ? `/api/products/${productId}/variants/${editingVariant.id}`
        : `/api/products/${productId}/variants`;
      
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVariant)
      });

      const data = await res.json();
      if (data.success) {
        await fetchVariants();
        setShowVariantDialog(false);
        setEditingVariant(null);
      }
    } catch (error) {
      console.error('Error saving variant:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتغير؟')) return;

    try {
      await fetch(`/api/products/${productId}/variants/${variantId}`, {
        method: 'DELETE'
      });
      await fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  };

  // Add option to variant
  const addOption = () => {
    if (!editingVariant) return;
    setEditingVariant({
      ...editingVariant,
      options: [
        ...editingVariant.options,
        { value: '', valueAr: '', order: editingVariant.options.length }
      ]
    });
  };

  const updateOption = (index: number, field: keyof VariantOption, value: string) => {
    if (!editingVariant) return;
    const newOptions = [...editingVariant.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditingVariant({ ...editingVariant, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!editingVariant) return;
    const newOptions = editingVariant.options.filter((_, i) => i !== index);
    setEditingVariant({ ...editingVariant, options: newOptions });
  };

  // SKU Dialog Handlers
  const openSKUDialog = (sku?: ProductVariantSKU) => {
    if (sku) {
      setEditingSKU({ ...sku });
    } else {
      // Generate default values
      const defaultValues: VariantSKUValue[] = variants.map(v => ({
        variantId: v.id || '',
        optionId: v.options[0]?.id || ''
      }));

      setEditingSKU({
        sku: `${productId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        price: null,
        discountPrice: null,
        stock: 0,
        isActive: true,
        values: []
      });
    }
    setShowSKUDialog(true);
  };

  const saveSKU = async () => {
    if (!editingSKU) return;
    setSaving(true);

    try {
      const isEdit = !!editingSKU.id;
      const url = isEdit 
        ? `/api/products/${productId}/skus/${editingSKU.id}`
        : `/api/products/${productId}/skus`;
      
      // Build option values from selected options
      const optionValues = editingSKU.values?.map(v => ({
        variantId: v.variantId,
        optionId: v.optionId
      })) || [];

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingSKU, optionValues })
      });

      const data = await res.json();
      if (data.success) {
        await fetchSKUs();
        setShowSKUDialog(false);
        setEditingSKU(null);
      }
    } catch (error) {
      console.error('Error saving SKU:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSKU = async (skuId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الـ SKU؟')) return;

    try {
      await fetch(`/api/products/${productId}/skus/${skuId}`, {
        method: 'DELETE'
      });
      await fetchSKUs();
    } catch (error) {
      console.error('Error deleting SKU:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Variants Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              متغيرات المنتج
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="hasVariants">تفعيل المتغيرات</Label>
              <Switch
                id="hasVariants"
                checked={hasVariants}
                onCheckedChange={toggleVariants}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {hasVariants && (
        <>
          {/* Variants Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">أنواع المتغيرات</CardTitle>
                <Button onClick={() => openVariantDialog()} size="sm">
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة متغير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
              ) : variants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد متغيرات</p>
                  <p className="text-sm mt-1">أضف متغيرات مثل اللون، المقاس، الخامة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => {
                    const template = VARIANT_TEMPLATES.find(t => t.name === variant.name);
                    const Icon = template?.icon || Package;
                    return (
                      <div
                        key={variant.id || index}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold">{variant.nameAr}</span>
                            <span className="text-gray-500 text-sm">({variant.name})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openVariantDialog(variant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteVariant(variant.id!)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option, optIndex) => (
                            <Badge
                              key={option.id || optIndex}
                              variant="secondary"
                              className="flex items-center gap-1 py-1 px-3"
                            >
                              {option.colorCode && (
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: option.colorCode }}
                                />
                              )}
                              {option.valueAr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SKUs Section */}
          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">المخزون والأسعار (SKU)</CardTitle>
                  <Button onClick={() => openSKUDialog()} size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة SKU
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {skus.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>لا توجد SKUs</p>
                    <p className="text-sm mt-1">أنشئ تركيبات المتغيرات مع الأسعار والمخزون</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">رمز SKU</th>
                          <th className="text-right p-2">المتغيرات</th>
                          <th className="text-right p-2">السعر</th>
                          <th className="text-right p-2">المخزون</th>
                          <th className="text-right p-2">الحالة</th>
                          <th className="text-right p-2">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skus.map((sku) => (
                          <tr key={sku.id} className="border-b">
                            <td className="p-2 font-mono text-sm">{sku.sku}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {sku.values?.map((v, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {v.option.valueAr}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              {sku.price ? (
                                <span>{sku.price.toLocaleString()} ج.م</span>
                              ) : (
                                <span className="text-gray-500">افتراضي ({productPrice.toLocaleString()})</span>
                              )}
                            </td>
                            <td className="p-2">{sku.stock}</td>
                            <td className="p-2">
                              <Badge variant={sku.isActive ? 'default' : 'secondary'}>
                                {sku.isActive ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openSKUDialog(sku)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteSKU(sku.id!)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
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
            </Card>
          )}

          {/* Variant Dialog */}
          <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVariant?.id ? 'تعديل المتغير' : 'إضافة متغير جديد'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Quick Templates */}
                {!editingVariant?.id && (
                  <div>
                    <Label className="mb-2 block">اختر نوع المتغير</Label>
                    <div className="flex gap-2">
                      {VARIANT_TEMPLATES.map((template) => {
                        const Icon = template.icon;
                        return (
                          <Button
                            key={template.name}
                            variant="outline"
                            onClick={() => {
                              if (editingVariant) {
                                setEditingVariant({
                                  ...editingVariant,
                                  name: template.name,
                                  nameAr: template.nameAr
                                });
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            {template.nameAr}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الاسم (إنجليزي)</Label>
                    <Input
                      value={editingVariant?.name || ''}
                      onChange={(e) => 
                        setEditingVariant(prev => prev ? { ...prev, name: e.target.value } : null)
                      }
                      placeholder="Color"
                    />
                  </div>
                  <div>
                    <Label>الاسم (عربي)</Label>
                    <Input
                      value={editingVariant?.nameAr || ''}
                      onChange={(e) => 
                        setEditingVariant(prev => prev ? { ...prev, nameAr: e.target.value } : null)
                      }
                      placeholder="اللون"
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>الخيارات</Label>
                    <Button variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة خيار
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {editingVariant?.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                        <Input
                          placeholder="قيمة (EN)"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="قيمة (AR)"
                          value={option.valueAr}
                          onChange={(e) => updateOption(index, 'valueAr', e.target.value)}
                          className="flex-1"
                        />
                        {editingVariant?.name.toLowerCase() === 'color' && (
                          <Input
                            type="color"
                            value={option.colorCode || '#000000'}
                            onChange={(e) => updateOption(index, 'colorCode', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVariantDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={saveVariant} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* SKU Dialog */}
          <Dialog open={showSKUDialog} onOpenChange={setShowSKUDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSKU?.id ? 'تعديل SKU' : 'إضافة SKU جديد'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>رمز SKU</Label>
                  <Input
                    value={editingSKU?.sku || ''}
                    onChange={(e) => 
                      setEditingSKU(prev => prev ? { ...prev, sku: e.target.value } : null)
                    }
                  />
                </div>

                {/* Variant Selection */}
                {variants.map((variant) => (
                  <div key={variant.id}>
                    <Label>{variant.nameAr}</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {variant.options.map((option) => (
                        <Button
                          key={option.id}
                          type="button"
                          variant={
                            editingSKU?.values?.find(
                              v => v.variantId === variant.id && v.optionId === option.id
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            setEditingSKU(prev => {
                              if (!prev) return null;
                              const currentValues = prev.values || [];
                              // Remove any existing value for this variant
                              const filteredValues = currentValues.filter(
                                v => v.variantId !== variant.id
                              );
                              // Add new selection with full variant and option data
                              const newValue: VariantSKUValue = {
                                variantId: variant.id!,
                                optionId: option.id!,
                                variant: { name: variant.name, nameAr: variant.nameAr },
                                option: { 
                                  value: option.value, 
                                  valueAr: option.valueAr, 
                                  colorCode: option.colorCode 
                                }
                              };
                              return {
                                ...prev,
                                values: [
                                  ...filteredValues,
                                  newValue
                                ]
                              };
                            });
                          }}
                        >
                          {option.colorCode && (
                            <div
                              className="w-3 h-3 rounded-full ml-1"
                              style={{ backgroundColor: option.colorCode }}
                            />
                          )}
                          {option.valueAr}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>السعر (اتركه فارغاً لاستخدام السعر الافتراضي)</Label>
                    <Input
                      type="number"
                      placeholder={`افتراضي: ${productPrice}`}
                      value={editingSKU?.price || ''}
                      onChange={(e) => 
                        setEditingSKU(prev => prev ? { 
                          ...prev, 
                          price: e.target.value ? parseFloat(e.target.value) : null 
                        } : null)
                      }
                    />
                  </div>
                  <div>
                    <Label>المخزون</Label>
                    <Input
                      type="number"
                      value={editingSKU?.stock || 0}
                      onChange={(e) => 
                        setEditingSKU(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingSKU?.isActive ?? true}
                    onCheckedChange={(checked) => 
                      setEditingSKU(prev => prev ? { ...prev, isActive: checked } : null)
                    }
                  />
                  <Label>نشط</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSKUDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={saveSKU} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
