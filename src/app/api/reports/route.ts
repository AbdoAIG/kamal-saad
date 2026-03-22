import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'sales'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date()

    switch (type) {
      case 'sales':
        return await getSalesReport(start, end)
      case 'products':
        return await getProductsReport(start, end)
      case 'customers':
        return await getCustomersReport(start, end)
      case 'financial':
        return await getFinancialReport(start, end)
      case 'overview':
        return await getOverviewReport()
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// Sales Report
async function getSalesReport(startDate: Date, endDate: Date) {
  const orders = await db.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by day
  const dailySales = orders.reduce((acc: Record<string, { date: string; orders: number; revenue: number; delivered: number }>, order) => {
    const date = order.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, orders: 0, revenue: 0, delivered: 0 }
    }
    acc[date].orders++
    acc[date].revenue += order.total
    if (order.status === 'delivered') acc[date].delivered++
    return acc
  }, {})

  // Calculate metrics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0)
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Status distribution
  const statusDistribution = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: deliveredOrders.length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  // Payment method distribution
  const paymentDistribution = {
    cod: orders.filter(o => o.paymentMethod === 'cod').length,
    paymob: orders.filter(o => o.paymentMethod === 'paymob').length,
    fawry: orders.filter(o => o.paymentMethod === 'fawry').length,
    valu: orders.filter(o => o.paymentMethod === 'valu').length,
  }

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalOrders,
        totalRevenue,
        totalDeliveredRevenue,
        cancelledOrders,
        pendingOrders,
        averageOrderValue,
        conversionRate: totalOrders > 0 ? (deliveredOrders.length / totalOrders * 100).toFixed(1) : 0,
      },
      dailySales: Object.values(dailySales),
      statusDistribution,
      paymentDistribution,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    },
  })
}

// Products Report
async function getProductsReport(startDate: Date, endDate: Date) {
  // Get all products with their order items
  const products = await db.product.findMany({
    include: {
      category: true,
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        include: { order: true },
      },
      reviews: true,
    },
  })

  // Calculate product performance
  const productPerformance = products.map(product => {
    const soldQuantity = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const revenue = product.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveredRevenue = product.orderItems
      .filter(item => item.order.status === 'delivered')
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
    const avgRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
      : 0

    return {
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      category: product.category.nameAr,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      soldQuantity,
      revenue,
      deliveredRevenue,
      ordersCount: product.orderItems.length,
      avgRating: avgRating.toFixed(1),
      reviewsCount: product.reviews.length,
      featured: product.featured,
    }
  })

  // Sort by revenue
  productPerformance.sort((a, b) => b.revenue - a.revenue)

  // Top selling products
  const topSelling = productPerformance.slice(0, 10)

  // Low stock products
  const lowStock = productPerformance.filter(p => p.stock < 10)

  // Category performance
  const categoryPerformance = products.reduce((acc: Record<string, { category: string; products: number; soldQuantity: number; revenue: number }>, product) => {
    const catId = product.categoryId
    if (!acc[catId]) {
      acc[catId] = {
        category: product.category.nameAr,
        products: 0,
        soldQuantity: 0,
        revenue: 0,
      }
    }
    acc[catId].products++
    acc[catId].soldQuantity += product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
    acc[catId].revenue += product.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return acc
  }, {})

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalProducts: products.length,
        totalSold: productPerformance.reduce((sum, p) => sum + p.soldQuantity, 0),
        totalRevenue: productPerformance.reduce((sum, p) => sum + p.revenue, 0),
        lowStockCount: lowStock.length,
        featuredCount: products.filter(p => p.featured).length,
      },
      topSelling,
      lowStock,
      categoryPerformance: Object.values(categoryPerformance),
      allProducts: productPerformance,
    },
  })
}

// Customers Report
async function getCustomersReport(startDate: Date, endDate: Date) {
  // Get customers with their orders in the period
  const customers = await db.user.findMany({
    where: { role: 'customer' },
    include: {
      orders: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  })

  // Customer metrics
  const customerMetrics = customers.map(customer => {
    const orders = customer.orders
    const totalSpent = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)
    const lastOrder = orders.length > 0 
      ? orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
      : null

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      ordersCount: orders.length,
      totalSpent,
      lastOrder,
      averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
    }
  })

  // Sort by total spent
  customerMetrics.sort((a, b) => b.totalSpent - a.totalSpent)

  // Top customers
  const topCustomers = customerMetrics.slice(0, 10)

  // New vs returning
  const newCustomers = customerMetrics.filter(c => 
    new Date(c.createdAt) >= startDate && new Date(c.createdAt) <= endDate
  ).length
  const returningCustomers = customerMetrics.filter(c => c.ordersCount > 1).length

  // Customer segments by spending
  const segments = {
    high: customerMetrics.filter(c => c.totalSpent >= 1000).length, // High value
    medium: customerMetrics.filter(c => c.totalSpent >= 500 && c.totalSpent < 1000).length,
    low: customerMetrics.filter(c => c.totalSpent < 500 && c.totalSpent > 0).length,
    inactive: customerMetrics.filter(c => c.ordersCount === 0).length,
  }

  // Daily new customers
  const dailyNewCustomers = await db.user.groupBy({
    by: ['createdAt'],
    where: {
      role: 'customer',
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  })

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        retentionRate: customers.length > 0 
          ? (returningCustomers / customers.length * 100).toFixed(1) 
          : 0,
      },
      topCustomers,
      segments,
      allCustomers: customerMetrics,
    },
  })
}

// Financial Report
async function getFinancialReport(startDate: Date, endDate: Date) {
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      items: true,
      coupon: true,
    },
  })

  // Revenue calculations
  const grossRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const netRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0)
  const cancelledRefunds = orders
    .filter(o => o.status === 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0)
  
  // COD collection
  const codOrders = orders.filter(o => o.paymentMethod === 'cod' && o.status === 'delivered')
  const codAmount = codOrders.reduce((sum, o) => sum + o.total, 0)

  // Online payments
  const onlineOrders = orders.filter(o => 
    ['paymob', 'fawry', 'valu'].includes(o.paymentMethod || '') && 
    o.status !== 'cancelled'
  )
  const onlineAmount = onlineOrders.reduce((sum, o) => sum + o.total, 0)

  // Daily revenue
  const dailyRevenue = orders.reduce((acc: Record<string, { date: string; gross: number; net: number; orders: number }>, order) => {
    const date = order.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, gross: 0, net: 0, orders: 0 }
    }
    acc[date].gross += order.total
    acc[date].orders++
    if (order.status === 'delivered') {
      acc[date].net += order.total
    }
    return acc
  }, {})

  // Coupon usage
  const couponUsage = orders.filter(o => o.coupon).reduce((acc: Record<string, { code: string; uses: number; discount: number }>, order) => {
    const code = order.coupon?.code || ''
    if (!acc[code]) {
      acc[code] = { code, uses: 0, discount: 0 }
    }
    acc[code].uses++
    acc[code].discount += order.discount
    return acc
  }, {})

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        grossRevenue,
        netRevenue,
        cancelledRefunds,
        totalDiscount,
        codAmount,
        onlineAmount,
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        averageOrderValue: orders.length > 0 ? grossRevenue / orders.length : 0,
      },
      dailyRevenue: Object.values(dailyRevenue),
      paymentBreakdown: {
        cod: { orders: codOrders.length, amount: codAmount },
        paymob: { 
          orders: orders.filter(o => o.paymentMethod === 'paymob').length, 
          amount: orders.filter(o => o.paymentMethod === 'paymob').reduce((s, o) => s + o.total, 0) 
        },
        fawry: { 
          orders: orders.filter(o => o.paymentMethod === 'fawry').length, 
          amount: orders.filter(o => o.paymentMethod === 'fawry').reduce((s, o) => s + o.total, 0) 
        },
        valu: { 
          orders: orders.filter(o => o.paymentMethod === 'valu').length, 
          amount: orders.filter(o => o.paymentMethod === 'valu').reduce((s, o) => s + o.total, 0) 
        },
      },
      couponUsage: Object.values(couponUsage),
    },
  })
}

// Overview Report (Dashboard)
async function getOverviewReport() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  // Get counts
  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    todayOrders,
    monthOrders,
    lastMonthOrders,
    pendingOrders,
    lowStockProducts,
  ] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.user.count({ where: { role: 'customer' } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.findMany({ 
      where: { createdAt: { gte: thisMonth } },
      select: { total: true, status: true }
    }),
    db.order.findMany({ 
      where: { createdAt: { gte: lastMonth, lte: lastMonthEnd } },
      select: { total: true, status: true }
    }),
    db.order.count({ where: { status: 'pending' } }),
    db.product.count({ where: { stock: { lt: 10 } } }),
  ])

  // Calculate revenues
  const monthRevenue = monthOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const lastMonthRevenue = lastMonthOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0

  // Recent orders
  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
    },
  })

  // Top products this month
  const topProducts = await db.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: { createdAt: { gte: thisMonth } },
    },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  })

  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { name: true, nameAr: true, images: true },
      })
      return {
        ...product,
        soldQuantity: item._sum.quantity,
        ordersCount: item._count.id,
      }
    })
  )

  return NextResponse.json({
    success: true,
    data: {
      counts: {
        products: totalProducts,
        categories: totalCategories,
        customers: totalCustomers,
        orders: totalOrders,
      },
      today: {
        orders: todayOrders,
      },
      month: {
        orders: monthOrders.length,
        revenue: monthRevenue,
        deliveredOrders: monthOrders.filter(o => o.status === 'delivered').length,
      },
      growth: {
        revenue: revenueGrowth,
        orders: lastMonthOrders.length > 0 
          ? ((monthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(1)
          : 0,
      },
      alerts: {
        pendingOrders,
        lowStockProducts,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customer: o.user?.name || 'زائر',
        total: o.total,
        status: o.status,
        items: o.items.reduce((s, i) => s + i.quantity, 0),
        createdAt: o.createdAt,
      })),
      topProducts: topProductsWithDetails,
    },
  })
}
