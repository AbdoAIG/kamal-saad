'use client';

import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authMode, setUser, setUserId, language } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification states
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isArabic = language === 'ar';

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setRequiresVerification(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if email needs verification
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setUnverifiedEmail(data.email || loginForm.email);
        }
        setError(data.error || (isArabic ? 'فشل في تسجيل الدخول' : 'Login failed'));
      } else {
        setUser(data.user);
        setUserId(data.user.id);
        setAuthModalOpen(false);
        setLoginForm({ email: '', password: '' });
      }
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isArabic ? 'فشل في إنشاء الحساب' : 'Account creation failed'));
      } else {
        // Show verification success message
        setRegisteredEmail(registerForm.email);
        setShowVerificationSuccess(true);
        setRegisterForm({ name: '', email: '', password: '', phone: '' });
      }
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = unverifiedEmail || loginForm.email;
    if (!email) return;

    setResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setResendSuccess(true);
        setRequiresVerification(false);
        setError('');
      } else {
        setError(data.error || (isArabic ? 'فشل في إرسال الرسالة' : 'Failed to send email'));
      }
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setResending(false);
    }
  };

  const handleCloseAndNavigate = () => {
    setAuthModalOpen(false);
    setShowVerificationSuccess(false);
    // Optionally navigate to verify-email page
    // window.location.href = '/verify-email';
  };

  // Google OAuth - Redirect to our custom endpoint
  const handleGoogleLogin = () => {
    // Close modal first
    setAuthModalOpen(false);
    
    // Get current path for callback
    const currentPath = window.location.pathname + window.location.search;
    const callbackUrl = currentPath !== '/' ? currentPath : '/';
    
    // Redirect to our Google start endpoint which handles CSRF and OAuth
    window.location.href = `/api/auth/google-start?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError('');
      setShowVerificationSuccess(false);
      setRequiresVerification(false);
      setResendSuccess(false);
    }
    setAuthModalOpen(open);
  };

  // Verification success screen
  if (showVerificationSuccess) {
    return (
      <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden dark:bg-gray-900">
          <div className="bg-gradient-to-l from-teal-500 to-cyan-500 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-12 w-12 text-teal-500" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold">
              {isArabic ? 'تم إنشاء الحساب!' : 'Account Created!'}
            </DialogTitle>
          </div>
          
          <div className="p-6 text-center dark:bg-gray-900">
            <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 rounded-xl p-4 mb-4">
              <Mail className="h-8 w-8 text-teal-500 mx-auto mb-2" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {isArabic ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isArabic 
                  ? `أرسلنا رابط التحقق إلى ${registeredEmail}`
                  : `We sent a verification link to ${registeredEmail}`}
              </p>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {isArabic 
                ? 'اضغط على الرابط في البريد لتفعيل حسابك والبدء في التسوق.'
                : 'Click the link in the email to activate your account and start shopping.'}
            </p>

            <Button
              onClick={handleCloseAndNavigate}
              className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-12 rounded-xl font-bold"
            >
              {isArabic ? 'حسناً، فهمت' : 'Got it'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Resend success screen
  if (resendSuccess) {
    return (
      <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden dark:bg-gray-900">
          <div className="bg-gradient-to-l from-green-500 to-emerald-500 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="h-12 w-12 text-green-500" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold">
              {isArabic ? 'تم إرسال الرسالة!' : 'Email Sent!'}
            </DialogTitle>
          </div>
          
          <div className="p-6 text-center dark:bg-gray-900">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {isArabic 
                ? 'تم إرسال رابط تحقق جديد إلى بريدك الإلكتروني. تحقق من صندوق الوارد.'
                : 'A new verification link has been sent to your email. Check your inbox.'}
            </p>

            <Button
              onClick={() => {
                setResendSuccess(false);
                setLoginForm({ email: '', password: '' });
              }}
              className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-12 rounded-xl font-bold"
            >
              {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden dark:bg-gray-900">
        {/* Header with Logo */}
        <div className="bg-gradient-to-l from-teal-500 to-cyan-500 p-6 text-center text-white">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <img 
              src="/KMS LOGO FINAL.png" 
              alt="Kamal Saad" 
              className="w-16 h-16 object-contain"
            />
          </motion.div>
          <DialogTitle className="text-2xl font-bold">
            {isArabic ? 'مرحباً بك في كمال سعد' : 'Welcome to Kamal Saad'}
          </DialogTitle>
          <p className="text-teal-100 mt-1">
            {isArabic ? 'سجل الدخول أو أنشئ حساباً جديداً' : 'Sign in or create a new account'}
          </p>
        </div>

        <Tabs defaultValue={authMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-none bg-gray-50 dark:bg-gray-800">
            <TabsTrigger
              value="login"
              onClick={() => {
                setError('');
                setRequiresVerification(false);
              }}
              className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 font-medium"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </TabsTrigger>
            <TabsTrigger
              value="register"
              onClick={() => {
                setError('');
                setRequiresVerification(false);
              }}
              className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 font-medium"
            >
              {isArabic ? 'حساب جديد' : 'Sign Up'}
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            {/* Google Login Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isArabic ? 'المتابعة مع جوجل' : 'Continue with Google'}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                  {isArabic ? 'أو' : 'or'}
                </span>
              </div>
            </div>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${isArabic ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"
                  >
                    {error}
                    {requiresVerification && (
                      <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-800">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-teal-600 hover:text-teal-700 p-0 h-auto"
                        >
                          {resending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-1" />
                              {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                            </>
                          ) : (
                            isArabic ? 'إعادة إرسال رابط التحقق' : 'Resend verification email'
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-12 rounded-xl font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    isArabic ? 'تسجيل الدخول' : 'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                  </Label>
                  <div className="relative">
                    <User className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={isArabic ? 'أحمد محمد' : 'John Doe'}
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="example@email.com"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">
                    {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                  </Label>
                  <div className="relative">
                    <Phone className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+20 100 123 4567"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400 dark:text-gray-500`} />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${isArabic ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700`}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-12 rounded-xl font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    isArabic ? 'إنشاء حساب' : 'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
