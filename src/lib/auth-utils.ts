import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import {
  Resource,
  Action,
  hasPermission,
  RESOURCES,
  ACTIONS,
} from '@/lib/permissions'

// Admin roles that have access to admin panel
const ADMIN_ROLES = ['admin', 'super_admin']

// Permission type for user
interface UserPermission {
  resource: string
  action: string
}

// Interface for authenticated user
export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  roleId?: string | null
  permissions?: UserPermission[]
}

// Interface for auth result
export type AuthResult =
  | { user: AuthUser }
  | { error: NextResponse }

/**
 * Get the current authenticated user from session
 */
export async function getAuthUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get session from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return null
    }

    // Find session and user
    const session = await db.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            roleId: true,
            roleData: {
              include: {
                permissions: {
                  select: {
                    resource: true,
                    action: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!session || !session.user) {
      // Invalid session - try to clean up
      try {
        await db.session.deleteMany({
          where: { sessionToken },
        })
      } catch (e) {
        // Ignore
      }
      return null
    }

    // Check if session expired
    if (new Date(session.expires) < new Date()) {
      // Session expired - clean up
      try {
        await db.session.delete({
          where: { id: session.id },
        })
      } catch (e) {
        // Ignore
      }
      return null
    }

    // Build user object with permissions
    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      isActive: session.user.isActive,
      roleId: session.user.roleId,
      permissions: session.user.roleData?.permissions || [],
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  if (!user.isActive) return false
  return ADMIN_ROLES.includes(user.role)
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  if (!user.isActive) return false
  return user.role === 'super_admin'
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(
  user: AuthUser | null,
  resource: Resource,
  action: Action
): boolean {
  if (!user || !user.isActive) return false

  // Super admin has all permissions
  if (user.role === 'super_admin') return true

  // Check if user has the permission in their role
  if (user.permissions && user.permissions.length > 0) {
    return hasPermission(
      user.permissions.map(p => ({ resource: p.resource as Resource, action: p.action as Action })),
      { resource, action }
    )
  }

  // Fallback: admin role has most permissions
  if (user.role === 'admin') {
    // Admin cannot manage roles, users, settings, logs
    const adminRestricted = [
      { resource: RESOURCES.ROLES, action: ACTIONS.MANAGE },
      { resource: RESOURCES.USERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.SETTINGS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.LOGS, action: ACTIONS.MANAGE },
    ]

    const isRestricted = adminRestricted.some(
      (rp) => rp.resource === resource && (rp.action === action || rp.action === ACTIONS.MANAGE)
    )

    return !isRestricted
  }

  return false
}

/**
 * Middleware helper - Require admin authentication
 * Returns user if authenticated admin, or error response
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        { success: false, error: 'الحساب غير مفعل', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      ),
    }
  }

  if (!isAdmin(user)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - صلاحيات الأدمن مطلوبة', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Middleware helper - Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  resource: Resource,
  action: Action
): Promise<AuthResult> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        { success: false, error: 'الحساب غير مفعل', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      ),
    }
  }

  if (!userHasPermission(user, resource, action)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'غير مصرح - لا تملك صلاحية لهذا الإجراء',
          code: 'FORBIDDEN',
          required: { resource, action },
        },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Middleware helper - Require super admin authentication
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        { success: false, error: 'الحساب غير مفعل', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      ),
    }
  }

  if (!isSuperAdmin(user)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - صلاحيات السوبر أدمن مطلوبة', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Require user authentication (any role)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        { success: false, error: 'الحساب غير مفعل', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Optional authentication - returns user if logged in, null otherwise
 */
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(request)
}
