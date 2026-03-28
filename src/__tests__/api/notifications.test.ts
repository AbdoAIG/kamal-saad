/**
 * Tests for Notifications API Routes
 * Tests for notification management
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/notifications/route'
import { PUT, DELETE } from '@/app/api/notifications/[id]/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/auth', () => ({
  auth: () => mockAuth(),
}))

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer',
}

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

const mockNotification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'order',
  title: 'Order Confirmed',
  titleAr: 'تم تأكيد الطلب',
  message: 'Your order #12345 has been confirmed',
  messageAr: 'تم تأكيد طلبك رقم #12345',
  data: JSON.stringify({ orderId: 'order-1' }),
  isRead: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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

describe('Notifications API - GET /api/notifications', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Fetch notifications', () => {
    it('should return notifications for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findMany.mockResolvedValue([mockNotification])
      mocks.notification.count.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.notifications).toHaveLength(1)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should filter unread notifications only', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findMany.mockResolvedValue([mockNotification])
      mocks.notification.count.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/notifications?unreadOnly=true')
      await GET(request)

      expect(mocks.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      )
    })

    it('should return empty array when no notifications', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findMany.mockResolvedValue([])
      mocks.notification.count.mockResolvedValue(0)

      const request = createRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.notifications).toEqual([])
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Notifications API - POST /api/notifications', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Create notification (admin only)', () => {
    it('should create notification for admin user', async () => {
      mockAuth.mockResolvedValue({ user: mockAdminUser })
      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.notification.create.mockResolvedValue(mockNotification)

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          type: 'order',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 403 for non-admin user', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-2',
          type: 'order',
          title: 'Test',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
    })

    it('should return 400 when required fields are missing', async () => {
      mockAuth.mockResolvedValue({ user: mockAdminUser })

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 for invalid notification type', async () => {
      mockAuth.mockResolvedValue({ user: mockAdminUser })

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          type: 'invalid_type',
          title: 'Test',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid notification type')
    })

    it('should return 404 when target user not found', async () => {
      mockAuth.mockResolvedValue({ user: mockAdminUser })
      mocks.user.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'non-existent',
          type: 'order',
          title: 'Test',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })
  })
})

describe('Notifications API - PUT /api/notifications/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Mark as read', () => {
    it('should mark notification as read', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue(mockNotification)
      mocks.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      })

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
    })

    it('should return 404 when notification not found', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    it('should return 403 when notification belongs to another user', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      })

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
    })
  })
})

describe('Notifications API - DELETE /api/notifications/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Delete notification', () => {
    it('should delete notification', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue(mockNotification)
      mocks.notification.delete.mockResolvedValue(mockNotification)

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
    })

    it('should return 404 when notification not found', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/notifications/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
    })

    it('should return 403 when trying to delete another user notification', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      })

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should allow admin to delete any notification', async () => {
      mockAuth.mockResolvedValue({ user: mockAdminUser })
      mocks.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      })
      mocks.notification.delete.mockResolvedValue(mockNotification)

      const request = createRequest('http://localhost:3000/api/notifications/notif-1')
      const params = Promise.resolve({ id: 'notif-1' })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
    })
  })
})
