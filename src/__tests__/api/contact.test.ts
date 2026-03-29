/**
 * Tests for Contact API Routes
 * Tests for contact form management
 */

import { NextRequest } from 'next/server'
import { GET as ContactGET, POST as ContactPOST } from '@/app/api/contact/route'
import { GET as ContactByIdGET, PUT as ContactByIdPUT } from '@/app/api/contact/[id]/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the prisma module
jest.mock('@/lib/prisma', () => {
  const { db } = require('../mocks/db.mock')
  return { prisma: db }
})

// Mock auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

const mockAuth = require('@/auth').auth

// Sample test data
const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

const mockCustomer = {
  id: 'customer-1',
  email: 'customer@example.com',
  name: 'Customer',
  role: 'customer',
}

const mockContactMessage = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+20123456789',
  subject: 'Product Inquiry',
  message: 'I would like to know more about your products.',
  status: 'new',
  reply: null,
  repliedAt: null,
  createdAt: new Date('2024-01-15'),
}

const mockContactMessageRead = {
  ...mockContactMessage,
  id: 'contact-2',
  status: 'read',
}

const mockContactMessageReplied = {
  ...mockContactMessage,
  id: 'contact-3',
  status: 'replied',
  reply: 'Thank you for your inquiry!',
  repliedAt: new Date('2024-01-16'),
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

describe('Contact API - GET /api/contact', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Fetch contact messages (admin only)', () => {
    it('should return messages for admin user', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(1)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      const request = createRequest('http://localhost:3000/api/contact')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/contact')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 401 for non-admin user', async () => {
      mockAuth.mockResolvedValue({ user: mockCustomer })

      const request = createRequest('http://localhost:3000/api/contact')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Admin access required')
    })

    it('should filter messages by status', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(1)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      const request = createRequest('http://localhost:3000/api/contact?status=new')
      await ContactGET(request)

      expect(mocks.contactMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'new' },
        })
      )
    })

    it('should ignore invalid status filter', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(1)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      const request = createRequest('http://localhost:3000/api/contact?status=invalid')
      await ContactGET(request)

      expect(mocks.contactMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })

    it('should support pagination', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(25)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      const request = createRequest('http://localhost:3000/api/contact?page=2&limit=10')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.total).toBe(25)
      expect(data.pagination.totalPages).toBe(3)
    })

    it('should use default pagination values', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(5)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      const request = createRequest('http://localhost:3000/api/contact')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })

    it('should validate pagination params', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(100)
      mocks.contactMessage.findMany.mockResolvedValue([])

      // Test negative page
      const request1 = createRequest('http://localhost:3000/api/contact?page=-1')
      const response1 = await ContactGET(request1)
      const data1 = await response1.json()

      expect(data1.pagination.page).toBe(1) // defaults to 1

      // Test excessive limit
      const request2 = createRequest('http://localhost:3000/api/contact?limit=200')
      const response2 = await ContactGET(request2)
      const data2 = await response2.json()

      expect(data2.pagination.limit).toBe(100) // capped at 100
    })

    it('should return messages ordered by date desc', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockResolvedValue(1)
      mocks.contactMessage.findMany.mockResolvedValue([mockContactMessage])

      await ContactGET(createRequest('http://localhost:3000/api/contact'))

      expect(mocks.contactMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.count.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/contact')
      const response = await ContactGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch contact messages')
    })
  })
})

describe('Contact API - POST /api/contact', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Submit contact message (public)', () => {
    it('should create contact message with required fields', async () => {
      mocks.contactMessage.create.mockResolvedValue(mockContactMessage)

      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I would like to know more about your products.',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('John Doe')
    })

    it('should create contact message with all fields', async () => {
      mocks.contactMessage.create.mockResolvedValue(mockContactMessage)

      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+20123456789',
        subject: 'Product Inquiry',
        message: 'I would like to know more about your products.',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)

      expect(response.status).toBe(201)
      expect(mocks.contactMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+20123456789',
            subject: 'Product Inquiry',
          }),
        })
      )
    })

    it('should return 400 for missing name', async () => {
      const messageData = {
        email: 'john@example.com',
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name is required')
    })

    it('should return 400 for missing email', async () => {
      const messageData = {
        name: 'John Doe',
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Email is required')
    })

    it('should return 400 for missing message', async () => {
      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message is required')
    })

    it('should return 400 for invalid email format', async () => {
      const messageData = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid email format')
    })

    it('should return 400 for name too long', async () => {
      const messageData = {
        name: 'A'.repeat(101),
        email: 'john@example.com',
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 100 characters')
    })

    it('should return 400 for email too long', async () => {
      const messageData = {
        name: 'John Doe',
        email: `${'a'.repeat(250)}@example.com`,
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 255 characters')
    })

    it('should return 400 for message too long', async () => {
      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'A'.repeat(5001),
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 5000 characters')
    })

    it('should trim whitespace from fields', async () => {
      mocks.contactMessage.create.mockResolvedValue(mockContactMessage)

      const messageData = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        message: '  Test message  ',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      await ContactPOST(request)

      expect(mocks.contactMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Test message',
          }),
        })
      )
    })

    it('should set initial status to "new"', async () => {
      mocks.contactMessage.create.mockResolvedValue(mockContactMessage)

      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
      }

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify(messageData),
      })

      await ContactPOST(request)

      expect(mocks.contactMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'new',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.contactMessage.create.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message',
        }),
      })

      const response = await ContactPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to submit contact message')
    })
  })
})

describe('Contact API - GET /api/contact/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Fetch single contact message (admin only)', () => {
    it('should return message by ID for admin', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessageRead)

      const request = createRequest('http://localhost:3000/api/contact/contact-1')
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/contact/contact-1')
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Admin access required')
    })

    it('should return 404 for non-existent message', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/contact/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await ContactByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should auto-mark new message as read', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessage)
      mocks.contactMessage.update.mockResolvedValue(mockContactMessageRead)

      const request = createRequest('http://localhost:3000/api/contact/contact-1')
      const params = Promise.resolve({ id: 'contact-1' })

      await ContactByIdGET(request, { params })

      expect(mocks.contactMessage.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { status: 'read' },
      })
    })

    it('should not update already read messages', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessageRead)

      const request = createRequest('http://localhost:3000/api/contact/contact-2')
      const params = Promise.resolve({ id: 'contact-2' })

      await ContactByIdGET(request, { params })

      expect(mocks.contactMessage.update).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/contact/contact-1')
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdGET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch contact message')
    })
  })
})

describe('Contact API - PUT /api/contact/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    mockAuth.mockReset()
  })

  describe('Reply to contact message (admin only)', () => {
    it('should add reply to message', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessage)
      mocks.contactMessage.update.mockResolvedValue(mockContactMessageReplied)

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Thank you for your inquiry!' }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Test reply' }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Admin access required')
    })

    it('should return 400 for missing reply', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({}),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Reply message is required')
    })

    it('should return 400 for reply too long', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'A'.repeat(10001) }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 10000 characters')
    })

    it('should return 404 for non-existent message', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/contact/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Test reply' }),
      })
      const params = Promise.resolve({ id: 'non-existent' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should update status to "replied"', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessage)
      mocks.contactMessage.update.mockResolvedValue(mockContactMessageReplied)

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Thank you!' }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      await ContactByIdPUT(request, { params })

      expect(mocks.contactMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'replied',
          }),
        })
      )
    })

    it('should set repliedAt timestamp', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockResolvedValue(mockContactMessage)
      mocks.contactMessage.update.mockResolvedValue(mockContactMessageReplied)

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Thank you!' }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      await ContactByIdPUT(request, { params })

      expect(mocks.contactMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            repliedAt: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockAdmin })
      mocks.contactMessage.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/contact/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ reply: 'Test reply' }),
      })
      const params = Promise.resolve({ id: 'contact-1' })

      const response = await ContactByIdPUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to reply')
    })
  })
})
