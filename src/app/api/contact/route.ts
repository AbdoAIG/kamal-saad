import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET - Get all contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is admin
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page

    // Build where clause
    const where: { status?: string } = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.contactMessage.count({ where });

    // Get messages with pagination
    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    });

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error('Contact messages fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}

// POST - Submit contact message (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (email.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: 'Email must be less than 255 characters' },
        { status: 400 }
      );
    }

    if (phone && phone.trim().length > 20) {
      return NextResponse.json(
        { success: false, error: 'Phone must be less than 20 characters' },
        { status: 400 }
      );
    }

    if (subject && subject.trim().length > 200) {
      return NextResponse.json(
        { success: false, error: 'Subject must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      data: contactMessage,
      message: 'Your message has been submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Contact message create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact message' },
      { status: 500 }
    );
  }
}
