/**
 * Tests for Cart API Routes
 * Tests for cart operations: get, add, update, remove items
 */

import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/cart/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Sample test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
}

const mockCategory = {
  id: 'category-1',
  name: 'Test Category',
  nameAr: 'فئة تجريبية',
  slug: 'test-category',
}

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 100,
  discountPrice: null,
  stock: 50,
  images: '["https://example.com/image.jpg"]',
  categoryId: 'category-1',
  category: mockCategory,
}

const mockCart = {
  id: 'cart-1',
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  items: [],
}

const mockCartItem = {
  id: 'cartitem-1',
  cartId: 'cart-1',
  productId: 'product-1',
  quantity: 2,
  product: mockProduct,
}

const mockCartWithItems = {
  ...mockCart,
  items: [mockCartItem],
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

describe('Cart API - GET /api/cart', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Fetch cart for user', () => {
    it('should return existing cart for user', async () => {
      mocks.cart.findUnique.mockResolvedValue(mockCartWithItems)

      const request = createRequest('http://localhost:3000/api/cart?userId=user-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('cart-1')
      expect(data.userId).toBe('user-1')
      expect(mocks.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          items: {
            include: { product: { include: { category: true } } }
          }
        }
      })
    })

    it('should return empty array when userId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/cart')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual([])
    })

    it('should create new cart when cart does not exist', async () => {
      mocks.cart.findUnique.mockResolvedValue(null)
      mocks.cart.create.mockResolvedValue(mockCart)

      const request = createRequest('http://localhost:3000/api/cart?userId=new-user')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mocks.cart.create).toHaveBeenCalledWith({
        data: { userId: 'new-user' },
        include: {
          items: {
            include: { product: { include: { category: true } } }
          }
        }
      })
    })

    it('should return cart with items', async () => {
      mocks.cart.findUnique.mockResolvedValue(mockCartWithItems)

      const request = createRequest('http://localhost:3000/api/cart?userId=user-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].productId).toBe('product-1')
      expect(data.items[0].quantity).toBe(2)
    })

    it('should return empty items array for new cart', async () => {
      mocks.cart.findUnique.mockResolvedValue(null)
      mocks.cart.create.mockResolvedValue(mockCart)

      const request = createRequest('http://localhost:3000/api/cart?userId=new-user')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual([])
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.cart.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/cart?userId=user-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch cart')
    })
  })
})

describe('Cart API - POST /api/cart', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Add item to cart', () => {
    it('should add item to existing cart', async () => {
      mocks.cart.findUnique
        .mockResolvedValueOnce(mockCart) // First call to find cart
        .mockResolvedValueOnce(mockCartWithItems) // Second call to get updated cart

      mocks.cartItem.findFirst.mockResolvedValue(null)
      mocks.cartItem.create.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          productId: 'product-1',
          quantity: 1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('cart-1')
      expect(mocks.cartItem.create).toHaveBeenCalled()
    })

    it('should create cart if not exists', async () => {
      mocks.cart.findUnique
        .mockResolvedValueOnce(null) // Cart doesn't exist
        .mockResolvedValueOnce(mockCart) // Created cart

      mocks.cart.create.mockResolvedValue(mockCart)
      mocks.cartItem.findFirst.mockResolvedValue(null)
      mocks.cartItem.create.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'new-user',
          productId: 'product-1',
          quantity: 1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mocks.cart.create).toHaveBeenCalledWith({ data: { userId: 'new-user' } })
    })

    it('should increment quantity if item already exists', async () => {
      mocks.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCartWithItems)

      mocks.cartItem.findFirst.mockResolvedValue(mockCartItem)
      mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 3 })

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          productId: 'product-1',
          quantity: 1,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mocks.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'cartitem-1' },
        data: { quantity: 3 }, // 2 + 1
      })
    })

    it('should use default quantity of 1', async () => {
      mocks.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCartWithItems)

      mocks.cartItem.findFirst.mockResolvedValue(null)
      mocks.cartItem.create.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          productId: 'product-1',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mocks.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 1,
          }),
        })
      )
    })

    it('should add multiple different items', async () => {
      mocks.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCartWithItems)

      mocks.cartItem.findFirst.mockResolvedValue(null)
      mocks.cartItem.create.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          productId: 'product-2', // Different product
          quantity: 3,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mocks.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'product-2',
            quantity: 3,
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.cart.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          productId: 'product-1',
          quantity: 1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to add to cart')
    })
  })
})

describe('Cart API - PUT /api/cart', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Update cart item quantity', () => {
    it('should update item quantity', async () => {
      mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 5 })

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: 5,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'cartitem-1' },
        data: { quantity: 5 },
      })
    })

    it('should remove item when quantity is 0', async () => {
      mocks.cartItem.delete.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: 0,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'cartitem-1' },
      })
    })

    it('should remove item when quantity is negative', async () => {
      mocks.cartItem.delete.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: -1,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.delete).toHaveBeenCalled()
    })

    it('should decrease item quantity', async () => {
      mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 1 })

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: 1,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'cartitem-1' },
        data: { quantity: 1 },
      })
    })

    it('should increase item quantity', async () => {
      mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 10 })

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: 10,
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
      mocks.cartItem.update.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          itemId: 'cartitem-1',
          quantity: 5,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to update cart')
    })
  })
})

describe('Cart API - DELETE /api/cart', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Remove item from cart', () => {
    it('should remove item from cart', async () => {
      mocks.cartItem.delete.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart?itemId=cartitem-1')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'cartitem-1' },
      })
    })

    it('should return success when itemId is missing', async () => {
      const request = createRequest('http://localhost:3000/api/cart')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.cartItem.delete).not.toHaveBeenCalled()
    })

    it('should return success even when item does not exist', async () => {
      mocks.cartItem.delete.mockResolvedValue(mockCartItem)

      const request = createRequest('http://localhost:3000/api/cart?itemId=non-existent')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mocks.cartItem.delete.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/cart?itemId=cartitem-1')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to remove from cart')
    })
  })
})

describe('Cart API - Integration scenarios', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should handle complete cart flow', async () => {
    // Step 1: Get empty cart
    mocks.cart.findUnique.mockResolvedValueOnce(null)
    mocks.cart.create.mockResolvedValueOnce(mockCart)

    const getRequest1 = createRequest('http://localhost:3000/api/cart?userId=user-1')
    const getResponse1 = await GET(getRequest1)
    const getData1 = await getResponse1.json()

    expect(getResponse1.status).toBe(200)
    expect(getData1.items).toEqual([])

    // Step 2: Add item to cart
    mocks.cart.findUnique
      .mockResolvedValueOnce(mockCart)
      .mockResolvedValueOnce(mockCartWithItems)
    mocks.cartItem.findFirst.mockResolvedValue(null)
    mocks.cartItem.create.mockResolvedValue(mockCartItem)

    const postRequest = createRequest('http://localhost:3000/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-1',
        productId: 'product-1',
        quantity: 2,
      }),
    })

    const postResponse = await POST(postRequest)
    const postData = await postResponse.json()

    expect(postResponse.status).toBe(200)
    expect(postData.items).toHaveLength(1)

    // Step 3: Update item quantity
    mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 5 })

    const putRequest = createRequest('http://localhost:3000/api/cart', {
      method: 'PUT',
      body: JSON.stringify({
        itemId: 'cartitem-1',
        quantity: 5,
      }),
    })

    const putResponse = await PUT(putRequest)
    const putData = await putResponse.json()

    expect(putResponse.status).toBe(200)
    expect(putData.success).toBe(true)

    // Step 4: Remove item
    mocks.cartItem.delete.mockResolvedValue(mockCartItem)

    const deleteRequest = createRequest('http://localhost:3000/api/cart?itemId=cartitem-1')
    const deleteResponse = await DELETE(deleteRequest)
    const deleteData = await deleteResponse.json()

    expect(deleteResponse.status).toBe(200)
    expect(deleteData.success).toBe(true)
  })

  it('should handle add same item multiple times', async () => {
    mocks.cart.findUnique.mockResolvedValue(mockCart)
    mocks.cartItem.findFirst.mockResolvedValue(mockCartItem)
    mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 3 })
    mocks.cart.findUnique.mockResolvedValue(mockCartWithItems)

    // First add
    const request1 = createRequest('http://localhost:3000/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-1',
        productId: 'product-1',
        quantity: 1,
      }),
    })

    const response1 = await POST(request1)
    expect(response1.status).toBe(200)

    // Second add (should increment)
    mocks.cartItem.findFirst.mockResolvedValue({ ...mockCartItem, quantity: 3 })
    mocks.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 4 })

    const request2 = createRequest('http://localhost:3000/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-1',
        productId: 'product-1',
        quantity: 1,
      }),
    })

    const response2 = await POST(request2)
    expect(response2.status).toBe(200)

    // Should have called update (not create) for existing item
    expect(mocks.cartItem.update).toHaveBeenCalled()
  })
})
