/**
 * Tests for Addresses API Routes
 * Tests for shipping/delivery address management
 */

import { NextRequest } from 'next/server'
import { GET as AddressesGET, POST as AddressesPOST } from '@/app/api/addresses/route'
import { GET as AddressByIdGET, PUT as AddressByIdPUT, DELETE as AddressByIdDELETE } from '@/app/api/addresses/[id]/route'
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

const mockAddress = {
  id: 'address-1',
  userId: 'user-1',
  label: 'Home',
  fullName: 'John Doe',
  phone: '+20123456789',
  governorate: 'Cairo',
  city: 'Nasr City',
  address: '123 Main Street, Apt 4',
  landmark: 'Near City Stars Mall',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockAddress2 = {
  id: 'address-2',
  userId: 'user-1',
  label: 'Work',
  fullName: 'John Doe',
  phone: '+20198765432',
  governorate: 'Giza',
  city: 'Dokki',
  address: '456 Work Street',
  landmark: null,
  isDefault: false,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
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

describe('Addresses API - GET /api/addresses', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Fetch addresses', () => {
    it('should return addresses for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.findMany.mockResolvedValue([mockAddress, mockAddress2])

      const response = await AddressesGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(mocks.address.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await AddressesGET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return empty array when user has no addresses', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.findMany.mockResolvedValue([])

      const response = await AddressesGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should sort addresses with default first', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.findMany.mockResolvedValue([mockAddress, mockAddress2])

      await AddressesGET()

      expect(mocks.address.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.findMany.mockRejectedValue(new Error('Database error'))

      const response = await AddressesGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch addresses')
    })
  })
})

describe('Addresses API - POST /api/addresses', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Create address', () => {
    it('should create a new address with valid data', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.count.mockResolvedValue(1)
      mocks.address.create.mockResolvedValue(mockAddress)

      const newAddress = {
        label: 'Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Nasr City',
        address: '123 Main Street',
      }

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      const response = await AddressesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.label).toBe('Home')
    })

    it('should set first address as default automatically', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.count.mockResolvedValue(0) // No existing addresses
      mocks.address.create.mockResolvedValue({ ...mockAddress, isDefault: true })

      const newAddress = {
        label: 'Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Nasr City',
        address: '123 Main Street',
      }

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      await AddressesPOST(request)

      expect(mocks.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDefault: true,
          }),
        })
      )
    })

    it('should unset previous default when setting new default', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.count.mockResolvedValue(1)
      mocks.address.updateMany.mockResolvedValue({ count: 1 })
      mocks.address.create.mockResolvedValue({ ...mockAddress, isDefault: true })

      const newAddress = {
        label: 'New Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Maadi',
        address: '789 New Street',
        isDefault: true,
      }

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      await AddressesPOST(request)

      expect(mocks.address.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isDefault: true,
        },
        data: { isDefault: false },
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await AddressesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should return 400 when required fields are missing', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: 'Home',
          // Missing fullName, phone, governorate, city, address
        }),
      })

      const response = await AddressesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    it('should handle optional landmark field', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.count.mockResolvedValue(0)
      mocks.address.create.mockResolvedValue(mockAddress)

      const newAddress = {
        label: 'Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Nasr City',
        address: '123 Main Street',
        landmark: 'Near the park',
      }

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      const response = await AddressesPOST(request)

      expect(response.status).toBe(201)
      expect(mocks.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            landmark: 'Near the park',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: mockUser })
      mocks.address.count.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: 'Home',
          fullName: 'John Doe',
          phone: '+20123456789',
          governorate: 'Cairo',
          city: 'Nasr City',
          address: '123 Main Street',
        }),
      })

      const response = await AddressesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Addresses API - GET /api/addresses/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  it('should return a single address by ID', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue(mockAddress)

    const request = createRequest('http://localhost:3000/api/addresses/address-1')
    const params = Promise.resolve({ id: 'address-1' })

    const response = await AddressByIdGET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('address-1')
  })

  it('should return 404 when address not found', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue(null)

    const request = createRequest('http://localhost:3000/api/addresses/non-existent')
    const params = Promise.resolve({ id: 'non-existent' })

    const response = await AddressByIdGET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('not found')
  })

  it('should return 403 when address belongs to another user', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue({ ...mockAddress, userId: 'other-user' })

    const request = createRequest('http://localhost:3000/api/addresses/address-1')
    const params = Promise.resolve({ id: 'address-1' })

    const response = await AddressByIdGET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Forbidden')
  })
})

describe('Addresses API - PUT /api/addresses/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  it('should update an existing address', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue(mockAddress)
    mocks.address.update.mockResolvedValue({ ...mockAddress, label: 'Updated Home' })

    const request = createRequest('http://localhost:3000/api/addresses/address-1', {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Updated Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Nasr City',
        address: '123 Main Street',
        isDefault: true,
      }),
    })
    const params = Promise.resolve({ id: 'address-1' })

    const response = await AddressByIdPUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.label).toBe('Updated Home')
  })

  it('should unset previous default when setting as default', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue(mockAddress)
    mocks.address.updateMany.mockResolvedValue({ count: 1 })
    mocks.address.update.mockResolvedValue(mockAddress)

    const request = createRequest('http://localhost:3000/api/addresses/address-1', {
      method: 'PUT',
      body: JSON.stringify({
        label: 'Home',
        fullName: 'John Doe',
        phone: '+20123456789',
        governorate: 'Cairo',
        city: 'Nasr City',
        address: '123 Main Street',
        isDefault: true,
      }),
    })
    const params = Promise.resolve({ id: 'address-1' })

    await AddressByIdPUT(request, { params })

    expect(mocks.address.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isDefault: true,
        id: { not: 'address-1' },
      },
      data: { isDefault: false },
    })
  })
})

describe('Addresses API - DELETE /api/addresses/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.clearAllMocks()
  })

  it('should delete an address', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue({ ...mockAddress, isDefault: false })
    mocks.address.delete.mockResolvedValue(mockAddress)

    const request = createRequest('http://localhost:3000/api/addresses/address-1')
    const params = Promise.resolve({ id: 'address-1' })

    const response = await AddressByIdDELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('deleted')
  })

  it('should set new default when deleting default address', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue(mockAddress) // isDefault: true
    mocks.address.delete.mockResolvedValue(mockAddress)
    mocks.address.findFirst.mockResolvedValue(mockAddress2)
    mocks.address.update.mockResolvedValue({ ...mockAddress2, isDefault: true })

    const request = createRequest('http://localhost:3000/api/addresses/address-1')
    const params = Promise.resolve({ id: 'address-1' })

    await AddressByIdDELETE(request, { params })

    expect(mocks.address.findFirst).toHaveBeenCalled()
    expect(mocks.address.update).toHaveBeenCalledWith({
      where: { id: 'address-2' },
      data: { isDefault: true },
    })
  })

  it('should return 403 when deleting address of another user', async () => {
    mockAuth.mockResolvedValue({ user: mockUser })
    mocks.address.findUnique.mockResolvedValue({ ...mockAddress, userId: 'other-user' })

    const request = createRequest('http://localhost:3000/api/addresses/address-1')
    const params = Promise.resolve({ id: 'address-1' })

    const response = await AddressByIdDELETE(request, { params })

    expect(response.status).toBe(403)
  })
})
