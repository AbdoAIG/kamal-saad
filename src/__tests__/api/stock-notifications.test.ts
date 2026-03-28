/**
 * Tests for Stock Notifications API Routes
 * Tests for stock notification subscriptions
 */

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/stock-notifications/route'
import { POST as CheckPOST } from '@/app/api/stock-notifications/check/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

const mockAuth = require('@/auth').auth

// Sample test data
const mockCustomer = {
  id: 'customer-1',
  email: 'customer@example.com',
  name: 'Test Customer',
  role: 'customer',
}

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 100,
  discountPrice: null,
  stock: 0, // Out of stock
  images: '["https://example.com/image.jpg"]',
  category: {
    id: 'category-1',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
  },
}

const mockProductInStock = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 100,
  discountPrice: null,
  stock: 50, // In stock
  images: '["https://example.com/image.jpg"]',
  category: {
    id: 'category-1',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
  },
}

const mockStockNotification = {
  id: 'notification-1',
  userId: 'customer-1',
  productId: 'product-1',
  isNotified: false,
  createdAt: new Date('2024-01-15'),
  product: mockProduct,
  user: {
    id: 'customer-1',
    name: 'Test Customer',
    email: 'customer@example.com',
  },
}

const mockStockNotificationNotified = {
  id: 'notification-2',
  userId: 'customer-1',
  productId: 'product-2',
  isNotified: true,
  createdAt: new Date('2024-01-14'),
  product: { ...mockProduct, id: 'product-2' },
}

// Helper to create mock request
function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

describe('Stock Notifications API - GET /api/stock-notifications', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Fetch user stock notifications', () => {
    it('should return notifications for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.notifications).toHaveLength(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should only return own notifications', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      await GET(createRequest('http://localhost:3000/api/stock-notifications'))

      expect(mocks.stockNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'customer-1',
          }),
        })
      )
    })

    it('should exclude notified by default', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      await GET(createRequest('http://localhost:3000/api/stock-notifications'))

      expect(mocks.stockNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isNotified: false,
          }),
        })
      )
    })

    it('should include notified when requested', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification, mockStockNotificationNotified])

      const request = createRequest('http://localhost:3000/api/stock-notifications?includeNotified=true')
      await GET(request)

      expect(mocks.stockNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'customer-1',
          }),
        })
      )
    })

    it('should include product details', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.notifications[0].product).toBeDefined()
      expect(data.data.notifications[0].product.name).toBe('Test Product')
    })

    it('should parse product images JSON', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data.data.notifications[0].product.images)).toBe(true)
    })

    it('should return count of notifications', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.count).toBe(1)
    })

    it('should return empty array when no notifications', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.notifications).toEqual([])
      expect(data.data.count).toBe(0)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/stock-notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch stock notifications')
    })
  })
})

describe('Stock Notifications API - POST /api/stock-notifications', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Subscribe to stock notification', () => {
    it('should create subscription for out of stock product', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.stockNotification.findUnique.mockResolvedValue(null)
      mocks.stockNotification.create.mockResolvedValue(mockStockNotification)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Successfully subscribed')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 400 for missing productId', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Product ID is required')
    })

    it('should return 404 for non-existent product', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'non-existent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Product not found')
    })

    it('should return 400 for product already in stock', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already in stock')
    })

    it('should return 400 if already subscribed', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.stockNotification.findUnique.mockResolvedValue(mockStockNotification)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Already subscribed')
    })

    it('should renew subscription if previously notified', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.stockNotification.findUnique.mockResolvedValue(mockStockNotificationNotified)
      mocks.stockNotification.update.mockResolvedValue({
        ...mockStockNotificationNotified,
        isNotified: false,
      })

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-2' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('renewed')
      expect(mocks.stockNotification.update).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to subscribe')
    })
  })
})

describe('Stock Notifications API - DELETE /api/stock-notifications', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Unsubscribe from stock notification', () => {
    it('should delete subscription successfully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findUnique.mockResolvedValue(mockStockNotification)
      mocks.stockNotification.delete.mockResolvedValue(mockStockNotification)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'DELETE',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('unsubscribed')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'DELETE',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 400 for missing productId', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'DELETE',
        body: JSON.stringify({}),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Product ID is required')
    })

    it('should return 404 for non-existent subscription', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'DELETE',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.stockNotification.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/stock-notifications', {
        method: 'DELETE',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to unsubscribe')
    })
  })
})

describe('Stock Notifications API - POST /api/stock-notifications/check', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Check and notify users', () => {
    it('should notify users when product is back in stock', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])
      mocks.notification.create.mockResolvedValue({})
      mocks.stockNotification.updateMany.mockResolvedValue({ count: 1 })

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.notifiedCount).toBe(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 400 for missing productId', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Product ID is required')
    })

    it('should return 404 for non-existent product', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'non-existent' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Product not found')
    })

    it('should return 0 notified when product still out of stock', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProduct) // stock: 0

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.notifiedCount).toBe(0)
      expect(data.message).toContain('out of stock')
    })

    it('should return 0 notified when no users waiting', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)
      mocks.stockNotification.findMany.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.notifiedCount).toBe(0)
      expect(data.message).toContain('No users waiting')
    })

    it('should use provided stock quantity', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])
      mocks.notification.create.mockResolvedValue({})
      mocks.stockNotification.updateMany.mockResolvedValue({ count: 1 })

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', stockQuantity: 100 }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.currentStock).toBe(100)
    })

    it('should create notifications for all waiting users', async () => {
      const waitingUsers = [
        { ...mockStockNotification, userId: 'user-1', user: { id: 'user-1', name: 'User 1', email: 'user1@test.com' } },
        { ...mockStockNotification, id: 'notif-2', userId: 'user-2', user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' } },
      ]

      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)
      mocks.stockNotification.findMany.mockResolvedValue(waitingUsers)
      mocks.notification.create.mockResolvedValue({})
      mocks.stockNotification.updateMany.mockResolvedValue({ count: 2 })

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.notifiedCount).toBe(2)
    })

    it('should mark notifications as sent', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockResolvedValue(mockProductInStock)
      mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])
      mocks.notification.create.mockResolvedValue({})
      mocks.stockNotification.updateMany.mockResolvedValue({ count: 1 })

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      await CheckPOST(request)

      expect(mocks.stockNotification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isNotified: true },
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.product.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/stock-notifications/check', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1' }),
      })

      const response = await CheckPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to check and notify')
    })
  })
})

describe('Stock Notifications API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  it('should handle complete stock notification flow', async () => {
    // Step 1: Subscribe to notification for out of stock product
    mockAuth.mockResolvedValue({ user: mockCustomer })
    mocks.product.findUnique.mockResolvedValue(mockProduct)
    mocks.stockNotification.findUnique.mockResolvedValue(null)
    mocks.stockNotification.create.mockResolvedValue(mockStockNotification)

    const subscribeRequest = createRequest('http://localhost:3000/api/stock-notifications', {
      method: 'POST',
      body: JSON.stringify({ productId: 'product-1' }),
    })

    const subscribeResponse = await POST(subscribeRequest)
    const subscribeData = await subscribeResponse.json()

    expect(subscribeResponse.status).toBe(200)
    expect(subscribeData.success).toBe(true)

    // Step 2: Check notifications list
    mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])

    const listRequest = createRequest('http://localhost:3000/api/stock-notifications')
    const listResponse = await GET(listRequest)
    const listData = await listResponse.json()

    expect(listResponse.status).toBe(200)
    expect(listData.data.notifications).toHaveLength(1)

    // Step 3: Product comes back in stock - check and notify
    mocks.product.findUnique.mockResolvedValue(mockProductInStock)
    mocks.stockNotification.findMany.mockResolvedValue([mockStockNotification])
    mocks.notification.create.mockResolvedValue({})
    mocks.stockNotification.updateMany.mockResolvedValue({ count: 1 })

    const checkRequest = createRequest('http://localhost:3000/api/stock-notifications/check', {
      method: 'POST',
      body: JSON.stringify({ productId: 'product-1', stockQuantity: 50 }),
    })

    const checkResponse = await CheckPOST(checkRequest)
    const checkData = await checkResponse.json()

    expect(checkResponse.status).toBe(200)
    expect(checkData.data.notifiedCount).toBe(1)

    // Step 4: Unsubscribe (optional cleanup)
    mocks.stockNotification.findUnique.mockResolvedValue(mockStockNotification)
    mocks.stockNotification.delete.mockResolvedValue(mockStockNotification)

    const unsubscribeRequest = createRequest('http://localhost:3000/api/stock-notifications', {
      method: 'DELETE',
      body: JSON.stringify({ productId: 'product-1' }),
    })

    const unsubscribeResponse = await DELETE(unsubscribeRequest)
    const unsubscribeData = await unsubscribeResponse.json()

    expect(unsubscribeResponse.status).toBe(200)
    expect(unsubscribeData.success).toBe(true)
  })
})
