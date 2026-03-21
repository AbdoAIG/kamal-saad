import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get a single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const order = await db.order.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        coupon: true
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: JSON.parse(item.product.images)
          }
        }))
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
