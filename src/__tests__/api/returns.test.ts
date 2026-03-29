/**
 * Tests for Returns API Routes
 * Tests for return request management
 */

import { NextRequest } from 'next/server'
import { GET as ReturnsGET, POST as ReturnsPOST } from '@/app/api/returns/route'
import { GET as ReturnByIdGET, PUT as ReturnByIdPUT } from '@/app/api/returns/[id]/route'
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
  phone: '+20123456789',
  role: 'customer',
}

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

const mockOrder = {
  id: 'order-1',
  userId: 'customer-1',
  status: 'delivered',
  total: 500,
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      price: 200,
    },
  ],
}

const mockReturn = {
  id: 'return-1',
  orderId: 'order-1',
  userId: 'customer-1',
  type: 'return',
  reason: 'Product damaged',
  description: 'Item arrived with scratches',
  status: 'pending',
  refundAmount: null,
  refundMethod: null,
  adminNotes: null,
  createdAt: new Date('2024-01-15'),
  user: {
    id: 'customer-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+20123456789',
  },
  order: {
    id: 'order-1',
    status: 'delivered',
    total: 500,
    createdAt: new Date('2024-01-10'),
    items: [],
  },
  items: [
    {
      id: 'return-item-1',
      productId: 'product-1',
      productName: 'Test Product',
      quantity: 1,
      price: 200,
    },
  ],
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

describe('Returns API - GET /api/returns', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Fetch returns for customer', () => {
    it('should return returns for authenticated customer', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      const request = createRequest('http://localhost:3000/api/returns')
      const response = await ReturnsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns')
      const response = await ReturnsGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should only return own returns for customer', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      await ReturnsGET(createRequest('http://localhost:3000/api/returns'))

      expect(mocks.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'customer-1',
          }),
        })
      )
    })

    it('should filter returns by status', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      const request = createRequest('http://localhost:3000/api/returns?status=pending')
      await ReturnsGET(request)

      expect(mocks.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pending',
          }),
        })
      )
    })

    it('should filter returns by type', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      const request = createRequest('http://localhost:3000/api/returns?type=return')
      await ReturnsGET(request)

      expect(mocks.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'return',
          }),
        })
      )
    })
  })

  describe('Fetch returns for admin', () => {
    it('should return all returns for admin', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      const request = createRequest('http://localhost:3000/api/returns')
      const response = await ReturnsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should allow admin to filter by userId', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findMany.mockResolvedValue([mockReturn])

      const request = createRequest('http://localhost:3000/api/returns?userId=customer-1')
      await ReturnsGET(request)

      expect(mocks.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'customer-1',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/returns')
      const response = await ReturnsGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch returns')
    })
  })
})

describe('Returns API - POST /api/returns', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Create return request', () => {
    it('should create return request with valid data', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue(mockOrder)
      mocks.return.findFirst.mockResolvedValue(null)
      mocks.return.create.mockResolvedValue(mockReturn)
      mocks.user.findMany.mockResolvedValue([])

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Product damaged',
        items: [
          { productId: 'product-1', productName: 'Test Product', quantity: 1, price: 200 },
        ],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-1' }),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-1' }),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 for invalid type', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const returnData = {
        orderId: 'order-1',
        type: 'invalid_type',
        reason: 'Test',
        items: [{ productId: 'p1', productName: 'Test', quantity: 1, price: 100 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid type')
    })

    it('should return 404 for non-existent order', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue(null)

      const returnData = {
        orderId: 'non-existent',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'p1', productName: 'Test', quantity: 1, price: 100 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Order not found')
    })

    it('should return 403 for order belonging to different user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'customer' } })
      mocks.order.findUnique.mockResolvedValue(mockOrder)

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'p1', productName: 'Test', quantity: 1, price: 100 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('own orders')
    })

    it('should return 400 for order not eligible for return', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'pending' })

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'p1', productName: 'Test', quantity: 1, price: 100 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not eligible for return')
    })

    it('should return 400 if pending return already exists', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue(mockOrder)
      mocks.return.findFirst.mockResolvedValue(mockReturn)

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'product-1', productName: 'Test Product', quantity: 1, price: 200 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })

    it('should validate item quantity against order', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue(mockOrder)

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'product-1', productName: 'Test', quantity: 10, price: 100 }], // more than ordered
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('more items than ordered')
    })

    it('should create notification for admins', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockResolvedValue(mockOrder)
      mocks.return.findFirst.mockResolvedValue(null)
      mocks.return.create.mockResolvedValue(mockReturn)
      mocks.user.findMany.mockResolvedValue([mockAdmin])
      mocks.notification.createMany.mockResolvedValue({ count: 1 })

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Product damaged',
        items: [
          { productId: 'product-1', productName: 'Test Product', quantity: 1, price: 200 },
        ],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      await ReturnsPOST(request)

      expect(mocks.notification.createMany).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.order.findUnique.mockRejectedValue(new Error('Database error'))

      const returnData = {
        orderId: 'order-1',
        type: 'return',
        reason: 'Test',
        items: [{ productId: 'product-1', productName: 'Test', quantity: 1, price: 100 }],
      }

      const request = createRequest('http://localhost:3000/api/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      })

      const response = await ReturnsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Returns API - GET /api/returns/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Fetch single return', () => {
    it('should return return by ID for owner', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1')
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('return-1')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns/return-1')
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 404 for non-existent return', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 403 for different user accessing return', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'customer' } })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1')
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Access denied')
    })

    it('should allow admin to access any return', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1')
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })
      mocks.return.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/returns/return-1')
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch return request')
    })
  })
})

describe('Returns API - PUT /api/returns/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Update return status (admin only)', () => {
    it('should update return status as admin', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)
      mocks.return.update.mockResolvedValue({
        ...mockReturn,
        status: 'approved',
      })
      mocks.notification.create.mockResolvedValue({})

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Admin only')
    })

    it('should return 400 for invalid status', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid_status' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })

    it('should return 400 for invalid refund method', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ refundMethod: 'invalid_method' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid refund method')
    })

    it('should return 400 for negative refund amount', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ refundAmount: -100 }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be negative')
    })

    it('should return 404 for non-existent return', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/returns/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should create notification for user on status change', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)
      mocks.return.update.mockResolvedValue({
        ...mockReturn,
        status: 'approved',
      })
      mocks.notification.create.mockResolvedValue({})

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      await ReturnByIdPUT(request, { params })

      expect(mocks.notification.create).toHaveBeenCalled()
    })

    it('should add loyalty points when refund via wallet', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockResolvedValue(mockReturn)
      mocks.return.update.mockResolvedValue({
        ...mockReturn,
        status: 'completed',
        refundMethod: 'wallet',
        refundAmount: 200,
      })
      mocks.notification.create.mockResolvedValue({})
      mocks.user.update.mockResolvedValue({})
      mocks.loyaltyHistory.create.mockResolvedValue({})

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'completed',
          refundMethod: 'wallet',
          refundAmount: 200,
        }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })

      expect(mocks.user.update).toHaveBeenCalled()
      expect(mocks.loyaltyHistory.create).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.return.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/returns/return-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })
      const params = Promise.resolve({ id: 'return-1' })

      const response = await ReturnByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to update return request')
    })
  })
})
