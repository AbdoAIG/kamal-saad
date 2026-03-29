import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-utils'
import { cacheGetOrSet, CacheTTL } from '@/lib/cache'

type UserSortOption = 'orders' | 'spending' | 'recent'

// GET /api/analytics/users
// Admin protected - returns user analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const sortBy = (searchParams.get('sortBy') || 'spending') as UserSortOption
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)

    const validSortOptions: UserSortOption[] = ['orders', 'spending', 'recent']
    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}` },
        { status: 400 }
      )
    }

    const cacheKey = `analytics:users:${sortBy}:${limit}`
    const usersData = await cacheGetOrSet(
      cacheKey,
      () => fetchUserAnalytics(sortBy, limit),
      { ttl: CacheTTL.MEDIUM } // 5 minutes
    )

    return NextResponse.json({
      success: true,
      data: usersData,
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user analytics' },
      { status: 500 }
    )
  }
}

async function fetchUserAnalytics(sortBy: UserSortOption, limit: number) {
  // Determine sort order
  const orderBy: Record<UserSortOption, object> = {
    orders: { orders: { _count: 'desc' } },
    spending: { loyaltyPoints: 'desc' }, // placeholder, will be re-sorted
    recent: { createdAt: 'desc' },
  }

  // Fetch users with order counts and favorite counts
  const users = await db.user.findMany({
    where: { role: 'customer' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      lastLogin: true,
      loyaltyPoints: true,
      isActive: true,
      _count: {
        select: {
          orders: true,
          favorites: true,
        },
      },
      orders: {
        where: { status: { not: 'cancelled' } },
        select: {
          total: true,
          createdAt: true,
        },
      },
    },
    orderBy: orderBy[sortBy],
    take: limit * 2, // fetch extra for re-sorting
  })

  // Compute spending metrics per user
  const usersWithMetrics = users.map((user) => {
    const totalOrders = user._count.orders
    const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const favoriteCount = user._count.favorites

    // Determine if active (had an order in the last 90 days)
    const lastOrder = user.orders.length > 0
      ? user.orders.reduce((latest, order) =>
          order.createdAt > latest.createdAt ? order : latest
        )
      : null

    const isActive = user.isActive && lastOrder
      ? (Date.now() - lastOrder.createdAt.getTime()) < 90 * 24 * 60 * 60 * 1000
      : user.isActive

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      loyaltyPoints: user.loyaltyPoints,
      favoriteCount,
      isActive,
    }
  })

  // Sort based on requested parameter
  switch (sortBy) {
    case 'spending':
      usersWithMetrics.sort((a, b) => b.totalSpent - a.totalSpent)
      break
    case 'orders':
      usersWithMetrics.sort((a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent)
      break
    case 'recent':
      usersWithMetrics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
  }

  return {
    users: usersWithMetrics.slice(0, limit),
  }
}
