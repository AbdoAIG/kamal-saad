/**
 * Tests for Coupons API Routes
 * Tests for discount coupon management and validation
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/coupons/route'
import { POST as ValidatePOST } from '@/app/api/coupons/validate/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the prisma module
jest.mock('@/lib/prisma', () => {
  const { db } = require('../mocks/db.mock')
  return { prisma: db }
})

// Sample test data - use dynamic dates to ensure validity
const now = new Date()
const validFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

const mockCoupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  minOrder: 100,
  maxDiscount: 50,
  usageLimit: 100,
  usageCount: 25,
  validFrom,
  validUntil,
  isActive: true,
  createdAt: validFrom,
  updatedAt: validFrom,
}

const mockFixedCoupon = {
  id: 'coupon-2',
  code: 'FLAT20',
  type: 'fixed',
  value: 20,
  minOrder: null,
  maxDiscount: null,
  usageLimit: null,
  usageCount: 5,
  validFrom,
  validUntil,
  isActive: true,
}

const mockExpiredCoupon = {
  ...mockCoupon,
  id: 'coupon-3',
  code: 'EXPIRED',
  validUntil: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
}

const mockInactiveCoupon = {
  ...mockCoupon,
  id: 'coupon-4',
  code: 'INACTIVE',
  isActive: false,
}

const mockUsageLimitedCoupon = {
  ...mockCoupon,
  id: 'coupon-5',
  code: 'LIMITED',
  usageLimit: 10,
  usageCount: 10, // Reached limit
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

describe('Coupons API - GET /api/coupons', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Validate coupon code', () => {
    it('should return valid coupon by code', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const request = createRequest('http://localhost:3000/api/coupons?code=SAVE10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(true)
      expect(data.coupon.code).toBe('SAVE10')
      expect(data.coupon.type).toBe('percentage')
      expect(data.coupon.value).toBe(10)
    })

    it('should return 404 for invalid coupon code', async () => {
      mocks.coupon.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/coupons?code=INVALID')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid coupon code')
    })

    it('should return error for inactive coupon', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockInactiveCoupon)

      const request = createRequest('http://localhost:3000/api/coupons?code=INACTIVE')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
      expect(data.error).toContain('no longer active')
    })

    it('should return error for expired coupon', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockExpiredCoupon)

      const request = createRequest('http://localhost:3000/api/coupons?code=EXPIRED')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
      expect(data.error).toContain('expired')
    })

    it('should return error for coupon that reached usage limit', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockUsageLimitedCoupon)

      const request = createRequest('http://localhost:3000/api/coupons?code=LIMITED')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
      expect(data.error).toContain('usage limit')
    })

    it('should convert code to uppercase', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const request = createRequest('http://localhost:3000/api/coupons?code=save10')
      await GET(request)

      expect(mocks.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      })
    })
  })

  describe('List all coupons (admin)', () => {
    it('should return all coupons for admin', async () => {
      mocks.coupon.findMany.mockResolvedValue([mockCoupon, mockFixedCoupon])

      const request = createRequest('http://localhost:3000/api/coupons?admin=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
    })
  })

  describe('Error handling', () => {
    it('should return 400 when no parameters provided', async () => {
      const request = createRequest('http://localhost:3000/api/coupons')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required parameters')
    })

    it('should handle database errors gracefully', async () => {
      mocks.coupon.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/coupons?code=SAVE10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Coupons API - POST /api/coupons', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Create coupon', () => {
    it('should create a percentage coupon', async () => {
      mocks.coupon.findUnique.mockResolvedValue(null)
      mocks.coupon.create.mockResolvedValue(mockCoupon)

      const newCoupon = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minOrder: 100,
        maxDiscount: 50,
        usageLimit: 100,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }

      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify(newCoupon),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.code).toBe('SAVE10')
    })

    it('should create a fixed discount coupon', async () => {
      mocks.coupon.findUnique.mockResolvedValue(null)
      mocks.coupon.create.mockResolvedValue(mockFixedCoupon)

      const newCoupon = {
        code: 'FLAT20',
        type: 'fixed',
        value: 20,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }

      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify(newCoupon),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.type).toBe('fixed')
    })

    it('should return 409 when coupon code already exists', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const newCoupon = {
        code: 'SAVE10',
        type: 'percentage',
        value: 15,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }

      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify(newCoupon),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when required fields are missing', async () => {
      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST',
          // Missing type, value, validFrom, validUntil
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 for invalid coupon type', async () => {
      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST',
          type: 'invalid',
          value: 10,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString(),
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid coupon type')
    })

    it('should return 400 for percentage value > 100', async () => {
      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST',
          type: 'percentage',
          value: 150,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString(),
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('between 1 and 100')
    })

    it('should return 400 when validFrom >= validUntil', async () => {
      const request = createRequest('http://localhost:3000/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST',
          type: 'percentage',
          value: 10,
          validFrom: validUntil.toISOString(), // Swapped
          validUntil: validFrom.toISOString(),
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('validFrom must be before validUntil')
    })
  })
})

describe('Coupons API - POST /api/coupons/validate', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Validate and calculate discount', () => {
    it('should calculate percentage discount correctly', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
          cartTotal: 200,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(true)
      expect(data.discount).toBe(20) // 10% of 200
      expect(data.finalTotal).toBe(180)
    })

    it('should calculate fixed discount correctly', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockFixedCoupon)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'FLAT20',
          cartTotal: 100,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.discount).toBe(20)
      expect(data.finalTotal).toBe(80)
    })

    it('should apply max discount cap for percentage coupon', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
          cartTotal: 1000, // 10% = 100, but max is 50
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.discount).toBe(50) // Max discount cap
    })

    it('should not allow discount to exceed cart total', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockFixedCoupon)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'FLAT20',
          cartTotal: 15, // Less than discount
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.discount).toBe(15) // Limited to cart total
      expect(data.finalTotal).toBe(0)
    })

    it('should return error when cart total below minimum', async () => {
      mocks.coupon.findUnique.mockResolvedValue(mockCoupon)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
          cartTotal: 50, // Below minOrder of 100
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
      expect(data.message).toContain('Minimum order')
    })

    it('should return error for invalid coupon code', async () => {
      mocks.coupon.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INVALID',
          cartTotal: 100,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when code is missing', async () => {
      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          cartTotal: 100,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when cartTotal is missing', async () => {
      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when cartTotal is negative', async () => {
      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
          cartTotal: -50,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid cartTotal')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.coupon.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE10',
          cartTotal: 100,
        }),
      })

      const response = await ValidatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
