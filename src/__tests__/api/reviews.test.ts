/**
 * Tests for Reviews API Routes
 * Testing GET and POST endpoints for the review system
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/reviews/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockReviews = [
  {
    id: 'review-1',
    userId: 'user-1',
    productId: 'product-1',
    rating: 5,
    title: 'Excellent product',
    comment: 'I love this product! It works perfectly.',
    images: '[]',
    isVerified: true,
    isApproved: true,
    helpful: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {
      id: 'user-1',
      name: 'John Doe',
      image: null,
    },
  },
  {
    id: 'review-2',
    userId: 'user-2',
    productId: 'product-1',
    rating: 4,
    title: 'Good product',
    comment: 'Good quality, fast shipping.',
    images: '[]',
    isVerified: false,
    isApproved: true,
    helpful: 5,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      image: null,
    },
  },
]

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer',
}

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 100,
  images: '[]',
}

describe('Reviews API - GET /api/reviews', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Basic functionality', () => {
    it('should return reviews for a product', async () => {
      mocks.review.findMany.mockResolvedValue(mockReviews)
      mocks.review.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    it('should return empty array when no reviews exist', async () => {
      mocks.review.findMany.mockResolvedValue([])
      mocks.review.count.mockResolvedValue(0)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
    })
  })

  describe('Filtering', () => {
    it('should filter by rating', async () => {
      mocks.review.findMany.mockResolvedValue([mockReviews[0]])
      mocks.review.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1&rating=5'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: 5,
          }),
        })
      )
    })

    it('should filter by userId', async () => {
      mocks.review.findMany.mockResolvedValue([mockReviews[0]])
      mocks.review.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?userId=user-1'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      )
    })

    it('should check if user has reviewed a product', async () => {
      mocks.review.findMany.mockResolvedValue([mockReviews[0]])
      mocks.review.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1&userId=user-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
    })
  })

  describe('Sorting', () => {
    it('should sort by newest first by default', async () => {
      mocks.review.findMany.mockResolvedValue(mockReviews)
      mocks.review.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('should sort by rating', async () => {
      mocks.review.findMany.mockResolvedValue(mockReviews)
      mocks.review.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1&sortBy=rating&sortOrder=desc'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        })
      )
    })

    it('should sort by helpful count', async () => {
      mocks.review.findMany.mockResolvedValue(mockReviews)
      mocks.review.count.mockResolvedValue(2)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1&sortBy=helpful'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { helpful: 'desc' },
        })
      )
    })
  })

  describe('Pagination', () => {
    it('should handle pagination', async () => {
      mocks.review.findMany.mockResolvedValue([mockReviews[0]])
      mocks.review.count.mockResolvedValue(10)

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1&limit=5&offset=0'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.meta.total).toBe(10)
      expect(mocks.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 0,
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.review.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

describe('Reviews API - POST /api/reviews', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Success cases', () => {
    it('should create a review with valid data', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
        title: 'Great product',
        comment: 'I really love this product!',
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.review.findUnique.mockResolvedValue(null) // No existing review
      mocks.order.findFirst.mockResolvedValue(null) // No verified purchase
      mocks.review.create.mockResolvedValue({
        id: 'new-review-id',
        ...newReview,
        images: null,
        isVerified: false,
        isApproved: true,
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        product: mockProduct,
      })
      mocks.review.findMany.mockResolvedValue([])
      mocks.product.update.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.review.create).toHaveBeenCalled()
    })

    it('should mark review as verified if user purchased the product', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
        title: 'Verified purchase review',
        comment: 'Great!',
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.review.findUnique.mockResolvedValue(null)
      mocks.order.findFirst.mockResolvedValue({ id: 'order-1' }) // Has verified purchase
      mocks.review.create.mockResolvedValue({
        id: 'new-review-id',
        ...newReview,
        images: null,
        isVerified: true, // Should be verified
        isApproved: true,
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        product: mockProduct,
      })
      mocks.review.findMany.mockResolvedValue([{ rating: 5 }])
      mocks.product.update.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mocks.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
          }),
        })
      )
    })

    it('should update product rating after review creation', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 4,
        title: 'Good',
        comment: 'Good product',
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.review.findUnique.mockResolvedValue(null)
      mocks.order.findFirst.mockResolvedValue(null)
      mocks.review.create.mockResolvedValue({
        id: 'new-review-id',
        ...newReview,
        images: null,
        isVerified: false,
        isApproved: true,
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        product: mockProduct,
      })
      mocks.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
      ])
      mocks.product.update.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mocks.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({
            rating: expect.any(Number),
            reviewsCount: 3,
          }),
        })
      )
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when userId is missing', async () => {
      const invalidReview = {
        productId: 'product-1',
        rating: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(invalidReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 when rating is invalid', async () => {
      const invalidReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 6, // Invalid: must be 1-5
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(invalidReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('between 1 and 5')
    })

    it('should return 400 when user does not exist', async () => {
      const newReview = {
        userId: 'non-existent-user',
        productId: 'product-1',
        rating: 5,
      }

      mocks.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })

    it('should return 400 when product does not exist', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'non-existent-product',
        rating: 5,
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Product not found')
    })

    it('should return 400 when user has already reviewed the product', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.review.findUnique.mockResolvedValue(mockReviews[0]) // Already exists

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already reviewed')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const newReview = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
      }

      mocks.user.findUnique.mockResolvedValue(mockUser)
      mocks.product.findUnique.mockResolvedValue(mockProduct)
      mocks.review.findUnique.mockResolvedValue(null)
      mocks.order.findFirst.mockResolvedValue(null)
      mocks.review.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
