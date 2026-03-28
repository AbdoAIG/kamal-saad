/**
 * Tests for Settings API Routes
 * Tests for store settings management
 */

import { NextRequest } from 'next/server'
import { GET, POST, PUT } from '@/app/api/settings/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockSettings = [
  {
    id: 'setting-1',
    key: 'site_name',
    value: 'Kamal Saad Store',
    type: 'text',
    group: 'general',
    label: 'Site Name',
    labelAr: 'اسم الموقع',
    description: 'The name of your store',
    descriptionAr: 'اسم متجرك',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'setting-2',
    key: 'site_email',
    value: 'info@kamalsaad.com',
    type: 'email',
    group: 'general',
    label: 'Site Email',
    labelAr: 'بريد الموقع',
    description: 'Main contact email',
    descriptionAr: 'البريد الإلكتروني الرئيسي',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'setting-3',
    key: 'shipping_fee',
    value: '50',
    type: 'number',
    group: 'shipping',
    label: 'Shipping Fee',
    labelAr: 'رسوم الشحن',
    description: 'Default shipping fee',
    descriptionAr: 'رسوم الشحن الافتراضية',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

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

describe('Settings API - GET /api/settings', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch settings', () => {
    it('should return all settings when no filters', async () => {
      mocks.siteSetting.findMany.mockResolvedValue(mockSettings)

      const request = createRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
    })

    it('should return settings as object format', async () => {
      mocks.siteSetting.findMany.mockResolvedValue(mockSettings)

      const request = createRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(data.settings).toBeDefined()
      expect(data.settings['site_name']).toBe('Kamal Saad Store')
      expect(data.settings['site_email']).toBe('info@kamalsaad.com')
    })

    it('should filter settings by group', async () => {
      mocks.siteSetting.findMany.mockResolvedValue([mockSettings[0], mockSettings[1]])

      const request = createRequest('http://localhost:3000/api/settings?group=general')
      const response = await GET(request)
      const data = await response.json()

      expect(mocks.siteSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { group: 'general' },
        })
      )
    })

    it('should return single setting by key', async () => {
      mocks.siteSetting.findUnique.mockResolvedValue(mockSettings[0])

      const request = createRequest('http://localhost:3000/api/settings?key=site_name')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.siteSetting.findUnique).toHaveBeenCalledWith({
        where: { key: 'site_name' },
      })
    })

    it('should return empty array when no settings exist', async () => {
      mocks.siteSetting.findMany.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.settings).toEqual({})
    })

    it('should return settings ordered by group', async () => {
      mocks.siteSetting.findMany.mockResolvedValue(mockSettings)

      const request = createRequest('http://localhost:3000/api/settings')
      await GET(request)

      expect(mocks.siteSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { group: 'asc' },
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.siteSetting.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch settings')
    })
  })
})

describe('Settings API - POST /api/settings', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Create or update multiple settings', () => {
    it('should create or update multiple settings', async () => {
      mocks.siteSetting.upsert.mockResolvedValue(mockSettings[0])

      const settingsData = {
        settings: [
          { key: 'site_name', value: 'New Store Name' },
          { key: 'site_email', value: 'new@email.com' },
        ],
      }

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(settingsData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('saved successfully')
    })

    it('should return 400 for missing settings array', async () => {
      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Settings array is required')
    })

    it('should return 400 for non-array settings', async () => {
      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: 'not-an-array' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Settings array is required')
    })

    it('should create new setting with all fields', async () => {
      mocks.siteSetting.upsert.mockResolvedValue(mockSettings[0])

      const settingsData = {
        settings: [
          {
            key: 'new_setting',
            value: 'test value',
            type: 'text',
            group: 'custom',
            label: 'New Setting',
            labelAr: 'إعداد جديد',
            description: 'A new setting',
            descriptionAr: 'إعداد جديد',
          },
        ],
      }

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(settingsData),
      })

      await POST(request)

      expect(mocks.siteSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            key: 'new_setting',
            type: 'text',
            group: 'custom',
          }),
        })
      )
    })

    it('should use default values for optional fields', async () => {
      mocks.siteSetting.upsert.mockResolvedValue(mockSettings[0])

      const settingsData = {
        settings: [
          { key: 'minimal_setting', value: 'value' },
        ],
      }

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(settingsData),
      })

      await POST(request)

      expect(mocks.siteSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            type: 'text',
            group: 'general',
            label: 'minimal_setting',
          }),
        })
      )
    })

    it('should handle empty settings array', async () => {
      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: [] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.siteSetting.upsert.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          settings: [{ key: 'test', value: 'test' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to save settings')
    })
  })
})

describe('Settings API - PUT /api/settings', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Update single setting', () => {
    it('should update single setting', async () => {
      mocks.siteSetting.upsert.mockResolvedValue({
        ...mockSettings[0],
        value: 'Updated Store Name',
      })

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: 'site_name',
          value: 'Updated Store Name',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.value).toBe('Updated Store Name')
    })

    it('should return 400 for missing key', async () => {
      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ value: 'test' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Setting key is required')
    })

    it('should create setting if not exists (upsert)', async () => {
      mocks.siteSetting.upsert.mockResolvedValue({
        id: 'setting-new',
        key: 'new_key',
        value: 'new value',
      })

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: 'new_key',
          value: 'new value',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.siteSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'new_key' },
          create: { key: 'new_key', value: 'new value' },
        })
      )
    })

    it('should handle empty value', async () => {
      mocks.siteSetting.upsert.mockResolvedValue({
        ...mockSettings[0],
        value: '',
      })

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: 'site_name',
          value: '',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.siteSetting.upsert.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: 'test',
          value: 'test',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to update setting')
    })
  })
})

describe('Settings API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should handle complete settings lifecycle', async () => {
    // Step 1: Get current settings
    mocks.siteSetting.findMany.mockResolvedValue(mockSettings)

    const getRequest = createRequest('http://localhost:3000/api/settings')
    const getResponse = await GET(getRequest)
    const getData = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getData.settings['site_name']).toBe('Kamal Saad Store')

    // Step 2: Update a setting
    mocks.siteSetting.upsert.mockResolvedValue({
      ...mockSettings[0],
      value: 'New Store Name',
    })

    const putRequest = createRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        key: 'site_name',
        value: 'New Store Name',
      }),
    })

    const putResponse = await PUT(putRequest)
    const putData = await putResponse.json()

    expect(putResponse.status).toBe(200)
    expect(putData.data.value).toBe('New Store Name')

    // Step 3: Batch update settings
    mocks.siteSetting.upsert.mockResolvedValue(mockSettings[0])

    const postRequest = createRequest('http://localhost:3000/api/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: [
          { key: 'site_name', value: 'Final Name' },
          { key: 'shipping_fee', value: '75' },
        ],
      }),
    })

    const postResponse = await POST(postRequest)
    const postData = await postResponse.json()

    expect(postResponse.status).toBe(200)
    expect(postData.success).toBe(true)
  })
})
