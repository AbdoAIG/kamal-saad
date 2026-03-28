import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema for sending a message
const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file']).default('text'),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().optional(),
});

// Schema for guest message
const guestSendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(5000),
  guestName: z.string().min(2).max(100).optional(),
});

// GET - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const conversationId = searchParams.get('conversationId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Check access
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
    const isOwner = session?.user?.id === conversation.userId;
    const isGuestOwner = !conversation.userId && request.cookies.get('guest_chat_id')?.value === conversationId;

    if (!isAdmin && !isOwner && !isGuestOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1]?.id : null,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

    let validatedData;

    if (isAdmin) {
      validatedData = sendMessageSchema.parse(body);
    } else {
      validatedData = guestSendMessageSchema.parse(body);
    }

    // Check access to conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: validatedData.conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Validate access
    if (!isAdmin) {
      const isOwner = session?.user?.id === conversation.userId;
      const isGuestOwner = !conversation.userId && request.cookies.get('guest_chat_id')?.value === validatedData.conversationId;

      if (!isOwner && !isGuestOwner) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Determine sender info
    const senderType = isAdmin ? 'admin' : 'customer';
    const senderName = session?.user?.name || (isAdmin ? 'Support' : (body as any).guestName || 'Customer');

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: validatedData.conversationId,
        senderId: session?.user?.id || null,
        senderType,
        senderName,
        content: validatedData.content,
        type: (validatedData as any).type || 'text',
        attachmentUrl: (validatedData as any).attachmentUrl,
        attachmentName: (validatedData as any).attachmentName,
      },
    });

    // Update conversation
    await prisma.chatConversation.update({
      where: { id: validatedData.conversationId },
      data: {
        lastMessage: validatedData.content.substring(0, 200),
        lastMessageAt: new Date(),
        status: isAdmin ? 'active' : conversation.status,
        unreadCount: isAdmin ? conversation.unreadCount : conversation.unreadCount + 1,
        ...(isAdmin ? { assignedTo: session?.user?.id } : {}),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
