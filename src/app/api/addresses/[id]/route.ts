import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to verify address ownership
async function verifyAddressOwnership(addressId: string, userId: string) {
  const address = await db.address.findUnique({
    where: { id: addressId }
  });
  
  if (!address) {
    return { error: 'Address not found', status: 404 };
  }
  
  if (address.userId !== userId) {
    return { error: 'Forbidden', status: 403 };
  }
  
  return { address };
}

// GET - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await verifyAddressOwnership(id, authUser.id);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.address
    });
  } catch (error) {
    console.error('Address fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

// PUT - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await verifyAddressOwnership(id, authUser.id);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { label, fullName, phone, governorate, city, address, landmark, isDefault } = body;

    // If this is set as default, unset default on other addresses
    if (isDefault) {
      await db.address.updateMany({
        where: { 
          userId: authUser.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await db.address.update({
      where: { id },
      data: {
        label,
        fullName,
        phone,
        governorate,
        city,
        address,
        landmark: landmark || null,
        isDefault
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedAddress,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await verifyAddressOwnership(id, authUser.id);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // Check if this was the default address
    const wasDefault = result.address.isDefault;

    // Delete the address
    await db.address.delete({
      where: { id }
    });

    // If deleted address was default, set another address as default
    if (wasDefault) {
      const remainingAddress = await db.address.findFirst({
        where: { userId: authUser.id },
        orderBy: { createdAt: 'desc' }
      });

      if (remainingAddress) {
        await db.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
