import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { optionalAuth } from '@/lib/auth-utils'

interface TrackEventBody {
  event: string
  data?: unknown
  page?: string
  productId?: string
  sessionId?: string
}

// POST /api/analytics/track
// Public endpoint - works for both logged-in and guest users
export async function POST(request: NextRequest) {
  try {
    const user = await optionalAuth(request)
    const body: TrackEventBody = await request.json()

    const { event, data, page, productId, sessionId } = body

    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      )
    }

    // Serialize data if provided
    const dataString = data ? JSON.stringify(data) : null

    // Create the analytics event record
    const analyticsEvent = await db.analyticsEvent.create({
      data: {
        userId: user?.id || null,
        event,
        data: dataString,
        page: page || null,
        productId: productId || null,
        sessionId: sessionId || null,
      },
    })

    // Special event handling
    switch (event) {
      case 'page_view': {
        // Page view is already tracked via AnalyticsEvent record above
        // No additional action needed
        break
      }

      case 'product_view': {
        if (productId) {
          // Create ProductView record
          await db.productView.create({
            data: {
              productId,
              userId: user?.id || null,
            },
          })

          // Increment product's view count (using salesCount field is wrong, 
          // but there's no dedicated viewCount field - we count via ProductView records)
          // The view count is computed from ProductView records when querying
        }
        break
      }

      case 'search': {
        const searchData = data as { query?: string; results?: number } | undefined
        if (searchData?.query) {
          // Create SearchHistory record
          await db.searchHistory.create({
            data: {
              userId: user?.id || null,
              query: searchData.query,
              results: searchData.results || 0,
            },
          })
        }
        break
      }

      case 'add_to_cart': {
        // Cart addition is tracked via AnalyticsEvent record
        // Can be queried later for analytics
        break
      }

      case 'purchase': {
        // Purchase tracking via AnalyticsEvent record
        // The actual order data is tracked in Order model
        break
      }

      case 'add_to_favorites': {
        // Favorites tracking via AnalyticsEvent record
        // The actual favorite is tracked in Favorite model
        break
      }

      default:
        break
    }

    return NextResponse.json({
      success: true,
      id: analyticsEvent.id,
    })
  } catch (error) {
    console.error('Error tracking analytics event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
