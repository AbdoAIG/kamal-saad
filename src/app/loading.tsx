import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          جاري التحميل...
        </h2>
        <p className="text-gray-500">
          يرجى الانتظار قليلاً
        </p>
      </div>
    </div>
  )
}
