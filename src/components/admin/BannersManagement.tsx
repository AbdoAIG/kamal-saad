'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Plus, Edit, Trash2, Image, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/admin/ImageUploader';

/* ───────────── Types ───────────── */

interface Banner {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string | null;
  subtitleAr: string | null;
  image: string;
  link: string | null;
  section: string;
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  hotspotW: number;
  hotspotH: number;
  active: boolean;
  order: number;
}

/* ───────────── Config ───────────── */

const SECTIONS = [
  { key: 'hero', label: 'شريط البطل', icon: '🖼️', color: '#9333ea', bg: 'bg-purple-50', border: 'border-purple-300' },
  { key: 'below-categories', label: 'أسفل الأقسام', icon: '📐', color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-300' },
  { key: 'between-products', label: 'بين المنتجات', icon: '📦', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-300' },
  { key: 'above-footer', label: 'فوق الفوتر', icon: '📌', color: '#e11d48', bg: 'bg-rose-50', border: 'border-rose-300' },
] as const;

const DEFAULT_FORM = {
  title: '', titleAr: '', subtitle: '', subtitleAr: '',
  image: '', link: '', section: 'hero',
  width: 0, height: 0,
  hotspotX: 0, hotspotY: 0, hotspotW: 0, hotspotH: 0,
  active: true, order: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // Hotspot
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  /* ── Fetch ── */
  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners');
      const json = await res.json();
      if (json.success) setBanners(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const bySection = (section: string) =>
    banners.filter(b => b.section === section).sort((a, b) => a.order - b.order);

  /* ── API ── */
  const moveBanner = async (bannerId: string, newSection: string) => {
    try {
      await fetch('/api/banners', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bannerId, section: newSection }),
      });
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const reorderBanner = async (id: string, dir: 'up' | 'down') => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    const siblings = bySection(banner.section);
    const idx = siblings.findIndex(s => s.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    try {
      await Promise.all([
        fetch('/api/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: banner.id, order: swap.order }) }),
        fetch('/api/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swap.id, order: banner.order }) }),
      ]);
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingBanner;
      const res = await fetch('/api/banners', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingBanner.id, ...formData } : formData),
      });
      if (res.ok) { cancelForm(); fetchBanners(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (e) { console.error(e); }
  };

  const openEdit = (b: Banner) => {
    setEditingBanner(b);
    setFormData({
      title: b.title, titleAr: b.titleAr,
      subtitle: b.subtitle || '', subtitleAr: b.subtitleAr || '',
      image: b.image, link: b.link || '',
      section: b.section, width: b.width, height: b.height,
      hotspotX: b.hotspotX, hotspotY: b.hotspotY,
      hotspotW: b.hotspotW, hotspotH: b.hotspotH,
      active: b.active, order: b.order,
    });
    setShowForm(true);
  };

  const openNew = (section?: string) => {
    setEditingBanner(null);
    setFormData({ ...DEFAULT_FORM, section: section || 'hero', order: bySection(section || 'hero').length });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({ ...DEFAULT_FORM });
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
  };

  /* ── Hotspot Drawing ── */
  const getCoords = (e: React.MouseEvent) => {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };

  const onDrawStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const c = getCoords(e);
    setIsDrawing(true);
    setDrawStart(c);
    setPreviewRect({ x: c.x, y: c.y, w: 0, h: 0 });
  };
  const onDrawMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const c = getCoords(e);
    setPreviewRect({
      x: Math.min(drawStart.x, c.x),
      y: Math.min(drawStart.y, c.y),
      w: Math.abs(c.x - drawStart.x),
      h: Math.abs(c.y - drawStart.y),
    });
  };
  const onDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (previewRect && previewRect.w > 2 && previewRect.h > 2) {
      setFormData(p => ({
        ...p,
        hotspotX: Math.round(previewRect.x * 10) / 10,
        hotspotY: Math.round(previewRect.y * 10) / 10,
        hotspotW: Math.round(previewRect.w * 10) / 10,
        hotspotH: Math.round(previewRect.h * 10) / 10,
      }));
    }
    setDrawStart(null);
    setPreviewRect(null);
  };
  const clearHotspot = () => setFormData(p => ({ ...p, hotspotX: 0, hotspotY: 0, hotspotW: 0, hotspotH: 0 }));
  const hasHotspot = formData.hotspotW > 0 && formData.hotspotH > 0;

  /* ── Drag & Drop (proper HTML5) ── */
  const onDragStart = (e: React.DragEvent, bannerId: string) => {
    e.dataTransfer.setData('text/plain', bannerId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(null);
    const bannerId = e.dataTransfer.getData('text/plain');
    if (bannerId) moveBanner(bannerId, section);
  };

  /* ── Quick Links ── */
  const quickLinks = [
    { label: 'الرئيسية', value: '/' },
    { label: 'بحث', value: '/?search=' },
    { label: 'قسم', value: '/?category=' },
    { label: 'منتج', value: '/product/' },
    { label: 'رابط خارجي', value: 'https://' },
  ];

  /* ═══════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */

  if (loading) return (
    <div className="flex justify-center items-center py-20" dir="rtl">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">إدارة البنرات</h2>
          <p className="text-sm text-gray-500">سحب وإفلات البانرات لتحديد مكان عرضها في الصفحة الرئيسية</p>
        </div>
        <Button onClick={() => openNew()} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="h-4 w-4" /> إضافة بانر
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setViewMode('visual')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'visual' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
          🖥️ معاينة الصفحة
        </button>
        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
          📋 قائمة
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         VISUAL SIMULATOR
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'visual' && (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-gray-700 rounded-md px-2 py-0.5 text-[10px] text-gray-400 font-mono text-center">
              🔒 kamal-saad.com
            </div>
          </div>

          <div className="overflow-hidden">
            {/* ── Mini Header ── */}
            <div className="bg-gradient-to-l from-teal-600 to-emerald-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-[8px] font-bold">KS</div>
                <span className="text-white font-bold text-[10px]">كمال سعد</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/10 rounded-full" />
                <div className="w-4 h-4 bg-white/10 rounded-full" />
                <div className="w-4 h-4 bg-white/10 rounded-full" />
              </div>
            </div>

            {/* ── HERO DROP ZONE ── */}
            <DropZone
              sectionKey="hero"
              icon="🖼️"
              label="شريط البطل"
              banners={bySection('hero')}
              display="full"
            />

            {/* ── Categories Mockup ── */}
            <div className="px-4 py-3 bg-gray-50 border-y border-gray-100">
              <p className="text-[9px] font-bold text-gray-500 mb-2">📦 الأقسام</p>
              <div className="flex gap-2">
                {['teal', 'blue', 'amber', 'rose', 'purple', 'cyan'].map((c, i) => (
                  <div key={i} className={`w-10 h-10 rounded-lg bg-${c}-100 flex items-center justify-center text-${c}-600 text-[8px] font-bold`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* ── BELOW CATEGORIES DROP ZONE ── */}
            <DropZone
              sectionKey="below-categories"
              icon="📐"
              label="أسفل الأقسام"
              banners={bySection('below-categories')}
              display="grid"
            />

            {/* ── Products Mockup ── */}
            <div className="px-4 py-3 bg-white border-y border-gray-100">
              <p className="text-[9px] font-bold text-gray-500 mb-2">🛍️ المنتجات</p>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-1.5">
                      <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
                      <div className="h-1.5 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BETWEEN PRODUCTS DROP ZONE ── */}
            <DropZone
              sectionKey="between-products"
              icon="📦"
              label="بين المنتجات"
              banners={bySection('between-products')}
              display="grid"
            />

            {/* ── How to Order Mockup ── */}
            <div className="px-4 py-3 bg-emerald-50 border-y border-gray-100">
              <p className="text-[9px] font-bold text-gray-500 mb-2">🛒 كيف تطلب</p>
              <div className="flex justify-around">
                {['1', '2', '3', '4'].map(s => (
                  <div key={s} className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[8px] font-bold" />
                ))}
              </div>
            </div>

            {/* ── ABOVE FOOTER DROP ZONE ── */}
            <DropZone
              sectionKey="above-footer"
              icon="📌"
              label="فوق الفوتر"
              banners={bySection('above-footer')}
              display="grid"
            />

            {/* ── Footer Mockup ── */}
            <div className="bg-gray-800 px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="h-1.5 w-12 bg-gray-600 rounded" />
                <div className="flex gap-2">
                  <div className="h-1.5 w-8 bg-gray-600 rounded" />
                  <div className="h-1.5 w-8 bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center bg-gray-50 py-2 border-t border-gray-100">
            🖱️ اسحب البانرات وأفلتها في أي قسم • اضغط ✏️ للتعديل
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         LIST VIEW
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {SECTIONS.map(sec => {
            const secBanners = bySection(sec.key);
            return (
              <div key={sec.key}>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">{sec.icon} {sec.label} ({secBanners.length})</h3>
                {secBanners.length === 0 ? (
                  <div className="text-center py-8 text-gray-300 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    لا توجد بنرات
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {secBanners.map(b => (
                      <Card key={b.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-video bg-gray-100">
                          <img src={b.image} alt={b.titleAr} className="w-full h-full object-cover" />
                          {!b.active && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Badge variant="destructive" className="text-[10px]">معطل</Badge></div>}
                          {b.hotspotW > 0 && (
                            <div className="absolute border-2 border-dashed border-emerald-400 bg-emerald-400/10 pointer-events-none" style={{ left: `${b.hotspotX}%`, top: `${b.hotspotY}%`, width: `${b.hotspotW}%`, height: `${b.hotspotH}%` }} />
                          )}
                          <div className="absolute top-1.5 right-1.5">
                            <Badge className="text-[9px]" style={{ backgroundColor: sec.color, color: '#fff' }}>{sec.label}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="font-semibold text-sm truncate">{b.titleAr}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] text-gray-400">
                            {b.height > 0 && <span>{b.height}px</span>}
                            {b.hotspotW > 0 && <span className="text-emerald-600">🎯 hotspot</span>}
                            {b.link && <span className="text-blue-500 truncate max-w-[80px]" dir="ltr">{b.link}</span>}
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <Button variant="outline" size="sm" className="h-7" onClick={() => openEdit(b)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="h-7 text-red-500" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                            <div className="flex-1" />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => reorderBanner(b.id, 'up')}><ChevronUp className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => reorderBanner(b.id, 'down')}><ChevronDown className="h-3 w-3" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         FORM MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={cancelForm}>
          <Card className="w-full max-w-2xl my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{editingBanner ? '✏️ تعديل البانر' : '➕ إضافة بانر جديد'}</CardTitle>
                <button onClick={cancelForm} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Section selector */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">📍 القسم</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {SECTIONS.map(s => (
                      <button key={s.key} type="button" onClick={() => setFormData(p => ({ ...p, section: s.key }))}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${formData.section === s.key ? `${s.bg} ${s.border} shadow-md` : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-lg block">{s.icon}</span>
                        <span className="text-[10px] font-bold block mt-0.5">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions - Auto-detected from image */}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-blue-700">📐 الأبعاد (تلقائية)</p>
                    {formData.width > 0 && formData.height > 0 && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {formData.width} × {formData.height}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-500">
                    يتم اكتشاف الأبعاد تلقائياً من الصورة. اتركها كما هي لعرض البانر بالكامل.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">العرض (px)</Label>
                      <Input type="number" min={0} value={formData.width || ''} onChange={e => setFormData(p => ({ ...p, width: parseInt(e.target.value) || 0 }))} placeholder="تلقائي" dir="ltr" className="font-mono text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الارتفاع (px)</Label>
                      <Input type="number" min={0} value={formData.height || ''} onChange={e => setFormData(p => ({ ...p, height: parseInt(e.target.value) || 0 }))} placeholder="تلقائي" dir="ltr" className="font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs">الترتيب</Label>
                    <Input type="number" min={0} value={formData.order || ''} onChange={e => setFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} placeholder="0" />
                  </div>
                </div>

                {/* Titles */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان (عربي) *</Label>
                    <Input value={formData.titleAr} onChange={e => setFormData(p => ({ ...p, titleAr: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان (إنجليزي) *</Label>
                    <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required dir="ltr" />
                  </div>
                </div>

                {/* Image */}
                <div className="space-y-1">
                  <Label className="font-semibold text-sm">🖼️ الصورة *</Label>
                  <ImageUploader 
                    images={formData.image ? [formData.image] : []} 
                    onImagesChange={imgs => {
                      const newImage = imgs[0] || '';
                      setFormData(p => ({ ...p, image: newImage }));
                      
                      // Auto-detect image dimensions
                      if (newImage) {
                        const img = document.createElement('img');
                        img.onload = () => {
                          setFormData(p => ({ 
                            ...p, 
                            width: img.naturalWidth,
                            height: img.naturalHeight 
                          }));
                        };
                        img.src = newImage;
                      }
                    }} 
                    maxImages={1} 
                    folder="kamal-saad-banners" 
                  />
                  {formData.width > 0 && formData.height > 0 && (
                    <p className="text-xs text-gray-500">
                      📐 الأبعاد: {formData.width} × {formData.height} بكسل
                    </p>
                  )}
                </div>

                {/* Hotspot */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-emerald-700">🎯 منطقة النقر (Hotspot)</p>
                      <p className="text-[10px] text-emerald-500">ارسم على الصورة لتحديد منطقة النقر</p>
                    </div>
                    {hasHotspot && <Button type="button" variant="outline" size="sm" onClick={clearHotspot} className="h-7 text-xs text-red-500 border-red-200"><X className="h-3 w-3 ml-1" /> مسح</Button>}
                  </div>

                  {formData.image ? (
                    <div className="space-y-2">
                      <div
                        ref={imgRef}
                        className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-emerald-200 cursor-crosshair select-none"
                        style={{ height: '260px' }}
                        onMouseDown={onDrawStart}
                        onMouseMove={onDrawMove}
                        onMouseUp={onDrawEnd}
                        onMouseLeave={() => { if (isDrawing) onDrawEnd(); }}
                      >
                        <img src={formData.image} alt="Banner" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
                        {hasHotspot && !isDrawing && (
                          <div className="absolute border-2 border-dashed border-emerald-500 bg-emerald-500/10 rounded-lg pointer-events-none z-10" style={{ left: `${formData.hotspotX}%`, top: `${formData.hotspotY}%`, width: `${formData.hotspotW}%`, height: `${formData.hotspotH}%` }}>
                            <span className="absolute -top-4 right-0 text-[9px] font-bold text-emerald-700 bg-white/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">🔗 منطقة نقر</span>
                          </div>
                        )}
                        {isDrawing && previewRect && previewRect.w > 0.5 && (
                          <div className="absolute border-2 border-blue-500 bg-blue-500/15 rounded-lg z-20 pointer-events-none" style={{ left: `${previewRect.x}%`, top: `${previewRect.y}%`, width: `${previewRect.w}%`, height: `${previewRect.h}%` }} />
                        )}
                        {!hasHotspot && !isDrawing && (
                          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-xl"><p>🖱️ اضغط واسحب لرسم منطقة النقر</p></div>
                          </div>
                        )}
                      </div>
                      {hasHotspot && (
                        <div className="grid grid-cols-4 gap-2">
                          {[{ l: 'X', v: formData.hotspotX }, { l: 'Y', v: formData.hotspotY }, { l: 'عرض %', v: formData.hotspotW }, { l: 'ارتفاع %', v: formData.hotspotH }].map(c => (
                            <div key={c.l} className="bg-white rounded-lg p-1.5 border border-emerald-100 text-center">
                              <p className="text-[9px] text-emerald-500">{c.l}</p>
                              <p className="font-mono text-xs font-bold text-gray-700">{c.v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-emerald-400 text-sm">قم برفع صورة البانر أولاً</p>
                  )}

                  {/* Link */}
                  <div className="space-y-1 pt-1">
                    <Label className="text-xs">🔗 رابط الوجهة</Label>
                    <Input value={formData.link} onChange={e => setFormData(p => ({ ...p, link: e.target.value }))} placeholder="/?search=أقلام  أو  https://..." dir="ltr" className="font-mono text-sm" />
                    <div className="flex flex-wrap gap-1">
                      {quickLinks.map((ex, i) => (
                        <button key={i} type="button" onClick={() => setFormData(p => ({ ...p, link: ex.value }))} className="text-[9px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-100" dir="ltr">{ex.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                  <span className="text-sm font-semibold">بانر فعال</span>
                </label>

                {/* Submit */}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingBanner ? '💾 حفظ التعديلات' : '➕ إضافة البانر'}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelForm}>إلغاء</Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     DROP ZONE COMPONENT
     ═══════════════════════════════════════════════════════════════════════════════ */

  function DropZone({ sectionKey, icon, label, banners, display }: {
    sectionKey: string;
    icon: string;
    label: string;
    banners: Banner[];
    display: 'full' | 'grid';
  }) {
    const sec = SECTIONS.find(s => s.key === sectionKey)!;
    const isOver = dragOverSection === sectionKey;

    return (
      <div
        className={`relative mx-3 my-2 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
          isOver
            ? `${sec.bg} ${sec.border} border-solid shadow-lg scale-[1.005]`
            : 'border-dashed border-gray-200 bg-white/60 hover:border-gray-300'
        }`}
        onDragOver={onDragOver}
        onDragEnter={() => setDragOverSection(sectionKey)}
        onDragLeave={() => setDragOverSection(null)}
        onDrop={(e) => onDrop(e, sectionKey)}
      >
        {/* Section label */}
        <div className={`flex items-center justify-between px-2.5 py-1.5 border-b ${isOver ? 'border-gray-300 bg-white/80' : 'border-transparent'}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">{icon}</span>
            <span className="text-[10px] font-bold text-gray-600">{label}</span>
            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{banners.length}</span>
          </div>
          <button type="button" onClick={() => openNew(sectionKey)} className="text-gray-300 hover:text-emerald-600 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Banners or empty state */}
        {banners.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-5 transition-colors ${isOver ? 'text-emerald-500' : 'text-gray-300'}`}>
            <Plus className="h-4 w-4 mb-1" />
            <span className="text-[9px] font-medium">{isOver ? 'أفلت البانر هنا' : 'اسحب بانر هنا'}</span>
          </div>
        ) : (
          <div className={`p-1.5 ${display === 'full' ? 'space-y-1.5' : 'grid gap-1.5'}`} style={display !== 'full' ? { gridTemplateColumns: banners.length === 1 ? '1fr' : 'repeat(2, 1fr)' } : undefined}>
            {banners.map((b, idx) => {
              const h = b.height > 0 ? Math.max(40, Math.min(b.height * 0.15, 80)) : display === 'full' ? 60 : 50;
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, b.id)}
                  onDragEnd={() => setDragOverSection(null)}
                  className="group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-gray-200 hover:shadow-md transition-all"
                  style={{ height: `${h}px` }}
                >
                  <img src={b.image} alt={b.titleAr} className="w-full h-full object-cover" draggable={false} />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Title */}
                  <div className="absolute bottom-0 inset-x-0 px-1.5 pb-1">
                    <p className="text-[8px] font-bold text-white truncate drop-shadow-sm">{b.titleAr}</p>
                  </div>

                  {/* Top-right badges */}
                  <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                    {b.height > 0 && <span className="text-[7px] bg-black/50 text-white px-1 py-px rounded">{b.height}px</span>}
                    {b.hotspotW > 0 && <span className="text-[7px] bg-emerald-500 text-white px-1 py-px rounded">🎯</span>}
                    {!b.active && <span className="text-[7px] bg-red-500 text-white px-1 py-px rounded">✗</span>}
                  </div>

                  {/* Action buttons on hover */}
                  <div className="absolute top-0.5 left-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(b); }} className="w-4 h-4 bg-white/90 rounded flex items-center justify-center shadow-sm hover:bg-white">
                      <Edit className="w-2 h-2 text-gray-600" />
                    </button>
                    {idx > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); reorderBanner(b.id, 'up'); }} className="w-4 h-4 bg-white/90 rounded flex items-center justify-center shadow-sm hover:bg-white">
                        <ChevronUp className="w-2 h-2 text-gray-600" />
                      </button>
                    )}
                    {idx < banners.length - 1 && (
                      <button onClick={(e) => { e.stopPropagation(); reorderBanner(b.id, 'down'); }} className="w-4 h-4 bg-white/90 rounded flex items-center justify-center shadow-sm hover:bg-white">
                        <ChevronDown className="w-2 h-2 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Drag indicator */}
                  <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-2.5 h-2.5 text-white drop-shadow" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active drop highlight */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed pointer-events-none rounded-xl z-10" style={{ borderColor: sec.color }} />
        )}
      </div>
    );
  }
}
