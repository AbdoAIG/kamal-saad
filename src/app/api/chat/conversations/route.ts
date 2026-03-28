import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema for creating a new conversation
const createConversationSchema = z.object({
  guestName: z.string().min(2).max(100).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
});

// GET - List conversations (Admin) or Get user's conversation (Customer)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check if user is admin
    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

    if (isAdmin) {
      // Admin: List all conversations with filters
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      const [conversations, total] = await Promise.all([
        prisma.chatConversation.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { messages: true },
            },
          },
          orderBy: [
            { status: 'asc' },
            { lastMessageAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.chatConversation.count({ where }),
      ]);

      // Get counts by status
      const statusCounts = await prisma.chatConversation.groupBy({
        by: ['status'],
        _count: true,
      });

      return NextResponse.json({
        conversations,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      });
    } else if (session?.user?.id) {
      // Customer: Get their own conversations
      const conversations = await prisma.chatConversation.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return NextResponse.json({ conversations });
    } else {
      // Guest: Check for guest session
      const guestId = request.cookies.get('guest_chat_id')?.value;

      if (guestId) {
        const conversations = await prisma.chatConversation.findMany({
          where: {
            id: guestId,
            userId: null,
          },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        });

        return NextResponse.json({ conversations });
      }

      return NextResponse.json({ conversations: [] });
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const validatedData = createConversationSchema.parse(body);

    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: session?.user?.id || null,
        guestName: !session?.user ? validatedData.guestName : null,
        guestEmail: !session?.user ? validatedData.guestEmail : null,
        guestPhone: !session?.user ? validatedData.guestPhone : null,
        subject: validatedData.subject,
        status: 'waiting',
        lastMessage: validatedData.message.substring(0, 200),
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: session?.user?.id || null,
            senderType: 'customer',
            senderName: session?.user?.name || validatedData.guestName || 'Guest',
            content: validatedData.message,
            type: 'text',
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Set guest cookie if not logged in
    const response = NextResponse.json(conversation);
    if (!session?.user?.id) {
      response.cookies.set('guest_chat_id', conversation.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
