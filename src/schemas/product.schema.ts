import { z } from 'zod';

// Product creation/update schema
export const productSchema = z.object({
  name: z.string()
    .min(2, { message: 'اسم المنتج يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم المنتج طويل جداً' }),
  
  nameAr: z.string()
    .min(2, { message: 'اسم المنتج بالعربية يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'اسم المنتج بالعربية طويل جداً' }),
  
  description: z.string()
    .max(2000, { message: 'الوصف طويل جداً' })
    .optional()
    .nullable(),
  
  descriptionAr: z.string()
    .max(2000, { message: 'الوصف بالعربية طويل جداً' })
    .optional()
    .nullable(),
  
  price: z.number()
    .positive({ message: 'السعر يجب أن يكون أكبر من صفر' })
    .max(999999.99, { message: 'السعر كبير جداً' }),
  
  discountPrice: z.number()
    .positive({ message: 'سعر الخصم يجب أن يكون أكبر من صفر' })
    .max(999999.99, { message: 'سعر الخصم كبير جداً' })
    .optional()
    .nullable()
    .refine((val, ctx) => {
      // This will be validated in the API where we have access to price
      return true;
    }),
  
  stock: z.number()
    .int({ message: 'المخزون يجب أن يكون رقماً صحيحاً' })
    .min(0, { message: 'المخزون لا يمكن أن يكون سالباً' })
    .max(999999, { message: 'المخزون كبير جداً' }),
  
  categoryId: z.string()
    .min(1, { message: 'يجب اختيار فئة' }),
  
  featured: z.boolean().optional().default(false),
  
  images: z.array(z.string().url({ message: 'رابط الصورة غير صالح' }))
    .min(1, { message: 'يجب إضافة صورة واحدة على الأقل' })
    .max(10, { message: 'لا يمكن إضافة أكثر من 10 صور' }),
  
  sku: z.string()
    .max(50, { message: 'رمز SKU طويل جداً' })
    .optional()
    .nullable(),
  
  barcode: z.string()
    .max(50, { message: 'رمز الباركود طويل جداً' })
    .optional()
    .nullable(),
  
  minStock: z.number()
    .int({ message: 'الحد الأدنى للمخزون يجب أن يكون رقماً صحيحاً' })
    .min(0, { message: 'الحد الأدنى للمخزون لا يمكن أن يكون سالباً' })
    .optional()
    .default(5),
});

// Schema for updating product (partial)
export const updateProductSchema = productSchema.partial().extend({
  hasVariants: z.boolean().optional(),
});

// Schema for product ID
export const productIdSchema = z.object({
  id: z.string().min(1, { message: 'معرف المنتج مطلوب' }),
});

// Product query schema for filtering
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  categoryId: z.string().optional(),
  search: z.string().max(100).optional(),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(999999.99).optional(),
  sortBy: z.enum(['createdAt', 'price', 'salesCount', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Advanced search query schema
export const advancedSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(999999.99).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating', 'sales']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  hasDiscount: z.coerce.boolean().optional(),
});

// Search suggestions query schema
export const searchSuggestionsQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

export type AdvancedSearchQuery = z.infer<typeof advancedSearchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<typeof searchSuggestionsQuerySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
