'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          حدث خطأ في لوحة التحكم
        </h1>
        
        <p className="text-gray-600 mb-2">
          {error.message || 'نعتذر عن هذا الإزعاج.'}
        </p>

        <p className="text-xs text-gray-400 mb-4">
          يرجى تحديث الصفحة أو تسجيل الدخول مرة أخرى
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            رقم الخطأ: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/admin';
            }}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل الصفحة
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  )
}
