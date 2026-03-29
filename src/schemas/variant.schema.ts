import { z } from 'zod';

// Variant option schema
export const variantOptionSchema = z.object({
  value: z.string()
    .min(1, { message: 'قيمة الخيار مطلوبة' })
    .max(50, { message: 'قيمة الخيار طويلة جداً' }),
  
  valueAr: z.string()
    .min(1, { message: 'قيمة الخيار بالعربية مطلوبة' })
    .max(50, { message: 'قيمة الخيار بالعربية طويلة جداً' }),
  
  colorCode: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'رمز اللون غير صالح' })
    .optional()
    .nullable(),
  
  image: z.string()
    .url({ message: 'رابط الصورة غير صالح' })
    .optional()
    .nullable(),
  
  order: z.number().int().min(0).optional().default(0),
});

// Variant schema
export const variantSchema = z.object({
  name: z.string()
    .min(1, { message: 'اسم المتغير مطلوب' })
    .max(50, { message: 'اسم المتغير طويل جداً' }),
  
  nameAr: z.string()
    .min(1, { message: 'اسم المتغير بالعربية مطلوب' })
    .max(50, { message: 'اسم المتغير بالعربية طويل جداً' }),
  
  order: z.number().int().min(0).optional().default(0),
  
  options: z.array(variantOptionSchema)
    .min(1, { message: 'يجب إضافة خيار واحد على الأقل' })
    .max(50, { message: 'لا يمكن إضافة أكثر من 50 خيار' })
    .optional(),
});

// Update variant schema
export const updateVariantSchema = variantSchema.partial();

// SKU schema
export const skuSchema = z.object({
  sku: z.string()
    .min(1, { message: 'رمز SKU مطلوب' })
    .max(100, { message: 'رمز SKU طويل جداً' })
    .regex(/^[A-Za-z0-9\-_]+$/, { message: 'رمز SKU يجب أن يحتوي على أحرف وأرقام فقط' }),
  
  price: z.number()
    .positive({ message: 'السعر يجب أن يكون أكبر من صفر' })
    .max(999999.99, { message: 'السعر كبير جداً' })
    .optional()
    .nullable(),
  
  discountPrice: z.number()
    .positive({ message: 'سعر الخصم يجب أن يكون أكبر من صفر' })
    .max(999999.99, { message: 'سعر الخصم كبير جداً' })
    .optional()
    .nullable(),
  
  stock: z.number()
    .int({ message: 'المخزون يجب أن يكون رقماً صحيحاً' })
    .min(0, { message: 'المخزون لا يمكن أن يكون سالباً' })
    .max(999999, { message: 'المخزون كبير جداً' })
    .default(0),
  
  image: z.string()
    .url({ message: 'رابط الصورة غير صالح' })
    .optional()
    .nullable(),
  
  isActive: z.boolean().optional().default(true),
  
  optionValues: z.array(z.object({
    variantId: z.string().min(1),
    optionId: z.string().min(1),
  })).min(1, { message: 'يجب اختيار قيمة واحدة على الأقل لكل متغير' }),
});

// Update SKU schema
export const updateSkuSchema = skuSchema.partial();

export type VariantOptionInput = z.infer<typeof variantOptionSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type SkuInput = z.infer<typeof skuSchema>;
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;
