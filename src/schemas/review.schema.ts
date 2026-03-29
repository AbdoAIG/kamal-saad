import { z } from 'zod';

// Review schema
export const reviewSchema = z.object({
  productId: z.string().min(1, { message: 'معرف المنتج مطلوب' }),
  
  rating: z.number()
    .int({ message: 'التقييم يجب أن يكون رقماً صحيحاً' })
    .min(1, { message: 'التقييم يجب أن يكون بين 1 و 5' })
    .max(5, { message: 'التقييم يجب أن يكون بين 1 و 5' }),
  
  title: z.string()
    .max(100, { message: 'عنوان التقييم طويل جداً' })
    .optional()
    .nullable(),
  
  comment: z.string()
    .min(10, { message: 'التعليق يجب أن يكون 10 أحرف على الأقل' })
    .max(1000, { message: 'التعليق طويل جداً' })
    .optional()
    .nullable(),
  
  images: z.array(z.string().url({ message: 'رابط الصورة غير صالح' }))
    .max(5, { message: 'لا يمكن إضافة أكثر من 5 صور' })
    .optional()
    .nullable(),
});

// Update review schema
export const updateReviewSchema = reviewSchema.partial().omit({ productId: true });

export type ReviewInput = z.infer<typeof reviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
