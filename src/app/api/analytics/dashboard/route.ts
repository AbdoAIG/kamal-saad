import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-utils'
import { cacheGetOrSet, CacheTTL } from '@/lib/cache'

// GET /api/analytics/dashboard
// Admin protected - returns comprehensive dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) return authResult.error

    const dashboardData = await cacheGetOrSet(
      'analytics:dashboard',
      () => fetchDashboardData(),
      { ttl: CacheTTL.MEDIUM } // 5 minutes cache
    )

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
}

async function fetchDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // Run all independent queries in parallel
  const [
    totalOrdersResult,
    totalProducts,
    totalUsers,
    totalPageViews,
    totalProductViews,
    todayRevenueResult,
    thisWeekRevenueResult,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
    topProducts,
    topCategories,
    recentOrders,
    topSearches,
    usersThisWeek,
    usersThisMonth,
    ordersByStatus,
    popularTimesRaw,
    monthlyTrendRaw,
    averageRatingResult,
  ] = await Promise.all([
    // Total orders (non-cancelled)
    db.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _count: { id: true },
      _sum: { total: true },
    }),

    // Total products (non-deleted)
    db.product.count({ where: { deletedAt: null } }),

    // Total users (customers)
    db.user.count({ where: { role: 'customer' } }),

    // Total page views
    db.analyticsEvent.count({ where: { event: 'page_view' } }),

    // Total product views
    db.productView.count(),

    // Today's revenue
    db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
    }),

    // This week's revenue
    db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: weekStart },
      },
      _sum: { total: true },
    }),

    // This month's revenue
    db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),

    // Last month's revenue
    db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { total: true },
    }),

    // Top products by sales
    db.product.findMany({
      take: 10,
      orderBy: { salesCount: 'desc' },
      where: { deletedAt: null },
      include: {
        _count: { select: { views: true, favorites: true } },
        category: { select: { id: true, name: true, nameAr: true } },
      },
    }),

    // Top categories by product count and revenue
    db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { products: { _count: 'desc' } },
    }),

    // Recent orders (last 10)
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          take: 3,
          select: {
            quantity: true,
            price: true,
            product: { select: { id: true, name: true, nameAr: true, images: true } },
          },
        },
      },
    }),

    // Top searches
    db.searchHistory.groupBy({
      by: ['query'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    // Users this week
    db.user.count({
      where: {
        role: 'customer',
        createdAt: { gte: weekStart },
      },
    }),

    // Users this month
    db.user.count({
      where: {
        role: 'customer',
        createdAt: { gte: monthStart },
      },
    }),

    // Orders by status
    db.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),

    // Popular times - orders by hour of day (last 30 days)
    db.$queryRaw<Array<{ hour: number; orders: bigint }>>`
      SELECT 
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `,

    // Monthly revenue trend (last 12 months)
    db.$queryRaw<Array<{ month: string; revenue: string; orders: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COALESCE(SUM("total")::text, '0') as revenue,
        COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "status" != 'cancelled'
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month
    `,

    // Average product rating
    db.product.aggregate({
      where: { deletedAt: null },
      _avg: { rating: true },
    }),
  ])

  // Calculate top product revenues from order items
  const topProductIds = topProducts.map((p) => p.id)
  const productRevenues = topProductIds.length > 0
    ? await db.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: topProductIds },
          order: { status: { not: 'cancelled' } },
        },
        _sum: { price: true, quantity: true },
        _count: { id: true },
      })
    : []

  const revenueMap = new Map(
    productRevenues.map((r) => [r.productId, { revenue: r._sum.price || 0, salesCount: r._count.id }])
  )

  // Format top products
  const formattedTopProducts = topProducts.map((product) => {
    const rev = revenueMap.get(product.id)
    const firstImage = product.images ? product.images.split(',')[0]?.trim() : null
    return {
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      salesCount: product.salesCount,
      revenue: rev?.revenue || 0,
      views: product._count.views,
      rating: product.rating,
      image: firstImage,
    }
  })

  // Calculate category revenues
  const categoryProductIds = new Map(
    topCategories.map((c) => [c.id, c.products.filter((p) => !('deletedAt' in p && p.deletedAt)).map((p) => p.id)])
  )

  const allProductIds = topCategories.flatMap((c) => categoryProductIds.get(c.id) || [])
  const categoryRevenues = allProductIds.length > 0
    ? await db.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: allProductIds },
          order: { status: { not: 'cancelled' } },
        },
        _sum: { price: true },
      })
    : []

  const productRevenueById = new Map(
    categoryRevenues.map((r) => [r.productId, r._sum.price || 0])
  )

  const formattedTopCategories = topCategories
    .map((category) => {
      const pIds = categoryProductIds.get(category.id) || []
      const catRevenue = pIds.reduce((sum, pid) => sum + (productRevenueById.get(pid) || 0), 0)
      return {
        categoryId: category.id,
        name: category.name,
        nameAr: category.nameAr,
        productCount: category._count.products,
        revenue: catRevenue,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Format orders by status
  const statusMap: Record<string, number> = {}
  for (const status of ordersByStatus) {
    statusMap[status.status] = status._count.id
  }

  // Format popular times
  const popularTimes = popularTimesRaw.map((row) => ({
    hour: row.hour,
    orders: Number(row.orders),
  }))

  // Format monthly trend
  const monthlyTrend = monthlyTrendRaw.map((row) => ({
    month: row.month,
    revenue: parseFloat(row.revenue),
    orders: Number(row.orders),
  }))

  // Calculate conversion rate (unique users who ordered vs total unique visitors)
  const uniqueVisitors = await db.analyticsEvent.groupBy({
    by: ['sessionId'],
    where: { event: 'page_view', sessionId: { not: null } },
  })

  const totalRevenue = totalOrdersResult._sum.total || 0
  const conversionRate =
    uniqueVisitors.length > 0
      ? (totalOrdersResult._count.id / uniqueVisitors.length) * 100
      : 0

  // Active users (users with order in last 90 days)
  const activeUsers = await db.user.count({
    where: {
      role: 'customer',
      orders: {
        some: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      },
    },
  })

  return {
    overview: {
      totalOrders: totalOrdersResult._count.id,
      totalRevenue,
      totalProducts,
      totalUsers,
      totalPageViews,
      totalProductViews,
      averageRating: averageRatingResult._avg.rating || 0,
    },
    revenue: {
      today: todayRevenueResult._sum.total || 0,
      thisWeek: thisWeekRevenueResult._sum.total || 0,
      thisMonth: thisMonthRevenueResult._sum.total || 0,
      lastMonth: lastMonthRevenueResult._sum.total || 0,
      monthlyTrend,
    },
    topProducts: formattedTopProducts,
    topCategories: formattedTopCategories,
    recentOrders,
    topSearches: topSearches.map((s) => ({
      query: s.query,
      count: s._count.id,
    })),
    userStats: {
      newThisWeek: usersThisWeek,
      newThisMonth: usersThisMonth,
      totalActive: activeUsers,
    },
    ordersByStatus: statusMap,
    popularTimes,
    conversionRate: Math.round(conversionRate * 100) / 100,
  }
}
