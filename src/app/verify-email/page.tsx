'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState('');

  // For resend functionality
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setLoading(false);
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setSuccess(true);
          setAlreadyVerified(data.alreadyVerified || false);
        } else {
          setError(data.error || 'رمز التحقق غير صالح');
        }
      } catch (err) {
        setError('حدث خطأ أثناء التحقق من الرابط');
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setResendSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'حدث خطأ في إرسال رسالة التحقق');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setResending(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">جاري التحقق من البريد الإلكتروني...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (token && success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {alreadyVerified ? 'البريد مؤكد بالفعل' : 'تم تأكيد البريد الإلكتروني!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {alreadyVerified
                ? 'البريد الإلكتروني الخاص بك مؤكد بالفعل.'
                : 'تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول والبدء في التسوق.'}
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-12 px-8"
            >
              ابدأ التسوق الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token or no token
  if (token && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">رابط غير صالح</h2>
            <p className="text-gray-600 mb-4">
              {error || 'رابط التحقق غير صالح أو منتهي الصلاحية'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              يمكنك طلب رابط تحقق جديد من خلال إدخال بريدك الإلكتروني أدناه.
            </p>

            {/* Resend form */}
            <form onSubmit={handleResend} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="h-12 rounded-xl text-center"
                required
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {resendSuccess && (
                <p className="text-green-600 text-sm">تم إرسال رسالة تحقق جديدة!</p>
              )}
              <Button
                type="submit"
                disabled={resending}
                className="w-full h-12 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 ml-2" />
                    إرسال رابط جديد
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No token - show resend form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-10 w-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            تأكيد البريد الإلكتروني
          </CardTitle>
          <p className="text-gray-500 text-sm mt-1">
            أدخل بريدك الإلكتروني لإرسال رابط التحقق
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="h-12 rounded-xl text-center"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm text-center p-3 rounded-xl">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 text-green-600 text-sm text-center p-3 rounded-xl">
                تم إرسال رسالة التحقق! تحقق من بريدك الإلكتروني.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold"
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 ml-2" />
                  إرسال رابط التحقق
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              العودة للرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
