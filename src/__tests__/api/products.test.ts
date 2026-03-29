/**
 * Tests for Products API Routes
 * Testing GET and POST endpoints
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/products/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockProducts = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    nameAr: 'منتج تجريبي 1',
    description: 'Description 1',
    descriptionAr: 'وصف 1',
    price: 100,
    discountPrice: null,
    images: '["https://example.com/image1.jpg"]',
    stock: 10,
    categoryId: 'category-1',
    featured: false,
    rating: 4.5,
    reviewsCount: 10,
    salesCount: 50,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    category: {
      id: 'category-1',
      name: 'Category 1',
      nameAr: 'فئة 1',
    },
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    nameAr: 'منتج تجريبي 2',
    description: 'Description 2',
    descriptionAr: 'وصف 2',
    price: 200,
    discountPrice: 150,
    images: '["https://example.com/image2.jpg"]',
    stock: 5,
    categoryId: 'category-1',
    featured: true,
    rating: 5,
    reviewsCount: 20,
    salesCount: 100,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    category: {
      id: 'category-1',
      name: 'Category 1',
      nameAr: 'فئة 1',
    },
  },
]

const mockCategory = {
  id: 'category-1',
  name: 'Category 1',
  nameAr: 'فئة 1',
  slug: 'category-1',
  image: null,
  description: 'Test category',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Products API - GET /api/products', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Basic functionality', () => {
    it('should return products with default pagination', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      })
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { category: true },
          skip: 0,
          take: 20,
        })
      )
    })

    it('should return empty array when no products exist', async () => {
      mocks.product.findMany.mockResolvedValue([])
      mocks.product.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })
  })

  describe('Filtering', () => {
    it('should filter by categoryId', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/products?categoryId=category-1'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'category-1',
          }),
        })
      )
    })

    it('should filter by featured', async () => {
      mocks.product.findMany.mockResolvedValue([mockProducts[1]])
      mocks.product.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/products?featured=true'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            featured: true,
          }),
        })
      )
    })

    it('should filter by search term', async () => {
      mocks.product.findMany.mockResolvedValue([mockProducts[0]])
      mocks.product.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/products?search=Test'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('should filter by price range', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/products?minPrice=50&maxPrice=250'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.objectContaining({
              gte: 50,
              lte: 250,
            }),
          }),
        })
      )
    })
  })

  describe('Sorting', () => {
    it('should sort by price ascending', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=price&sortOrder=asc'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      )
    })

    it('should sort by rating descending', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=rating&sortOrder=desc'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        })
      )
    })

    it('should sort by salesCount', async () => {
      mocks.product.findMany.mockResolvedValue(mockProducts)
      mocks.product.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=salesCount'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { salesCount: 'desc' }, // default order
        })
      )
    })
  })

  describe('Pagination', () => {
    it('should handle custom pagination', async () => {
      mocks.product.findMany.mockResolvedValue([mockProducts[0]])
      mocks.product.count.mockResolvedValue(25)

      const request = new NextRequest(
        'http://localhost:3000/api/products?page=2&limit=10'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasMore: true,
      })
      expect(mocks.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.product.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch products')
    })
  })
})

describe('Products API - POST /api/products', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Success cases', () => {
    it('should create a product with valid data', async () => {
      const newProduct = {
        name: 'New Product',
        nameAr: 'منتج جديد',
        description: 'New product description',
        descriptionAr: 'وصف المنتج الجديد',
        price: 150,
        stock: 20,
        categoryId: 'category-1',
        featured: false,
        images: [],
      }

      mocks.category.findUnique.mockResolvedValue(mockCategory)
      mocks.product.create.mockResolvedValue({
        id: 'new-product-id',
        ...newProduct,
        discountPrice: null,
        images: '[]',
        rating: 0,
        reviewsCount: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
      })

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(newProduct.name)
      expect(data.nameAr).toBe(newProduct.nameAr)
      expect(mocks.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: newProduct.name,
            nameAr: newProduct.nameAr,
            price: newProduct.price,
          }),
        })
      )
    })

    it('should create a product with discount price', async () => {
      const newProduct = {
        name: 'Discounted Product',
        nameAr: 'منتج بخصم',
        price: 200,
        discountPrice: 150,
        categoryId: 'category-1',
      }

      mocks.category.findUnique.mockResolvedValue(mockCategory)
      mocks.product.create.mockResolvedValue({
        id: 'new-product-id',
        ...newProduct,
        description: '',
        descriptionAr: '',
        images: '[]',
        stock: 0,
        featured: false,
        rating: 0,
        reviewsCount: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
      })

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mocks.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountPrice: 150,
          }),
        })
      )
    })

    it('should parse string price and stock values', async () => {
      const newProduct = {
        name: 'Product',
        nameAr: 'منتج',
        price: '100',
        stock: '10',
        categoryId: 'category-1',
      }

      mocks.category.findUnique.mockResolvedValue(mockCategory)
      mocks.product.create.mockResolvedValue({
        id: 'new-product-id',
        name: 'Product',
        nameAr: 'منتج',
        price: 100,
        stock: 10,
        description: '',
        descriptionAr: '',
        images: '[]',
        discountPrice: null,
        featured: false,
        rating: 0,
        reviewsCount: 0,
        salesCount: 0,
        categoryId: 'category-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
      })

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mocks.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: 100,
            stock: 10,
          }),
        })
      )
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when name is missing', async () => {
      const invalidProduct = {
        nameAr: 'منتج',
        price: 100,
        categoryId: 'category-1',
      }

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('حقول مطلوبة')
    })

    it('should return 400 when nameAr is missing', async () => {
      const invalidProduct = {
        name: 'Product',
        price: 100,
        categoryId: 'category-1',
      }

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('حقول مطلوبة')
    })

    it('should return 400 when price is missing', async () => {
      const invalidProduct = {
        name: 'Product',
        nameAr: 'منتج',
        categoryId: 'category-1',
      }

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('حقول مطلوبة')
    })

    it('should return 400 when categoryId is missing', async () => {
      const invalidProduct = {
        name: 'Product',
        nameAr: 'منتج',
        price: 100,
      }

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('حقول مطلوبة')
    })

    it('should return 400 when category does not exist', async () => {
      const newProduct = {
        name: 'Product',
        nameAr: 'منتج',
        price: 100,
        categoryId: 'non-existent-category',
      }

      mocks.category.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('الفئة غير موجودة')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const newProduct = {
        name: 'Product',
        nameAr: 'منتج',
        price: 100,
        categoryId: 'category-1',
      }

      mocks.category.findUnique.mockResolvedValue(mockCategory)
      mocks.product.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})
