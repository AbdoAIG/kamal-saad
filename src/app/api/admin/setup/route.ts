import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// All permissions for super admin
const ALL_PERMISSIONS = [
  { resource: 'products', action: 'create' },
  { resource: 'products', action: 'read' },
  { resource: 'products', action: 'update' },
  { resource: 'products', action: 'delete' },
  { resource: 'categories', action: 'create' },
  { resource: 'categories', action: 'read' },
  { resource: 'categories', action: 'update' },
  { resource: 'categories', action: 'delete' },
  { resource: 'orders', action: 'read' },
  { resource: 'orders', action: 'update' },
  { resource: 'orders', action: 'delete' },
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },
  { resource: 'roles', action: 'create' },
  { resource: 'roles', action: 'read' },
  { resource: 'roles', action: 'update' },
  { resource: 'roles', action: 'delete' },
  { resource: 'coupons', action: 'create' },
  { resource: 'coupons', action: 'read' },
  { resource: 'coupons', action: 'update' },
  { resource: 'coupons', action: 'delete' },
  { resource: 'banners', action: 'create' },
  { resource: 'banners', action: 'read' },
  { resource: 'banners', action: 'update' },
  { resource: 'banners', action: 'delete' },
  { resource: 'reports', action: 'read' },
  { resource: 'reports', action: 'export' },
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'update' },
  { resource: 'notifications', action: 'create' },
  { resource: 'notifications', action: 'read' },
  { resource: 'notifications', action: 'update' },
  { resource: 'notifications', action: 'delete' },
  { resource: 'reviews', action: 'read' },
  { resource: 'reviews', action: 'update' },
  { resource: 'reviews', action: 'delete' },
  { resource: 'returns', action: 'read' },
  { resource: 'returns', action: 'update' },
  { resource: 'contacts', action: 'read' },
  { resource: 'contacts', action: 'update' },
];

// Default super admin credentials
const DEFAULT_EMAIL = 'adminkms@abdoaig';
const DEFAULT_PASSWORD = 'admin318';
const DEFAULT_NAME = 'Super Admin';

async function createSuperAdmin(email: string, password: string, name: string) {
  console.log('[Setup] Creating super admin...');
  
  // 1. Delete all existing admin users (admin + super_admin)
  const deletedUsers = await db.user.deleteMany({
    where: {
      OR: [
        { role: 'admin' },
        { role: 'super_admin' },
      ]
    }
  });
  console.log('[Setup] Deleted old admin users:', deletedUsers.count);

  // 2. Delete existing super_admin role
  await db.role.deleteMany({
    where: { name: 'super_admin' }
  });

  // 3. Create super_admin role with all permissions
  const superAdminRole = await db.role.create({
    data: {
      name: 'super_admin',
      nameAr: 'مدير عام',
      description: 'Super Administrator with full access',
      color: '#dc2626',
      isDefault: false,
      isActive: true,
      permissions: {
        create: ALL_PERMISSIONS
      }
    }
  });
  console.log('[Setup] Created super_admin role:', superAdminRole.id);

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 5. Create super admin user
  const superAdmin = await db.user.create({
    data: {
      email: email,
      name: name,
      password: hashedPassword,
      role: 'super_admin',
      roleId: superAdminRole.id,
      emailVerified: new Date(),
      isActive: true,
    }
  });
  console.log('[Setup] Created super admin user:', superAdmin.id);

  // 6. Create regular admin role if not exists
  const existingAdminRole = await db.role.findUnique({
    where: { name: 'admin' }
  });

  if (!existingAdminRole) {
    await db.role.create({
      data: {
        name: 'admin',
        nameAr: 'مدير',
        description: 'Administrator with limited access',
        color: '#2563eb',
        isDefault: false,
        isActive: true,
        permissions: {
          create: [
            { resource: 'products', action: 'create' },
            { resource: 'products', action: 'read' },
            { resource: 'products', action: 'update' },
            { resource: 'categories', action: 'read' },
            { resource: 'orders', action: 'read' },
            { resource: 'orders', action: 'update' },
            { resource: 'users', action: 'read' },
            { resource: 'coupons', action: 'read' },
            { resource: 'banners', action: 'read' },
            { resource: 'reports', action: 'read' },
          ]
        }
      }
    });
    console.log('[Setup] Created admin role');
  }

  return superAdmin;
}

// GET - Easy setup via browser URL
export async function GET() {
  try {
    console.log('[Setup] Starting via GET...');
    
    const superAdmin = await createSuperAdmin(DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_NAME);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب المدير العام بنجاح!',
      credentials: {
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      },
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      }
    });

  } catch (error: any) {
    console.error('[Setup] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'فشل في إنشاء حساب المدير' 
    }, { status: 500 });
  }
}

// POST - Custom credentials
export async function POST(request: Request) {
  try {
    console.log('[Setup] Starting via POST...');
    
    const body = await request.json().catch(() => ({}));
    const email = body.email || DEFAULT_EMAIL;
    const password = body.password || DEFAULT_PASSWORD;
    const name = body.name || DEFAULT_NAME;

    const superAdmin = await createSuperAdmin(email, password, name);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب المدير العام بنجاح',
      credentials: {
        email: email,
        password: password,
      },
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      }
    });

  } catch (error: any) {
    console.error('[Setup] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'فشل في إنشاء حساب المدير' 
    }, { status: 500 });
  }
}
