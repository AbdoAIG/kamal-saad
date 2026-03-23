import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number | null;
  images: string;
  stock: number;
  categoryId: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  featured: boolean;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  role: string;
}

interface AppState {
  items: CartItem[];
  favorites: FavoriteItem[];
  userId: string | null;
  user: User | null;
  isCartOpen: boolean;
  isFavoritesOpen: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  searchQuery: string;
  selectedCategory: string | null;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  
  setItems: (items: CartItem[]) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  
  // Favorites
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  clearFavorites: () => void;
  getFavoritesCount: () => number;
  
  setUser: (user: User | null) => void;
  setUserId: (id: string | null) => void;
  logout: () => void;
  
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  toggleFavorites: () => void;
  setFavoritesOpen: (open: boolean) => void;
  toggleAuthModal: (mode?: 'login' | 'register') => void;
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleLanguage: () => void;
  setLanguage: (lang: 'ar' | 'en') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      favorites: [],
      userId: null,
      user: null,
      isCartOpen: false,
      isFavoritesOpen: false,
      isAuthModalOpen: false,
      authMode: 'login',
      searchQuery: '',
      selectedCategory: null,
      theme: 'light',
      language: 'ar',

      setItems: (items) => set({ items }),

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);
        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          const newItem: CartItem = {
            id: `cart-${Date.now()}`,
            productId: product.id,
            product,
            quantity
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => set({ items: get().items.filter(item => item.id !== itemId) }),

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
        } else {
          set({
            items: get().items.map(item =>
              item.id === itemId ? { ...item, quantity } : item
            )
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.discountPrice || item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),

      // Favorites methods
      addFavorite: (product) => {
        const favorites = get().favorites;
        const exists = favorites.find(f => f.productId === product.id);
        if (!exists) {
          const newFavorite: FavoriteItem = {
            id: `fav-${Date.now()}`,
            productId: product.id,
            product,
            addedAt: new Date()
          };
          set({ favorites: [...favorites, newFavorite] });
        }
      },

      removeFavorite: (productId) => {
        set({ favorites: get().favorites.filter(f => f.productId !== productId) });
      },

      isFavorite: (productId) => {
        return get().favorites.some(f => f.productId === productId);
      },

      toggleFavorite: (product) => {
        const isFav = get().isFavorite(product.id);
        if (isFav) {
          get().removeFavorite(product.id);
        } else {
          get().addFavorite(product);
        }
      },

      clearFavorites: () => set({ favorites: [] }),

      getFavoritesCount: () => get().favorites.length,

      setUser: (user) => set({ user }),
      setUserId: (id) => set({ userId: id }),
      logout: () => set({ user: null, userId: null, items: [] }),

      toggleCart: () => set({ isCartOpen: !get().isCartOpen }),
      setCartOpen: (open) => set({ isCartOpen: open }),

      toggleFavorites: () => set({ isFavoritesOpen: !get().isFavoritesOpen }),
      setFavoritesOpen: (open) => set({ isFavoritesOpen: open }),

      toggleAuthModal: (mode) => set({
        isAuthModalOpen: !get().isAuthModalOpen,
        authMode: mode || get().authMode
      }),

      setAuthModalOpen: (open, mode) => set({
        isAuthModalOpen: open,
        authMode: mode || get().authMode
      }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      toggleLanguage: () => {
        const newLang = get().language === 'ar' ? 'en' : 'ar';
        set({ language: newLang });
      },

      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'kamal-saad-store',
      partialize: (state) => ({
        items: state.items,
        favorites: state.favorites,
        userId: state.userId,
        user: state.user,
        theme: state.theme,
        language: state.language
      }),
    }
  )
);

// Translations
export const translations = {
  ar: {
    siteName: 'كمال سعد',
    siteSlogan: 'للأدوات المكتبية والمدرسية',
    topBarPromo: 'توصيل مجاني للطلبات فوق 200 جنيه | خصم 15% على طلاب المدارس',
    searchPlaceholder: 'ابحث عن الأقلام، الدفاتر، الحقائب...',
    login: 'تسجيل الدخول',
    register: 'حساب جديد',
    cart: 'سلة التسوق',
    favorites: 'المفضلة',
    addToCart: 'أضف للسلة',
    buyNow: 'شراء الآن',
    addedToCart: 'تمت الإضافة!',
    currency: 'ج.م',
    products: 'المنتجات',
    categories: 'الفئات',
    featured: 'مميز',
    discount: 'خصم',
    quantity: 'الكمية',
    inStock: 'متوفر',
    onlyLeft: 'متبقي فقط',
    reviews: 'تقييم',
    sold: 'مبيعة',
    description: 'الوصف',
    specifications: 'المواصفات',
    relatedProducts: 'منتجات مشابهة',
    viewAll: 'عرض الكل',
    siteSlogan: 'للأدوات المكتبية والمدرسية',
    fastDelivery: 'توصيل سريع',
    qualityGuarantee: 'ضمان الجودة',
    securePayment: 'دفع آمن',
    support247: 'دعم متواصل',
    allRightsReserved: 'جميع الحقوق محفوظة',
    returnPolicy: 'استرجاع خلال 14 يوم',
    originalProducts: 'منتجات أصلية 100%',
    addedToFavorites: 'تمت الإضافة للمفضلة!',
    removedFromFavorites: 'تمت الإزالة من المفضلة',
    newsletter: 'اشترك في نشرتنا البريدية',
    newsletterDesc: 'احصل على أحدث العروض والخصومات مباشرة في بريدك',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    subscribe: 'اشتراك',
    quickLinks: 'روابط سريعة',
    aboutUs: 'من نحن',
    contactUs: 'تواصل معنا',
    privacyPolicy: 'سياسة الخصوصية',
    offers: 'العروض والتخفيضات',
    needHelp: 'تحتاج مساعدة؟',
    callUs: 'اتصل بنا',
    // New translations
    myOrders: 'طلباتي',
    myProfile: 'حسابي',
    notifications: 'الإشعارات',
    loyaltyPoints: 'نقاط الولاء',
    myAddresses: 'عناويني',
    orderHistory: 'سجل الطلبات',
    orderDetails: 'تفاصيل الطلب',
    orderNumber: 'رقم الطلب',
    orderDate: 'تاريخ الطلب',
    orderStatus: 'حالة الطلب',
    pending: 'قيد الانتظار',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    reorder: 'إعادة الطلب',
    writeReview: 'اكتب تقييم',
    rating: 'التقييم',
    reviewTitle: 'عنوان التقييم',
    reviewComment: 'تعليقك',
    submitReview: 'إرسال التقييم',
    verifiedPurchase: 'شراء موثق',
    helpful: 'مفيد',
    wasThisHelpful: 'هل كان هذا التقييم مفيداً؟',
    couponCode: 'كود الخصم',
    applyCoupon: 'تطبيق',
    invalidCoupon: 'كود خصم غير صالح',
    couponApplied: 'تم تطبيق كود الخصم',
    pointsEarned: 'نقاط مكتسبة',
    pointsUsed: 'نقاط مستخدمة',
    redeemPoints: 'استبدال النقاط',
    availablePoints: 'النقاط المتاحة',
    returnRequest: 'طلب إرجاع',
    exchangeRequest: 'طلب استبدال',
    returnReason: 'سبب الإرجاع',
    returnStatus: 'حالة الإرجاع',
    contactForm: 'نموذج التواصل',
    sendMessage: 'إرسال رسالة',
    messageSent: 'تم إرسال رسالتك بنجاح',
    personalInfo: 'البيانات الشخصية',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    addAddress: 'إضافة عنوان',
    editAddress: 'تعديل العنوان',
    deleteAddress: 'حذف العنوان',
    setAsDefault: 'تعيين كافتراضي',
    defaultAddress: 'العنوان الافتراضي',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    governorate: 'المحافظة',
    city: 'المدينة',
    address: 'العنوان',
    landmark: 'علامة مميزة',
    notifyWhenAvailable: 'أخبرني عند التوفر',
    stockNotification: 'إشعار التوفر',
    outOfStock: 'غير متوفر',
    backInStock: 'متوفر مرة أخرى',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات',
    viewAllNotifications: 'عرض كل الإشعارات',
    personalInfoTab: 'البيانات الشخصية',
    addressesTab: 'العناوين',
    loyaltyTab: 'نقاط الولاء',
    securityTab: 'الأمان',
    profile: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'إغلاق',
    loading: 'جاري التحميل...',
    noOrders: 'لا توجد طلبات',
    noOrdersDesc: 'لم تقم بأي طلبات بعد',
    startShopping: 'ابدأ التسوق',
    viewOrder: 'عرض الطلب',
    items: 'المنتجات',
    paymentMethod: 'طريقة الدفع',
    shippingAddress: 'عنوان الشحن',
    orderSummary: 'ملخص الطلب',
    discount: 'الخصم',
    couponDiscount: 'خصم الكوبون',
    pointsDiscount: 'خصم النقاط',
    grandTotal: 'الإجمالي النهائي',
    subject: 'الموضوع',
    generalInquiry: 'استفسار عام',
    orderInquiry: 'استفسار عن طلب',
    returnExchange: 'إرجاع أو استبدال',
    suggestion: 'اقتراح',
    complaint: 'شكوى',
    message: 'الرسالة',
    yourMessage: 'رسالتك',
    sendAnotherMessage: 'إرسال رسالة أخرى',
    thankYouContact: 'شكراً لتواصلك معنا',
    getInTouch: 'تواصل معنا',
    ourLocation: 'موقعنا',
    workingHours: 'ساعات العمل',
    weekdays: 'أيام الأسبوع',
    friday: 'الجمعة',
    followUs: 'تابعنا',
    sortBy: 'ترتيب حسب',
    newestFirst: 'الأحدث أولاً',
    highestRated: 'الأعلى تقييماً',
    lowestRated: 'الأقل تقييماً',
    mostHelpful: 'الأكثر فائدة',
    filterByRating: 'تصفية حسب التقييم',
    allRatings: 'كل التقييمات',
    stars: 'نجوم',
    outOf5: 'من 5',
    basedOn: 'بناءً على',
    customerReviews: 'تقييمات العملاء',
    writeYourReview: 'اكتب تقييمك',
    editYourReview: 'تعديل تقييمك',
    deleteReview: 'حذف التقييم',
    reviewDeleted: 'تم حذف التقييم',
    reviewSubmitted: 'تم إرسال تقييمك',
    reviewUpdated: 'تم تحديث تقييمك',
    addPhotos: 'أضف صور',
    maxPhotos: 'حد أقصى 5 صور',
    noReviewsYet: 'لا توجد تقييمات بعد',
    beFirstToReview: 'كن أول من يقيم هذا المنتج',
    reviews: 'تقييم',
    sold: 'مباع',
    quantity: 'الكمية',
    inStock: 'متوفر',
    addToCart: 'أضف للسلة',
    addedToCart: 'تمت الإضافة!',
    buyNow: 'شراء الآن',
    needHelp: 'هل تحتاج مساعدة؟',
    callUs: 'اتصل بنا',
    description: 'الوصف',
    specifications: 'المواصفات',
    relatedProducts: 'منتجات مشابهة',
    viewAll: 'عرض الكل',
  },
  en: {
    siteName: 'Kamal Saad',
    siteSlogan: 'Office & School Supplies',
    topBarPromo: 'Free shipping on orders over 200 EGP | 15% student discount',
    searchPlaceholder: 'Search for pens, notebooks, bags...',
    login: 'Login',
    register: 'Sign Up',
    cart: 'Shopping Cart',
    favorites: 'Favorites',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    addedToCart: 'Added!',
    currency: 'EGP',
    products: 'Products',
    categories: 'Categories',
    featured: 'Featured',
    discount: 'OFF',
    quantity: 'Quantity',
    inStock: 'In Stock',
    onlyLeft: 'Only left',
    reviews: 'reviews',
    sold: 'sold',
    description: 'Description',
    specifications: 'Specifications',
    relatedProducts: 'Related Products',
    viewAll: 'View All',
    siteSlogan: 'Office & School Supplies',
    fastDelivery: 'Fast Delivery',
    qualityGuarantee: 'Quality Guarantee',
    securePayment: 'Secure Payment',
    support247: '24/7 Support',
    allRightsReserved: 'All Rights Reserved',
    returnPolicy: '14-day return policy',
    originalProducts: '100% Original Products',
    addedToFavorites: 'Added to Favorites!',
    removedFromFavorites: 'Removed from Favorites',
    newsletter: 'Subscribe to our newsletter',
    newsletterDesc: 'Get the latest offers and discounts directly in your inbox',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    quickLinks: 'Quick Links',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    privacyPolicy: 'Privacy Policy',
    offers: 'Offers & Discounts',
    needHelp: 'Need Help?',
    callUs: 'Call Us',
    // New translations
    myOrders: 'My Orders',
    myProfile: 'My Account',
    notifications: 'Notifications',
    loyaltyPoints: 'Loyalty Points',
    myAddresses: 'My Addresses',
    orderHistory: 'Order History',
    orderDetails: 'Order Details',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    reorder: 'Reorder',
    writeReview: 'Write a Review',
    rating: 'Rating',
    reviewTitle: 'Review Title',
    reviewComment: 'Your Comment',
    submitReview: 'Submit Review',
    verifiedPurchase: 'Verified Purchase',
    helpful: 'Helpful',
    wasThisHelpful: 'Was this review helpful?',
    couponCode: 'Coupon Code',
    applyCoupon: 'Apply',
    invalidCoupon: 'Invalid coupon code',
    couponApplied: 'Coupon applied successfully',
    pointsEarned: 'Points Earned',
    pointsUsed: 'Points Used',
    redeemPoints: 'Redeem Points',
    availablePoints: 'Available Points',
    returnRequest: 'Return Request',
    exchangeRequest: 'Exchange Request',
    returnReason: 'Return Reason',
    returnStatus: 'Return Status',
    contactForm: 'Contact Form',
    sendMessage: 'Send Message',
    messageSent: 'Your message has been sent successfully',
    personalInfo: 'Personal Information',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordChanged: 'Password changed successfully',
    addAddress: 'Add Address',
    editAddress: 'Edit Address',
    deleteAddress: 'Delete Address',
    setAsDefault: 'Set as Default',
    defaultAddress: 'Default Address',
    fullName: 'Full Name',
    phone: 'Phone Number',
    governorate: 'Governorate',
    city: 'City',
    address: 'Address',
    landmark: 'Landmark',
    notifyWhenAvailable: 'Notify When Available',
    stockNotification: 'Stock Notification',
    outOfStock: 'Out of Stock',
    backInStock: 'Back in Stock',
    markAllRead: 'Mark All as Read',
    noNotifications: 'No notifications',
    viewAllNotifications: 'View All Notifications',
    personalInfoTab: 'Personal Info',
    addressesTab: 'Addresses',
    loyaltyTab: 'Loyalty Points',
    securityTab: 'Security',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    loading: 'Loading...',
    noOrders: 'No Orders',
    noOrdersDesc: 'You haven\'t placed any orders yet',
    startShopping: 'Start Shopping',
    viewOrder: 'View Order',
    items: 'Items',
    paymentMethod: 'Payment Method',
    shippingAddress: 'Shipping Address',
    orderSummary: 'Order Summary',
    discount: 'Discount',
    couponDiscount: 'Coupon Discount',
    pointsDiscount: 'Points Discount',
    grandTotal: 'Grand Total',
    subject: 'Subject',
    generalInquiry: 'General Inquiry',
    orderInquiry: 'Order Inquiry',
    returnExchange: 'Return/Exchange',
    suggestion: 'Suggestion',
    complaint: 'Complaint',
    message: 'Message',
    yourMessage: 'Your Message',
    sendAnotherMessage: 'Send Another Message',
    thankYouContact: 'Thank you for contacting us',
    getInTouch: 'Get in Touch',
    ourLocation: 'Our Location',
    workingHours: 'Working Hours',
    weekdays: 'Weekdays',
    friday: 'Friday',
    followUs: 'Follow Us',
    sortBy: 'Sort By',
    newestFirst: 'Newest First',
    highestRated: 'Highest Rated',
    lowestRated: 'Lowest Rated',
    mostHelpful: 'Most Helpful',
    filterByRating: 'Filter by Rating',
    allRatings: 'All Ratings',
    stars: 'stars',
    outOf5: 'out of 5',
    basedOn: 'Based on',
    customerReviews: 'customer reviews',
    writeYourReview: 'Write Your Review',
    editYourReview: 'Edit Your Review',
    deleteReview: 'Delete Review',
    reviewDeleted: 'Review deleted',
    reviewSubmitted: 'Your review has been submitted',
    reviewUpdated: 'Your review has been updated',
    addPhotos: 'Add Photos',
    maxPhotos: 'Max 5 photos',
    noReviewsYet: 'No reviews yet',
    beFirstToReview: 'Be the first to review this product',
    reviews: 'reviews',
    sold: 'sold',
    quantity: 'Quantity',
    inStock: 'in stock',
    addToCart: 'Add to Cart',
    addedToCart: 'Added!',
    buyNow: 'Buy Now',
    needHelp: 'Need Help?',
    callUs: 'Call Us',
    description: 'Description',
    specifications: 'Specifications',
    relatedProducts: 'Related Products',
    viewAll: 'View All',
  }
};

export const t = (key: keyof typeof translations.ar, language: 'ar' | 'en') => {
  return translations[language][key];
};
