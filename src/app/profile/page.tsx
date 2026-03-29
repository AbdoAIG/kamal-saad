'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  User, 
  MapPin, 
  Gift, 
  Shield, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  Star,
  ArrowLeft,
  Camera,
  Save,
  Eye,
  EyeOff,
  History,
  Coins,
  Award
} from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStore, translations } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  image: string | null;
  role: string;
  loyaltyPoints: number;
  createdAt: string;
  addresses: Address[];
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  landmark: string | null;
  isDefault: boolean;
}

interface LoyaltyData {
  summary: {
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    totalExpired: number;
    monetaryValue: number;
  };
  history: {
    id: string;
    points: number;
    type: string;
    reason: string;
    monetaryValue: number;
    createdAt: string;
  }[];
  pointsRate: {
    pointsToEgp: number;
    description: string;
  };
}

// Translations for profile page
const profileTranslations = {
  ar: {
    profile: 'الملف الشخصي',
    personalInfo: 'المعلومات الشخصية',
    addresses: 'العناوين',
    loyaltyPoints: 'نقاط الولاء',
    security: 'الأمان',
    editProfile: 'تعديل الملف الشخصي',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    profilePicture: 'الصورة الشخصية',
    changePhoto: 'تغيير الصورة',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    addAddress: 'إضافة عنوان جديد',
    editAddress: 'تعديل العنوان',
    deleteAddress: 'حذف العنوان',
    addressLabel: 'اسم العنوان',
    fullName: 'الاسم الكامل',
    governorate: 'المحافظة',
    city: 'المدينة',
    streetAddress: 'العنوان التفصيلي',
    landmark: 'علامة مميزة',
    setAsDefault: 'تعيين كافتراضي',
    default: 'افتراضي',
    noAddresses: 'لا توجد عناوين محفوظة',
    addFirstAddress: 'أضف عنوانك الأول',
    currentPoints: 'النقاط الحالية',
    totalEarned: 'إجمالي المكتسبة',
    totalRedeemed: 'إجمالي المستبدلة',
    pointsValue: 'قيمة النقاط',
    pointsHistory: 'سجل النقاط',
    noHistory: 'لا يوجد سجل نقاط',
    earned: 'مكتسبة',
    redeemed: 'مستبدلة',
    expired: 'منتهية',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmItemPassword: 'تأكيد كلمة المرور الجديدة',
    updatePassword: 'تحديث كلمة المرور',
    passwordRequirements: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
    addressAdded: 'تم إضافة العنوان بنجاح',
    addressUpdated: 'تم تحديث العنوان بنجاح',
    addressDeleted: 'تم حذف العنوان بنجاح',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    error: 'حدث خطأ',
    loginRequired: 'يرجى تسجيل الدخول للوصول إلى صفحة الملف الشخصي',
    deleteConfirm: 'هل أنت متأكد من حذف هذا العنوان؟',
    confirmDelete: 'تأكيد الحذف',
    optional: 'اختياري',
    egp: 'ج.م',
    points: 'نقطة',
    backToHome: 'العودة للرئيسية',
    memberSince: 'عضو منذ',
    accountType: 'نوع الحساب',
    customer: 'عميل',
    admin: 'مدير',
    pointsRate: 'سعر التحويل',
    perPoint: 'ج.م لكل نقطة',
    redeemPoints: 'استبدال النقاط',
    enterPoints: 'أدخل عدد النقاط',
    redeemValue: 'القيمة',
    redeem: 'استبدال',
    minRedeem: 'الحد الأدنى 100 نقطة',
  },
  en: {
    profile: 'Profile',
    personalInfo: 'Personal Info',
    addresses: 'Addresses',
    loyaltyPoints: 'Loyalty Points',
    security: 'Security',
    editProfile: 'Edit Profile',
    name: 'Name',
    email: 'Email',
    phone: 'Phone Number',
    profilePicture: 'Profile Picture',
    changePhoto: 'Change Photo',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    addAddress: 'Add New Address',
    editAddress: 'Edit Address',
    deleteAddress: 'Delete Address',
    addressLabel: 'Address Label',
    fullName: 'Full Name',
    governorate: 'Governorate',
    city: 'City',
    streetAddress: 'Street Address',
    landmark: 'Landmark',
    setAsDefault: 'Set as Default',
    default: 'Default',
    noAddresses: 'No saved addresses',
    addFirstAddress: 'Add your first address',
    currentPoints: 'Current Points',
    totalEarned: 'Total Earned',
    totalRedeemed: 'Total Redeemed',
    pointsValue: 'Points Value',
    pointsHistory: 'Points History',
    noHistory: 'No points history',
    earned: 'Earned',
    redeemed: 'Redeemed',
    expired: 'Expired',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    passwordRequirements: 'Password must be at least 8 characters',
    profileUpdated: 'Profile updated successfully',
    addressAdded: 'Address added successfully',
    addressUpdated: 'Address updated successfully',
    addressDeleted: 'Address deleted successfully',
    passwordChanged: 'Password changed successfully',
    error: 'An error occurred',
    loginRequired: 'Please login to access your profile',
    deleteConfirm: 'Are you sure you want to delete this address?',
    confirmDelete: 'Confirm Delete',
    optional: 'Optional',
    egp: 'EGP',
    points: 'points',
    backToHome: 'Back to Home',
    memberSince: 'Member since',
    accountType: 'Account Type',
    customer: 'Customer',
    admin: 'Admin',
    pointsRate: 'Conversion Rate',
    perPoint: 'EGP per point',
    redeemPoints: 'Redeem Points',
    enterPoints: 'Enter points amount',
    redeemValue: 'Value',
    redeem: 'Redeem',
    minRedeem: 'Minimum 100 points',
  }
};

// Egyptian governorates
const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية',
  'القليوبية', 'البحيرة', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح',
  'شمال سيناء', 'جنوب سيناء', 'السويس', 'الإسماعيلية', 'بورسعيد', 'دمياط'
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { language } = useStore();
  const { toast } = useToast();
  const t = profileTranslations[language];
  const isArabic = language === 'ar';

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  
  // Personal info state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editImage, setEditImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Address state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    fullName: '',
    phone: '',
    governorate: '',
    city: '',
    address: '',
    landmark: '',
    isDefault: false
  });
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: t.loginRequired,
        variant: 'destructive'
      });
      router.push('/');
    }
  }, [status, router, toast, t.loginRequired]);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const [userRes, loyaltyRes] = await Promise.all([
          fetch('/api/user'),
          fetch(`/api/loyalty?userId=${session?.user?.id}`)
        ]);
        
        const userData = await userRes.json();
        const loyaltyResult = await loyaltyRes.json();
        
        if (userData.success) {
          setProfile(userData.data);
          setEditName(userData.data.name || '');
          setEditPhone(userData.data.phone || '');
          setEditImage(userData.data.image || '');
        }
        
        if (loyaltyResult.success) {
          setLoyaltyData(loyaltyResult.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: t.error,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [status, session?.user?.id, toast, t.error]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!editName.trim()) {
      newErrors.name = isArabic ? 'الاسم مطلوب' : 'Name is required';
    }
    
    if (editPhone && !/^(\+?20|0)?1[0-25][0-9]{8}$/.test(editPhone)) {
      newErrors.phone = isArabic ? 'رقم الهاتف غير صحيح' : 'Invalid phone number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          image: editImage
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...data.data } : null);
        toast({ title: t.profileUpdated });
        setErrors({});
      } else {
        toast({ title: data.error || t.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.error, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle address form
  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        governorate: address.governorate,
        city: address.city,
        address: address.address,
        landmark: address.landmark || '',
        isDefault: address.isDefault
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: '',
        fullName: '',
        phone: '',
        governorate: '',
        city: '',
        address: '',
        landmark: '',
        isDefault: false
      });
    }
    setErrors({});
    setAddressDialogOpen(true);
  };

  const handleAddressSubmit = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!addressForm.label.trim()) {
      newErrors.label = isArabic ? 'اسم العنوان مطلوب' : 'Address label is required';
    }
    if (!addressForm.fullName.trim()) {
      newErrors.fullName = isArabic ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }
    if (!addressForm.phone.trim()) {
      newErrors.phone = isArabic ? 'رقم الهاتف مطلوب' : 'Phone is required';
    }
    if (!addressForm.governorate.trim()) {
      newErrors.governorate = isArabic ? 'المحافظة مطلوبة' : 'Governorate is required';
    }
    if (!addressForm.city.trim()) {
      newErrors.city = isArabic ? 'المدينة مطلوبة' : 'City is required';
    }
    if (!addressForm.address.trim()) {
      newErrors.address = isArabic ? 'العنوان مطلوب' : 'Address is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const url = editingAddress 
        ? `/api/addresses/${editingAddress.id}`
        : '/api/addresses';
      
      const res = await fetch(url, {
        method: editingAddress ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (editingAddress) {
          setProfile(prev => prev ? {
            ...prev,
            addresses: prev.addresses.map(a => a.id === editingAddress.id ? data.data : a)
          } : null);
          toast({ title: t.addressUpdated });
        } else {
          setProfile(prev => prev ? {
            ...prev,
            addresses: [...prev.addresses, data.data]
          } : null);
          toast({ title: t.addressAdded });
        }
        setAddressDialogOpen(false);
        setErrors({});
      } else {
        toast({ title: data.error || t.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.error, variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddressId) return;
    
    try {
      const res = await fetch(`/api/addresses/${deletingAddressId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProfile(prev => prev ? {
          ...prev,
          addresses: prev.addresses.filter(a => a.id !== deletingAddressId)
        } : null);
        toast({ title: t.addressDeleted });
        setDeleteDialogOpen(false);
        setDeletingAddressId(null);
      } else {
        toast({ title: data.error || t.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.error, variant: 'destructive' });
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = isArabic ? 'كلمة المرور الحالية مطلوبة' : 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = isArabic ? 'كلمة المرور الجديدة مطلوبة' : 'New password is required';
    }
    if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = t.passwordRequirements;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: t.passwordChanged });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
      } else {
        toast({ title: data.error || t.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.error, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Not authenticated
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header onMenuClick={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t.profile}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t.memberSince} {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.image || ''} />
                  <AvatarFallback className="text-2xl bg-teal-500 text-white">
                    {profile.name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center md:text-start flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile.name || profile.email}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                  <Badge variant="secondary">
                    {profile.role === 'admin' ? t.admin : t.customer}
                  </Badge>
                  <Badge className="bg-teal-500">
                    <Star className="h-3 w-3 me-1" />
                    {profile.loyaltyPoints} {t.points}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2">
            <TabsTrigger value="personal" className="flex items-center gap-2 py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t.personalInfo}</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 py-3">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t.addresses}</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2 py-3">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">{t.loyaltyPoints}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t.security}</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>{t.personalInfo}</CardTitle>
                <CardDescription>
                  {t.editProfile}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editImage || ''} />
                    <AvatarFallback className="text-2xl bg-teal-500 text-white">
                      {editName?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full max-w-md">
                    <Label htmlFor="image">{t.profilePicture}</Label>
                    <Input
                      id="image"
                      type="url"
                      placeholder="https://..."
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name} *</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.phone}</Label>
                    <Input
                      id="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className={errors.phone ? 'border-red-500' : ''}
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditName(profile.name || '');
                      setEditPhone(profile.phone || '');
                      setEditImage(profile.image || '');
                      setErrors({});
                    }}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={isSaving}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    {isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2"
                      />
                    ) : (
                      <Save className="h-4 w-4 me-2" />
                    )}
                    {t.saveChanges}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.addresses}</CardTitle>
                  <CardDescription>
                    {isArabic ? 'إدارة عناوين الشحن' : 'Manage your shipping addresses'}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => openAddressDialog()}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {t.addAddress}
                </Button>
              </CardHeader>
              <CardContent>
                {profile.addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t.noAddresses}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {t.addFirstAddress}
                    </p>
                    <Button
                      onClick={() => openAddressDialog()}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      <Plus className="h-4 w-4 me-2" />
                      {t.addAddress}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence>
                      {profile.addresses.map((address) => (
                        <motion.div
                          key={address.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="border dark:border-gray-700 rounded-lg p-4 relative"
                        >
                          {address.isDefault && (
                            <Badge className="absolute top-2 start-2 bg-teal-500">
                              {t.default}
                            </Badge>
                          )}
                          <div className="pt-6">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {address.label}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {address.fullName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.phone}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {address.governorate}, {address.city}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.address}
                            </p>
                            {address.landmark && (
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {address.landmark}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddressDialog(address)}
                            >
                              <Edit2 className="h-3 w-3 me-1" />
                              {t.editAddress}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                setDeletingAddressId(address.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 me-1" />
                              {t.deleteAddress}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Points Tab */}
          <TabsContent value="loyalty">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Points Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-teal-500" />
                    {t.currentPoints}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="text-5xl font-bold text-teal-500 mb-2">
                      {loyaltyData?.summary.currentPoints || 0}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t.points}
                    </p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                      = {(loyaltyData?.summary.monetaryValue || 0).toFixed(2)} {t.egp}
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t.totalEarned}</span>
                      <span className="font-medium text-green-600">+{loyaltyData?.summary.totalEarned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t.totalRedeemed}</span>
                      <span className="font-medium text-orange-600">-{loyaltyData?.summary.totalRedeemed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t.pointsRate}</span>
                      <span className="font-medium">{loyaltyData?.pointsRate.pointsToEgp} {t.perPoint}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Points History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-teal-500" />
                    {t.pointsHistory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {loyaltyData?.history.length === 0 || !loyaltyData ? (
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {t.noHistory}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {loyaltyData.history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {entry.reason}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(entry.createdAt)}
                              </p>
                            </div>
                            <Badge
                              variant={entry.type === 'earn' ? 'default' : 'secondary'}
                              className={entry.type === 'earn' ? 'bg-green-500' : entry.type === 'redeem' ? 'bg-orange-500' : 'bg-gray-500'}
                            >
                              {entry.type === 'earn' ? '+' : '-'}{Math.abs(entry.points)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-500" />
                  {t.security}
                </CardTitle>
                <CardDescription>
                  {t.changePassword}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={errors.currentPassword ? 'border-red-500 pe-10' : 'pe-10'}
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1 h-7 w-7"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">{errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t.newPassword}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={errors.newPassword ? 'border-red-500 pe-10' : 'pe-10'}
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1 h-7 w-7"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">{errors.newPassword}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.passwordRequirements}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                      dir="ltr"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className="bg-teal-500 hover:bg-teal-600 w-full md:w-auto"
                  >
                    {isChangingPassword ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2"
                      />
                    ) : (
                      <Shield className="h-4 w-4 me-2" />
                    )}
                    {t.updatePassword}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? t.editAddress : t.addAddress}
            </DialogTitle>
            <DialogDescription>
              {isArabic ? 'أدخل تفاصيل العنوان' : 'Enter address details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">{t.addressLabel} *</Label>
              <Input
                id="label"
                placeholder={isArabic ? 'مثال: المنزل، العمل' : 'e.g., Home, Work'}
                value={addressForm.label}
                onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                className={errors.label ? 'border-red-500' : ''}
              />
              {errors.label && <p className="text-sm text-red-500">{errors.label}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.fullName} *</Label>
              <Input
                id="fullName"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addrPhone">{t.phone} *</Label>
              <Input
                id="addrPhone"
                value={addressForm.phone}
                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className={errors.phone ? 'border-red-500' : ''}
                dir="ltr"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="governorate">{t.governorate} *</Label>
                <select
                  id="governorate"
                  value={addressForm.governorate}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, governorate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${errors.governorate ? 'border-red-500' : ''}`}
                >
                  <option value="">{isArabic ? 'اختر المحافظة' : 'Select governorate'}</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
                {errors.governorate && <p className="text-sm text-red-500">{errors.governorate}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">{t.city} *</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">{t.streetAddress} *</Label>
              <Input
                id="address"
                value={addressForm.address}
                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="landmark">{t.landmark} ({t.optional})</Label>
              <Input
                id="landmark"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="w-4 h-4 text-teal-500"
              />
              <Label htmlFor="isDefault">{t.setAsDefault}</Label>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleAddressSubmit}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {editingAddress ? t.editAddress : t.addAddress}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDelete}</DialogTitle>
            <DialogDescription>
              {t.deleteConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAddress}
            >
              {t.deleteAddress}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
