'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          حدث خطأ ما
        </h1>
        
        <p className="text-gray-600 mb-6">
          نعتذر عن هذا الإزعاج. يرجى المحاولة مرة أخرى.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            رقم الخطأ: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
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
