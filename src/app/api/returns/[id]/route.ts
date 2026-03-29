import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// GET - Get single return with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const returnRequest = await db.return.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            discount: true,
            shippingAddress: true,
            phone: true,
            createdAt: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    nameAr: true,
                    images: true,
                    price: true,
                    discountPrice: true,
                  },
                },
              },
            },
          },
        },
        items: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { success: false, error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this return
    if (returnRequest.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse product images
    const orderWithParsedImages = {
      ...returnRequest.order,
      items: returnRequest.order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
        },
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...returnRequest,
        order: orderWithParsedImages,
      },
    });
  } catch (error) {
    console.error('Return fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch return request' },
      { status: 500 }
    );
  }
}

// PUT - Update return status (admin only)
// Fields: status, refundAmount, refundMethod, adminNotes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update return status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, refundAmount, refundMethod, adminNotes } = body;

    // Check if return exists
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate refundMethod if provided
    const validRefundMethods = ['original', 'wallet', 'bank'];
    if (refundMethod && !validRefundMethods.includes(refundMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid refund method. Must be one of: ${validRefundMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate refundAmount if provided
    if (refundAmount !== undefined && refundAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Refund amount cannot be negative' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    if (refundAmount !== undefined) {
      updateData.refundAmount = refundAmount;
    }
    if (refundMethod !== undefined) {
      updateData.refundMethod = refundMethod;
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    // Update return
    const updatedReturn = await db.return.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });

    // Create notification for the user
    let notificationTitle = '';
    let notificationTitleAr = '';
    let notificationMessage = '';
    let notificationMessageAr = '';

    if (status === 'approved') {
      notificationTitle = 'Return Request Approved';
      notificationTitleAr = 'تم الموافقة على طلب الإرجاع';
      notificationMessage = `Your ${existingReturn.type} request for order #${existingReturn.orderId.slice(-8)} has been approved.`;
      notificationMessageAr = `تمت الموافقة على طلب ${existingReturn.type === 'return' ? 'الإرجاع' : 'الاستبدال'} للطلب #${existingReturn.orderId.slice(-8)}.`;
    } else if (status === 'rejected') {
      notificationTitle = 'Return Request Rejected';
      notificationTitleAr = 'تم رفض طلب الإرجاع';
      notificationMessage = `Your ${existingReturn.type} request for order #${existingReturn.orderId.slice(-8)} has been rejected.`;
      notificationMessageAr = `تم رفض طلب ${existingReturn.type === 'return' ? 'الإرجاع' : 'الاستبدال'} للطلب #${existingReturn.orderId.slice(-8)}.`;
    } else if (status === 'completed') {
      notificationTitle = 'Return Request Completed';
      notificationTitleAr = 'تم إكمال طلب الإرجاع';
      notificationMessage = `Your ${existingReturn.type} request for order #${existingReturn.orderId.slice(-8)} has been completed.`;
      notificationMessageAr = `تم إكمال طلب ${existingReturn.type === 'return' ? 'الإرجاع' : 'الاستبدال'} للطلب #${existingReturn.orderId.slice(-8)}.`;
    }

    if (notificationTitle) {
      await db.notification.create({
        data: {
          userId: existingReturn.userId,
          type: 'order',
          title: notificationTitle,
          titleAr: notificationTitleAr,
          message: notificationMessage,
          messageAr: notificationMessageAr,
          data: JSON.stringify({ 
            returnId: id, 
            orderId: existingReturn.orderId,
            status: status || existingReturn.status,
          }),
        },
      });
    }

    // If refund is completed and refundMethod is wallet, add loyalty points (optional feature)
    if (status === 'completed' && refundMethod === 'wallet' && refundAmount && refundAmount > 0) {
      // Convert refund amount to loyalty points (1 point per currency unit)
      const pointsToAdd = Math.floor(refundAmount);
      if (pointsToAdd > 0) {
        await db.user.update({
          where: { id: existingReturn.userId },
          data: {
            loyaltyPoints: { increment: pointsToAdd },
          },
        });

        await db.loyaltyHistory.create({
          data: {
            userId: existingReturn.userId,
            points: pointsToAdd,
            type: 'earn',
            reason: `Refund for return request #${id.slice(-8)}`,
            orderId: existingReturn.orderId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedReturn,
      message: 'Return request updated successfully',
    });
  } catch (error) {
    console.error('Return update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update return request' },
      { status: 500 }
    );
  }
}
