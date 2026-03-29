import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';
import { DEFAULT_ROLES, RESOURCES, ACTIONS } from '@/lib/permissions';

// GET - List all roles with their permissions
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const roles = await db.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      roles: roles.map((role) => ({
        ...role,
        userCount: role._count.users,
      })),
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الأدوار' },
      { status: 500 }
    );
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { name, nameAr, description, descriptionAr, color, permissions } = body;

    if (!name || !nameAr) {
      return NextResponse.json(
        { success: false, error: 'اسم الدور مطلوب' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existing = await db.role.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'اسم الدور موجود بالفعل' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await db.role.create({
      data: {
        name,
        nameAr,
        description: description || null,
        color: color || '#6366f1',
        permissions: {
          create: permissions?.map((p: { resource: string; action: string }) => ({
            resource: p.resource,
            action: p.action,
          })) || [],
        },
      },
      include: {
        permissions: true,
      },
    });

    return NextResponse.json({
      success: true,
      role,
      message: 'تم إنشاء الدور بنجاح',
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الدور' },
      { status: 500 }
    );
  }
}

// PUT - Update a role
export async function PUT(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { id, name, nameAr, description, color, isActive, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الدور مطلوب' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existing = await db.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Prevent modifying system roles' name
    const isSystemRole = DEFAULT_ROLES.some((r) => r.name === existing.name);
    if (isSystemRole && name && name !== existing.name) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تغيير اسم دور النظام' },
        { status: 400 }
      );
    }

    // Update role
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (nameAr) updateData.nameAr = nameAr;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await db.permission.deleteMany({
        where: { roleId: id },
      });

      // Create new permissions
      if (permissions.length > 0) {
        await db.permission.createMany({
          data: permissions.map((p: { resource: string; action: string }) => ({
            roleId: id,
            resource: p.resource,
            action: p.action,
          })),
        });
      }
    }

    const role = await db.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: true,
      },
    });

    return NextResponse.json({
      success: true,
      role,
      message: 'تم تحديث الدور بنجاح',
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الدور' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a role
export async function DELETE(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الدور مطلوب' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existing = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Prevent deleting system roles
    const isSystemRole = DEFAULT_ROLES.some((r) => r.name === existing.name);
    if (isSystemRole) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف أدوار النظام' },
        { status: 400 }
      );
    }

    // Prevent deleting role with users
    if (existing._count.users > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `لا يمكن حذف الدور لأنه مستخدم من قبل ${existing._count.users} مستخدم`,
        },
        { status: 400 }
      );
    }

    // Delete role (permissions will be cascade deleted)
    await db.role.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدور بنجاح',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الدور' },
      { status: 500 }
    );
  }
}
