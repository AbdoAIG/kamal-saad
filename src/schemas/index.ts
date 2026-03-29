// Export all schemas
export * from './product.schema';
export * from './variant.schema';
export * from './order.schema';
export * from './user.schema';
export * from './category.schema';
export * from './coupon.schema';
export * from './contact.schema';
export * from './review.schema';
export * from './banner.schema';

// Helper function to validate request body
import { NextResponse } from 'next/server';
import { z } from 'zod';

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'بيانات غير صالحة',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'خطأ في التحقق من البيانات' },
        { status: 400 }
      ),
    };
  }
}

// Helper function to validate query parameters
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: Record<string, string | string[] | undefined>
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  try {
    const data = schema.parse(query);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'معاملات غير صالحة',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'خطأ في التحقق من المعاملات' },
        { status: 400 }
      ),
    };
  }
}

// Helper function to validate route params
export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | undefined>
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'معاملات غير صالحة',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'خطأ في التحقق من المعاملات' },
        { status: 400 }
      ),
    };
  }
}
