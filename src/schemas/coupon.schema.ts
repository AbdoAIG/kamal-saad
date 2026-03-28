import { z } from 'zod';

// Coupon schema
export const couponSchema = z.object({
  code: z.string()
    .min(3, { message: 'كود الخصم يجب أن يكون 3 أحرف على الأقل' })
    .max(20, { message: 'كود الخصم طويل جداً' })
    .regex(/^[A-Za-z0-9]+$/, { message: 'كود الخصم يجب أن يحتوي على أحرف وأرقام فقط' }),
  
  type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'نوع الخصم غير صالح' }),
  }),
  
  value: z.number()
    .positive({ message: 'قيمة الخصم يجب أن تكون أكبر من صفر' })
    .max(100, { message: 'نسبة الخصم لا يمكن أن تتجاوز 100%' }),
  
  minOrder: z.number()
    .min(0, { message: 'الحد الأدنى للطلب لا يمكن أن يكون سالباً' })
    .optional()
    .nullable(),
  
  maxDiscount: z.number()
    .positive({ message: 'أقصى خصم يجب أن يكون أكبر من صفر' })
    .optional()
    .nullable(),
  
  usageLimit: z.number()
    .int({ message: 'حد الاستخدام يجب أن يكون رقماً صحيحاً' })
    .positive({ message: 'حد الاستخدام يجب أن يكون أكبر من صفر' })
    .optional()
    .nullable(),
  
  validFrom: z.string()
    .datetime({ message: 'تاريخ البداية غير صالح' }),
  
  validUntil: z.string()
    .datetime({ message: 'تاريخ النهاية غير صالح' }),
  
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);
  return validFrom < validUntil;
}, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['validUntil'],
});

// Update coupon schema - without using .partial() on refined schema
export const updateCouponSchema = z.object({
  code: z.string()
    .min(3, { message: 'كود الخصم يجب أن يكون 3 أحرف على الأقل' })
    .max(20, { message: 'كود الخصم طويل جداً' })
    .regex(/^[A-Za-z0-9]+$/, { message: 'كود الخصم يجب أن يحتوي على أحرف وأرقام فقط' })
    .optional(),
  
  type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'نوع الخصم غير صالح' }),
  }).optional(),
  
  value: z.number()
    .positive({ message: 'قيمة الخصم يجب أن تكون أكبر من صفر' })
    .max(100, { message: 'نسبة الخصم لا يمكن أن تتجاوز 100%' })
    .optional(),
  
  minOrder: z.number()
    .min(0, { message: 'الحد الأدنى للطلب لا يمكن أن يكون سالباً' })
    .optional()
    .nullable(),
  
  maxDiscount: z.number()
    .positive({ message: 'أقصى خصم يجب أن يكون أكبر من صفر' })
    .optional()
    .nullable(),
  
  usageLimit: z.number()
    .int({ message: 'حد الاستخدام يجب أن يكون رقماً صحيحاً' })
    .positive({ message: 'حد الاستخدام يجب أن يكون أكبر من صفر' })
    .optional()
    .nullable(),
  
  validFrom: z.string()
    .datetime({ message: 'تاريخ البداية غير صالح' })
    .optional(),
  
  validUntil: z.string()
    .datetime({ message: 'تاريخ النهاية غير صالح' })
    .optional(),
  
  isActive: z.boolean().optional(),
});

// Validate coupon schema
export const validateCouponSchema = z.object({
  code: z.string().min(1, { message: 'كود الخصم مطلوب' }),
  total: z.number().positive({ message: 'المجموع يجب أن يكون أكبر من صفر' }),
});

export type CouponInput = z.infer<typeof couponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
