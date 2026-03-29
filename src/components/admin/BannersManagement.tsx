'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Plus, Edit, Trash2, Image, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/admin/ImageUploader';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Sections Config ─────────────────────────────────────────────────────────

const SECTIONS: Record<string, { label: string; icon: string; color: string }> = {
  hero: { label: 'شريط البطل', icon: '🖼️', color: 'border-purple-400 bg-purple-50' },
  'below-categories': { label: 'أسفل الأقسام', icon: '📐', color: 'border-blue-400 bg-blue-50' },
  'between-products': { label: 'بين المنتجات', icon: '📦', color: 'border-amber-400 bg-amber-50' },
  'above-footer': { label: 'فوق الفوتر', icon: '📌', color: 'border-rose-400 bg-rose-50' },
};

// ─── Default Form Data ──────────────────────────────────────────────────────

const DEFAULT_FORM = {
  title: '',
  titleAr: '',
  subtitle: '',
  subtitleAr: '',
  image: '',
  link: '',
  section: 'hero',
  width: 0,
  height: 0,
  hotspotX: 0,
  hotspotY: 0,
  hotspotW: 0,
  hotspotH: 0,
  active: true,
  order: 0,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BannersManagement() {
  // ── State ──
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [draggedBannerId, setDraggedBannerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // Hotspot drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // ── Fetch Banners ──
  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners');
      const json = await res.json();
      if (json.success) {
        setBanners(json.data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // ── Helper: get banners by section, sorted by order ──
  const getBannersBySection = (section: string) =>
    banners
      .filter((b) => b.section === section)
      .sort((a, b) => a.order - b.order);

  // ── API Functions ──
  const moveBannerToSection = async (bannerId: string, newSection: string) => {
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bannerId, section: newSection }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchBanners();
      }
    } catch (err) {
      console.error('Error moving banner:', err);
    }
  };

  const reorderBanner = async (bannerId: string, direction: 'up' | 'down') => {
    const banner = banners.find((b) => b.id === bannerId);
    if (!banner) return;

    const siblings = getBannersBySection(banner.section);
    const idx = siblings.findIndex((s) => s.id === bannerId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const swapBanner = siblings[swapIdx];

    try {
      await Promise.all([
        fetch('/api/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: banner.id, order: swapBanner.order }),
        }),
        fetch('/api/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapBanner.id, order: banner.order }),
        }),
      ]);
      await fetchBanners();
    } catch (err) {
      console.error('Error reordering banner:', err);
    }
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
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        setEditingBanner(null);
        setFormData(DEFAULT_FORM);
        await fetchBanners();
      }
    } catch (err) {
      console.error('Error saving banner:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await fetchBanners();
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
    }
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      titleAr: banner.titleAr,
      subtitle: banner.subtitle || '',
      subtitleAr: banner.subtitleAr || '',
      image: banner.image,
      link: banner.link || '',
      section: banner.section,
      width: banner.width,
      height: banner.height,
      hotspotX: banner.hotspotX,
      hotspotY: banner.hotspotY,
      hotspotW: banner.hotspotW,
      hotspotH: banner.hotspotH,
      active: banner.active,
      order: banner.order,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingBanner(null);
    setFormData({ ...DEFAULT_FORM, order: getBannersBySection('hero').length });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData(DEFAULT_FORM);
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
  };

  // ── Hotspot Drawing ──
  const getRelativeCoords = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleHotspotMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    const coords = getRelativeCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setPreviewRect(null);
  };

  const handleHotspotMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDrawing || !drawStart) return;
    const coords = getRelativeCoords(e);
    setPreviewRect({
      x: Math.min(drawStart.x, coords.x),
      y: Math.min(drawStart.y, coords.y),
      w: Math.abs(coords.x - drawStart.x),
      h: Math.abs(coords.y - drawStart.y),
    });
  };

  const handleHotspotMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (previewRect && previewRect.w > 0.01 && previewRect.h > 0.01) {
      setFormData((prev) => ({
        ...prev,
        hotspotX: parseFloat((previewRect.x * 100).toFixed(2)),
        hotspotY: parseFloat((previewRect.y * 100).toFixed(2)),
        hotspotW: parseFloat((previewRect.w * 100).toFixed(2)),
        hotspotH: parseFloat((previewRect.h * 100).toFixed(2)),
      }));
    }
    setDrawStart(null);
    setPreviewRect(null);
  };

  const clearHotspot = () => {
    setFormData((prev) => ({
      ...prev,
      hotspotX: 0,
      hotspotY: 0,
      hotspotW: 0,
      hotspotH: 0,
    }));
    setPreviewRect(null);
    setDrawStart(null);
  };

  // ── Drag & Drop ──
  const handleDragStart = (bannerId: string) => {
    setDraggedBannerId(bannerId);
  };

  const handleDragEnd = () => {
    setDraggedBannerId(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(section);
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(null);
    if (draggedBannerId) {
      moveBannerToSection(draggedBannerId, section);
    }
  };

  // ── Quick-insert link examples ──
  const quickLinks = [
    { label: 'الصفحة الرئيسية', value: '/' },
    { label: 'المنتجات', value: '/products' },
    { label: 'الأقسام', value: '/categories' },
    { label: 'العروض', value: '/offers' },
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة البانرات</h2>
          <p className="text-gray-500">إدارة وتنظيم بانرات المتجر بالسحب والإفلات</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="h-4 w-4" />
          إضافة بانر
        </Button>
      </div>

      {/* ── View Mode Toggle ── */}
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm w-fit">
        <Button
          variant={viewMode === 'visual' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('visual')}
          className={viewMode === 'visual' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          🖥️ عرض بصري
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          📋 عرض قائمة
        </Button>
      </div>

      {/* ── Visual Simulator ── */}
      {viewMode === 'visual' && <VisualSimulator />}

      {/* ── List View ── */}
      {viewMode === 'list' && <ListView />}

      {/* ── Banner Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-2xl my-8">
            <BannerForm />
          </div>
        </div>
      )}
    </div>
  );

  // ─── Visual Simulator Sub-component ──────────────────────────────────────

  function VisualSimulator() {
    const SCALE = 0.38;

    return (
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            🖥️ محاكي الصفحة الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-gray-100 rounded-b-xl overflow-hidden flex justify-center">
            <div
              className="bg-white shadow-2xl rounded-xl overflow-hidden origin-top"
              style={{ width: `${100 / SCALE}%`, transform: `scale(${SCALE})`, transformOrigin: 'top center' }}
            >
              <div className="w-full" style={{ minHeight: '1300px' }}>
                {/* ── Browser Bar ── */}
                <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 text-center border border-gray-300">
                    🔒 kamal-saad.com
                  </div>
                </div>

                {/* ── Header Mockup ── */}
                <div className="bg-gradient-to-l from-teal-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      KS
                    </div>
                    <span className="text-white font-bold text-sm">كمال سعد</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* ── Hero Drop Zone ── */}
                <DropZoneSection section="hero" label="شريط البطل" icon="🖼️" display="full" />

                {/* ── Categories Mockup ── */}
                <div className="px-6 py-5 bg-gray-50">
                  <p className="text-xs font-bold text-gray-600 mb-3">الأقسام</p>
                  <div className="flex gap-3 overflow-hidden">
                    {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((c, i) => (
                      <div key={i} className="shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1" style={{ backgroundColor: c + '18', border: `2px solid ${c}40` }}>
                        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: c }} />
                        <span className="text-[8px] text-gray-500">قسم {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Below Categories Drop Zone ── */}
                <DropZoneSection section="below-categories" label="أسفل الأقسام" icon="📐" display="grid" />

                {/* ── Products Mockup ── */}
                <div className="px-6 py-5 bg-white">
                  <p className="text-xs font-bold text-gray-600 mb-3">المنتجات</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                        <div className="aspect-square bg-gray-200 flex items-center justify-center">
                          <Image className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="p-2">
                          <div className="h-2 bg-gray-200 rounded w-full mb-1" />
                          <div className="h-2 bg-gray-200 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Between Products Drop Zone ── */}
                <DropZoneSection section="between-products" label="بين المنتجات" icon="📦" display="grid" />

                {/* ── Info Section Mockup ── */}
                <div className="px-6 py-5 bg-emerald-50">
                  <div className="flex justify-around items-center">
                    {['🚚', '💳', '🔄', '📞'].map((icon, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-lg">{icon}</span>
                        <div className="h-1.5 w-8 bg-emerald-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Above Footer Drop Zone ── */}
                <DropZoneSection section="above-footer" label="فوق الفوتر" icon="📌" display="grid" />

                {/* ── Footer Mockup ── */}
                <div className="bg-gray-800 px-6 py-5">
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-16 bg-gray-600 rounded" />
                    <div className="flex gap-3">
                      <div className="h-2 w-10 bg-gray-600 rounded" />
                      <div className="h-2 w-10 bg-gray-600 rounded" />
                      <div className="h-2 w-10 bg-gray-600 rounded" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="h-1.5 w-24 bg-gray-600 rounded mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Drop Zone Sub-component ─────────────────────────────────────────────

  function DropZoneSection({
    section,
    label,
    icon,
    display,
  }: {
    section: string;
    label: string;
    icon: string;
    display: 'full' | 'grid';
  }) {
    const sectionBanners = getBannersBySection(section);
    const isDragOver = dragOverSection === section;
    const sectionConfig = SECTIONS[section];

    return (
      <div
        className={`mx-4 my-3 rounded-xl border-2 transition-all duration-200 p-3 ${
          isDragOver
            ? `border-solid ${sectionConfig.color.split(' ').join(' ')} border-2 shadow-lg`
            : 'border-dashed border-gray-300 bg-white/50'
        }`}
        onDragOver={(e) => handleDragOver(e, section)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, section)}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-bold text-gray-700">{label}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {sectionBanners.length}
            </Badge>
          </div>
          <button
            onClick={openNew}
            className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Banners in Drop Zone */}
        {sectionBanners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px]">اسحب بانر هنا</span>
          </div>
        ) : (
          <div
            className={
              display === 'full'
                ? 'flex flex-col gap-2'
                : 'grid grid-cols-2 gap-2'
            }
          >
            {sectionBanners.map((banner) => (
              <SimulatorBannerCard key={banner.id} banner={banner} display={display} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Simulator Banner Card ───────────────────────────────────────────────

  function SimulatorBannerCard({
    banner,
    display,
  }: {
    banner: Banner;
    display: 'full' | 'grid';
  }) {
    const isDragging = draggedBannerId === banner.id;
    const aspectHeight = banner.height > 0 ? Math.min(banner.height * 0.25, 120) : display === 'full' ? 100 : 70;

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(banner.id)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border transition-all duration-200 ${
          isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:scale-[1.01]'
        } ${banner.active ? 'border-gray-200' : 'border-gray-300 opacity-60'}`}
        style={display === 'full' ? { height: `${aspectHeight}px` } : undefined}
      >
        {/* Banner Image */}
        <img
          src={banner.image}
          alt={banner.titleAr}
          className={`w-full ${display === 'full' ? 'h-full' : 'h-auto'} object-cover`}
          style={display !== 'full' ? { aspectRatio: `${banner.width || 460}/${banner.height || 200}` } : undefined}
          draggable={false}
        />

        {/* Title Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 left-0 p-2">
          <p className="text-[10px] font-bold text-white truncate drop-shadow">
            {banner.titleAr || banner.title}
          </p>
        </div>

        {/* Top Badges */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {banner.height > 0 && (
            <span className="text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
              {banner.height}px
            </span>
          )}
          {banner.hotspotW > 0 && (
            <span className="text-[8px] bg-emerald-500/90 text-white px-1.5 py-0.5 rounded-full">
              🎯
            </span>
          )}
          {!banner.active && (
            <span className="text-[8px] bg-red-500/90 text-white px-1.5 py-0.5 rounded-full">
              معطل
            </span>
          )}
        </div>

        {/* Drag Handle */}
        <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 bg-white/80 rounded flex items-center justify-center shadow-sm text-[8px] text-gray-500">
            ⠿
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEdit(banner);
          }}
          className="absolute top-1.5 left-8 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-white/80 rounded flex items-center justify-center shadow-sm"
        >
          <Edit className="h-2.5 w-2.5 text-gray-600" />
        </button>

        {/* Hotspot Rectangle Preview */}
        {banner.hotspotW > 0 && banner.hotspotH > 0 && (
          <div
            className="absolute border-2 border-dashed border-emerald-400 bg-emerald-400/10 rounded-sm pointer-events-none"
            style={{
              left: `${banner.hotspotX}%`,
              top: `${banner.hotspotY}%`,
              width: `${banner.hotspotW}%`,
              height: `${banner.hotspotH}%`,
            }}
          />
        )}
      </div>
    );
  }

  // ─── List View Sub-component ─────────────────────────────────────────────

  function ListView() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Image className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">لا توجد بانرات</p>
            <p className="text-sm mt-1">اضغط على &quot;إضافة بانر&quot; لإنشاء بانر جديد</p>
          </div>
        ) : (
          banners
            .sort((a, b) => {
              const sectionOrder = ['hero', 'below-categories', 'between-products', 'above-footer'];
              const sDiff = sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
              return sDiff !== 0 ? sDiff : a.order - b.order;
            })
            .map((banner) => (
              <Card key={banner.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image Preview */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={banner.image}
                    alt={banner.titleAr}
                    className="w-full h-full object-cover"
                  />
                  {!banner.active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">معطل</Badge>
                    </div>
                  )}
                  {banner.hotspotW > 0 && (
                    <div
                      className="absolute border-2 border-dashed border-emerald-400 bg-emerald-400/10 rounded-sm pointer-events-none"
                      style={{
                        left: `${banner.hotspotX}%`,
                        top: `${banner.hotspotY}%`,
                        width: `${banner.hotspotW}%`,
                        height: `${banner.hotspotH}%`,
                      }}
                    />
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title */}
                  <div>
                    <p className="font-bold text-gray-800 text-sm truncate">
                      {banner.titleAr || banner.title}
                    </p>
                    {banner.subtitleAr && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{banner.subtitleAr}</p>
                    )}
                  </div>

                  {/* Meta Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {SECTIONS[banner.section]?.icon} {SECTIONS[banner.section]?.label}
                    </Badge>
                    {banner.height > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        📏 {banner.height}px
                      </Badge>
                    )}
                    {banner.hotspotW > 0 && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                        🎯 نقطة اتصال
                      </Badge>
                    )}
                  </div>

                  {/* Link */}
                  {banner.link && (
                    <p className="text-[10px] text-blue-500 truncate" dir="ltr">
                      {banner.link}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => openEdit(banner)}
                      >
                        <Edit className="h-3 w-3" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => reorderBanner(banner.id, 'up')}
                        title="تحريك للأعلى"
                      >
                        <ChevronLeft className="h-3 w-3 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => reorderBanner(banner.id, 'down')}
                        title="تحريك للأسفل"
                      >
                        <ChevronLeft className="h-3 w-3 -rotate-90" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    );
  }

  // ─── Banner Form Sub-component ───────────────────────────────────────────

  function BannerForm() {
    const currentHotspotRect = {
      x: formData.hotspotX / 100,
      y: formData.hotspotY / 100,
      w: formData.hotspotW / 100,
      h: formData.hotspotH / 100,
    };

    const displayRect = previewRect || (formData.hotspotW > 0 ? currentHotspotRect : null);

    return (
      <Card className="shadow-2xl border-0" dir="rtl">
        <CardHeader className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {editingBanner ? '✏️ تعديل البانر' : '➕ إضافة بانر جديد'}
            </CardTitle>
            <button
              onClick={cancelForm}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* ── Section Selector ── */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">القسم</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SECTIONS).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, section: key }))}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      formData.section === key
                        ? `${config.color} border-2 shadow-md`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{config.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Dimensions Section ── */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-200">
              <p className="text-sm font-bold text-blue-700">📏 الأبعاد والترتيب</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-blue-600">الارتفاع (بكسل) — 0 = تلقائي</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1200}
                    value={formData.height || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    className="bg-white border-blue-200"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-600">الترتيب</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.order || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="bg-white border-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* ── Title Inputs ── */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">العنوان</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان (عربي)</Label>
                  <Input
                    value={formData.titleAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                    placeholder="عنوان البانر بالعربي"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان (إنجليزي)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Banner title"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان الفرعي (عربي)</Label>
                  <Input
                    value={formData.subtitleAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitleAr: e.target.value }))}
                    placeholder="عنوان فرعي"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">العنوان الفرعي (إنجليزي)</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Subtitle"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* ── Image Uploader ── */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">🖼️ الصورة</Label>
              <ImageUploader
                images={formData.image ? [formData.image] : []}
                onImagesChange={(imgs) => setFormData((prev) => ({ ...prev, image: imgs[0] || '' }))}
                maxImages={1}
                folder="kamal-saad-banners"
              />
            </div>

            {/* ── Hotspot Section ── */}
            <div className="bg-green-50 rounded-xl p-4 space-y-3 border border-green-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-green-700">🎯 نقطة الاتصال (Hotspot)</p>
                {(formData.hotspotW > 0 || previewRect) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    onClick={clearHotspot}
                  >
                    <X className="h-3 w-3 ml-1" />
                    مسح
                  </Button>
                )}
              </div>

              {formData.image ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border-2 border-green-200 bg-gray-100">
                    <img
                      ref={imgRef}
                      src={formData.image}
                      alt="Banner preview"
                      className="w-full h-auto block"
                      style={{ cursor: 'crosshair' }}
                      draggable={false}
                      onMouseDown={handleHotspotMouseDown}
                      onMouseMove={handleHotspotMouseMove}
                      onMouseUp={handleHotspotMouseUp}
                      onMouseLeave={() => {
                        if (isDrawing) handleHotspotMouseUp();
                      }}
                    />

                    {/* Drawn / Saved Hotspot Rectangle */}
                    {displayRect && (
                      <div
                        className="absolute border-2 border-dashed border-green-500 bg-green-400/20 pointer-events-none"
                        style={{
                          left: `${displayRect.x * 100}%`,
                          top: `${displayRect.y * 100}%`,
                          width: `${displayRect.w * 100}%`,
                          height: `${displayRect.h * 100}%`,
                        }}
                      >
                        {/* Crosshair indicator */}
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-green-600">
                    🔽 اضغط واسحب على الصورة لرسم منطقة نقطة الاتصال
                  </p>

                  {/* Coordinates Display */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'X', key: 'hotspotX' },
                      { label: 'Y', key: 'hotspotY' },
                      { label: 'العرض', key: 'hotspotW' },
                      { label: 'الارتفاع', key: 'hotspotH' },
                    ].map(({ label, key }) => (
                      <div key={key} className="text-center bg-white rounded-lg p-2 border border-green-200">
                        <p className="text-[10px] text-green-600 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formData[key as keyof typeof formData] as number}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-green-400">
                  <Image className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">قم برفع الصورة أولاً لتحديد نقطة الاتصال</p>
                </div>
              )}

              {/* Link Destination */}
              <div className="space-y-2 pt-2 border-t border-green-200">
                <Label className="text-xs text-green-700 font-medium">🔗 رابط وجهة النقرة</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com/product/123"
                  dir="ltr"
                  className="bg-white border-green-200"
                />
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-green-600 ml-1">إدراج سريع:</span>
                  {quickLinks.map((ql) => (
                    <button
                      key={ql.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, link: ql.value }))}
                      className="text-[10px] bg-white text-green-700 border border-green-200 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
                    >
                      {ql.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Active Toggle ── */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
              <span className="text-sm text-gray-700 font-medium">
                {formData.active ? '✅ البانر مفعّل' : '⛔ البانر معطّل'}
              </span>
            </div>
          </CardContent>

          {/* ── Form Actions ── */}
          <div className="flex gap-3 p-6 pt-0">
            <Button
              type="submit"
              disabled={saving || !formData.image || !formData.titleAr}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : editingBanner ? (
                '💾 حفظ التعديلات'
              ) : (
                '➕ إضافة البانر'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    );
  }
}
