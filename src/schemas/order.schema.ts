import { z } from 'zod';

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().min(1, { message: 'معرف المنتج مطلوب' }),
  skuId: z.string().optional().nullable(),
  quantity: z.number()
    .int({ message: 'الكمية يجب أن تكون رقماً صحيحاً' })
    .min(1, { message: 'الكمية يجب أن تكون واحد على الأقل' })
    .max(100, { message: 'الكمية كبيرة جداً' }),
});

// Shipping info schema
export const shippingInfoSchema = z.object({
  fullName: z.string()
    .min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' }),
  
  phone: z.string()
    .regex(/^(\+20|0)?1[0-25][0-9]{8}$/, { message: 'رقم الهاتف غير صالح' }),
  
  email: z.string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .optional()
    .nullable(),
  
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
  
  notes: z.string()
    .max(500, { message: 'الملاحظات طويلة جداً' })
    .optional()
    .nullable(),
});

// Create order schema
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, { message: 'يجب إضافة منتج واحد على الأقل' })
    .max(50, { message: 'لا يمكن إضافة أكثر من 50 منتج' }),
  
  shippingInfo: shippingInfoSchema,
  
  paymentMethod: z.enum(['cod', 'card', 'wallet', 'kiosk', 'fawry', 'visa', 'vodafone', 'valu'], {
    errorMap: () => ({ message: 'طريقة الدفع غير صالحة' }),
  }),
  
  couponCode: z.string()
    .max(50, { message: 'كود الخصم طويل جداً' })
    .optional()
    .nullable(),
  
  pointsUsed: z.number()
    .int({ message: 'النقاط يجب أن تكون رقماً صحيحاً' })
    .min(0, { message: 'النقاط لا يمكن أن تكون سالبة' })
    .max(10000, { message: 'النقاط كبيرة جداً' })
    .optional()
    .default(0),
  
  notes: z.string()
    .max(500, { message: 'الملاحظات طويلة جداً' })
    .optional()
    .nullable(),
  
  // Allow additional fields from checkout
  subtotal: z.number().optional(),
  shippingFee: z.number().optional(),
  total: z.number().optional(),
  phone: z.string().optional(),
  userId: z.string().optional().nullable(),
  shippingAddress: z.string().optional(),
});

// Update order status schema
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'حالة الطلب غير صالحة' }),
  }),
  
  adminNotes: z.string()
    .max(1000, { message: 'ملاحظات الأدمن طويلة جداً' })
    .optional()
    .nullable(),
});

// Order query schema
export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  search: z.string().max(100).optional(),
  userId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type ShippingInfoInput = z.infer<typeof shippingInfoSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
