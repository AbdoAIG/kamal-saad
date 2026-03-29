/**
 * Tests for User API Routes
 * Tests for user profile and password management
 */

import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/user/route'
import { POST as PasswordPOST } from '@/app/api/user/password/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))
jest.mock('@/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

import bcrypt from 'bcryptjs'

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+20123456789',
  image: null,
  role: 'customer',
  loyaltyPoints: 150,
  password: '$2a$10$hashedpassword',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockAddress = {
  id: 'address-1',
  userId: 'user-1',
  label: 'Home',
  fullName: 'Test User',
  phone: '+20123456789',
  governorate: 'Cairo',
  city: 'Nasr City',
  address: '123 Main Street',
  isDefault: true,
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

describe('User API - GET /api/user', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Fetch user profile', () => {
    it('should return user profile for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue({
        ...mockUser,
        addresses: [mockAddress],
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('user-1')
      expect(data.data.email).toBe('test@example.com')
      expect(data.data.name).toBe('Test User')
      expect(data.data.loyaltyPoints).toBe(150)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should include user addresses in response', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue({
        ...mockUser,
        addresses: [mockAddress],
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.addresses).toBeDefined()
      expect(data.data.addresses).toHaveLength(1)
    })

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('User not found')
    })

    it('should not expose password in response', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue({
        ...mockUser,
        addresses: [],
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.password).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch user data')
    })
  })
})

describe('User API - PUT /api/user', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Update user profile', () => {
    it('should update user name', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      })

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Name')
    })

    it('should update user phone', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.update.mockResolvedValue({
        ...mockUser,
        phone: '+201111111111',
      })

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({ phone: '+201111111111' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.phone).toBe('+201111111111')
    })

    it('should update user image', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.update.mockResolvedValue({
        ...mockUser,
        image: 'https://example.com/avatar.jpg',
      })

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({ image: 'https://example.com/avatar.jpg' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.image).toBe('https://example.com/avatar.jpg')
    })

    it('should update multiple fields at once', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.update.mockResolvedValue({
        ...mockUser,
        name: 'New Name',
        phone: '+201999999999',
        image: 'https://example.com/new-avatar.jpg',
      })

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'New Name',
          phone: '+201999999999',
          image: 'https://example.com/new-avatar.jpg',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('New Name')
      expect(data.data.phone).toBe('+201999999999')
      expect(data.data.image).toBe('https://example.com/new-avatar.jpg')
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.update.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('User API - POST /api/user/password', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Change password', () => {
    it('should change password successfully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedpassword')
      mocks.user.update.mockResolvedValue(mockUser)

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('successfully')
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should return 400 when required fields are missing', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          // Missing newPassword and confirmPassword
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when passwords do not match', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('do not match')
    })

    it('should return 400 when password is too short', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'short',
          confirmPassword: 'short',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('at least 8 characters')
    })

    it('should return 400 when current password is incorrect', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('incorrect')
    })

    it('should return 400 for OAuth accounts without password', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue({ ...mockUser, password: null })

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('OAuth')
    })

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/user/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        }),
      })

      const response = await PasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
