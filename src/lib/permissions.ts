/**
 * Advanced Permissions System Configuration
 *
 * Resources: The entities that can be accessed (products, orders, customers, etc.)
 * Actions: What can be done with resources (view, create, update, delete)
 * Roles: Named sets of permissions
 */

// All available resources in the system
export const RESOURCES = {
  // Core Resources
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  REVIEWS: 'reviews',

  // Content
  BANNERS: 'banners',
  COUPONS: 'coupons',

  // Settings
  SETTINGS: 'settings',
  ROLES: 'roles',
  USERS: 'users',

  // Analytics
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',

  // Financial
  PAYMENTS: 'payments',
  RETURNS: 'returns',

  // System
  DASHBOARD: 'dashboard',
  LOGS: 'logs',
} as const

// All available actions
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  MANAGE: 'manage', // Full access
} as const

export type Resource = typeof RESOURCES[keyof typeof RESOURCES]
export type Action = typeof ACTIONS[keyof typeof ACTIONS]

// Permission definition
export interface Permission {
  resource: Resource
  action: Action
}

// Role definition with permissions
export interface RoleDefinition {
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  color: string
  permissions: Permission[]
  isSystem?: boolean // Cannot be deleted
}

// Default roles with their permissions
export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'super_admin',
    nameAr: 'مدير عام',
    description: 'Full system access with all permissions',
    descriptionAr: 'صلاحيات كاملة على النظام',
    color: '#ef4444',
    isSystem: true,
    permissions: [
      // Super admin has all permissions - handled specially in code
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.MANAGE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.MANAGE },
      { resource: RESOURCES.ORDERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.CUSTOMERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.REVIEWS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.BANNERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.COUPONS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.SETTINGS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.ROLES, action: ACTIONS.MANAGE },
      { resource: RESOURCES.USERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.REPORTS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.NOTIFICATIONS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.PAYMENTS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.RETURNS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.LOGS, action: ACTIONS.MANAGE },
    ],
  },
  {
    name: 'admin',
    nameAr: 'مدير',
    description: 'Standard admin with most permissions except system settings',
    descriptionAr: 'مدير عادي مع معظم الصلاحيات ما عدا إعدادات النظام',
    color: '#6366f1',
    isSystem: true,
    permissions: [
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.CREATE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.UPDATE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.DELETE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.IMPORT },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.VIEW },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.CREATE },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.UPDATE },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.DELETE },
      { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.ORDERS, action: ACTIONS.UPDATE },
      { resource: RESOURCES.ORDERS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.CUSTOMERS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.REVIEWS, action: ACTIONS.VIEW },
      { resource: RESOURCES.REVIEWS, action: ACTIONS.APPROVE },
      { resource: RESOURCES.REVIEWS, action: ACTIONS.DELETE },
      { resource: RESOURCES.BANNERS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.COUPONS, action: ACTIONS.MANAGE },
      { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
      { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.NOTIFICATIONS, action: ACTIONS.VIEW },
      { resource: RESOURCES.PAYMENTS, action: ACTIONS.VIEW },
      { resource: RESOURCES.RETURNS, action: ACTIONS.VIEW },
      { resource: RESOURCES.RETURNS, action: ACTIONS.UPDATE },
    ],
  },
  {
    name: 'products_manager',
    nameAr: 'مدير المنتجات',
    description: 'Can manage products and categories only',
    descriptionAr: 'يدير المنتجات والفئات فقط',
    color: '#10b981',
    permissions: [
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.CREATE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.UPDATE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.DELETE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.IMPORT },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.VIEW },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.CREATE },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.UPDATE },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.DELETE },
    ],
  },
  {
    name: 'orders_manager',
    nameAr: 'مدير الطلبات',
    description: 'Can manage orders and view customers',
    descriptionAr: 'يدير الطلبات وعرض العملاء',
    color: '#f59e0b',
    permissions: [
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW },
      { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.ORDERS, action: ACTIONS.UPDATE },
      { resource: RESOURCES.ORDERS, action: ACTIONS.EXPORT },
      { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.RETURNS, action: ACTIONS.VIEW },
      { resource: RESOURCES.RETURNS, action: ACTIONS.UPDATE },
    ],
  },
  {
    name: 'viewer',
    nameAr: 'مشاهد',
    description: 'Read-only access to most resources',
    descriptionAr: 'صلاحيات قراءة فقط لمعظم الموارد',
    color: '#6b7280',
    permissions: [
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.VIEW },
      { resource: RESOURCES.CATEGORIES, action: ACTIONS.VIEW },
      { resource: RESOURCES.ORDERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.CUSTOMERS, action: ACTIONS.VIEW },
      { resource: RESOURCES.REPORTS, action: ACTIONS.VIEW },
    ],
  },
]

// Resource labels for UI
export const RESOURCE_LABELS: Record<Resource, { en: string; ar: string }> = {
  [RESOURCES.DASHBOARD]: { en: 'Dashboard', ar: 'لوحة التحكم' },
  [RESOURCES.PRODUCTS]: { en: 'Products', ar: 'المنتجات' },
  [RESOURCES.CATEGORIES]: { en: 'Categories', ar: 'الفئات' },
  [RESOURCES.ORDERS]: { en: 'Orders', ar: 'الطلبات' },
  [RESOURCES.CUSTOMERS]: { en: 'Customers', ar: 'العملاء' },
  [RESOURCES.REVIEWS]: { en: 'Reviews', ar: 'التقييمات' },
  [RESOURCES.BANNERS]: { en: 'Banners', ar: 'البنرات' },
  [RESOURCES.COUPONS]: { en: 'Coupons', ar: 'الكوبونات' },
  [RESOURCES.SETTINGS]: { en: 'Settings', ar: 'الإعدادات' },
  [RESOURCES.ROLES]: { en: 'Roles & Permissions', ar: 'الأدوار والصلاحيات' },
  [RESOURCES.USERS]: { en: 'Users', ar: 'المستخدمين' },
  [RESOURCES.REPORTS]: { en: 'Reports', ar: 'التقارير' },
  [RESOURCES.NOTIFICATIONS]: { en: 'Notifications', ar: 'الإشعارات' },
  [RESOURCES.PAYMENTS]: { en: 'Payments', ar: 'المدفوعات' },
  [RESOURCES.RETURNS]: { en: 'Returns', ar: 'المرتجعات' },
  [RESOURCES.LOGS]: { en: 'System Logs', ar: 'سجلات النظام' },
}

// Action labels for UI
export const ACTION_LABELS: Record<Action, { en: string; ar: string }> = {
  [ACTIONS.VIEW]: { en: 'View', ar: 'عرض' },
  [ACTIONS.CREATE]: { en: 'Create', ar: 'إنشاء' },
  [ACTIONS.UPDATE]: { en: 'Update', ar: 'تعديل' },
  [ACTIONS.DELETE]: { en: 'Delete', ar: 'حذف' },
  [ACTIONS.EXPORT]: { en: 'Export', ar: 'تصدير' },
  [ACTIONS.IMPORT]: { en: 'Import', ar: 'استيراد' },
  [ACTIONS.APPROVE]: { en: 'Approve', ar: 'موافقة' },
  [ACTIONS.MANAGE]: { en: 'Full Access', ar: 'صلاحية كاملة' },
}

/**
 * Check if a permission implies another permission
 * For example, MANAGE implies all other actions
 */
export function permissionImplies(
  userPermission: Permission,
  requiredPermission: Permission
): boolean {
  // Same resource and action
  if (
    userPermission.resource === requiredPermission.resource &&
    userPermission.action === requiredPermission.action
  ) {
    return true
  }

  // MANAGE action implies all other actions for the same resource
  if (
    userPermission.resource === requiredPermission.resource &&
    userPermission.action === ACTIONS.MANAGE
  ) {
    return true
  }

  return false
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.some((up) =>
    permissionImplies(up, requiredPermission)
  )
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((rp) => hasPermission(userPermissions, rp))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((rp) => hasPermission(userPermissions, rp))
}
