import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// GET - Fetch returns with filters
// For customers: only their own returns
// For admins: all returns with filters (status, userId)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    // Build where clause based on user role
    const where: Record<string, unknown> = {};
    
    // Customers can only see their own returns
    if (session.user.role !== 'admin') {
      where.userId = session.user.id;
    } else {
      // Admins can filter by userId
      if (userId) {
        where.userId = userId;
      }
    }

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const returns = await db.return.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error('Returns fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// POST - Create return request
// Fields: orderId, type (return/exchange), reason, description, items (array with productId, productName, quantity, price)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, type, reason, description, items } = body;

    // Validate required fields
    if (!orderId || !type || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, type, reason, and items are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['return', 'exchange'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "return" or "exchange"' },
        { status: 400 }
      );
    }

    // Verify the order belongs to the user
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You can only create returns for your own orders' },
        { status: 403 }
      );
    }

    // Check if order is eligible for return (e.g., delivered status)
    if (!['delivered', 'shipped'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order is not eligible for return. Only delivered or shipped orders can be returned.' },
        { status: 400 }
      );
    }

    // Validate items - ensure they belong to the order
    const orderProductIds = order.items.map(item => item.productId);
    for (const item of items) {
      if (!item.productId || !item.productName || !item.quantity || !item.price) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId, productName, quantity, and price' },
          { status: 400 }
        );
      }

      if (!orderProductIds.includes(item.productId)) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} does not belong to this order` },
          { status: 400 }
        );
      }

      // Check if quantity is valid
      const orderItem = order.items.find(oi => oi.productId === item.productId);
      if (orderItem && item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { success: false, error: `Cannot return more items than ordered for product ${item.productName}` },
          { status: 400 }
        );
      }
    }

    // Check for existing pending return for the same order
    const existingReturn = await db.return.findFirst({
      where: {
        orderId,
        userId: session.user.id,
        status: 'pending',
      },
    });

    if (existingReturn) {
      return NextResponse.json(
        { success: false, error: 'A pending return request already exists for this order' },
        { status: 400 }
      );
    }

    // Create return with items
    const returnRequest = await db.return.create({
      data: {
        orderId,
        userId: session.user.id,
        type,
        reason,
        description: description || null,
        status: 'pending',
        items: {
          create: items.map((item: { productId: string; productName: string; quantity: number; price: number; reason?: string }) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            reason: item.reason || null,
          })),
        },
      },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
      },
    });

    // Create notification for admin (if there are admins)
    const admins = await db.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'order',
          title: 'New Return Request',
          titleAr: 'طلب إرجاع جديد',
          message: `A new ${type} request has been submitted for order #${orderId.slice(-8)}`,
          messageAr: `تم تقديم طلب ${type === 'return' ? 'إرجاع' : 'استبدال'} جديد للطلب #${orderId.slice(-8)}`,
          data: JSON.stringify({ returnId: returnRequest.id, orderId }),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: returnRequest,
      message: 'Return request created successfully',
    });
  } catch (error) {
    console.error('Return create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}
