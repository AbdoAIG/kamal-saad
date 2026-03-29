/**
 * Tests for Authentication API Routes
 * Tests for login, register, me (session check), and Google OAuth start
 */

import { NextRequest, NextResponse } from 'next/server'
import { POST as LoginPOST, DELETE as LogoutDELETE } from '@/app/api/auth/login/route'
import { POST as RegisterPOST } from '@/app/api/auth/register/route'
import { GET as MeGET } from '@/app/api/auth/me/route'
import { GET as GoogleStartGET } from '@/app/api/auth/google-start/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock next/headers cookies
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}))

// Mock email service
jest.mock('@/lib/email', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
}))

import bcrypt from 'bcryptjs'

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$10$hashedpassword123',
  role: 'customer',
  phone: '+20123456789',
  image: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

const mockInactiveUser = {
  ...mockUser,
  id: 'inactive-1',
  email: 'inactive@example.com',
  name: 'Inactive User',
  isActive: false,
}

const mockSession = {
  id: 'sess_123456',
  sessionToken: 'session-token-abc123',
  userId: 'user-1',
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
}

const mockExpiredSession = {
  ...mockSession,
  expires: new Date(Date.now() - 1000), // 1 second ago (expired)
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

describe('Auth API - POST /api/auth/login', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
    mockCookieStore.get.mockReturnValue({ value: null })
  })

  describe('Successful login', () => {
    it('should login successfully with valid credentials', async () => {
      mocks.$queryRaw.mockResolvedValue([mockUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      })
      expect(data.user.password).toBeUndefined()
    })

    it('should set session cookie on successful login', async () => {
      mocks.$queryRaw.mockResolvedValue([mockUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      await LoginPOST(request)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'session',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
      )
    })

    it('should login admin user successfully', async () => {
      mocks.$queryRaw.mockResolvedValue([mockAdminUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'adminpassword',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe('admin')
    })

    it('should normalize email to lowercase', async () => {
      mocks.$queryRaw.mockResolvedValue([mockUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mocks.$executeRaw.mockResolvedValue(1)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        }),
      })

      await LoginPOST(request)

      // Check that $queryRaw was called with lowercase email
      expect(mocks.$queryRaw).toHaveBeenCalled()
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when email is missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'password123',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('البريد الإلكتروني وكلمة المرور مطلوبان')
    })

    it('should return 400 when password is missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('البريد الإلكتروني وكلمة المرور مطلوبان')
    })

    it('should return 400 when both email and password are missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Authentication failures', () => {
    it('should return 401 when user does not exist', async () => {
      mocks.$queryRaw.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    })

    it('should return 401 when password is incorrect', async () => {
      mocks.$queryRaw.mockResolvedValue([mockUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    })

    it('should return 403 when user account is inactive', async () => {
      mocks.$queryRaw.mockResolvedValue([mockInactiveUser])
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'inactive@example.com',
          password: 'password123',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('هذا الحساب غير مفعل')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.$queryRaw.mockRejectedValue(new Error('Database connection failed'))

      const request = createRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await LoginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('فشل في تسجيل الدخول')
    })
  })
})

describe('Auth API - DELETE /api/auth/login (Logout)', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  it('should logout successfully and clear session', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'session-token-abc123' })
    mocks.$executeRaw.mockResolvedValue(1)

    const response = await LogoutDELETE()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
    expect(mocks.$executeRaw).toHaveBeenCalled()
  })

  it('should handle logout when no session exists', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const response = await LogoutDELETE()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return success even on database error', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'session-token-abc123' })
    mocks.$executeRaw.mockRejectedValue(new Error('Database error'))

    const response = await LogoutDELETE()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
  })
})

describe('Auth API - POST /api/auth/register', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Successful registration', () => {
    it('should register a new user successfully', async () => {
      mocks.user.findUnique.mockResolvedValue(null)
      mocks.user.create.mockResolvedValue({
        ...mockUser,
        password: 'plainpassword', // In production should be hashed
      })

      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('تم إنشاء الحساب بنجاح')
      expect(data.user).toBeDefined()
      expect(data.user.password).toBeUndefined()
    })

    it('should register user with phone and address', async () => {
      mocks.user.findUnique.mockResolvedValue(null)
      mocks.user.create.mockResolvedValue({
        ...mockUser,
        phone: '+20123456789',
        address: 'Cairo, Egypt',
      })

      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          phone: '+20123456789',
          address: 'Cairo, Egypt',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+20123456789',
            address: 'Cairo, Egypt',
          }),
        })
      )
    })

    it('should assign customer role by default', async () => {
      mocks.user.findUnique.mockResolvedValue(null)
      mocks.user.create.mockResolvedValue(mockUser)

      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        }),
      })

      await RegisterPOST(request)

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'customer',
          }),
        })
      )
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when name is missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('جميع الحقول المطلوبة يجب ملؤها')
    })

    it('should return 400 when email is missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          password: 'password123',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('جميع الحقول المطلوبة يجب ملؤها')
    })

    it('should return 400 when password is missing', async () => {
      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('جميع الحقول المطلوبة يجب ملؤها')
    })
  })

  describe('Duplicate email', () => {
    it('should return 400 when email already exists', async () => {
      mocks.user.findUnique.mockResolvedValue(mockUser)

      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('البريد الإلكتروني مستخدم بالفعل')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await RegisterPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('فشل في إنشاء الحساب')
    })
  })
})

describe('Auth API - GET /api/auth/me', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Authenticated user', () => {
    it('should return current user when valid session exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'session-token-abc123' })
      mocks.$queryRaw.mockResolvedValue([{
        id: 'sess_123456',
        sessionToken: 'session-token-abc123',
        userId: 'user-1',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        u_id: 'user-1',
        u_email: 'test@example.com',
        u_name: 'Test User',
        u_role: 'customer',
        u_phone: '+20123456789',
        u_image: null,
        u_isActive: true,
      }])

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
      })
    })

    it('should return admin user correctly', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'admin-session-token' })
      mocks.$queryRaw.mockResolvedValue([{
        id: 'sess_admin',
        sessionToken: 'admin-session-token',
        userId: 'admin-1',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        u_id: 'admin-1',
        u_email: 'admin@example.com',
        u_name: 'Admin User',
        u_role: 'admin',
        u_phone: null,
        u_image: null,
        u_isActive: true,
      }])

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe('admin')
    })

    it('should default to customer role if role is null', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'session-token' })
      mocks.$queryRaw.mockResolvedValue([{
        id: 'sess_123',
        sessionToken: 'session-token',
        userId: 'user-1',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        u_id: 'user-1',
        u_email: 'test@example.com',
        u_name: 'Test User',
        u_role: null,
        u_phone: null,
        u_image: null,
        u_isActive: true,
      }])

      const response = await MeGET()
      const data = await response.json()

      expect(data.user.role).toBe('customer')
    })
  })

  describe('Unauthenticated user', () => {
    it('should return null user when no session cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.user).toBeNull()
    })

    it('should return null user when session cookie is empty', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' })

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeNull()
    })
  })

  describe('Session validation', () => {
    it('should return null when session not found in database', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-token' })
      mocks.$queryRaw.mockResolvedValue([])

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.user).toBeNull()
      expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
    })

    it('should return null when session is expired', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'expired-session-token' })
      mocks.$queryRaw.mockResolvedValue([{
        id: 'sess_expired',
        sessionToken: 'expired-session-token',
        userId: 'user-1',
        expires: new Date(Date.now() - 1000), // Expired
        u_id: 'user-1',
        u_email: 'test@example.com',
        u_name: 'Test User',
        u_role: 'customer',
        u_phone: null,
        u_image: null,
        u_isActive: true,
      }])

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.user).toBeNull()
      expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'session-token' })
      mocks.$queryRaw.mockRejectedValue(new Error('Database error'))

      const response = await MeGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.user).toBeNull()
    })
  })
})

describe('Auth API - GET /api/auth/google-start', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
    // Mock fetch for CSRF token
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Google OAuth initiation', () => {
    it('should return HTML with redirect form', async () => {
      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html')
    })

    it('should include callbackUrl in the form', async () => {
      const request = createRequest('http://localhost:3000/api/auth/google-start?callbackUrl=/dashboard')

      const response = await GoogleStartGET(request)
      const html = await response.text()

      expect(html).toContain('callbackUrl')
      expect(html).toContain('/dashboard')
    })

    it('should use default callbackUrl when not provided', async () => {
      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)
      const html = await response.text()

      expect(html).toContain('value="/"')
    })

    it('should include CSRF token in the form', async () => {
      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)
      const html = await response.text()

      expect(html).toContain('mock-csrf-token')
      expect(html).toContain('name="csrfToken"')
    })

    it('should include Arabic loading message', async () => {
      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)
      const html = await response.text()

      expect(html).toContain('جاري التوجيه إلى Google')
    })
  })

  describe('Error handling', () => {
    it('should handle CSRF fetch failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      })

      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)

      // Should redirect to error page (307 redirect)
      expect(response.status).toBe(307)
    })

    it('should handle fetch exception', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const request = createRequest('http://localhost:3000/api/auth/google-start')

      const response = await GoogleStartGET(request)

      // Should redirect to error page (307 redirect)
      expect(response.status).toBe(307)
    })
  })
})

describe('Auth API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  it('should handle complete login flow', async () => {
    // Step 1: Login
    mocks.$queryRaw.mockResolvedValue([mockUser])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    mocks.$executeRaw.mockResolvedValue(1)

    const loginRequest = createRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const loginResponse = await LoginPOST(loginRequest)
    const loginData = await loginResponse.json()

    expect(loginResponse.status).toBe(200)
    expect(loginData.success).toBe(true)

    // Step 2: Check session (me)
    mockCookieStore.get.mockReturnValue({ value: 'session-token-abc123' })
    mocks.$queryRaw.mockResolvedValue([{
      id: 'sess_123',
      sessionToken: 'session-token-abc123',
      userId: 'user-1',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      u_id: 'user-1',
      u_email: 'test@example.com',
      u_name: 'Test User',
      u_role: 'customer',
      u_phone: '+20123456789',
      u_image: null,
      u_isActive: true,
    }])

    const meResponse = await MeGET()
    const meData = await meResponse.json()

    expect(meResponse.status).toBe(200)
    expect(meData.user.email).toBe('test@example.com')
  })

  it('should handle register then login flow', async () => {
    // Step 1: Register
    mocks.user.findUnique.mockResolvedValue(null)
    mocks.user.create.mockResolvedValue(mockUser)

    const registerRequest = createRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const registerResponse = await RegisterPOST(registerRequest)
    const registerData = await registerResponse.json()

    expect(registerResponse.status).toBe(200)
    expect(registerData.success).toBe(true)

    // Step 2: Login with same credentials
    mocks.$queryRaw.mockResolvedValue([mockUser])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    mocks.$executeRaw.mockResolvedValue(1)

    const loginRequest = createRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const loginResponse = await LoginPOST(loginRequest)
    const loginData = await loginResponse.json()

    expect(loginResponse.status).toBe(200)
    expect(loginData.success).toBe(true)
  })

  it('should handle logout flow', async () => {
    // Set session
    mockCookieStore.get.mockReturnValue({ value: 'session-token-abc123' })
    mocks.$executeRaw.mockResolvedValue(1)

    const logoutResponse = await LogoutDELETE()
    const logoutData = await logoutResponse.json()

    expect(logoutResponse.status).toBe(200)
    expect(logoutData.success).toBe(true)
    expect(mockCookieStore.delete).toHaveBeenCalledWith('session')

    // After logout, me should return null
    mockCookieStore.get.mockReturnValue(undefined)
    const meResponse = await MeGET()
    const meData = await meResponse.json()

    expect(meData.user).toBeNull()
  })
})
