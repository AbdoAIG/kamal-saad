'use client';

import { useState, useRef } from 'react';
import {
  Download, Upload, FileText, FileSpreadsheet, Loader2, CheckCircle, XCircle,
  AlertCircle, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

interface ProductImportExportProps {
  onImportComplete?: () => void;
}

export function ProductImportExport({ onImportComplete }: ProductImportExportProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export handlers
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/products/export?format=csv');
      const blob = await res.blob();
      downloadFile(blob, `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/products/export/excel');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      downloadFile(blob, `products-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('حدث خطأ أثناء تصدير Excel. جرب تصدير CSV بدلاً من ذلك.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/products/export?format=json');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        downloadFile(blob, `products-export-${new Date().toISOString().split('T')[0]}.json`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  // Import handler
  const handleImport = async () => {
    if (!selectedFile) {
      alert('يرجى اختيار ملف أولاً');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('updateExisting', String(updateExisting));

      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setImportResult(result.data);
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        alert(result.error || 'حدث خطأ أثناء الاستيراد');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const closeImportDialog = () => {
    setShowImportDialog(false);
    setSelectedFile(null);
    setImportResult(null);
    setUpdateExisting(false);
  };

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gray-50 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            استيراد / تصدير المنتجات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Export Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                تصدير المنتجات
              </h3>
              <p className="text-sm text-gray-500">
                قم بتنزيل جميع المنتجات بصيغة CSV أو Excel أو JSON
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportJSON}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Import Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                استيراد المنتجات
              </h3>
              <p className="text-sm text-gray-500">
                قم باستيراد المنتجات من ملف CSV أو JSON
              </p>
              <Button
                onClick={() => setShowImportDialog(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4" />
                استيراد من ملف
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={closeImportDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              استيراد المنتجات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label>اختر ملف CSV أو JSON</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Update Existing Option */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="updateExisting"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
              />
              <Label htmlFor="updateExisting" className="text-sm">
                تحديث المنتجات الموجودة (بالاسم أو SKU)
              </Label>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold">نتيجة الاستيراد:</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                    <p className="text-xs text-green-700">تمت الإضافة</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                    <p className="text-xs text-blue-700">تم التحديث</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-xs text-red-700">فشل</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-600 mb-1">الأخطاء:</p>
                    <ul className="text-xs text-red-500 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>... و {importResult.errors.length - 10} خطأ آخر</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    استيراد
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={closeImportDialog}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Loading Overlay */}
      {exporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-64">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-3" />
              <p className="text-gray-600">جاري التصدير...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
