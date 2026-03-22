'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore, t } from '@/store/useStore';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authMode, setUser, setUserId, language } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const isArabic = language === 'ar';

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isArabic ? 'فشل في تسجيل الدخول' : 'Login failed'));
      } else {
        setUser(data);
        setUserId(data.id);
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
        setUser(data);
        setUserId(data.id);
        setAuthModalOpen(false);
        setRegisterForm({ name: '', email: '', password: '', phone: '' });
      }
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    console.log('[AuthModal] Starting Google OAuth flow');
    
    const callbackUrl = window.location.pathname + window.location.search;
    
    try {
      // Use signIn from next-auth/react with redirect: false
      const result = await signIn('google', {
        callbackUrl: callbackUrl !== '/' ? callbackUrl : '/',
        redirect: false,
      });
      
      console.log('[AuthModal] signIn result:', result);
      
      if (result?.error) {
        console.error('[AuthModal] signIn error:', result.error);
        setError(isArabic ? 'فشل تسجيل الدخول' : 'Login failed');
        setSocialLoading(null);
      } else if (result?.url) {
        console.log('[AuthModal] Redirecting to:', result.url);
        window.location.href = result.url;
      } else {
        // No URL returned, try direct navigation
        console.log('[AuthModal] No URL, trying direct navigation');
        window.location.href = '/api/auth/google-signin?callbackUrl=' + encodeURIComponent(callbackUrl);
      }
    } catch (error) {
      console.error('[AuthModal] Exception:', error);
      // Fallback to direct navigation
      window.location.href = '/api/auth/google-signin?callbackUrl=' + encodeURIComponent(callbackUrl);
    }
  };

  const handleFacebookLogin = () => {
    // Facebook login not configured yet
    console.log('[AuthModal] Facebook login not configured');
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
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
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-none bg-gray-50">
            <TabsTrigger
              value="login"
              onClick={() => setError('')}
              className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </TabsTrigger>
            <TabsTrigger
              value="register"
              onClick={() => setError('')}
              className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
            >
              {isArabic ? 'حساب جديد' : 'Sign Up'}
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-2 hover:bg-gray-50 font-medium flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
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
                  </>
                )}
              </Button>

              {/* Facebook Button - Hidden for now since it's not configured */}
              {/* <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-2 hover:bg-blue-50 font-medium flex items-center justify-center gap-3"
                onClick={handleFacebookLogin}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'facebook' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    {isArabic ? 'المتابعة مع فيسبوك' : 'Continue with Facebook'}
                  </>
                )}
              </Button> */}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
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
                    <Mail className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
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
                    <Lock className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${isArabic ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl"
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
                    <User className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={isArabic ? 'أحمد محمد' : 'John Doe'}
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
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
                    <Mail className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="example@email.com"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
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
                    <Phone className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+20 100 123 4567"
                      className={`${isArabic ? 'pr-11' : 'pl-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
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
                    <Lock className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-gray-400`} />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${isArabic ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-12 rounded-xl bg-gray-50 border-0 focus:bg-white`}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl"
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
