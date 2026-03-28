/**
 * Tests for Admin API Routes
 * Tests for admin panel functionality (customers, orders management)
 */

import { NextRequest } from 'next/server'
import { GET as CustomersGET } from '@/app/api/admin/customers/route'
import { GET as OrdersGET } from '@/app/api/admin/orders/route'
import { GET as OrderByIdGET, PUT as OrderByIdPUT } from '@/app/api/admin/orders/[id]/route'
import { GET as SetupGET, POST as SetupPOST } from '@/app/api/admin/setup/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
}))

// Sample test data
const mockCustomer = {
  id: 'customer-1',
  email: 'customer@example.com',
  name: 'Test Customer',
  phone: '+20123456789',
  role: 'customer',
  createdAt: new Date('2024-01-01'),
  orders: [
    { id: 'order-1', total: 200, status: 'delivered' },
    { id: 'order-2', total: 150, status: 'pending' },
  ],
}

const mockAdminOrder = {
  id: 'order_admin_1234567890_abc',
  userId: 'customer-1',
  status: 'pending',
  total: 350,
  discount: 0,
  shippingAddress: JSON.stringify({
    fullName: 'Test Customer',
    phone: '+20123456789',
    governorate: 'Cairo',
    city: 'Nasr City',
    address: '123 Test Street',
  }),
  phone: '+20123456789',
  paymentMethod: 'cod',
  notes: null,
  pointsUsed: 0,
  pointsEarned: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userName: 'Test Customer',
  userEmail: 'customer@example.com',
  userPhone: '+20123456789',
  userImage: null,
}

const mockOrderItem = {
  id: 'item_1234567890_xyz',
  orderId: 'order_admin_1234567890_abc',
  productId: 'product-1',
  quantity: 2,
  price: 100,
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  images: '["https://example.com/image.jpg"]',
  productPrice: 100,
  discountPrice: null,
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

describe('Admin API - GET /api/admin/customers', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch customers with stats', () => {
    it('should return customers with their order statistics', async () => {
      mocks.user.findMany.mockResolvedValue([mockCustomer])

      const request = createRequest('http://localhost:3000/api/admin/customers')
      const response = await CustomersGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].ordersCount).toBe(2)
      expect(data.data[0].totalSpent).toBe(200) // Only delivered orders
    })

    it('should return empty array when no customers exist', async () => {
      mocks.user.findMany.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/admin/customers')
      const response = await CustomersGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should only return users with customer role', async () => {
      mocks.user.findMany.mockResolvedValue([mockCustomer])

      await CustomersGET()

      expect(mocks.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'customer' },
        })
      )
    })

    it('should calculate totalSpent only from delivered orders', async () => {
      const customerWithMixedOrders = {
        ...mockCustomer,
        orders: [
          { id: 'order-1', total: 200, status: 'delivered' },
          { id: 'order-2', total: 150, status: 'pending' },
          { id: 'order-3', total: 300, status: 'delivered' },
          { id: 'order-4', total: 100, status: 'cancelled' },
        ],
      }

      mocks.user.findMany.mockResolvedValue([customerWithMixedOrders])

      const response = await CustomersGET()
      const data = await response.json()

      expect(data.data[0].totalSpent).toBe(500) // 200 + 300 from delivered
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.user.findMany.mockRejectedValue(new Error('Database error'))

      const response = await CustomersGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch customers')
    })
  })
})

describe('Admin API - GET /api/admin/orders', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch all orders for admin', () => {
    it('should return all orders with user information', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should filter orders by status', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([{ ...mockAdminOrder, status: 'delivered' }])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders?status=delivered')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return all orders when status is "all"', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders?status=all')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should search orders by ID', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest(`http://localhost:3000/api/admin/orders?search=${mockAdminOrder.id.slice(-8)}`)
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should search orders by customer name', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders?search=Test Customer')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should search orders by email', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders?search=customer@example.com')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should search orders by phone', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders?search=0123456789')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should include order items in response', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(data.data[0].items).toBeDefined()
      expect(data.data[0].items).toHaveLength(1)
    })

    it('should include shipping info in response', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(data.data[0].shippingInfo).toBeDefined()
      expect(data.data[0].shippingInfo.fullName).toBe('Test Customer')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$queryRaw.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/admin/orders')
      const response = await OrdersGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch orders')
    })
  })
})

describe('Admin API - GET /api/admin/orders/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch single order', () => {
    it('should return order by ID', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc')
      const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('order_admin_1234567890_abc')
    })

    it('should return 404 when order not found', async () => {
      mocks.$queryRaw.mockResolvedValueOnce([])

      const request = createRequest('http://localhost:3000/api/admin/orders/non-existent-order')
      const params = Promise.resolve({ id: 'non-existent-order' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Order not found')
    })

    it('should include order items with product details', async () => {
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])

      const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc')
      const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(data.data.items).toBeDefined()
      expect(data.data.items[0].product).toBeDefined()
      expect(data.data.items[0].product.name).toBe('Test Product')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$queryRaw.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/admin/orders/order_123')
      const params = Promise.resolve({ id: 'order_123' })

      const response = await OrderByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch order')
    })
  })
})

describe('Admin API - PUT /api/admin/orders/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Update order status', () => {
    it('should update order status successfully', async () => {
      mocks.$executeRaw.mockResolvedValue(1)
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder]) // Fetch updated order
        .mockResolvedValueOnce([mockOrderItem]) // Fetch items
      mocks.notification.create.mockResolvedValue({})

      const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc', {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' }),
      })
      const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

      const response = await OrderByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for invalid status', async () => {
      const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid_status' }),
      })
      const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

      const response = await OrderByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid status')
    })

    it('should accept valid statuses', async () => {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

      for (const status of validStatuses) {
        resetAllMocks()

        mocks.$executeRaw.mockResolvedValue(1)
        mocks.$queryRaw
          .mockResolvedValueOnce([mockAdminOrder])
          .mockResolvedValueOnce([mockOrderItem])
        mocks.notification.create.mockResolvedValue({})

        const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc', {
          method: 'PUT',
          body: JSON.stringify({ status }),
        })
        const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

        const response = await OrderByIdPUT(request, { params })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should create notification for user on status change', async () => {
      mocks.$executeRaw.mockResolvedValue(1)
      mocks.$queryRaw
        .mockResolvedValueOnce([mockAdminOrder])
        .mockResolvedValueOnce([mockOrderItem])
        .mockResolvedValueOnce(undefined)

      const request = createRequest('http://localhost:3000/api/admin/orders/order_admin_1234567890_abc', {
        method: 'PUT',
        body: JSON.stringify({ status: 'shipped' }),
      })
      const params = Promise.resolve({ id: 'order_admin_1234567890_abc' })

      const response = await OrderByIdPUT(request, { params })

      expect(response.status).toBe(200)
      expect(mocks.$executeRaw).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$executeRaw.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/admin/orders/order_123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' }),
      })
      const params = Promise.resolve({ id: 'order_123' })

      const response = await OrderByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to update order')
    })
  })
})

describe('Admin API - GET /api/admin/setup', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Setup super admin via GET', () => {
    it('should create super admin with default credentials', async () => {
      mocks.user.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.create.mockResolvedValue({
        id: 'role-1',
        name: 'super_admin',
        nameAr: 'مدير عام',
      })
      mocks.user.create.mockResolvedValue({
        id: 'admin-1',
        email: 'adminkms@abdoaig',
        name: 'Super Admin',
        role: 'super_admin',
      })
      mocks.role.findUnique.mockResolvedValue(null)
      mocks.role.create.mockResolvedValue({
        id: 'role-2',
        name: 'admin',
      })

      const response = await SetupGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.credentials).toBeDefined()
      expect(data.credentials.email).toBe('adminkms@abdoaig')
    })

    it('should delete existing admin users before creating new one', async () => {
      mocks.user.deleteMany.mockResolvedValue({ count: 2 })
      mocks.role.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.create.mockResolvedValue({
        id: 'role-1',
        name: 'super_admin',
      })
      mocks.user.create.mockResolvedValue({
        id: 'admin-1',
        email: 'adminkms@abdoaig',
        name: 'Super Admin',
        role: 'super_admin',
      })
      mocks.role.findUnique.mockResolvedValue(null)
      mocks.role.create.mockResolvedValue({
        id: 'role-2',
        name: 'admin',
      })

      await SetupGET()

      expect(mocks.user.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { role: 'admin' },
            { role: 'super_admin' },
          ],
        },
      })
    })
  })

  describe('Error handling', () => {
    it('should handle setup errors gracefully', async () => {
      mocks.user.deleteMany.mockRejectedValue(new Error('Database error'))

      const response = await SetupGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })
})

describe('Admin API - POST /api/admin/setup', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Setup super admin via POST', () => {
    it('should create super admin with custom credentials', async () => {
      mocks.user.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.create.mockResolvedValue({
        id: 'role-1',
        name: 'super_admin',
      })
      mocks.user.create.mockResolvedValue({
        id: 'admin-1',
        email: 'custom@admin.com',
        name: 'Custom Admin',
        role: 'super_admin',
      })
      mocks.role.findUnique.mockResolvedValue(null)
      mocks.role.create.mockResolvedValue({
        id: 'role-2',
        name: 'admin',
      })

      const request = createRequest('http://localhost:3000/api/admin/setup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'custom@admin.com',
          password: 'customPassword123',
          name: 'Custom Admin',
        }),
      })

      const response = await SetupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.credentials.email).toBe('custom@admin.com')
    })

    it('should use default credentials if not provided', async () => {
      mocks.user.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.deleteMany.mockResolvedValue({ count: 1 })
      mocks.role.create.mockResolvedValue({
        id: 'role-1',
        name: 'super_admin',
      })
      mocks.user.create.mockResolvedValue({
        id: 'admin-1',
        email: 'adminkms@abdoaig',
        name: 'Super Admin',
        role: 'super_admin',
      })
      mocks.role.findUnique.mockResolvedValue(null)
      mocks.role.create.mockResolvedValue({
        id: 'role-2',
        name: 'admin',
      })

      const request = createRequest('http://localhost:3000/api/admin/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await SetupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.credentials.email).toBe('adminkms@abdoaig')
    })
  })

  describe('Error handling', () => {
    it('should handle setup errors gracefully', async () => {
      mocks.user.deleteMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/admin/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await SetupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })
})
