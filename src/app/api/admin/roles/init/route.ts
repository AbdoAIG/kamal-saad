import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';
import { DEFAULT_ROLES } from '@/lib/permissions';

// POST - Initialize default roles
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const results = {
      created: [] as string[],
      existing: [] as string[],
      errors: [] as string[],
    };

    for (const roleDef of DEFAULT_ROLES) {
      try {
        // Check if role already exists
        const existing = await db.role.findUnique({
          where: { name: roleDef.name },
        });

        if (existing) {
          // Update existing role permissions
          await db.permission.deleteMany({
            where: { roleId: existing.id },
          });

          if (roleDef.permissions.length > 0) {
            await db.permission.createMany({
              data: roleDef.permissions.map((p) => ({
                roleId: existing.id,
                resource: p.resource,
                action: p.action,
              })),
            });
          }

          results.existing.push(roleDef.name);
        } else {
          // Create new role with permissions
          await db.role.create({
            data: {
              name: roleDef.name,
              nameAr: roleDef.nameAr,
              description: roleDef.description,
              color: roleDef.color,
              isDefault: roleDef.isSystem || false,
              permissions: {
                create: roleDef.permissions.map((p) => ({
                  resource: p.resource,
                  action: p.action,
                })),
              },
            },
          });

          results.created.push(roleDef.name);
        }
      } catch (error) {
        results.errors.push(roleDef.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة الأدوار بنجاح',
      results,
    });
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تهيئة الأدوار' },
      { status: 500 }
    );
  }
}

// GET - Check roles initialization status
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const existingRoles = await db.role.findMany({
      select: { name: true },
    });

    const existingNames = existingRoles.map((r) => r.name);
    const missingRoles = DEFAULT_ROLES.filter(
      (r) => !existingNames.includes(r.name)
    );

    return NextResponse.json({
      success: true,
      initialized: missingRoles.length === 0,
      existingRoles: existingNames,
      missingRoles: missingRoles.map((r) => r.name),
    });
  } catch (error) {
    console.error('Error checking roles status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في التحقق من حالة الأدوار' },
      { status: 500 }
    );
  }
}
