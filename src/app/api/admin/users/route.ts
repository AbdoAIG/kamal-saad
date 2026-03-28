import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-utils';

// GET - List all users with their roles
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const users = await db.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' },
          { roleId: { not: null } }
        ]
      },
      include: {
        roleData: {
          include: {
            permissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        roleData: user.roleData,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - Create a new admin user
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  // Only super_admin can create new admin users
  if (authResult.user.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'ليس لديك صلاحية لإنشاء مستخدمين جدد' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, phone, roleId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role based on roleId or default to 'admin'
    let userRole = 'admin';
    if (roleId) {
      const role = await db.role.findUnique({ where: { id: roleId } });
      if (role) {
        userRole = role.name;
      }
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
        role: userRole,
        roleId: roleId || null,
        emailVerified: new Date(),
        isActive: true,
      },
      include: {
        roleData: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        roleData: user.roleData,
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  // Only super_admin can update admin users
  if (authResult.user.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'ليس لديك صلاحية لتعديل المستخدمين' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, name, phone, roleId, isActive, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Prevent modifying super_admin
    if (existingUser.role === 'super_admin' && authResult.user.id !== id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل السوبر أدمن' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (roleId !== undefined) {
      updateData.roleId = roleId;
      // Update role name based on roleId
      if (roleId) {
        const role = await db.role.findUnique({ where: { id: roleId } });
        if (role) {
          updateData.role = role.name;
        }
      }
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        roleData: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        roleData: user.roleData,
        isActive: user.isActive,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  // Only super_admin can delete admin users
  if (authResult.user.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'ليس لديك صلاحية لحذف المستخدمين' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Prevent deleting super_admin
    if (existingUser.role === 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف السوبر أدمن' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (existingUser.id === authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 403 }
      );
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    );
  }
}
