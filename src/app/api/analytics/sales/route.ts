import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-utils'
import { cacheGetOrSet, CacheTTL } from '@/lib/cache'

type PeriodOption = '7d' | '30d' | '90d' | '12m' | 'all'

// GET /api/analytics/sales
// Admin protected - returns sales analytics for a time period
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || '30d') as PeriodOption

    const validPeriods: PeriodOption[] = ['7d', '30d', '90d', '12m', 'all']
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { success: false, error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      )
    }

    const cacheKey = `analytics:sales:${period}`
    const salesData = await cacheGetOrSet(
      cacheKey,
      () => fetchSalesAnalytics(period),
      { ttl: CacheTTL.MEDIUM } // 5 minutes
    )

    return NextResponse.json({
      success: true,
      data: salesData,
    })
  } catch (error) {
    console.error('Error fetching sales analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales analytics' },
      { status: 500 }
    )
  }
}

function getStartDate(period: PeriodOption): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '12m':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'all':
      return new Date(2020, 0, 1) // far back date for "all time"
  }
}

async function fetchSalesAnalytics(period: PeriodOption) {
  const startDate = getStartDate(period)

  // Run independent queries in parallel
  const [
    // All orders in period (non-cancelled for revenue, all for daily data)
    allOrders,
    summaryResult,
    // Top products by revenue
    topProductGroups,
    // Payment method breakdown
    paymentGroups,
    // Coupon usage
    couponOrders,
    // Repeat customers
    repeatCustomerCount,
    // New vs returning customer orders
    newCustomerOrders,
    returningCustomerOrders,
  ] = await Promise.all([
    // All orders (including cancelled for daily data)
    db.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, nameAr: true } },
          },
        },
        coupon: { select: { id: true, code: true } },
        user: { select: { id: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),

    // Summary aggregate (non-cancelled)
    db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: startDate },
      },
      _sum: { total: true, discount: true },
      _count: { id: true },
    }),

    // Top products by revenue
    db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { not: 'cancelled' },
          createdAt: { gte: startDate },
        },
      },
      _sum: { price: true, quantity: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 10,
    }),

    // Payment method breakdown
    db.order.groupBy({
      by: ['paymentMethod'],
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      _count: { id: true },
    }),

    // Orders with coupons for coupon usage analysis
    db.order.findMany({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: startDate },
        couponId: { not: null },
      },
      include: {
        coupon: { select: { code: true } },
      },
    }),

    // Repeat customers (users with > 1 non-cancelled order in period)
    db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM (
        SELECT "userId"
        FROM "Order"
        WHERE "status" != 'cancelled'
          AND "createdAt" >= ${startDate}
        GROUP BY "userId"
        HAVING COUNT(*) > 1
      ) repeat_customers
    `,

    // New customer orders (customers created within the period)
    db.order.count({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: startDate },
        user: {
          createdAt: { gte: startDate },
        },
      },
    }),

    // Returning customer orders
    db.order.count({
      where: {
        status: { not: 'cancelled' },
        createdAt: { gte: startDate },
        user: {
          createdAt: { lt: startDate },
        },
      },
    }),
  ])

  // === Summary ===
  const totalRevenue = summaryResult._sum.total || 0
  const totalOrders = summaryResult._count.id
  const totalDiscount = summaryResult._sum.discount || 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalItemsSold = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)

  // === Daily Data ===
  const dailyMap = new Map<string, { date: string; revenue: number; orders: number; items: number }>()
  for (const order of allOrders) {
    const dateStr = order.createdAt.toISOString().split('T')[0]
    const existing = dailyMap.get(dateStr) || { date: dateStr, revenue: 0, orders: 0, items: 0 }
    existing.orders++
    if (order.status !== 'cancelled') {
      existing.revenue += order.total
      existing.items += order.items.reduce((s, i) => s + i.quantity, 0)
    }
    dailyMap.set(dateStr, existing)
  }
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  // === Top Products ===
  const topProductIds = topProductGroups.map((g) => g.productId)
  const productNames = topProductIds.length > 0
    ? await db.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, nameAr: true },
      })
    : []

  const productNameMap = new Map(productNames.map((p) => [p.id, p]))

  const topProducts = topProductGroups.map((group) => {
    const product = productNameMap.get(group.productId)
    return {
      id: group.productId,
      name: product?.name || 'Unknown',
      revenue: group._sum.price || 0,
      quantity: group._sum.quantity || 0,
    }
  })

  // === Payment Methods ===
  const paymentMethods: Record<string, { count: number; revenue: number }> = {}
  for (const pm of paymentGroups) {
    paymentMethods[pm.paymentMethod || 'unknown'] = {
      count: pm._count.id,
      revenue: pm._sum.total || 0,
    }
  }

  // === Coupon Usage ===
  const couponMap = new Map<string, { code: string; usageCount: number; totalDiscount: number }>()
  for (const order of couponOrders) {
    const code = order.coupon?.code || 'unknown'
    const existing = couponMap.get(code) || { code, usageCount: 0, totalDiscount: 0 }
    existing.usageCount++
    existing.totalDiscount += order.discount || 0
    couponMap.set(code, existing)
  }
  const couponUsage = Array.from(couponMap.values()).sort((a, b) => b.usageCount - a.usageCount)

  return {
    period,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalItemsSold,
      totalDiscount,
    },
    dailyData,
    topProducts,
    paymentMethods,
    couponUsage,
    repeatCustomers: Number(repeatCustomerCount[0]?.count || 0),
    newVsReturning: {
      new: newCustomerOrders,
      returning: returningCustomerOrders,
    },
  }
}
