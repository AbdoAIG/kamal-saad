import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, image } = body;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        image
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}
