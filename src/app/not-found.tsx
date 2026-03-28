import { Button } from '@/components/ui/button'
import { Home, Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-[150px] font-bold text-gradient bg-gradient-to-l from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            404
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          الصفحة غير موجودة
        </h1>
        
        <p className="text-gray-600 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-gradient-to-l from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2">
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Button>
          </Link>
          <Link href="/?search=">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              البحث عن منتجات
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <Link 
            href="/contact" 
            className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center gap-1"
          >
            هل تحتاج مساعدة؟ تواصل معنا
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}
