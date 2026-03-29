/**
 * Tests for Categories API Routes
 * Testing GET and POST endpoints
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/categories/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockCategories = [
  {
    id: 'category-1',
    name: 'Pens',
    nameAr: 'أقلام',
    slug: 'pens',
    image: 'https://example.com/pens.jpg',
    description: 'All types of pens',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { products: 10 },
  },
  {
    id: 'category-2',
    name: 'Notebooks',
    nameAr: 'دفاتر',
    slug: 'notebooks',
    image: 'https://example.com/notebooks.jpg',
    description: 'All types of notebooks',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    _count: { products: 15 },
  },
]

describe('Categories API - GET /api/categories', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return all categories with product counts', async () => {
    mocks.category.findMany.mockResolvedValue(mockCategories)

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0]._count.products).toBe(10)
    expect(data[1]._count.products).toBe(15)
    expect(mocks.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      })
    )
  })

  it('should return empty array when no categories exist', async () => {
    mocks.category.findMany.mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(0)
  })

  it('should handle database errors gracefully', async () => {
    mocks.category.findMany.mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch categories')
  })
})

describe('Categories API - POST /api/categories', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should create a category with valid data', async () => {
    const newCategory = {
      name: 'New Category',
      nameAr: 'فئة جديدة',
      slug: 'new-category',
      image: 'https://example.com/new.jpg',
      description: 'New category description',
    }

    mocks.category.create.mockResolvedValue({
      id: 'new-category-id',
      ...newCategory,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe(newCategory.name)
    expect(data.nameAr).toBe(newCategory.nameAr)
    expect(mocks.category.create).toHaveBeenCalledWith({
      data: newCategory,
    })
  })

  it('should create a category with minimal data', async () => {
    const newCategory = {
      name: 'Minimal Category',
      nameAr: 'فئة',
      slug: 'minimal-category',
    }

    mocks.category.create.mockResolvedValue({
      id: 'new-category-id',
      ...newCategory,
      image: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe(newCategory.name)
  })

  it('should handle database errors gracefully', async () => {
    const newCategory = {
      name: 'Category',
      nameAr: 'فئة',
      slug: 'category',
    }

    mocks.category.create.mockRejectedValue(new Error('Duplicate slug'))

    const request = new NextRequest('http://localhost:3000/api/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create category')
  })
})
