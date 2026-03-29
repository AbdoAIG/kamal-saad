// Mock Prisma client for testing
import { jest } from '@jest/globals'

// Create mock functions for all models
const mockProduct = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockCategory = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockUser = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  groupBy: jest.fn(),
  deleteMany: jest.fn(),
}

const mockOrder = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockReview = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockCoupon = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockBanner = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockNotification = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
}

const mockCart = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockCartItem = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockOrderItem = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  groupBy: jest.fn(),
}

const mockAddress = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockLoyaltyHistory = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockReturn = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockReturnItem = {
  findMany: jest.fn(),
  create: jest.fn(),
}

const mockSiteSetting = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
}

const mockStockNotification = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
}

const mockContactMessage = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
}

const mockSession = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockRole = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
}

const mockPermission = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
}

// Mock $queryRaw and $executeRaw for raw SQL queries
const mockQueryRaw = jest.fn()
const mockExecuteRaw = jest.fn()

// Mock the db export
export const db = {
  product: mockProduct,
  category: mockCategory,
  user: mockUser,
  order: mockOrder,
  orderItem: mockOrderItem,
  review: mockReview,
  coupon: mockCoupon,
  banner: mockBanner,
  notification: mockNotification,
  cart: mockCart,
  cartItem: mockCartItem,
  address: mockAddress,
  loyaltyHistory: mockLoyaltyHistory,
  return: mockReturn,
  returnItem: mockReturnItem,
  siteSetting: mockSiteSetting,
  stockNotification: mockStockNotification,
  contactMessage: mockContactMessage,
  session: mockSession,
  role: mockRole,
  permission: mockPermission,
  $queryRaw: mockQueryRaw,
  $executeRaw: mockExecuteRaw,
  $queryRawUnsafe: mockQueryRaw,
}

// Export mocks for individual access in tests
export const mocks = {
  product: mockProduct,
  category: mockCategory,
  user: mockUser,
  order: mockOrder,
  orderItem: mockOrderItem,
  review: mockReview,
  coupon: mockCoupon,
  banner: mockBanner,
  notification: mockNotification,
  cart: mockCart,
  cartItem: mockCartItem,
  address: mockAddress,
  loyaltyHistory: mockLoyaltyHistory,
  return: mockReturn,
  returnItem: mockReturnItem,
  siteSetting: mockSiteSetting,
  stockNotification: mockStockNotification,
  contactMessage: mockContactMessage,
  session: mockSession,
  role: mockRole,
  permission: mockPermission,
  $queryRaw: mockQueryRaw,
  $executeRaw: mockExecuteRaw,
}

// Helper to reset all mocks
export function resetAllMocks() {
  Object.values(mocks).forEach((modelMocks) => {
    Object.values(modelMocks).forEach((mock) => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        mock.mockClear()
      }
    })
  })
}
