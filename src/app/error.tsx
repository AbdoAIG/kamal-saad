'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">حدث خطأ!</h1>
        <p className="text-gray-600 mb-6">
          نعتذر عن هذا الخطأ. تم إبلاغ فريق الدعم ونعمل على حل المشكلة.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            حاول مرة أخرى
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
