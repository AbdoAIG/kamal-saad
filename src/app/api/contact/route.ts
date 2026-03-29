import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { contactMessageSchema, replyContactSchema, validateBody } from '@/schemas';

// GET - Get all contact messages (admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new contact message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(contactMessageSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, email, phone, subject, message } = validationResult.data;

    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message
      }
    });

    return NextResponse.json({
      success: true,
      data: contactMessage,
      message: 'تم إرسال رسالتك بنجاح'
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
