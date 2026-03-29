import { z } from 'zod';

// Contact message schema
export const contactMessageSchema = z.object({
  name: z.string()
    .min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' }),
  
  email: z.string()
    .email({ message: 'البريد الإلكتروني غير صالح' })
    .max(255, { message: 'البريد الإلكتروني طويل جداً' }),
  
  phone: z.string()
    .regex(/^(\+20|0)?1[0-25][0-9]{8}$/, { message: 'رقم الهاتف غير صالح' })
    .optional()
    .nullable(),
  
  subject: z.string()
    .min(2, { message: 'الموضوع يجب أن يكون حرفين على الأقل' })
    .max(200, { message: 'الموضوع طويل جداً' })
    .optional()
    .nullable(),
  
  message: z.string()
    .min(10, { message: 'الرسالة يجب أن تكون 10 أحرف على الأقل' })
    .max(2000, { message: 'الرسالة طويلة جداً' }),
});

// Reply to contact message schema
export const replyContactSchema = z.object({
  reply: z.string()
    .min(10, { message: 'الرد يجب أن يكون 10 أحرف على الأقل' })
    .max(2000, { message: 'الرد طويل جداً' }),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type ReplyContactInput = z.infer<typeof replyContactSchema>;
