import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all addresses for authenticated user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Addresses fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST - Create new address
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
    const { label, fullName, phone, governorate, city, address, landmark, isDefault } = body;

    // Validate required fields
    if (!label || !fullName || !phone || !governorate || !city || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set as default, unset default on other addresses
    if (isDefault) {
      await db.address.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }

    // Check if this is the user's first address - make it default automatically
    const existingAddressCount = await db.address.count({
      where: { userId: session.user.id }
    });

    const newAddress = await db.address.create({
      data: {
        userId: session.user.id,
        label,
        fullName,
        phone,
        governorate,
        city,
        address,
        landmark: landmark || null,
        isDefault: isDefault || existingAddressCount === 0
      }
    });

    return NextResponse.json({
      success: true,
      data: newAddress,
      message: 'Address created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Address create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
