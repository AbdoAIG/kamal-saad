import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get single contact message (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is admin
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Auto-mark as read when viewed by admin
    if (message.status === 'new') {
      const updatedMessage = await prisma.contactMessage.update({
        where: { id },
        data: { status: 'read' },
      });
      return NextResponse.json({
        success: true,
        data: updatedMessage,
      });
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Contact message fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact message' },
      { status: 500 }
    );
  }
}

// PUT - Reply to contact message (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is admin
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reply } = body;

    // Validate reply field
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reply message is required' },
        { status: 400 }
      );
    }

    if (reply.trim().length > 10000) {
      return NextResponse.json(
        { success: false, error: 'Reply must be less than 10000 characters' },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Update message with reply
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
        status: 'replied',
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMessage,
      message: 'Reply has been saved successfully',
    });
  } catch (error) {
    console.error('Contact message reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reply to contact message' },
      { status: 500 }
    );
  }
}
