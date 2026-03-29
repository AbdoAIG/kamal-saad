import { z } from 'zod';

// Banner schema
export const bannerSchema = z.object({
  title: z.string()
    .min(2, { message: 'عنوان البانر يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'عنوان البانر طويل جداً' }),
  
  titleAr: z.string()
    .min(2, { message: 'عنوان البانر بالعربية يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'عنوان البانر بالعربية طويل جداً' }),
  
  subtitle: z.string()
    .max(200, { message: 'العنوان الفرعي طويل جداً' })
    .optional()
    .nullable(),
  
  subtitleAr: z.string()
    .max(200, { message: 'العنوان الفرعي بالعربية طويل جداً' })
    .optional()
    .nullable(),
  
  image: z.string()
    .url({ message: 'رابط الصورة غير صالح' }),
  
  link: z.string()
    .url({ message: 'الرابط غير صالح' })
    .optional()
    .nullable(),
  
  buttonText: z.string()
    .max(50, { message: 'نص الزر طويل جداً' })
    .optional()
    .nullable(),
  
  buttonTextAr: z.string()
    .max(50, { message: 'نص الزر بالعربية طويل جداً' })
    .optional()
    .nullable(),
  
  active: z.boolean().optional().default(true),
  
  order: z.number().int().min(0).optional().default(0),
});

// Update banner schema
export const updateBannerSchema = bannerSchema.partial();

export type BannerInput = z.infer<typeof bannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
