import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  name: z.string()
    .min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' }),
  
  email: z.string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .max(255, { message: 'البريد الإلكتروني طويل جداً' }),
  
  password: z.string()
    .min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور طويلة جداً' })
    .regex(/[A-Za-z]/, { message: 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل' })
    .regex(/[0-9]/, { message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' }),
  
  phone: z.string()
    .regex(/^(\+20|0)?1[0-25][0-9]{8}$/, { message: 'رقم الهاتف غير صالح' })
    .optional()
    .nullable(),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

// User login schema
export const loginSchema = z.object({
  email: z.string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .max(255, { message: 'البريد الإلكتروني طويل جداً' }),
  
  password: z.string()
    .min(1, { message: 'كلمة المرور مطلوبة' }),
});

// Update user schema
export const updateUserSchema = z.object({
  name: z.string()
    .min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' })
    .optional(),
  
  phone: z.string()
    .regex(/^(\+20|0)?1[0-25][0-9]{8}$/, { message: 'رقم الهاتف غير صالح' })
    .optional()
    .nullable(),
  
  email: z.string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .max(255, { message: 'البريد الإلكتروني طويل جداً' })
    .optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, { message: 'كلمة المرور الحالية مطلوبة' }),
  
  newPassword: z.string()
    .min(6, { message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور طويلة جداً' })
    .regex(/[A-Za-z]/, { message: 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل' })
    .regex(/[0-9]/, { message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' }),
  
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

// Address schema
export const addressSchema = z.object({
  label: z.string()
    .min(1, { message: 'اسم العنوان مطلوب' })
    .max(50, { message: 'اسم العنوان طويل جداً' }),
  
  fullName: z.string()
    .min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' }),
  
  phone: z.string()
    .regex(/^(\+20|0)?1[0-25][0-9]{8}$/, { message: 'رقم الهاتف غير صالح' }),
  
  governorate: z.string()
    .min(2, { message: 'المحافظة مطلوبة' })
    .max(50, { message: 'اسم المحافظة طويل جداً' }),
  
  city: z.string()
    .min(2, { message: 'المدينة مطلوبة' })
    .max(50, { message: 'اسم المدينة طويل جداً' }),
  
  address: z.string()
    .min(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
    .max(500, { message: 'العنوان طويل جداً' }),
  
  landmark: z.string()
    .max(100, { message: 'العلامة المميزة طويلة جداً' })
    .optional()
    .nullable(),
  
  isDefault: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
