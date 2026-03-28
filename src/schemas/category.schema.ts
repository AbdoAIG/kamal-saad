import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  name: z.string()
    .min(2, { message: 'اسم الفئة يجب أن يكون حرفين على الأقل' })
    .max(50, { message: 'اسم الفئة طويل جداً' }),
  
  nameAr: z.string()
    .min(2, { message: 'اسم الفئة بالعربية يجب أن يكون حرفين على الأقل' })
    .max(50, { message: 'اسم الفئة بالعربية طويل جداً' }),
  
  slug: z.string()
    .min(2, { message: 'الرابط يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الرابط طويل جداً' })
    .regex(/^[a-z0-9-]+$/, { message: 'الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط' })
    .optional(),
  
  image: z.string()
    .url({ message: 'رابط الصورة غير صالح' })
    .optional()
    .nullable(),
  
  description: z.string()
    .max(500, { message: 'الوصف طويل جداً' })
    .optional()
    .nullable(),
});

// Update category schema
export const updateCategorySchema = categorySchema.partial();

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
