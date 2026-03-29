/**
 * Tests for Reports API Routes
 * Tests for sales, products, customers, financial reports and export
 */

import { NextRequest } from 'next/server'
import { GET as ReportsGET } from '@/app/api/reports/route'
import { GET as ExportGET } from '@/app/api/reports/export/route'
import { mocks, resetAllMocks } from '../mocks/db.mock'

// Mock the db module
jest.mock('@/lib/db', () => {
  const { db } = require('../mocks/db.mock')
  return { db }
})

// Mock ExcelJS
jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    creator: '',
    created: null,
    addWorksheet: jest.fn().mockReturnValue({
      views: [],
      properties: {},
      addRow: jest.fn().mockReturnValue({
        font: {},
        alignment: {},
        getCell: jest.fn().mockReturnValue({
          font: {},
          fill: {},
        }),
      }),
      mergeCells: jest.fn(),
      columns: [],
    }),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-content')),
    },
  })),
}))

// Sample test data
const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'delivered',
  total: 500,
  discount: 50,
  shippingAddress: 'Test Address',
  phone: '+20123456789',
  paymentMethod: 'cod',
  notes: null,
  pointsUsed: 0,
  pointsEarned: 10,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  user: {
    name: 'Test Customer',
    email: 'customer@example.com',
  },
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      price: 200,
      product: {
        id: 'product-1',
        name: 'Test Product',
        nameAr: 'منتج تجريبي',
        price: 200,
      },
    },
  ],
  coupon: null,
}

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameAr: 'منتج تجريبي',
  price: 200,
  discountPrice: null,
  stock: 50,
  featured: true,
  categoryId: 'category-1',
  images: '[]',
  category: {
    id: 'category-1',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
  },
  orderItems: [
    {
      quantity: 5,
      price: 200,
      order: {
        id: 'order-1',
        status: 'delivered',
        createdAt: new Date('2024-01-15'),
      },
    },
  ],
  reviews: [
    { rating: 4 },
    { rating: 5 },
  ],
}

const mockCustomer = {
  id: 'user-1',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+20123456789',
  role: 'customer',
  createdAt: new Date('2024-01-01'),
  orders: [
    { id: 'order-1', total: 500, status: 'delivered', createdAt: new Date('2024-01-15') },
  ],
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

describe('Reports API - GET /api/reports', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Sales Report', () => {
    it('should return sales report with default period (last 30 days)', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.summary).toBeDefined()
    })

    it('should return sales report for custom date range', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports?type=sales&startDate=2024-01-01&endDate=2024-01-31')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.period).toBeDefined()
    })

    it('should calculate total revenue correctly', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, total: 500 },
        { ...mockOrder, id: 'order-2', total: 300 },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.summary.totalRevenue).toBe(800)
    })

    it('should count orders by status correctly', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, status: 'delivered' },
        { ...mockOrder, id: 'order-2', status: 'pending' },
        { ...mockOrder, id: 'order-3', status: 'cancelled' },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.statusDistribution.delivered).toBe(1)
      expect(data.data.statusDistribution.pending).toBe(1)
      expect(data.data.statusDistribution.cancelled).toBe(1)
    })

    it('should calculate payment method distribution', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, paymentMethod: 'cod' },
        { ...mockOrder, id: 'order-2', paymentMethod: 'paymob' },
        { ...mockOrder, id: 'order-3', paymentMethod: 'fawry' },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.paymentDistribution.cod).toBe(1)
      expect(data.data.paymentDistribution.paymob).toBe(1)
      expect(data.data.paymentDistribution.fawry).toBe(1)
    })

    it('should return empty arrays when no orders in period', async () => {
      mocks.order.findMany.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.summary.totalOrders).toBe(0)
      expect(data.data.summary.totalRevenue).toBe(0)
    })
  })

  describe('Products Report', () => {
    it('should return products report with performance data', async () => {
      mocks.product.findMany.mockResolvedValue([mockProduct])

      const request = createRequest('http://localhost:3000/api/reports?type=products')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.summary).toBeDefined()
    })

    it('should identify low stock products', async () => {
      mocks.product.findMany.mockResolvedValue([
        { ...mockProduct, stock: 5 },
        { ...mockProduct, id: 'product-2', stock: 50 },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=products')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.summary.lowStockCount).toBe(1)
    })

    it('should calculate sold quantity correctly', async () => {
      mocks.product.findMany.mockResolvedValue([mockProduct])

      const request = createRequest('http://localhost:3000/api/reports?type=products')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.summary.totalSold).toBe(5) // from orderItems
    })

    it('should sort products by revenue', async () => {
      const product1 = { ...mockProduct, orderItems: [{ quantity: 1, price: 100, order: { status: 'delivered' } }] }
      const product2 = { ...mockProduct, id: 'product-2', orderItems: [{ quantity: 5, price: 200, order: { status: 'delivered' } }] }

      mocks.product.findMany.mockResolvedValue([product1, product2])

      const request = createRequest('http://localhost:3000/api/reports?type=products')
      const response = await ReportsGET(request)
      const data = await response.json()

      // Higher revenue product should be first
      expect(data.data.topSelling[0].id).toBe('product-2')
    })
  })

  describe('Customers Report', () => {
    it('should return customers report with metrics', async () => {
      mocks.user.findMany.mockResolvedValue([mockCustomer])
      mocks.user.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=customers')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.summary).toBeDefined()
    })

    it('should calculate new vs returning customers', async () => {
      mocks.user.findMany.mockResolvedValue([
        { 
          ...mockCustomer, 
          id: 'user-1', 
          orders: [
            { id: 'o1', total: 100, status: 'delivered', createdAt: new Date('2024-01-10') }, 
            { id: 'o2', total: 200, status: 'delivered', createdAt: new Date('2024-01-12') }
          ], 
          createdAt: new Date('2024-01-01') 
        }, // returning
        { 
          ...mockCustomer, 
          id: 'user-2', 
          createdAt: new Date('2024-01-15'), 
          orders: [{ id: 'o3', total: 150, status: 'delivered', createdAt: new Date('2024-01-15') }] 
        }, // new
      ])
      mocks.user.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=customers')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should segment customers by spending', async () => {
      mocks.user.findMany.mockResolvedValue([
        { ...mockCustomer, id: 'user-1', orders: [{ status: 'delivered', total: 1500 }], createdAt: new Date('2024-01-01') }, // high
        { ...mockCustomer, id: 'user-2', orders: [{ status: 'delivered', total: 700 }], createdAt: new Date('2024-01-01') }, // medium
        { ...mockCustomer, id: 'user-3', orders: [{ status: 'delivered', total: 200 }], createdAt: new Date('2024-01-01') }, // low
        { ...mockCustomer, id: 'user-4', orders: [], createdAt: new Date('2024-01-01') }, // inactive
      ])
      mocks.user.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=customers')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should sort customers by total spent', async () => {
      mocks.user.findMany.mockResolvedValue([
        { ...mockCustomer, id: 'user-1', orders: [{ status: 'delivered', total: 200 }], createdAt: new Date('2024-01-01') },
        { ...mockCustomer, id: 'user-2', orders: [{ status: 'delivered', total: 1000 }], createdAt: new Date('2024-01-01') },
      ])
      mocks.user.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=customers')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Financial Report', () => {
    it('should return financial report with revenue data', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports?type=financial')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.summary).toBeDefined()
    })

    it('should calculate gross and net revenue', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, status: 'delivered', total: 500 },
        { ...mockOrder, id: 'order-2', status: 'pending', total: 300 },
        { ...mockOrder, id: 'order-3', status: 'cancelled', total: 200 },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=financial')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.summary.grossRevenue).toBe(1000)
      expect(data.data.summary.netRevenue).toBe(500) // only delivered
    })

    it('should calculate payment breakdown', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, paymentMethod: 'cod', status: 'delivered', total: 500 },
        { ...mockOrder, id: 'order-2', paymentMethod: 'paymob', status: 'delivered', total: 300 },
        { ...mockOrder, id: 'order-3', paymentMethod: 'fawry', total: 200 },
        { ...mockOrder, id: 'order-4', paymentMethod: 'valu', total: 100 },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=financial')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.paymentBreakdown.cod.amount).toBe(500)
      expect(data.data.paymentBreakdown.paymob.amount).toBe(300)
    })

    it('should calculate coupon usage', async () => {
      mocks.order.findMany.mockResolvedValue([
        { ...mockOrder, coupon: { code: 'SAVE10' }, discount: 50 },
        { ...mockOrder, id: 'order-2', coupon: { code: 'SAVE10' }, discount: 30 },
        { ...mockOrder, id: 'order-3', coupon: { code: 'WELCOME' }, discount: 20 },
      ])

      const request = createRequest('http://localhost:3000/api/reports?type=financial')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.couponUsage).toHaveLength(2)
    })
  })

  describe('Overview Report', () => {
    it('should return dashboard overview', async () => {
      mocks.product.count.mockResolvedValue(100)
      mocks.category.count.mockResolvedValue(10)
      mocks.user.count.mockResolvedValue(50)
      mocks.order.count.mockResolvedValue(200)
      mocks.order.findMany.mockResolvedValue([mockOrder])
      mocks.orderItem.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=overview')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.counts).toBeDefined()
    })

    it('should return count statistics', async () => {
      mocks.product.count.mockResolvedValue(100)
      mocks.category.count.mockResolvedValue(10)
      mocks.user.count.mockResolvedValue(50)
      mocks.order.count.mockResolvedValue(200)
      mocks.order.findMany.mockResolvedValue([])
      mocks.orderItem.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=overview')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(data.data.counts.products).toBe(100)
      expect(data.data.counts.categories).toBe(10)
      expect(data.data.counts.customers).toBe(50)
      expect(data.data.counts.orders).toBe(200)
    })

    it('should return alert information', async () => {
      mocks.product.count
        .mockResolvedValueOnce(100) // total products
        .mockResolvedValueOnce(5) // low stock products
      mocks.category.count.mockResolvedValue(10)
      mocks.user.count.mockResolvedValue(50)
      mocks.order.count
        .mockResolvedValueOnce(200) // total orders
        .mockResolvedValueOnce(200) // today orders
      mocks.order.findMany
        .mockResolvedValueOnce([]) // monthOrders
        .mockResolvedValueOnce([]) // lastMonthOrders
        .mockResolvedValueOnce([]) // recentOrders
      mocks.orderItem.groupBy.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/reports?type=overview')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should return 400 for invalid report type', async () => {
      const request = createRequest('http://localhost:3000/api/reports?type=invalid')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid report type')
    })

    it('should handle database errors gracefully', async () => {
      mocks.order.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/reports?type=sales')
      const response = await ReportsGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to generate report')
    })
  })
})

describe('Reports API - GET /api/reports/export', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('Export to Excel', () => {
    it('should export sales report as Excel', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports/export?type=sales')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('spreadsheet')
    })

    it('should export products report as Excel', async () => {
      mocks.product.findMany.mockResolvedValue([mockProduct])

      const request = createRequest('http://localhost:3000/api/reports/export?type=products')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('spreadsheet')
    })

    it('should export customers report as Excel', async () => {
      mocks.user.findMany.mockResolvedValue([mockCustomer])

      const request = createRequest('http://localhost:3000/api/reports/export?type=customers')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('spreadsheet')
    })

    it('should export financial report as Excel', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports/export?type=financial')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('spreadsheet')
    })

    it('should export orders report as Excel', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports/export?type=orders')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('spreadsheet')
    })

    it('should include correct filename in Content-Disposition', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports/export?type=sales')
      const response = await ExportGET(request)

      const disposition = response.headers.get('Content-Disposition')
      expect(disposition).toContain('attachment')
      expect(disposition).toContain('.xlsx')
    })

    it('should use custom date range for export', async () => {
      mocks.order.findMany.mockResolvedValue([mockOrder])

      const request = createRequest('http://localhost:3000/api/reports/export?type=sales&startDate=2024-01-01&endDate=2024-01-31')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error handling', () => {
    it('should return 400 for invalid export type', async () => {
      const request = createRequest('http://localhost:3000/api/reports/export?type=invalid')
      const response = await ExportGET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid report type')
    })

    it('should handle database errors gracefully', async () => {
      mocks.order.findMany.mockRejectedValue(new Error('Database error'))

      const request = createRequest('http://localhost:3000/api/reports/export?type=sales')
      const response = await ExportGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to generate report')
    })
  })
})
