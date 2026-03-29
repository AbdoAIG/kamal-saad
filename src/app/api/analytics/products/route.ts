import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-utils'
import { cacheGetOrSet, CacheTTL } from '@/lib/cache'

type SortOption = 'views' | 'sales' | 'revenue' | 'rating'

// GET /api/analytics/products
// Admin protected - returns product analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const sortBy = (searchParams.get('sortBy') || 'sales') as SortOption
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)

    const validSortOptions: SortOption[] = ['views', 'sales', 'revenue', 'rating']
    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}` },
        { status: 400 }
      )
    }

    const cacheKey = `analytics:products:${sortBy}:${limit}`
    const products = await cacheGetOrSet(
      cacheKey,
      () => fetchProductAnalytics(sortBy, limit),
      { ttl: CacheTTL.MEDIUM } // 5 minutes
    )

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product analytics' },
      { status: 500 }
    )
  }
}

async function fetchProductAnalytics(sortBy: SortOption, limit: number) {
  // Determine sort order based on sortBy parameter
  const orderByMap: Record<SortOption, { salesCount?: 'desc'; rating?: 'desc' }> = {
    sales: { salesCount: 'desc' },
    rating: { rating: 'desc' },
    views: { salesCount: 'desc' }, // will be re-sorted after fetching
    revenue: { salesCount: 'desc' }, // will be re-sorted after fetching
  }

  // Fetch all products (non-deleted) with their view and favorite counts
  const allProducts = await db.product.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { views: true, favorites: true } },
      category: { select: { id: true, name: true, nameAr: true } },
    },
    orderBy: orderByMap[sortBy],
  })

  // Get product IDs for batch queries
  const productIds = allProducts.map((p) => p.id)

  // Batch query: cart add counts from analytics events
  const cartAddCounts = productIds.length > 0
    ? await db.analyticsEvent.groupBy({
        by: ['productId'],
        where: {
          event: 'add_to_cart',
          productId: { in: productIds },
        },
        _count: { id: true },
      })
    : []

  const cartAddMap = new Map(
    cartAddCounts.map((c) => [c.productId, c._count.id])
  )

  // Batch query: revenue from order items
  const productRevenues = productIds.length > 0
    ? await db.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          order: { status: { not: 'cancelled' } },
        },
        _sum: { price: true, quantity: true },
      })
    : []

  const revenueMap = new Map(
    productRevenues.map((r) => [r.productId, {
      revenue: r._sum.price || 0,
      quantity: r._sum.quantity || 0,
    }])
  )

  // Batch query: order count per product (for conversion rate)
  const productOrderCounts = productIds.length > 0
    ? await db.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          order: { status: { not: 'cancelled' } },
        },
        _count: { id: true },
      })
    : []

  const orderCountMap = new Map(
    productOrderCounts.map((o) => [o.productId, o._count.id])
  )

  // Build the full product analytics list
  const productsWithAnalytics = allProducts.map((product) => {
    const viewCount = product._count.views
    const favoriteCount = product._count.favorites
    const cartAddCount = cartAddMap.get(product.id) || 0
    const rev = revenueMap.get(product.id)
    const revenue = rev?.revenue || 0
    const orderCount = orderCountMap.get(product.id) || 0
    const conversionRate = viewCount > 0 ? (orderCount / viewCount) * 100 : 0
    const firstImage = product.images ? product.images.split(',')[0]?.trim() : null

    return {
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      images: product.images,
      salesCount: product.salesCount,
      revenue,
      viewCount,
      favoriteCount,
      cartAddCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
    }
  })

  // Sort based on the requested parameter
  switch (sortBy) {
    case 'views':
      productsWithAnalytics.sort((a, b) => b.viewCount - a.viewCount)
      break
    case 'revenue':
      productsWithAnalytics.sort((a, b) => b.revenue - a.revenue)
      break
    case 'rating':
      productsWithAnalytics.sort((a, b) => b.rating - a.rating)
      break
    case 'sales':
    default:
      productsWithAnalytics.sort((a, b) => b.salesCount - a.salesCount)
      break
  }

  return {
    products: productsWithAnalytics.slice(0, limit),
  }
}
