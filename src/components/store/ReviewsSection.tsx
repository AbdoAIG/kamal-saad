'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Star, ThumbsUp, CheckCircle, Camera, X, ChevronLeft, ChevronRight, Loader2, MessageSquare, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

// Types
interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isVerified: boolean;
  isApproved: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsSectionProps {
  productId: string;
}

// Translations
const translations = {
  ar: {
    reviews: 'التقييمات',
    review: 'تقييم',
    writeReview: 'اكتب تقييماً',
    editReview: 'تعديل التقييم',
    rating: 'التقييم',
    title: 'عنوان التقييم',
    titlePlaceholder: 'أدخل عنواناً مختصراً',
    comment: 'تعليقك',
    commentPlaceholder: 'شارك تجربتك مع هذا المنتج...',
    addImages: 'أضف صور (اختياري)',
    submitReview: 'إرسال التقييم',
    cancel: 'إلغاء',
    verifiedPurchase: 'شراء موثق',
    helpful: 'مفيد',
    wasHelpful: 'هل كان هذا التقييم مفيداً؟',
    sortBy: 'ترتيب حسب',
    newest: 'الأحدث',
    highestRating: 'الأعلى تقييماً',
    lowestRating: 'الأقل تقييماً',
    mostHelpful: 'الأكثر فائدة',
    filterByRating: 'تصفية حسب التقييم',
    allRatings: 'جميع التقييمات',
    stars: 'نجوم',
    noReviews: 'لا توجد تقييمات بعد',
    beFirstReview: 'كن أول من يقيم هذا المنتج!',
    loginToReview: 'سجل الدخول لتكتب تقييماً',
    alreadyReviewed: 'لقد قمت بتقييم هذا المنتج بالفعل',
    deleteReview: 'حذف التقييم',
    confirmDelete: 'هل أنت متأكد من حذف تقييمك؟',
    delete: 'حذف',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
    reviewSubmitted: 'تم إرسال تقييمك بنجاح',
    reviewDeleted: 'تم حذف التقييم بنجاح',
    markHelpful: 'تم التسجيل كمفيد',
    uploadImages: 'رفع صور',
    maxImages: 'بحد أقصى 5 صور',
    imageSizeError: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
    requiredField: 'هذا الحقل مطلوب',
    minChars: 'الحد الأدنى 10 أحرف',
    maxChars: 'الحد الأقصى 500 حرف',
    basedOn: 'بناءً على',
    reviewsCount: 'تقييم',
    outOf: 'من 5',
    yourReview: 'تقييمك',
    pagination: 'صفحة',
  },
  en: {
    reviews: 'Reviews',
    review: 'Review',
    writeReview: 'Write a Review',
    editReview: 'Edit Review',
    rating: 'Rating',
    title: 'Review Title',
    titlePlaceholder: 'Enter a brief title',
    comment: 'Your Comment',
    commentPlaceholder: 'Share your experience with this product...',
    addImages: 'Add images (optional)',
    submitReview: 'Submit Review',
    cancel: 'Cancel',
    verifiedPurchase: 'Verified Purchase',
    helpful: 'Helpful',
    wasHelpful: 'Was this review helpful?',
    sortBy: 'Sort by',
    newest: 'Newest',
    highestRating: 'Highest Rating',
    lowestRating: 'Lowest Rating',
    mostHelpful: 'Most Helpful',
    filterByRating: 'Filter by Rating',
    allRatings: 'All Ratings',
    stars: 'stars',
    noReviews: 'No reviews yet',
    beFirstReview: 'Be the first to review this product!',
    loginToReview: 'Login to write a review',
    alreadyReviewed: 'You have already reviewed this product',
    deleteReview: 'Delete Review',
    confirmDelete: 'Are you sure you want to delete your review?',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    reviewSubmitted: 'Your review has been submitted successfully',
    reviewDeleted: 'Review deleted successfully',
    markHelpful: 'Marked as helpful',
    uploadImages: 'Upload Images',
    maxImages: 'Max 5 images',
    imageSizeError: 'Image size must be less than 5MB',
    requiredField: 'This field is required',
    minChars: 'Minimum 10 characters',
    maxChars: 'Maximum 500 characters',
    basedOn: 'Based on',
    reviewsCount: 'reviews',
    outOf: 'out of 5',
    yourReview: 'Your Review',
    pagination: 'Page',
  }
};

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { data: session, status } = useSession();
  const { language } = useStore();
  const isArabic = language === 'ar';
  const t = translations[language];
  
  // Use session user directly for better reliability
  const user = session?.user ? {
    id: (session.user as any).id,
    email: session.user.email || '',
    name: session.user.name,
    role: (session.user as any).role || 'customer'
  } : null;
  
  const isLoggedIn = status === 'authenticated' && !!user?.id;

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Filter and sort state
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reviewsPerPage = 5;

  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        limit: reviewsPerPage.toString(),
        offset: ((currentPage - 1) * reviewsPerPage).toString(),
      });

      // Add sort
      const sortMap = {
        newest: 'createdAt',
        highest: 'rating',
        lowest: 'rating',
        helpful: 'helpful'
      };
      const orderMap = {
        newest: 'desc',
        highest: 'desc',
        lowest: 'asc',
        helpful: 'desc'
      };
      params.set('sortBy', sortMap[sortBy]);
      params.set('sortOrder', orderMap[sortBy]);

      // Add filter
      if (filterRating) {
        params.set('rating', filterRating.toString());
      }

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data || []);
        const total = data.meta?.total || 0;
        setTotalPages(Math.ceil(total / reviewsPerPage));
        
        // Calculate stats from all reviews
        if (currentPage === 1 && !filterRating) {
          const statsResponse = await fetch(`/api/reviews?productId=${productId}&limit=1000`);
          const statsData = await statsResponse.json();
          
          if (statsData.success && statsData.data) {
            const allReviews = statsData.data;
            const totalReviews = allReviews.length;
            const avgRating = totalReviews > 0 
              ? allReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / totalReviews 
              : 0;
            
            const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            allReviews.forEach((r: Review) => {
              breakdown[r.rating as keyof typeof breakdown]++;
            });
            
            setStats({
              averageRating: Math.round(avgRating * 10) / 10,
              totalReviews,
              ratingBreakdown: breakdown
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage, sortBy, filterRating, t.error]);

  // Check if user has already reviewed
  const checkUserReview = useCallback(async () => {
    if (!user?.id) {
      setUserReview(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/reviews?productId=${productId}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setUserReview(data.data[0]);
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
      setUserReview(null);
    }
  }, [productId, user?.id]);

  useEffect(() => {
    fetchReviews();
    checkUserReview();
  }, [fetchReviews, checkUserReview]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (formImages.length + files.length > 5) {
      toast.error(t.maxImages);
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.imageSizeError);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImages(prev => [...prev, event.target!.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formRating === 0) {
      errors.rating = t.requiredField;
    }
    if (!formTitle.trim()) {
      errors.title = t.requiredField;
    }
    if (!formComment.trim()) {
      errors.comment = t.requiredField;
    } else if (formComment.length < 10) {
      errors.comment = t.minChars;
    } else if (formComment.length > 500) {
      errors.comment = t.maxChars;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit review
  const submitReview = async () => {
    if (!validateForm()) {
      toast.error(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    
    if (!user?.id) {
      toast.error(t.loginToReview);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId,
          rating: formRating,
          title: formTitle,
          comment: formComment,
          images: formImages
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(t.reviewSubmitted);
        setIsReviewDialogOpen(false);
        resetForm();
        fetchReviews();
        checkUserReview();
      } else {
        toast.error(data.error || data.errorAr || t.error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete review
  const deleteReview = async () => {
    if (!userReview || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${userReview.id}?userId=${user.id}&userRole=${user.role}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(t.reviewDeleted);
        setIsDeleteDialogOpen(false);
        setUserReview(null);
        fetchReviews();
      } else {
        toast.error(data.error || t.error);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark review as helpful
  const markHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success(t.markHelpful);
        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
        ));
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormRating(0);
    setFormTitle('');
    setFormComment('');
    setFormImages([]);
    setFormErrors({});
  };

  // Open edit dialog
  const openEditDialog = () => {
    if (userReview) {
      setFormRating(userReview.rating);
      setFormTitle(userReview.title || '');
      setFormComment(userReview.comment || '');
      setFormImages(userReview.images || []);
      setIsReviewDialogOpen(true);
    }
  };

  // Render stars
  const renderStars = (rating: number, interactive = false, size = 'h-5 w-5') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setFormRating(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${size} ${
                star <= rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isArabic
      ? date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="w-full space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.reviews}
        </h2>
        
        {/* Write Review Button */}
        {isLoggedIn ? (
          userReview ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={openEditDialog}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {t.editReview}
              </Button>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    {t.delete}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.deleteReview}</DialogTitle>
                  </DialogHeader>
                  <p className="text-gray-600 dark:text-gray-400">{t.confirmDelete}</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      {t.cancel}
                    </Button>
                    <Button variant="destructive" onClick={deleteReview} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.delete}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Dialog open={isReviewDialogOpen} onOpenChange={(open) => {
              setIsReviewDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                  <MessageSquare className="h-4 w-4" />
                  {t.writeReview}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.writeReview}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>{t.rating} *</Label>
                    <div className="flex items-center gap-2">
                      {renderStars(formRating, true, 'h-8 w-8')}
                      <span className="text-sm text-gray-500">
                        {formRating > 0 ? `${formRating}/5` : ''}
                      </span>
                    </div>
                    {formErrors.rating && (
                      <p className="text-sm text-red-500">{formErrors.rating}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">{t.title} *</Label>
                    <Input
                      id="title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={t.titlePlaceholder}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="comment">{t.comment} *</Label>
                    <Textarea
                      id="comment"
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      rows={4}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      {formErrors.comment && (
                        <p className="text-red-500">{formErrors.comment}</p>
                      )}
                      <span className={formComment.length > 500 ? 'text-red-500' : ''}>
                        {formComment.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-2">
                    <Label>{t.addImages}</Label>
                    <div className="flex flex-wrap gap-2">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {formImages.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
                          <Camera className="h-6 w-6 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">+{5 - formImages.length}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{t.maxImages}</p>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReviewDialogOpen(false);
                        resetForm();
                      }}
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={submitReview}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t.loading}
                        </>
                      ) : t.submitReview}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        ) : (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast.info(t.loginToReview)}
          >
            <MessageSquare className="h-4 w-4" />
            {t.writeReview}
          </Button>
        )}
      </div>

      {/* Stats Section */}
      {stats && stats.totalReviews > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-800/50 border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="mt-1">
                    {renderStars(Math.round(stats.averageRating))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.basedOn} {stats.totalReviews} {t.reviewsCount}
                  </p>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingBreakdown[star as keyof typeof stats.ratingBreakdown];
                  const percentage = stats.totalReviews > 0 
                    ? (count / stats.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <button
                      key={star}
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`w-full flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors ${filterRating === star ? 'bg-teal-50 dark:bg-teal-900/30' : ''}`}
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{star} ★</span>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-sm text-gray-500 w-12 text-left">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={filterRating?.toString() || 'all'}
            onValueChange={(value) => setFilterRating(value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.filterByRating} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allRatings}</SelectItem>
              {[5, 4, 3, 2, 1].map((star) => (
                <SelectItem key={star} value={star.toString()}>
                  {star} {t.stars}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t.newest}</SelectItem>
              <SelectItem value="highest">{t.highestRating}</SelectItem>
              <SelectItem value="lowest">{t.lowestRating}</SelectItem>
              <SelectItem value="helpful">{t.mostHelpful}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterRating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterRating(null)}
            className="text-teal-600"
          >
            <X className="h-4 w-4 mr-1" />
            {t.cancel}
          </Button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800/50 border-0">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t.noReviews}</p>
              <p className="text-sm text-gray-500 mt-2">{t.beFirstReview}</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.user.image || undefined} />
                          <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200">
                            {review.user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {review.user.name || 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {renderStars(review.rating, false, 'h-4 w-4')}
                            <span>•</span>
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {review.isVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {t.verifiedPurchase}
                        </Badge>
                      )}
                    </div>

                    {/* Review Content */}
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {review.title}
                      </h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {review.comment}
                      </p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.images.map((img, idx) => (
                          <Dialog key={idx}>
                            <DialogTrigger asChild>
                              <img
                                src={img}
                                alt=""
                                className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl p-0">
                              <img
                                src={img}
                                alt=""
                                className="w-full h-auto rounded-lg"
                              />
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    )}

                    {/* Helpful Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-500">{t.wasHelpful}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markHelpful(review.id)}
                        className="gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {review.helpful} {t.helpful}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 5) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => (
                <div key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'bg-teal-500 hover:bg-teal-600' : ''}
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
