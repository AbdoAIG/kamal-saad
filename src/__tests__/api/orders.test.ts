/**
 * Tests for Orders API Routes
 * Tests for order creation, retrieval, and management
 */

import { NextRequest } from 'next/server'
import { GET as OrdersGET, POST as OrdersPOST } from '@/app/api/orders/route'
import { GET as OrderByIdGET } from '@/app/api/orders/[id]/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock notification service
jest.mock('@/lib/notification-service', () => ({
  NotificationService: {
    notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
    notifyAdminsNewOrder: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer',
}

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 100,
  discountPrice: null,
  stock: 50,
  images: '["https://example.com/image.jpg"]',
  categoryId: 'category-1',
}

const mockOrder = {
  id: 'order_1234567890_abc123',
  userId: 'user-1',
  status: 'pending',
  total: 200,
  discount: 0,
  shippingAddress: '123 Test Street, Cairo, Egypt',
  phone: '+20123456789',
  paymentMethod: 'cod',
  notes: null,
  pointsUsed: 0,
  pointsEarned: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockOrderItem = {
  id: 'item_1234567890_xyz',
  orderId: 'order_1234567890_abc123',
  productId: 'product-1',
  quantity: 2,
  price: 100,
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

describe('Orders API - GET /api/orders', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch orders for user', () => {
    it('should return orders for valid user', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockOrder]) // Orders query
        .mockResolvedValueOnce([{
          ...mockOrderItem,
          name: mockProduct.name,
          nameAr: mockProduct.nameAr,
          productPrice: mockProduct.price,
          discountPrice: mockProduct.discountPrice,
          images: mockProduct.images,
          categoryId: mockProduct.categoryId,
        }]) // Order items query

      const request = createRequest('http://localhost:3000/api/orders?userId=user-1')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should return empty array when userId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should return empty array when user has no orders', async () => {
      mocks.$queryRaw.mockResolvedValueOnce([])

      const request = createRequest('http://localhost:3000/api/orders?userId=user-without-orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should include order items in response', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([{
          ...mockOrderItem,
          name: mockProduct.name,
          nameAr: mockProduct.nameAr,
          productPrice: mockProduct.price,
          discountPrice: mockProduct.discountPrice,
          images: mockProduct.images,
          categoryId: mockProduct.categoryId,
        }])

      const request = createRequest('http://localhost:3000/api/orders?userId=user-1')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].items).toBeDefined()
      expect(data.data[0].items).toHaveLength(1)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$queryRaw.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/orders?userId=user-1')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch orders')
    })
  })
})

describe('Orders API - POST /api/orders', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Successful order creation', () => {
    it('should create an order with valid data', async () => {
      const orderData = {
        userId: 'user-1',
        items: [
          { productId: 'product-1', quantity: 2, price: 100 },
        ],
        shippingAddress: '123 Test Street',
        phone: '+20123456789',
        subtotal: 200,
        shippingFee: 20,
        total: 220,
        paymentMethod: 'cod',
      }

      mocks.$queryRaw
        .mockResolvedValueOnce([mockProduct]) // Product validation
        .mockResolvedValueOnce([mockUser]) // User validation
        .mockResolvedValueOnce([{ id: mockOrder.id }]) // Created order
        .mockResolvedValueOnce([{ // Order items
          ...mockOrderItem,
          name: mockProduct.name,
          nameAr: mockProduct.nameAr,
          productPrice: mockProduct.price,
          discountPrice: mockProduct.discountPrice,
          images: mockProduct.images,
          categoryId: mockProduct.categoryId,
        }])
        .mockResolvedValueOnce([mockUser]) // User for notification

      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should create order with multiple items', async () => {
      const orderData = {
        userId: 'user-1',
        items: [
          { productId: 'product-1', quantity: 1, price: 100 },
          { productId: 'product-2', quantity: 2, price: 50 },
        ],
        total: 200,
        paymentMethod: 'cod',
      }

      mocks.$queryRaw
        .mockResolvedValueOnce([mockProduct, { ...mockProduct, id: 'product-2', price: 50 }])
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ id: mockOrder.id }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockUser])

      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should calculate total if not provided', async () => {
      const orderData = {
        userId: 'user-1',
        items: [
          { productId: 'product-1', quantity: 2 },
        ],
        paymentMethod: 'cod',
      }

      mocks.$queryRaw
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ id: mockOrder.id, total: 200 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockUser])

      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should create guest user when userId is not provided', async () => {
      const orderData = {
        items: [
          { productId: 'product-1', quantity: 1, price: 100 },
        ],
        shippingAddress: 'Guest Address',
        phone: '+201111111111',
        total: 100,
        paymentMethod: 'cod',
      }

      const guestUser = { id: 'guest-user-id' }

      mocks.$queryRaw
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce([guestUser]) // Created guest user
        .mockResolvedValueOnce([{ id: mockOrder.id }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([guestUser])

      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when items array is empty', async () => {
      const orderData = {
        userId: 'user-1',
        items: [],
        total: 0,
      }

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('No items in order')
    })

    it('should return 400 when items is not provided', async () => {
      const orderData = {
        userId: 'user-1',
        total: 100,
      }

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 when product does not exist', async () => {
      const orderData = {
        userId: 'user-1',
        items: [
          { productId: 'non-existent-product', quantity: 1, price: 100 },
        ],
        total: 100,
      }

      mocks.$queryRaw.mockResolvedValueOnce([]) // No products found

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no longer available')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const orderData = {
        userId: 'user-1',
        items: [
          { productId: 'product-1', quantity: 1, price: 100 },
        ],
        total: 100,
      }

      mocks.$queryRaw.mockRejectedValue(new Error('Database connection failed'))

      const request = createRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const response = await OrdersPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Orders API - GET /api/orders/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch single order', () => {
    it('should return order by ID for valid user', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockOrder]) // Order query
        .mockResolvedValueOnce([{ // Order items with category
          ...mockOrderItem,
          name: mockProduct.name,
          nameAr: mockProduct.nameAr,
          productPrice: mockProduct.price,
          discountPrice: mockProduct.discountPrice,
          images: mockProduct.images,
          categoryId: mockProduct.categoryId,
          categoryName: 'Test Category',
          categoryNameAr: 'فئة تجريبية',
        }])

      const request = createRequest('http://localhost:3000/api/orders/order_1234567890_abc123?userId=user-1')
      const params = Promise.resolve({ id: 'order_1234567890_abc123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('order_1234567890_abc123')
    })

    it('should return 404 when order not found', async () => {
      mocks.$queryRaw.mockResolvedValueOnce([])

      const request = createRequest('http://localhost:3000/api/orders/non-existent-order?userId=user-1')
      const params = Promise.resolve({ id: 'non-existent-order' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Order not found')
    })

    it('should return 400 when userId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/orders/order_123?')
      const params = Promise.resolve({ id: 'order_123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('User ID is required')
    })

    it('should not return order for different user', async () => {
      mocks.$queryRaw.mockResolvedValueOnce([]) // No order found for this user

      const request = createRequest('http://localhost:3000/api/orders/order_1234567890_abc123?userId=different-user')
      const params = Promise.resolve({ id: 'order_1234567890_abc123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('should include coupon if exists', async () => {
      const orderWithCoupon = {
        ...mockOrder,
        couponId: 'coupon-1',
      }

      mocks.$queryRaw
        .mockResolvedValueOnce([orderWithCoupon])
        .mockResolvedValueOnce([{
          ...mockOrderItem,
          name: mockProduct.name,
          nameAr: mockProduct.nameAr,
          productPrice: mockProduct.price,
          discountPrice: mockProduct.discountPrice,
          images: mockProduct.images,
          categoryId: mockProduct.categoryId,
          categoryName: 'Test Category',
          categoryNameAr: 'فئة تجريبية',
        }])
        .mockResolvedValueOnce([{ // Coupon
          id: 'coupon-1',
          code: 'SAVE10',
          type: 'percentage',
          value: 10,
          minOrder: 100,
          maxDiscount: 50,
        }])

      const request = createRequest('http://localhost:3000/api/orders/order_1234567890_abc123?userId=user-1')
      const params = Promise.resolve({ id: 'order_1234567890_abc123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.coupon).toBeDefined()
      expect(data.data.coupon.code).toBe('SAVE10')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$queryRaw.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/orders/order_123?userId=user-1')
      const params = Promise.resolve({ id: 'order_123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch order')
    })
  })
})

describe('Orders API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should handle complete order flow', async () => {
    // Step 1: Create order
    const orderData = {
      userId: 'user-1',
      items: [
        { productId: 'product-1', quantity: 2, price: 100 },
      ],
      shippingAddress: '123 Test Street',
      phone: '+20123456789',
      total: 200,
      paymentMethod: 'cod',
    }

    mocks.$queryRaw
      .mockResolvedValueOnce([mockProduct])
      .mockResolvedValueOnce([mockUser])
      .mockResolvedValueOnce([{ id: mockOrder.id }])
      .mockResolvedValueOnce([{
        ...mockOrderItem,
        name: mockProduct.name,
        nameAr: mockProduct.nameAr,
        productPrice: mockProduct.price,
        discountPrice: mockProduct.discountPrice,
        images: mockProduct.images,
        categoryId: mockProduct.categoryId,
      }])
      .mockResolvedValueOnce([mockUser])
      // Step 2: Fetch order by ID
      .mockResolvedValueOnce([mockOrder])
      .mockResolvedValueOnce([{
        ...mockOrderItem,
        name: mockProduct.name,
        nameAr: mockProduct.nameAr,
        productPrice: mockProduct.price,
        discountPrice: mockProduct.discountPrice,
        images: mockProduct.images,
        categoryId: mockProduct.categoryId,
        categoryName: 'Test Category',
        categoryNameAr: 'فئة تجريبية',
      }])

    mocks.$executeRaw.mockResolvedValue(1)

    // Create order
    const newOrderRequest = createRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })

    const createResponse = await OrdersPOST(newOrderRequest)
    const createData = await createResponse.json()

    expect(createResponse.status).toBe(200)
    expect(createData.success).toBe(true)

    // Fetch order by ID
    const getRequest = createRequest(`http://localhost:3000/api/orders/${mockOrder.id}?userId=user-1`)
    const params = Promise.resolve({ id: mockOrder.id })

    const getResponse = await OrderByIdGET(getRequest, { params })
    const getData = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getData.data.id).toBe(mockOrder.id)
  })
})
