import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Check if Partner table exists and is usable
async function dbAvailable(): Promise<boolean> {
  try {
    await db.partner?.count();
    return true;
  } catch {
    return false;
  }
}

// PUT - Update a partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, logo, url, order, active } = body;

    if (await dbAvailable()) {
      const partner = await db.partner!.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(nameAr !== undefined && { nameAr }),
          ...(logo && { logo }),
          ...(url !== undefined && { url: url || null }),
          ...(order !== undefined && { order }),
          ...(active !== undefined && { active }),
        },
      });
      return NextResponse.json({ success: true, data: partner });
    }

    return NextResponse.json(
      { success: false, error: 'جدول الشركاء غير موجود في قاعدة البيانات. يرجى تشغيل prisma db push أولاً.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (await dbAvailable()) {
      await db.partner!.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'تم حذف الشريك بنجاح' });
    }

    return NextResponse.json(
      { success: false, error: 'جدول الشركاء غير موجود في قاعدة البيانات. يرجى تشغيل prisma db push أولاً.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}
