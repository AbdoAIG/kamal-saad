/**
 * Tests for Banners API Routes
 * Tests for banner management (promotional images)
 */

import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/banners/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockBanner = {
  id: 'banner-1',
  title: 'Summer Sale',
  titleAr: 'تخفيضات الصيف',
  subtitle: 'Up to 50% off',
  subtitleAr: 'خصم يصل إلى 50%',
  image: 'https://example.com/banner.jpg',
  link: '/products?category=sale',
  buttonText: 'Shop Now',
  buttonTextAr: 'تسوق الآن',
  active: true,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockInactiveBanner = {
  id: 'banner-2',
  title: 'Old Promotion',
  titleAr: 'عرض قديم',
  subtitle: 'Expired offer',
  subtitleAr: 'عرض منتهي',
  image: 'https://example.com/old-banner.jpg',
  link: null,
  buttonText: null,
  buttonTextAr: null,
  active: false,
  order: 2,
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2023-12-01'),
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

describe('Banners API - GET /api/banners', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch banners', () => {
    it('should return only active banners', async () => {
      mocks.banner.findMany.mockResolvedValue([mockBanner])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].active).toBe(true)
    })

    it('should return banners ordered by order field', async () => {
      mocks.banner.findMany.mockResolvedValue([mockBanner])

      await GET()

      expect(mocks.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        })
      )
    })

    it('should return empty array when no active banners', async () => {
      mocks.banner.findMany.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should include all banner fields', async () => {
      mocks.banner.findMany.mockResolvedValue([mockBanner])

      const response = await GET()
      const data = await response.json()

      expect(data.data[0]).toHaveProperty('id')
      expect(data.data[0]).toHaveProperty('title')
      expect(data.data[0]).toHaveProperty('titleAr')
      expect(data.data[0]).toHaveProperty('image')
      expect(data.data[0]).toHaveProperty('link')
      expect(data.data[0]).toHaveProperty('active')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.banner.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch banners')
    })
  })
})

describe('Banners API - POST /api/banners', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Create banner', () => {
    it('should create a new banner with required fields', async () => {
      const bannerData = {
        title: 'New Banner',
        image: 'https://example.com/new-banner.jpg',
      }

      mocks.banner.create.mockResolvedValue({
        id: 'banner-new',
        ...bannerData,
        titleAr: bannerData.title,
        active: true,
        order: 0,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('New Banner')
    })

    it('should create banner with all fields', async () => {
      const bannerData = {
        title: 'Full Banner',
        titleAr: 'بانر كامل',
        subtitle: 'Subtitle',
        subtitleAr: 'عنوان فرعي',
        image: 'https://example.com/full-banner.jpg',
        link: '/special-offer',
        buttonText: 'Click Here',
        buttonTextAr: 'اضغط هنا',
        active: true,
        order: 5,
      }

      mocks.banner.create.mockResolvedValue({
        id: 'banner-full',
        ...bannerData,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('Full Banner')
      expect(data.data.titleAr).toBe('بانر كامل')
    })

    it('should default active to true if not specified', async () => {
      const bannerData = {
        title: 'Default Active',
        image: 'https://example.com/banner.jpg',
      }

      mocks.banner.create.mockResolvedValue({
        id: 'banner-default',
        ...bannerData,
        titleAr: bannerData.title,
        active: true,
        order: 0,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      })

      const response = await POST(request)

      expect(mocks.banner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            active: true,
          }),
        })
      )
    })

    it('should default order to 0 if not specified', async () => {
      const bannerData = {
        title: 'Default Order',
        image: 'https://example.com/banner.jpg',
      }

      mocks.banner.create.mockResolvedValue({
        id: 'banner-default',
        ...bannerData,
        titleAr: bannerData.title,
        active: true,
        order: 0,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      })

      const response = await POST(request)

      expect(mocks.banner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0,
          }),
        })
      )
    })

    it('should use title as titleAr if titleAr not provided', async () => {
      const bannerData = {
        title: 'English Title',
        image: 'https://example.com/banner.jpg',
      }

      mocks.banner.create.mockResolvedValue({
        id: 'banner-auto-ar',
        ...bannerData,
        titleAr: 'English Title',
        active: true,
        order: 0,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify(bannerData),
      })

      const response = await POST(request)

      expect(mocks.banner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titleAr: 'English Title',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.banner.create.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', image: 'test.jpg' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to create banner')
    })
  })
})

describe('Banners API - PUT /api/banners', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Update banner', () => {
    it('should update banner successfully', async () => {
      const updateData = {
        id: 'banner-1',
        title: 'Updated Title',
        titleAr: 'عنوان محدث',
        active: false,
      }

      mocks.banner.update.mockResolvedValue({
        ...mockBanner,
        ...updateData,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('Updated Title')
    })

    it('should update all banner fields', async () => {
      const updateData = {
        id: 'banner-1',
        title: 'New Title',
        titleAr: 'عنوان جديد',
        subtitle: 'New Subtitle',
        subtitleAr: 'عنوان فرعي جديد',
        image: 'https://example.com/new-image.jpg',
        link: '/new-link',
        buttonText: 'New Button',
        buttonTextAr: 'زر جديد',
        active: true,
        order: 10,
      }

      mocks.banner.update.mockResolvedValue({
        ...mockBanner,
        ...updateData,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.title).toBe('New Title')
      expect(data.data.order).toBe(10)
    })

    it('should update only provided fields', async () => {
      const updateData = {
        id: 'banner-1',
        active: false,
      }

      mocks.banner.update.mockResolvedValue({
        ...mockBanner,
        active: false,
      })

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.active).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.banner.update.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/banners', {
        method: 'PUT',
        body: JSON.stringify({ id: 'banner-1', title: 'Test' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to update banner')
    })
  })
})

describe('Banners API - DELETE /api/banners', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Delete banner', () => {
    it('should delete banner successfully', async () => {
      mocks.banner.delete.mockResolvedValue(mockBanner)

      const request = createRequest('http://localhost:3000/api/banners?id=banner-1')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
    })

    it('should return 400 when banner ID is missing', async () => {
      const request = createRequest('http://localhost:3000/api/banners')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Banner ID is required')
    })

    it('should call delete with correct ID', async () => {
      mocks.banner.delete.mockResolvedValue(mockBanner)

      const request = createRequest('http://localhost:3000/api/banners?id=banner-1')

      await DELETE(request)

      expect(mocks.banner.delete).toHaveBeenCalledWith({
        where: { id: 'banner-1' },
      })
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.banner.delete.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/banners?id=banner-1')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to delete banner')
    })
  })
})

describe('Banners API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should handle complete banner lifecycle', async () => {
    // Step 1: Create banner
    mocks.banner.create.mockResolvedValue({
      id: 'banner-new',
      title: 'Lifecycle Test',
      titleAr: 'اختبار دورة الحياة',
      image: 'https://example.com/test.jpg',
      active: true,
      order: 0,
    })

    const newBannerRequest = createRequest('http://localhost:3000/api/banners', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Lifecycle Test',
        image: 'https://example.com/test.jpg',
      }),
    })

    const createResponse = await POST(newBannerRequest)
    const createData = await createResponse.json()

    expect(createResponse.status).toBe(200)
    expect(createData.success).toBe(true)

    // Step 2: Update banner
    mocks.banner.update.mockResolvedValue({
      id: 'banner-new',
      title: 'Updated Lifecycle',
      titleAr: 'دورة حياة محدثة',
      image: 'https://example.com/test.jpg',
      active: true,
      order: 5,
    })

    const updateRequest = createRequest('http://localhost:3000/api/banners', {
      method: 'PUT',
      body: JSON.stringify({
        id: 'banner-new',
        title: 'Updated Lifecycle',
        order: 5,
      }),
    })

    const updateResponse = await PUT(updateRequest)
    const updateData = await updateResponse.json()

    expect(updateResponse.status).toBe(200)
    expect(updateData.data.order).toBe(5)

    // Step 3: Fetch banners
    mocks.banner.findMany.mockResolvedValue([{
      id: 'banner-new',
      title: 'Updated Lifecycle',
      active: true,
      order: 5,
    }])

    const getResponse = await GET()
    const getData = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getData.data).toHaveLength(1)

    // Step 4: Delete banner
    mocks.banner.delete.mockResolvedValue({
      id: 'banner-new',
    })

    const deleteRequest = createRequest('http://localhost:3000/api/banners?id=banner-new')

    const deleteResponse = await DELETE(deleteRequest)
    const deleteData = await deleteResponse.json()

    expect(deleteResponse.status).toBe(200)
    expect(deleteData.success).toBe(true)
  })
})
