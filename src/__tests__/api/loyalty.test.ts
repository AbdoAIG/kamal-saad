/**
 * Tests for Loyalty API Routes
 * Tests for loyalty points management and redemption
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/loyalty/route'
import { POST } from '@/app/api/loyalty/redeem/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the prisma module
jest.mock('@/lib/prisma', () => {
  const { db } = require('../mocks/db.mock')
  return { prisma: db }
})

// Mock loyalty library
const mockGetLoyaltySummary = jest.fn()
const mockRedeemPoints = jest.fn()

jest.mock('@/lib/loyalty', () => ({
  getLoyaltySummary: () => mockGetLoyaltySummary(),
  redeemPoints: (userId: string, points: number, orderId: string) => 
    mockRedeemPoints(userId, points, orderId),
  POINTS_TO_EGP_RATE: 0.1,
}))

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  loyaltyPoints: 500,
}

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'pending',
  total: 200,
  discount: 0,
  pointsUsed: 0,
}

const mockLoyaltySummary = {
  totalPoints: 500,
  monetaryValue: 50,
  pendingPoints: 50,
  expiringPoints: 0,
}

const mockLoyaltyHistory = [
  {
    id: 'history-1',
    userId: 'user-1',
    points: 100,
    type: 'earn',
    reason: 'Order #12345',
    orderId: 'order-1',
    createdAt: new Date('2024-01-01'),
    order: {
      id: 'order-1',
      status: 'delivered',
      total: 1000,
    },
  },
]

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

describe('Loyalty API - GET /api/loyalty', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Fetch loyalty data', () => {
    it('should return loyalty summary for user', async () => {
      mockGetLoyaltySummary.mockResolvedValue({
        success: true,
        data: mockLoyaltySummary,
      })
      mocks.loyaltyHistory.findMany.mockResolvedValue(mockLoyaltyHistory)

      const request = createRequest('http://localhost:3000/api/loyalty?userId=user-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 when userId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/loyalty')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('User ID is required')
    })

    it('should return 404 when user not found', async () => {
      mockGetLoyaltySummary.mockResolvedValue({
        success: false,
        error: 'User not found',
      })

      const request = createRequest('http://localhost:3000/api/loyalty?userId=non-existent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})

describe('Loyalty API - POST /api/loyalty/redeem', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Redeem points', () => {
    it('should redeem points successfully', async () => {
      mocks.order.findUnique.mockResolvedValue(mockOrder)
      mocks.user.findUnique.mockResolvedValue(mockUser)
      mockRedeemPoints.mockResolvedValue({
        success: true,
        discount: 10,
        newBalance: 400,
      })
      mocks.order.findUnique.mockResolvedValue(mockOrder)

      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          points: 100,
          orderId: 'order-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 when userId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          points: 100,
          orderId: 'order-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('User ID is required')
    })

    it('should return 400 when points is invalid', async () => {
      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          points: 0,
          orderId: 'order-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Valid points amount is required')
    })

    it('should return 400 when orderId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          points: 100,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Order ID is required')
    })

    it('should return 404 when order not found', async () => {
      mocks.order.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          points: 100,
          orderId: 'non-existent',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Order not found')
    })

    it('should return 403 when order belongs to another user', async () => {
      mocks.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-user',
      })

      const request = createRequest('http://localhost:3000/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          points: 100,
          orderId: 'order-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('does not belong')
    })
  })
})
